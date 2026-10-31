import { describe, expect, it } from 'vitest'
import { BX_BROWN_MS, BX_LIMIT_MS, BX_PAN } from '../../src/config'
import { BanhXeoGame, banhXeoStars, drawBanhXeoTicket, fillMatches, foldBand, spreadCoverage } from '../../src/sim/banhXeo'
import type { BanhXeoTicket } from '../../src/sim/banhXeo'

const ticket = (over: Partial<BanhXeoTicket> = {}): BanhXeoTicket => ({ filling: 'tom', crisp: 'vua', extraSprouts: false, ...over })

const ring = (radius: number, fromDeg: number, toDeg: number) => {
  const points: { x: number; y: number }[] = []
  for (let d = fromDeg; d < toDeg; d += 5) {
    const a = (d * Math.PI) / 180
    points.push({ x: BX_PAN.x + radius * Math.cos(a), y: BX_PAN.y + radius * Math.sin(a) })
  }
  return points
}

const foldAt = (t: BanhXeoTicket, brown: number, hard = false) => {
  const g = new BanhXeoGame(t, hard)
  g.swirl(ring(200, 0, 360))
  g.doneFilling()
  g.tick(BX_BROWN_MS * brown)
  return g.foldNow()
}

describe('Banh xeo rules', () => {
  it('draws the filling then the crispness, and gives a hard diner extra sprouts', () => {
    const values = [0.2, 0.7]
    let calls = 0
    const rng = () => values[calls++]
    expect(drawBanhXeoTicket(rng, true)).toEqual({ filling: 'tom', crisp: 'ky', extraSprouts: true })
    expect(calls).toBe(2)
  })

  it('measures a full ring as full and a half ring as half', () => {
    expect(spreadCoverage(ring(200, 0, 360))).toBe(1)
    expect(Math.abs(spreadCoverage(ring(200, 0, 180)) - 0.5)).toBeLessThanOrEqual(1 / 24)
    expect(spreadCoverage(ring(40, 0, 360))).toBe(0)
  })

  it('needs a long enough swirl', () => {
    const g = new BanhXeoGame(ticket())
    expect(g.swirl(ring(200, 0, 90))).toBe('short')
    expect(g.phase).toBe('spread')
    expect(g.swirl(ring(200, 0, 360))).toBe('good')
    expect(g.phase).toBe('fill')
    expect(g.spread).toBe(1)
  })

  it('matches the fillings to the ticket', () => {
    const t = ticket({ filling: 'tom' })
    expect(fillMatches(t, { tom: 1, thit: 0, gia: 1 })).toBe(true)
    expect(fillMatches(t, { tom: 1, thit: 1, gia: 1 })).toBe(false)
    expect(fillMatches(t, { tom: 1, thit: 0, gia: 0 })).toBe(false)
    const extra = ticket({ extraSprouts: true })
    expect(fillMatches(extra, { tom: 1, thit: 0, gia: 1 })).toBe(false)
    expect(fillMatches(extra, { tom: 1, thit: 0, gia: 2 })).toBe(true)
  })

  it('sets the fold band by crispness and narrows it for a hard diner', () => {
    const [a, b] = foldBand(ticket({ crisp: 'ky' }), false)
    expect(a).toBeCloseTo(0.68)
    expect(b).toBeCloseTo(0.85)
    const [c, d] = foldBand(ticket({ crisp: 'vua' }), true)
    expect(c).toBeCloseTo(0.49)
    expect(d).toBeCloseTo(0.58)
  })

  it('browns over BX_BROWN_MS and folds by itself when burnt', () => {
    const g = new BanhXeoGame(ticket())
    g.tick(BX_BROWN_MS)
    expect(g.brown).toBe(0)
    g.swirl(ring(200, 0, 360))
    g.doneFilling()
    expect(g.phase).toBe('fold')
    g.tick(BX_BROWN_MS / 2)
    expect(g.brown).toBeCloseTo(0.5)
    g.tick(BX_BROWN_MS)
    expect(g.phase).toBe('done')
    expect(g.fold).toBe('far')
  })

  it('scores a fold in the band, near it and far from it', () => {
    const t = ticket({ crisp: 'vua' })
    expect(foldAt(t, 0.5)).toBe('in')
    expect(foldAt(t, 0.4)).toBe('near')
    expect(foldAt(t, 0.2)).toBe('far')
    expect(foldAt(t, 0.46, true)).toBe('near')
  })

  it('scores stars like Pho', () => {
    expect(banhXeoStars({ spread: 0.9, fold: 'in', ticketOk: true })).toBe(3)
    expect(banhXeoStars({ spread: 0.5, fold: 'in', ticketOk: true })).toBe(2)
    expect(banhXeoStars({ spread: 0.9, fold: 'far', ticketOk: true })).toBe(1)
    expect(banhXeoStars({ spread: 0.9, fold: 'in', ticketOk: false })).toBe(2)
    expect(banhXeoStars({ spread: 0.2, fold: 'far', ticketOk: false })).toBe(1)
  })

  it('plays a whole pancake to three stars', () => {
    const g = new BanhXeoGame(ticket({ filling: 'tom' }))
    expect(g.stars()).toBeNull()
    g.swirl(ring(200, 0, 360))
    g.add('tom')
    g.add('gia')
    g.doneFilling()
    g.tick(BX_BROWN_MS * 0.5)
    g.foldNow()
    expect(g.phase).toBe('done')
    expect(g.stars()).toBe(3)
  })

  it('finishes on time with whatever was done', () => {
    const g = new BanhXeoGame(ticket())
    g.tick(BX_LIMIT_MS)
    expect(g.phase).toBe('done')
    expect(g.stars()).toBe(1)
  })
})
