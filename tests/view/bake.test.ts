import { describe, expect, it } from 'vitest'
// Phaser's own numbers, from a file its package does not export
import phaserCommands from '../../node_modules/phaser/src/gameobjects/graphics/Commands.js?raw'
import { COMMANDS, drawCommands, pictureBox, sameCommands, Settle, SETTLE_FRAMES, type PictureContext } from '../../src/view/bake'

const { ARC, BEGIN_PATH, CLOSE_PATH, FILL_RECT, LINE_TO, MOVE_TO, LINE_STYLE, FILL_STYLE, FILL_PATH, STROKE_PATH, FILL_TRIANGLE } = COMMANDS

/** Stands in for the browser's Path2D, which node does not have. */
const stub = () => ({ toString: () => 'triangle' }) as unknown as Path2D

/** A canvas context that writes down what is done to it. */
function recorder() {
  const calls: string[] = []
  const ctx = {
    beginPath: () => calls.push('beginPath'),
    closePath: () => calls.push('closePath'),
    moveTo: (x: number, y: number) => calls.push(`moveTo ${x},${y}`),
    lineTo: (x: number, y: number) => calls.push(`lineTo ${x},${y}`),
    arc: (x: number, y: number, r: number, a0: number, a1: number, ccw: boolean) => calls.push(`arc ${x},${y},${r},${a0},${a1},${ccw}`),
    fill: (path?: unknown) => calls.push(path ? `fill ${String(path)}` : `fill ${ctx.fillStyle}`),
    stroke: (path?: unknown) => calls.push(path ? `stroke ${String(path)}` : `stroke ${ctx.lineWidth} ${ctx.strokeStyle}`),
    fillRect: (x: number, y: number, w: number, h: number) => calls.push(`fillRect ${x},${y},${w},${h} ${ctx.fillStyle}`),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    lineJoin: 'miter',
    lineCap: 'round',
  }
  return { ctx: ctx as unknown as PictureContext, calls, state: ctx }
}

describe('the commands a picture copies', () => {
  it('numbers them as Phaser does', () => {
    for (const [name, n] of Object.entries(COMMANDS)) expect(phaserCommands, name).toMatch(new RegExp(`\\b${name}: ${n},?\\s`))
  })
})

describe('the box a Graphics draws in', () => {
  it('holds a filled rectangle with room for the smoothed edge, in whole units', () => {
    expect(pictureBox([FILL_STYLE, 0xffffff, 1, FILL_RECT, 10, 20, 100, 50])).toEqual({ x: 7, y: 17, w: 106, h: 56 })
  })

  it('takes a rectangle drawn back from its corner', () => {
    expect(pictureBox([FILL_RECT, 110, 70, -100, -50])).toEqual(pictureBox([FILL_RECT, 10, 20, 100, 50]))
  })

  it('makes room for half the widest line', () => {
    const box = pictureBox([LINE_STYLE, 6, 0, 1, BEGIN_PATH, MOVE_TO, 0, 0, LINE_TO, 100, 0, STROKE_PATH])!
    expect(box).toEqual({ x: -5, y: -5, w: 110, h: 10 })
  })

  it('holds the whole circle of an arc', () => {
    expect(pictureBox([BEGIN_PATH, ARC, 50, 50, 20, 0, Math.PI, 0, 0, FILL_PATH])).toEqual({ x: 27, y: 27, w: 46, h: 46 })
  })

  it('holds every corner of a triangle', () => {
    expect(pictureBox([FILL_TRIANGLE, 0, 10, 40, 0, 20, 30])).toEqual({ x: -3, y: -3, w: 46, h: 36 })
  })

  it('has none for nothing drawn, a gradient or a turned canvas', () => {
    expect(pictureBox([])).toBeNull()
    expect(pictureBox([FILL_STYLE, 0, 1])).toBeNull()
    // GRADIENT_FILL_STYLE, then SAVE and TRANSLATE
    expect(pictureBox([21, 1, 1, 1, 1, 0, 0, 0, 0, FILL_RECT, 0, 0, 10, 10])).toBeNull()
    expect(pictureBox([14, FILL_RECT, 0, 0, 10, 10])).toBeNull()
    expect(pictureBox([16, 5, 5, FILL_RECT, 0, 0, 10, 10])).toBeNull()
  })
})

