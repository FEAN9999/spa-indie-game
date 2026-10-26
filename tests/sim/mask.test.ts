import { describe, expect, it } from 'vitest'
import { MaskGame } from '../../src/sim/mask'

const inAnEye = (g: MaskGame, x: number, y: number) => g.eyes().some(e => Math.hypot(x - e.x, y - e.y) <= e.r)

/** Paints the face row by row on a 0.1 grid, lifting the finger after each row; `avoidEyes` skips the points in an eye. */
const sweep = (g: MaskGame, avoidEyes = false, after: () => void = () => {}) => {
  for (let j = -10; j <= 10; j++) {
    for (let i = -10; i <= 10; i++) {
      const [x, y] = [i / 10, j / 10]
      if (x * x + y * y > 1 || (avoidEyes && inAnEye(g, x, y))) continue
      g.paint(x, y)
      after()
    }
    g.lift()
  }
}

/** A game finished after `ms`, with `errors` separate touches of the left eye first. */
const finishAt = (ms: number, errors = 0) => {
  const g = new MaskGame()
  for (let k = 0; k < errors; k++) {
    g.paint(-0.38, -0.1)
    g.lift()
  }
  g.tick(ms)
  sweep(g, true)
  g.placeCucumber(-0.38, -0.1)
  g.placeCucumber(0.38, -0.1)
  return g
}

describe('MaskGame', () => {
  it('fills to the goal by painting the face outside the eyes, then waits for cucumbers', () => {
    const g = new MaskGame()
    expect(g.phase).toBe('paint')
    expect([g.coverage(), g.progress(), g.stars()]).toEqual([0, 0, null])
    g.paint(0, 0.5)
    expect(g.coverage()).toBeGreaterThan(0)
    expect(g.progress()).toBeCloseTo(g.coverage() / 0.9)
    sweep(g)
    expect(g.phase).toBe('cucumber')
    expect(g.coverage()).toBeGreaterThanOrEqual(0.9)
    // the rows at y -0.2, -0.1 and 0 each pass through both eyes
    expect(g.errors).toBe(6)
    // the cucumbers are the next goal, and painting is over
    expect(g.progress()).toBe(0)
    const covered = g.coverage()
    g.paint(0, 0.95)
    g.paint(-0.38, -0.1)
    expect([g.coverage(), g.errors]).toEqual([covered, 6])
    expect(g.stars()).toBeNull()
  })

  it('counts one error per stroke that enters an eye, not per move', () => {
    const g = new MaskGame()
    g.paint(-0.38, -0.1)
    g.paint(-0.37, -0.1)
    expect(g.errors).toBe(1)
    g.lift()
    g.paint(-0.38, -0.1)
    expect(g.errors).toBe(2)
    // leaving the eye and coming back in the same stroke enters it again
    g.paint(-0.6, -0.1)
    g.paint(-0.38, -0.1)
    expect(g.errors).toBe(3)
  })

  it('needs 95% and has bigger eyes for a picky customer', () => {
    expect(new MaskGame().eyes()).toEqual([
      { x: -0.38, y: -0.1, r: 0.16 },
      { x: 0.38, y: -0.1, r: 0.16 },
    ])
    const hard = new MaskGame(true)
    expect(hard.eyes()[0].r).toBe(0.22)
    expect(hard.eyes()[1].r).toBe(0.22)
    // 0.2 from an eye centre: outside a normal eye, inside a picky customer's
    const normal = new MaskGame()
    normal.paint(-0.18, -0.1)
    hard.paint(-0.18, -0.1)
    expect([normal.errors, hard.errors]).toEqual([0, 1])
    hard.lift()

    let stillPaintingAt90 = false
    sweep(hard, true, () => {
      if (hard.coverage() >= 0.9 && hard.coverage() < 0.95) stillPaintingAt90 ||= hard.phase === 'paint'
    })
    expect(stillPaintingAt90).toBe(true)
    expect(hard.phase).toBe('cucumber')
    expect(hard.coverage()).toBeGreaterThanOrEqual(0.95)
  })

  it('snaps a slice near an empty eye and refuses one far from both', () => {
    const g = new MaskGame()
    expect(g.placeCucumber(-0.38, -0.1)).toBeNull()
    sweep(g, true)
    expect(g.phase).toBe('cucumber')
    expect(g.placeCucumber(-0.3, -0.05)).toBe(0)
    expect(g.progress()).toBe(0.5)
    expect(g.placeCucumber(-0.38, -0.1)).toBeNull()
    expect(g.placeCucumber(0, 0.5)).toBeNull()
    expect(g.placeCucumber(0.38 + 0.26, -0.1)).toBeNull()
    expect(g.phase).toBe('cucumber')
    expect(g.placeCucumber(0.3, -0.1)).toBe(1)
    expect(g.phase).toBe('done')
    expect(g.progress()).toBe(1)
  })

  it('stars by time, one fewer for three errors, and one star at the time limit', () => {
    expect(finishAt(10_000).stars()).toBe(3)
    expect(finishAt(10_000, 2).stars()).toBe(3)
    expect(finishAt(10_000, 3).stars()).toBe(2)
    expect(finishAt(20_000).stars()).toBe(2)
    expect(finishAt(24_000).stars()).toBe(1)
    expect(finishAt(24_000, 3).stars()).toBe(1)

    const late = new MaskGame()
    expect(late.limitMs).toBe(25_000)
    sweep(late, true)
    late.tick(24_999)
    expect(late.phase).toBe('cucumber')
    late.tick(1)
    expect(late.phase).toBe('done')
    expect(late.stars()).toBe(1)
    expect(late.placeCucumber(-0.38, -0.1)).toBeNull()
  })
})
