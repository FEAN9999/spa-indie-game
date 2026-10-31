import { describe, expect, it } from 'vitest'
import { PHO_BOIL_MS, PHO_CUT_X, PHO_LIMIT_MS } from '../../src/config'
import { PhoGame, boilBand, drawPhoTicket, phoStars, ticketMatches } from '../../src/sim/pho'
import type { PhoTicket } from '../../src/sim/pho'

const ticket = (over: Partial<PhoTicket> = {}): PhoTicket => ({ doneness: 'chin', onion: 'little', chili: false, extraHerb: false, ...over })

const cutAll = (g: PhoGame) => PHO_CUT_X.forEach((x) => g.cut(x, 300))

describe('Pho rules', () => {
  it('draws a ticket from three rolls and adds the extra herb line for a hard customer', () => {
    const rolls = (values: number[]) => {
      let calls = 0
      return { rng: () => values[calls++ % values.length], calls: () => calls }
    }
    const a = rolls([0.1, 0.9, 0.1])
    expect(drawPhoTicket(a.rng, false)).toEqual({ doneness: 'tai', onion: 'lots', chili: true, extraHerb: false })
    expect(a.calls()).toBe(3)
    const b = rolls([0.1, 0.9, 0.1])
    expect(drawPhoTicket(b.rng, true)).toEqual({ doneness: 'tai', onion: 'lots', chili: true, extraHerb: true })
    expect(b.calls()).toBe(3)
  })

  it('sets the band low for tái, high for chín, and narrower for a hard customer', () => {
    const [a, b] = boilBand(ticket({ doneness: 'tai' }), false)
    expect(a).toBeCloseTo(0.42)
    expect(b).toBeCloseTo(0.6)
    const [c, d] = boilBand(ticket({ doneness: 'chin' }), false)
    expect(c).toBeCloseTo(0.62)
    expect(d).toBeCloseTo(0.8)
    const [e, f] = boilBand(ticket({ doneness: 'tai' }), true)
    expect(e).toBeCloseTo(0.47)
    expect(f).toBeCloseTo(0.55)
  })

  it('judges a swipe by its nearest undone line', () => {
    const g = new PhoGame(ticket())
    expect(g.cut(480, 100)).toBe('short')
    expect(g.cutsDone).toEqual([false, false, false, false])
    expect(g.cut(480 + 30, 300)).toBe('good')
    expect(g.cutsDone).toEqual([false, true, false, false])
    expect(g.goodCuts).toBe(1)
    expect(g.cut(480, 300)).toBe('off')
    expect(g.cutsDone).toEqual([true, true, false, false])
    expect(g.goodCuts).toBe(1)
    g.cut(615, 300)
    expect(g.phase).toBe('cut')
    g.cut(750, 300)
    expect(g.phase).toBe('boil')
    expect(g.cut(480, 300)).toBeNull()
  })

  it("judges the boil against the ticket's band", () => {
    const boil = (hold: number) => {
      const g = new PhoGame(ticket({ doneness: 'chin' }))
      cutAll(g)
      g.hold(PHO_BOIL_MS * hold)
      return g
    }
    const a = boil(0.7)
    expect(a.release()).toBe('in')
    expect(a.phase).toBe('top')
    expect(boil(0.57).release()).toBe('near')
    expect(boil(0.3).release()).toBe('far')
    const d = boil(2)
    expect(d.boil).toBe('far')
    expect(d.phase).toBe('top')
  })

  it('matches the toppings to the ticket', () => {
    const t = ticket({ onion: 'little', chili: false })
    expect(ticketMatches(t, { onion: 1, chili: 0, herb: 1 })).toBe(true)
    expect(ticketMatches(t, { onion: 2, chili: 0, herb: 1 })).toBe(false)
    expect(ticketMatches(t, { onion: 1, chili: 1, herb: 1 })).toBe(false)
    expect(ticketMatches(t, { onion: 1, chili: 0, herb: 0 })).toBe(false)
    expect(ticketMatches(ticket({ onion: 'lots', chili: true }), { onion: 3, chili: 1, herb: 1 })).toBe(true)
    const extra = ticket({ extraHerb: true })
    expect(ticketMatches(extra, { onion: 1, chili: 0, herb: 1 })).toBe(false)
    expect(ticketMatches(extra, { onion: 1, chili: 0, herb: 2 })).toBe(true)
  })

  it('scores one star to start, one for three good cuts, one in the band, minus one far and one for a wrong ticket', () => {
    expect(phoStars({ goodCuts: 4, boil: 'in', ticketOk: true })).toBe(3)
    expect(phoStars({ goodCuts: 3, boil: 'near', ticketOk: true })).toBe(2)
    expect(phoStars({ goodCuts: 2, boil: 'in', ticketOk: true })).toBe(2)
    expect(phoStars({ goodCuts: 4, boil: 'far', ticketOk: true })).toBe(1)
    expect(phoStars({ goodCuts: 4, boil: 'in', ticketOk: false })).toBe(2)
    expect(phoStars({ goodCuts: 0, boil: 'far', ticketOk: false })).toBe(1)
  })

  it('plays a whole bowl to three stars', () => {
    const g = new PhoGame(ticket({ doneness: 'chin', onion: 'little', chili: false }))
    expect(g.stars()).toBeNull()
    cutAll(g)
    expect(g.goodCuts).toBe(4)
    g.hold(PHO_BOIL_MS * 0.7)
    g.release()
    g.add('onion')
    g.add('herb')
    g.serve()
    expect(g.phase).toBe('done')
    expect(g.stars()).toBe(3)
  })

  it('ends at the time limit with what is done', () => {
    const g = new PhoGame(ticket())
    g.cut(345, 300)
    g.cut(480, 300)
    g.tick(PHO_LIMIT_MS)
    expect(g.phase).toBe('done')
    expect(g.boil).toBe('far')
    expect(g.stars()).toBe(1)
  })
})
