import { describe, expect, it } from 'vitest'
import { Gestures } from '../../src/view/gestures'

describe('gestures', () => {
  it('taps where a press that stayed within the slop is lifted', () => {
    const g = new Gestures()
    g.down(1, 100, 100, 0)
    expect(g.move(1, 119, 100, 10)).toEqual({ kind: 'none' })
    expect(g.busy).toBe(false)
    expect(g.up(1, 119, 100, 20)).toEqual({ kind: 'tap', x: 119, y: 100 })
  })

  it('pans a finger past the slop, the first step the whole way from the press, and releases it with its speed', () => {
    const g = new Gestures()
    g.down(1, 100, 100, 0)
    expect(g.move(1, 121, 100, 10)).toEqual({ kind: 'pan', dx: 21, dy: 0 })
    expect(g.busy).toBe(true)
    expect(g.move(1, 126, 100, 20)).toEqual({ kind: 'pan', dx: 5, dy: 0 })
    expect(g.up(1, 126, 100, 25)).toEqual({ kind: 'release', vx: 0.5, vy: 0 })
    expect(g.busy).toBe(false)
  })

  it('lets a pan that was held still before lifting stop where it is', () => {
    const g = new Gestures()
    g.down(1, 100, 100, 0)
    g.move(1, 150, 100, 10)
    expect(g.up(1, 150, 100, 400)).toEqual({ kind: 'none' })
  })

  it('gives a 25 px move as one step of 25', () => {
    const g = new Gestures()
    g.down(1, 0, 0, 0)
    expect(g.move(1, 25, 0, 16)).toEqual({ kind: 'pan', dx: 25, dy: 0 })
  })

  it('pinches about the fingers’ midpoint by the change in their distance', () => {
    const g = new Gestures()
    g.down(1, 100, 500, 0)
    expect(g.busy).toBe(false)
    g.down(2, 200, 500, 5)
    expect(g.busy).toBe(true)
    expect(g.move(2, 250, 500, 20)).toEqual({ kind: 'pinch', factor: 1.5, x: 175, y: 500, dx: 25, dy: 0 })
  })

  it('never taps after a pinch, and pans the finger left from where it is', () => {
    const g = new Gestures()
    g.down(1, 100, 500, 0)
    g.down(2, 200, 500, 5)
    g.move(2, 250, 500, 20)
    expect(g.up(2, 250, 500, 30)).toEqual({ kind: 'none' })
    expect(g.busy).toBe(true)
    expect(g.move(1, 110, 500, 40)).toEqual({ kind: 'pan', dx: 10, dy: 0 })
    expect(g.up(1, 110, 500, 50)).toEqual({ kind: 'release', vx: 1, vy: 0 })
    expect(g.busy).toBe(false)
  })

  it('gives nothing when both pinching fingers come up without the last one moving', () => {
    const g = new Gestures()
    g.down(1, 100, 500, 0)
    g.down(2, 200, 500, 5)
    g.up(1, 100, 500, 10)
    expect(g.up(2, 200, 500, 12)).toEqual({ kind: 'none' })
  })

  it('forgets a touch that was cancelled', () => {
    const g = new Gestures()
    g.down(1, 0, 0, 0)
    g.move(1, 50, 0, 10)
    g.cancel()
    expect(g.busy).toBe(false)
    g.down(1, 0, 0, 20)
    expect(g.up(1, 0, 0, 30)).toEqual({ kind: 'tap', x: 0, y: 0 })
  })
})