describe('drawing the commands onto a canvas', () => {
  it('fills and strokes a path with the colours and width given, joining lines in a bevel', () => {
    const { ctx, calls, state } = recorder()
    const cmds = [FILL_STYLE, 0x112233, 0.5, LINE_STYLE, 4, 0xff0000, 1, BEGIN_PATH, MOVE_TO, 0, 0, ARC, 10, 0, 10, 0, Math.PI, 1, 0, CLOSE_PATH, FILL_PATH, STROKE_PATH]
    drawCommands(ctx, cmds, stub)
    expect(calls).toEqual(['beginPath', 'beginPath', 'moveTo 0,0', `arc 10,0,10,0,${Math.PI},true`, 'closePath', 'fill rgba(17,34,51,0.5)', 'stroke 4 rgba(255,0,0,1)'])
    expect([state.lineJoin, state.lineCap]).toEqual(['bevel', 'butt'])
  })

  it('fills a rectangle without touching the path', () => {
    const { ctx, calls } = recorder()
    drawCommands(ctx, [FILL_STYLE, 0xffffff, 1, FILL_RECT, 1, 2, 3, 4], stub)
    expect(calls).toEqual(['beginPath', 'fillRect 1,2,3,4 rgba(255,255,255,1)'])
  })

  it('draws a triangle as a shape of its own, leaving the path being built alone', () => {
    const { ctx, calls } = recorder()
    const made: number[][] = []
    const triangle = (p: number[]) => {
      made.push(p)
      return stub()
    }
    drawCommands(ctx, [BEGIN_PATH, MOVE_TO, 0, 0, FILL_TRIANGLE, 1, 2, 3, 4, 5, 6, LINE_TO, 9, 9, STROKE_PATH], triangle)
    expect(made).toEqual([[1, 2, 3, 4, 5, 6]])
    expect(calls).toEqual(['beginPath', 'beginPath', 'moveTo 0,0', 'fill triangle', 'lineTo 9,9', 'stroke 1 '])
  })
})


describe('telling the same commands', () => {
  it('compares them value for value', () => {
    expect(sameCommands([1, 2, 3], [1, 2, 3])).toBe(true)
    expect(sameCommands([1, 2, 3], [1, 2, 4])).toBe(false)
    expect(sameCommands([1, 2], [1, 2, 3])).toBe(false)
  })
})

describe('when a Graphics is drawn from its picture', () => {
  it('pictures one that keeps still once, then shows the picture', () => {
    const s = new Settle()
    expect(s.step(true, 0)).toBe('bake')
    for (let f = 1; f < 100; f++) expect(s.step(false, f)).toBe('picture')
  })

  it('pictures a second change soon after the first, as a card filled in the frame after it is made', () => {
    const s = new Settle()
    expect([s.step(true, 0), s.step(true, 1), s.step(false, 2)]).toEqual(['bake', 'bake', 'picture'])
  })

  it('replays one that keeps changing, as a bar does, and pictures it once it has kept still', () => {
    const s = new Settle()
    const steps = [0, 1, 2, 3, 4].map(f => s.step(true, f))
    expect(steps).toEqual(['bake', 'bake', 'replay', 'replay', 'replay'])
    expect(s.step(false, 4 + SETTLE_FRAMES - 1)).toBe('replay')
    expect(s.step(false, 4 + SETTLE_FRAMES)).toBe('bake')
    expect(s.step(false, 4 + SETTLE_FRAMES + 1)).toBe('picture')
  })

  it('pictures a change that comes long after the one before', () => {
    const s = new Settle()
    s.step(true, 0)
    s.step(true, 1)
    expect(s.step(true, 1 + SETTLE_FRAMES)).toBe('bake')
    expect(s.step(false, 2 + SETTLE_FRAMES)).toBe('picture')
  })
})
