/**
 * The Phaser-free half of drawing a Graphics from a picture of itself: Phaser replays every command of a Graphics each frame,
 * rebuilding its arcs and triangles, so one that stays the same is drawn once onto a canvas and shown as an image instead.
 */

/** Phaser's Graphics commands, as numbered in phaser/src/gameobjects/graphics/Commands.js, with how many values follow each. */
export const COMMANDS = {
  ARC: 0,
  BEGIN_PATH: 1,
  CLOSE_PATH: 2,
  FILL_RECT: 3,
  LINE_TO: 4,
  MOVE_TO: 5,
  LINE_STYLE: 6,
  FILL_STYLE: 7,
  FILL_PATH: 8,
  STROKE_PATH: 9,
  FILL_TRIANGLE: 10,
  STROKE_TRIANGLE: 11,
} as const
const ARGS: Record<number, number> = { 0: 7, 1: 0, 2: 0, 3: 4, 4: 2, 5: 2, 6: 3, 7: 2, 8: 0, 9: 0, 10: 6, 11: 6 }

/** Room beyond a line's half width for the smoothed edge. */
const EDGE_PX = 2
/** The widest or tallest picture, in canvas pixels, that a phone takes as a texture. */
export const MAX_PICTURE_PX = 4096
/** A Graphics that changes again within this many frames is changing on purpose, as a bar or a trail does. */
export const SETTLE_FRAMES = 30

/** A box in a Graphics' own units. */
export interface Box {
  x: number
  y: number
  w: number
  h: number
}

/**
 * The box the commands draw in, with room for the widest line, in whole units; null when they draw nothing or use a command a
 * canvas cannot copy as WebGL draws it (gradients, and the save, restore, translate, scale and rotate of the canvas).
 */
export function pictureBox(cmds: readonly number[]): Box | null {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity]
  let line = 1
  const take = (x: number, y: number, r = 0) => {
    x0 = Math.min(x0, x - r)
    y0 = Math.min(y0, y - r)
    x1 = Math.max(x1, x + r)
    y1 = Math.max(y1, y + r)
  }
  for (let i = 0; i < cmds.length; i++) {
    const cmd = cmds[i]
    const n = ARGS[cmd]
    if (n === undefined) return null
    const a = (k: number) => cmds[i + k]
    if (cmd === COMMANDS.ARC) take(a(1), a(2), a(3))
    else if (cmd === COMMANDS.FILL_RECT) {
      take(a(1), a(2))
      take(a(1) + a(3), a(2) + a(4))
    } else if (cmd === COMMANDS.LINE_TO || cmd === COMMANDS.MOVE_TO) take(a(1), a(2))
    else if (cmd === COMMANDS.LINE_STYLE) line = Math.max(line, a(1))
    else if (cmd === COMMANDS.FILL_TRIANGLE || cmd === COMMANDS.STROKE_TRIANGLE) for (let k = 1; k <= 5; k += 2) take(a(k), a(k + 1))
    i += n
  }
  if (x0 > x1) return null
  const pad = line / 2 + EDGE_PX
  const x = Math.floor(x0 - pad)
  const y = Math.floor(y0 - pad)
  return { x, y, w: Math.ceil(x1 + pad) - x, h: Math.ceil(y1 + pad) - y }
}

/** The parts of a canvas context the commands use. */
export type PictureContext = Pick<
  CanvasRenderingContext2D,
  'beginPath' | 'closePath' | 'moveTo' | 'lineTo' | 'arc' | 'fill' | 'stroke' | 'fillRect' | 'fillStyle' | 'strokeStyle' | 'lineWidth' | 'lineJoin' | 'lineCap'
>

const rgba = (color: number, alpha: number) => `rgba(${(color >>> 16) & 0xff},${(color >>> 8) & 0xff},${color & 0xff},${alpha})`

/**
 * Draws the commands as Phaser's canvas renderer does, with two changes towards what WebGL shows: lines meet in a bevel, as
 * WebGL joins them with a quad, and a triangle is drawn as a shape of its own that leaves the path being built alone.
 * `triangle` makes that shape: a Path2D in the browser.
 */
export function drawCommands(ctx: PictureContext, cmds: readonly number[], triangle: (pts: number[]) => Path2D): void {
  ctx.lineJoin = 'bevel'
  ctx.lineCap = 'butt'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let i = 0; i < cmds.length; i++) {
    const cmd = cmds[i]
    const a = (k: number) => cmds[i + k]
    switch (cmd) {
      case COMMANDS.ARC:
        // Phaser keeps the anticlockwise flag as a boolean in the list
        ctx.arc(a(1), a(2), a(3), a(4), a(5), Boolean(a(6)))
        break
      case COMMANDS.BEGIN_PATH:
        ctx.beginPath()
        break
      case COMMANDS.CLOSE_PATH:
        ctx.closePath()
        break
      case COMMANDS.FILL_RECT:
        ctx.fillRect(a(1), a(2), a(3), a(4))
        break
      case COMMANDS.LINE_TO:
        ctx.lineTo(a(1), a(2))
        break
      case COMMANDS.MOVE_TO:
        ctx.moveTo(a(1), a(2))
        break
      case COMMANDS.LINE_STYLE:
        ctx.lineWidth = a(1)
        ctx.strokeStyle = rgba(a(2), a(3))
        break
      case COMMANDS.FILL_STYLE:
        ctx.fillStyle = rgba(a(1), a(2))
        break
      case COMMANDS.FILL_PATH:
        ctx.fill()
        break
      case COMMANDS.STROKE_PATH:
        ctx.stroke()
        break
      case COMMANDS.FILL_TRIANGLE:
        ;(ctx as CanvasRenderingContext2D).fill(triangle(cmds.slice(i + 1, i + 7)))
        break
      case COMMANDS.STROKE_TRIANGLE:
        ;(ctx as CanvasRenderingContext2D).stroke(triangle(cmds.slice(i + 1, i + 7)))
        break
    }
    i += ARGS[cmd] ?? 0
  }
}

/** Whether two command lists are the same, value for value. */
export function sameCommands(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

/** What to do with a Graphics this frame: draw its picture, draw a new picture of it first, or replay its commands. */
export type PictureStep = 'picture' | 'bake' | 'replay'

/**
 * Decides, frame by frame, whether a Graphics is still enough to draw from a picture. The first two changes in a row are pictured;
 * a third within SETTLE_FRAMES of the one before means it is changing on purpose, so it is replayed until it has kept still for
 * SETTLE_FRAMES, when it is pictured again.
 */
export class Settle {
  private at = -Infinity
  private run = 0
  private pictured = false

  step(changed: boolean, frame: number): PictureStep {
    if (changed) {
      this.run = frame - this.at < SETTLE_FRAMES ? this.run + 1 : 0
      this.at = frame
      this.pictured = this.run < 2
      return this.pictured ? 'bake' : 'replay'
    }
    if (this.pictured) return 'picture'
    if (frame - this.at < SETTLE_FRAMES) return 'replay'
    this.pictured = true
    return 'bake'
  }
}
