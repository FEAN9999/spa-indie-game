import { describe, expect, it } from 'vitest'
import { CHE_LIMIT_MS, CHE_POUR_MS } from '../../src/config'
import { CheGame, cheStars, drawCheTicket, layerMarks } from '../../src/sim/che'
import type { CheTicket } from '../../src/sim/che'

const ticket = (over: Partial<CheTicket> = {}): CheTicket => ({ mix: 'beans', ice: 'little', extraCoconut: false, ...over })

const pourTo = (g: CheGame, level: number) => {
  g.hold((level - g.level) * CHE_POUR_MS)
  return g.release()
}

const toIce = (g: CheGame) => {
  pourTo(g, 0.3)
  pourTo(g, 0.6)
  pourTo(g, 0.75)
}

const toPour = (g: CheGame) => {
  toIce(g)
  for (let i = 0; i < g.iceTarget(); i++) g.tap()
}

describe('Che rules', () => {
  it('draws the mix then the ice, and gives a hard diner more coconut', () => {
    const values = [0.7, 0.2]
    let calls = 0
    const rng = () => values[calls++]
    expect(drawCheTicket(rng, true)).toEqual({ mix: 'jelly', ice: 'little', extraCoconut: true })
    expect(calls).toBe(2)
  })

  it('puts the bean marks higher for nhiều đậu', () => {
    const beans = layerMarks(ticket({ mix: 'beans' }))
    const jelly = layerMarks(ticket({ mix: 'jelly' }))
    ;[0.3, 0.6, 0.75].forEach((v, i) => expect(beans[i]).toBeCloseTo(v, 9))
    ;[0.2, 0.4, 0.75].forEach((v, i) => expect(jelly[i]).toBeCloseTo(v, 9))
  })

  it('layers on from the last level and scores each against its mark', () => {
    const g = new CheGame(ticket({ mix: 'beans' }))
    g.hold(0.3 * CHE_POUR_MS)
    expect(g.release()).toBe('good')
    g.hold(0.1 * CHE_POUR_MS)
    expect(g.release()).toBe('off')
    g.hold(0.35 * CHE_POUR_MS)
    expect(g.release()).toBe('good')
    expect(g.goodLayers).toBe(2)
    expect(g.phase).toBe('ice')
  })

  it('narrows the mark for a hard diner', () => {
    const plain = new CheGame(ticket(), false)
    plain.hold(0.345 * CHE_POUR_MS)
    expect(plain.release()).toBe('good')
    const hard = new CheGame(ticket(), true)
    hard.hold(0.345 * CHE_POUR_MS)
    expect(hard.release()).toBe('off')
  })

  it('ignores a release before any pouring', () => {
    const g = new CheGame(ticket())
    expect(g.release()).toBeNull()
    expect(g.layer).toBe(0)
    g.hold(0.3 * CHE_POUR_MS)
    g.release()
    expect(g.release()).toBeNull()
    expect(g.layer).toBe(1)
  })

  it('releases on its own when the glass is full, leaving no room for the other layers', () => {
    const g = new CheGame(ticket())
    g.hold(2 * CHE_POUR_MS)
    expect(g.level).toBe(1)
    expect(g.goodLayers).toBe(0)
    expect(g.phase).toBe('ice')
  })

  it('crushes the ice in iceTarget taps and rewards a fast hand', () => {
    const fast = new CheGame(ticket({ ice: 'little' }))
    toIce(fast)
    for (let i = 0; i < 6; i++) {
      fast.tick(300)
      fast.tap()
    }
    expect(fast.phase).toBe('pour')
    expect(fast.iceFast).toBe(true)
    const slow = new CheGame(ticket({ ice: 'little' }))
    toIce(slow)
    for (let i = 0; i < 6; i++) {
      slow.tick(500)
      slow.tap()
    }
    expect(slow.phase).toBe('pour')
    expect(slow.iceFast).toBe(false)
  })

  it('counts a pass each way across the glass', () => {
    const g = new CheGame(ticket())
    toPour(g)
    expect(g.swipeTo(300)).toBe(false)
    expect(g.swipeTo(530)).toBe(true)
    expect(g.passes).toBe(1)
    expect(g.swipeTo(600)).toBe(false)
    expect(g.swipeTo(370)).toBe(true)
    expect(g.passes).toBe(2)
    expect(g.swipeTo(250)).toBe(false)
    expect(g.passes).toBe(2)
  })

  it('forgets the anchor between swipes', () => {
    const g = new CheGame(ticket())
    toPour(g)
    g.swipeTo(100)
    g.endSwipe()
    expect(g.swipeTo(500)).toBe(false)
    expect(g.passes).toBe(0)
    expect(g.swipeTo(280)).toBe(true)
  })

  it('finishes when the coconut is poured, and scores', () => {
    expect(cheStars({ goodLayers: 3, iceFast: true, pourDone: true })).toBe(3)
    expect(cheStars({ goodLayers: 2, iceFast: false, pourDone: true })).toBe(2)
    expect(cheStars({ goodLayers: 0, iceFast: true, pourDone: true })).toBe(1)
    expect(cheStars({ goodLayers: 3, iceFast: true, pourDone: false })).toBe(2)
    expect(cheStars({ goodLayers: 0, iceFast: false, pourDone: false })).toBe(1)
  })

  it('pours the whole glass to three stars', () => {
    const g = new CheGame(ticket({ ice: 'little' }))
    expect(g.stars()).toBeNull()
    toIce(g)
    for (let i = 0; i < 6; i++) {
      g.tick(100)
      g.tap()
    }
    expect(g.passTarget()).toBe(4)
    let x = 100
    g.swipeTo(x)
    for (let i = 0; i < 4; i++) {
      x += i % 2 === 0 ? 230 : -230
      g.swipeTo(x)
    }
    expect(g.phase).toBe('done')
    expect(g.stars()).toBe(3)
  })

  it('asks for more passes when the diner wants extra coconut', () => {
    expect(new CheGame(ticket({ extraCoconut: true })).passTarget()).toBe(6)
    expect(new CheGame(ticket({ ice: 'lots' })).iceTarget()).toBe(12)
  })

  it('moves the bar through the three steps', () => {
    const g = new CheGame(ticket())
    g.hold(0.5 * CHE_POUR_MS)
    expect(g.progress()).toBeCloseTo(0.2)
    g.release()
    pourTo(g, 0.6)
    pourTo(g, 0.75)
    expect(g.progress()).toBeCloseTo(0.4)
    g.tap()
    g.tap()
    g.tap()
    expect(g.progress()).toBeCloseTo(0.55)
  })

  it('finishes on time without the coconut', () => {
    const g = new CheGame(ticket())
    g.tick(CHE_LIMIT_MS)
    expect(g.phase).toBe('done')
    expect(g.stars()).toBe(1)
    expect(g.progress()).toBe(1)
  })
})
