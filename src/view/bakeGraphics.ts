import * as Phaser from 'phaser'
import { drawCommands, MAX_PICTURE_PX, pictureBox, sameCommands, Settle, type Box } from './bake'
import { inDepthOrder } from './depthOrder'

/** Canvas pixels per unit for a scene's pictures; the map zooms in up to ZOOM_MAX, so it asks for more to stay sharp. */
const scales = new WeakMap<Phaser.Scene, number>()

/** Draws `scene`'s pictures at `k` canvas pixels per unit, for a camera that zooms in. */
export function setPictureScale(scene: Phaser.Scene, k: number): void {
  scales.set(scene, k)
}

type Render = (renderer: unknown, src: unknown, drawingContext: { camera: Phaser.Cameras.Scene2D.Camera }, parentMatrix: unknown) => void

interface Picture {
  settle: Settle
  /** The commands as last seen. */
  seen: number[]
  /** The picture and how it was drawn, once there is one. */
  shown: { k: number; texture: Phaser.Textures.CanvasTexture; image: Phaser.GameObjects.Image } | null
}

const pictures = new WeakMap<Phaser.GameObjects.Graphics, Picture>()
let made = 0
/** Off replays every Graphics as Phaser does, for comparing on the ?perf overlay. */
let on = true

/** Turns drawing still Graphics from pictures on or off. */
export function setStillPictures(value: boolean): void {
  on = value
}

const triangle = (p: number[]) => {
  const path = new Path2D()
  path.moveTo(p[0], p[1])
  path.lineTo(p[2], p[3])
  path.lineTo(p[4], p[5])
  path.closePath()
  return path
}

/** Lets go of the picture's image and texture. */
function drop(p: Picture, textures: Phaser.Textures.TextureManager): void {
  if (!p.shown) return
  p.shown.image.destroy()
  textures.remove(p.shown.texture)
  p.shown = null
}

/** Draws `cmds` into a canvas texture the size of `box` at `k`, reusing the picture's texture while the size holds. */
function bake(g: Phaser.GameObjects.Graphics, p: Picture, cmds: readonly number[], box: Box, k: number): void {
  const w = Math.ceil(box.w * k)
  const h = Math.ceil(box.h * k)
  const textures = g.scene.textures
  if (!p.shown || p.shown.texture.width !== w || p.shown.texture.height !== h) {
    drop(p, textures)
    const key = `graphics-picture-${made++}`
    // never added to the scene: the Graphics draws it in its own place
    p.shown = { k, texture: textures.createCanvas(key, w, h)!, image: new Phaser.GameObjects.Image(g.scene, 0, 0, key) }
  }
  paint(p.shown.texture, cmds, box, k)
  p.shown.k = k
  // the Graphics' own point (0, 0) is this far into the picture
  p.shown.image.setDisplayOrigin(-box.x * k, -box.y * k)
}

/** Clears the canvas texture and draws `cmds` into it, `box` filling it at `k` canvas pixels per unit. */
function paint(texture: Phaser.Textures.CanvasTexture, cmds: readonly number[], box: Box, k: number): void {
  const ctx = texture.getContext()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, texture.width, texture.height)
  ctx.setTransform(k, 0, 0, k, -box.x * k, -box.y * k)
  drawCommands(ctx, cmds, triangle)
  texture.refresh()
}

/** The boxes of the textures pictureTexture made, by key. */
const madeBoxes = new Map<string, Box>()

/**
 * Makes texture `key`, once per game, a picture at `k` canvas pixels per unit of what `draw` puts into a Graphics; returns the box it
 * shows, in the Graphics' own units, so an image of it can be placed and scaled to stand where the Graphics would.
 */
export function pictureTexture(scene: Phaser.Scene, key: string, k: number, draw: (g: Phaser.GameObjects.Graphics) => void): Box {
  const known = madeBoxes.get(key)
  if (known && scene.textures.exists(key)) return known
  const g = new Phaser.GameObjects.Graphics(scene)
  draw(g)
  const cmds = g.commandBuffer as number[]
  const box = pictureBox(cmds)!
  paint(scene.textures.createCanvas(key, Math.ceil(box.w * k), Math.ceil(box.h * k))!, cmds, box, k)
  g.destroy()
  madeBoxes.set(key, box)
  return box
}

/**
 * Skips sorting a display list that is already in order. Phaser asks for a sort whenever a depth is set, even to the same value, and
 * everyone on the map is given a depth every frame, while what they walk past changes the order only now and then.
 */
export function skipNeedlessSorts(): void {
  const proto = Phaser.GameObjects.DisplayList.prototype as unknown as { depthSort(): void; sortChildrenFlag: boolean; list: { _depth: number }[] }
  const sort = proto.depthSort
  proto.depthSort = function (this: typeof proto) {
    if (this.sortChildrenFlag && inDepthOrder(this.list)) this.sortChildrenFlag = false
    sort.call(this)
  }
}

/**
 * Lets every Graphics that keeps still be drawn from a picture of itself. Phaser replays a Graphics' commands every frame, rebuilding
 * each rounded corner, which was most of a frame's drawing time and most of its garbage. A Graphics whose commands are the same as
 * last frame is drawn once onto a canvas and then shown as one image in its place, with its position, turn, scale, alpha and blend;
 * one that keeps changing, as a bar or a trail does, or that uses a gradient or turns the canvas, is replayed as before.
 */
export function bakeStillGraphics(): void {
  const proto = Phaser.GameObjects.Graphics.prototype as unknown as { renderWebGL: Render }
  const replay = proto.renderWebGL
  proto.renderWebGL = function (this: Phaser.GameObjects.Graphics, renderer, src, drawingContext, parentMatrix) {
    if (!on) {
      replay.call(this, renderer, src, drawingContext, parentMatrix)
      return
    }
    const g = src as Phaser.GameObjects.Graphics
    const cmds = g.commandBuffer as number[]
    let p = pictures.get(g)
    if (!p) {
      const fresh: Picture = { settle: new Settle(), seen: [], shown: null }
      const textures = g.scene.textures
      g.once(Phaser.GameObjects.Events.DESTROY, () => drop(fresh, textures))
      pictures.set(g, fresh)
      p = fresh
    }
    const changed = !sameCommands(cmds, p.seen)
    if (changed) p.seen = cmds.slice()
    const step = p.settle.step(changed, g.scene.game.getFrame())
    if (step === 'bake') {
      const box = pictureBox(cmds)
      const k = scales.get(g.scene) ?? 1
      if (box && box.w * k <= MAX_PICTURE_PX && box.h * k <= MAX_PICTURE_PX) bake(g, p, cmds, box, k)
      // what it draws now has no picture, so the old one must not show once it keeps still
      else drop(p, g.scene.textures)
    }
    if (step === 'replay' || !p.shown) {
      replay.call(this, renderer, src, drawingContext, parentMatrix)
      return
    }
    const { image, k } = p.shown
    image.x = g.x
    image.y = g.y
    image.rotation = g.rotation
    image.scaleX = g.scaleX / k
    image.scaleY = g.scaleY / k
    image.scrollFactorX = g.scrollFactorX
    image.scrollFactorY = g.scrollFactorY
    image.alpha = g.alpha
    image.blendMode = g.blendMode
    // the Graphics is what the camera rendered, for input that only tests what was drawn
    drawingContext.camera.addToRenderList(g)
    ;(image as unknown as { renderWebGL: Render }).renderWebGL(renderer, image, drawingContext, parentMatrix)
  }
}
