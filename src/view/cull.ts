import { pictureBox } from './bake'

/**
 * Phaser walks everything on the display list every frame, whether the camera can see it or not. Most of a grown shop's map is
 * off the camera at any time, the other shop on the street included, so what is off it is passed over before the frame is drawn.
 */

/** Room around the camera's view, in world units, for what has moved since it was last looked at. */
const MARGIN = 128
/** With the camera still, what it sees changes only as people walk, so the list is looked at this often, in frames. */
const PASS_FRAMES = 6
/** A reach is measured again this often, in frames, since a container's parts move and new ones come. */
const REACH_FRAMES = 60

/** What culling reads of a game object; a part it cannot size stays drawn. */
export interface Cullable {
  x: number
  y: number
  rotation?: number
  scaleX: number
  scaleY: number
  originX?: number
  originY?: number
  width?: number
  height?: number
  displayWidth?: number
  displayHeight?: number
  /** A container's parts. */
  list?: Cullable[]
  /** A Graphics' commands. */
  commandBuffer?: number[]
  visible: boolean
  scrollFactorX?: number
  scrollFactorY?: number
  cameraFilter: number
}

/** What culling reads of a camera. */
export interface CullCamera {
  id: number
  scrollX: number
  scrollY: number
  width: number
  height: number
  zoom: number
}

/** How far from its own point anything of `o` can draw, however it is turned; Infinity when that cannot be told. */
export function reachOf(o: Cullable): number {
  const scale = Math.max(Math.abs(o.scaleX), Math.abs(o.scaleY))
  if (o.list) {
    let far = Math.max(o.width ?? 0, o.height ?? 0)
    for (const part of o.list) far = Math.max(far, Math.abs(part.x) + Math.abs(part.y) + reachOf(part))
    return far * scale
  }
  if (o.commandBuffer) {
    const box = pictureBox(o.commandBuffer)
    if (!box) return Infinity
    return (Math.max(Math.abs(box.x), Math.abs(box.x + box.w)) + Math.max(Math.abs(box.y), Math.abs(box.y + box.h))) * scale
  }
  return o.displayWidth === undefined || o.displayHeight === undefined ? Infinity : o.displayWidth + o.displayHeight
}

/** The world a camera shows, with the margin, as left, top, right and bottom. */
export function cameraView(cam: CullCamera): [number, number, number, number] {
  const w = cam.width / cam.zoom
  const h = cam.height / cam.zoom
  const left = cam.scrollX + (cam.width - w) / 2
  const top = cam.scrollY + (cam.height - h) / 2
  return [left - MARGIN, top - MARGIN, left + w + MARGIN, top + h + MARGIN]
}

let reaches = new WeakMap<Cullable, number>()
let measuredAt = -Infinity
let lastPass = { frame: -Infinity, x: 0, y: 0, zoom: 0 }

/** The reach of a container or a Graphics, kept for a while since it takes a walk through its parts. */
function reach(o: Cullable): number {
  let r = reaches.get(o)
  if (r === undefined) reaches.set(o, (r = reachOf(o)))
  return r
}

/** Whether all of `o` is outside the view [left, top, right, bottom]. */
function isOutside(o: Cullable, left: number, top: number, right: number, bottom: number): boolean {
  const { x, y } = o
  if (!o.list && !o.commandBuffer && !o.rotation && o.scaleX > 0 && o.scaleY > 0 && o.originX !== undefined && o.originY !== undefined) {
    const w = o.displayWidth
    const h = o.displayHeight
    // the plain upright picture, a room or a house front among them, by its own box: its reach would be its whole diagonal
    if (w !== undefined && h !== undefined) {
      const x0 = x - o.originX * w
      const y0 = y - o.originY * h
      return x0 + w < left || x0 > right || y0 + h < top || y0 > bottom
    }
  }
  const r = reach(o)
  return x + r < left || x - r > right || y + r < top || y - r > bottom
}

/**
 * Tells `cam` to pass over each of the top-level `objects` it cannot see, by the object's camera filter, which the game does not
 * use for these and which leaves `visible` to the game's own code; what scrolls with the screen stays drawn.
 */
export function cullOffCamera(objects: readonly Cullable[], cam: CullCamera, frame: number): void {
  if (frame - lastPass.frame < PASS_FRAMES && cam.scrollX === lastPass.x && cam.scrollY === lastPass.y && cam.zoom === lastPass.zoom) return
  lastPass = { frame, x: cam.scrollX, y: cam.scrollY, zoom: cam.zoom }
  if (frame - measuredAt >= REACH_FRAMES) {
    reaches = new WeakMap()
    measuredAt = frame
  }
  const [left, top, right, bottom] = cameraView(cam)
  for (const o of objects) {
    // what comes out of hiding between looks is drawn, whatever it was before
    const off = o.visible && o.scrollFactorX === 1 && o.scrollFactorY === 1 && isOutside(o, left, top, right, bottom)
    o.cameraFilter = off ? cam.id : 0
  }
}
