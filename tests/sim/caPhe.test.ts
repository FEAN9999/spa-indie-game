import { describe, expect, it } from 'vitest'
import { CF_DRIP_BAND, CF_DRIP_RATE, CF_ICE, CF_LIMIT_MS, CF_MILK, CF_MILK_MOST, CF_MILK_POUR_MS, DISH_BUY_PRICE, STOCK_START } from '../../src/config'
import { CaPheGame, caPheStars, drawCaPheTicket, dripBand, milkBand, type CaPheTicket } from '../../src/sim/caPhe'
import { BASE_DISHES } from '../../src/sim/menu'
import { createRng } from '../../src/sim/rng'
import { restaurantFor, starShop } from './helpers'

const TICKET: CaPheTicket = { sweet: 'vua', ice: 'it', strong: false }
const mid = ([lo, hi]: [number, number]) => (lo + hi) / 2

/** Pours the milk until it reaches `k`, ticking in frames, then lets go. */
const pourTo = (g: CaPheGame, k: number) => {
  g.startPour()
  for (let i = 0; i < 10_000 && g.phase === 'milk' && g.milk < k; i++) g.tick(10)
  return g.stopPour()
}
/** Lets the phin drip until the coffee reaches `k`, then lifts it. */
const dripTo = (g: CaPheGame, k: number) => {
  for (let i = 0; i < 10_000 && g.phase === 'drip' && g.level < k; i++) g.tick(10)
  return g.lift()
}

describe('the Cà phê sữa đá ticket', () => {
  it('rolls the sweetness, then the ice, and makes it strong for a hard diner', () => {
    const seen = new Set<string>()
    const rng = createRng(8)
    for (let i = 0; i < 200; i++) {
      const tk = drawCaPheTicket(rng, false)
      seen.add(`${tk.sweet}:${tk.ice}`)
      expect(tk.strong).toBe(false)
    }
    expect([...seen].sort()).toEqual(['it:it', 'it:nhieu', 'vua:it', 'vua:nhieu'])
    expect(drawCaPheTicket(createRng(1), true).strong).toBe(true)
  })

  it("sets the milk's mark by the sweetness and the coffee's by the strength, tighter milk for a hard diner", () => {
    expect(mid(milkBand(TICKET, false))).toBeCloseTo(CF_MILK.vua)
    expect(mid(milkBand({ ...TICKET, sweet: 'it' }, false))).toBeCloseTo(CF_MILK.it)
    const [lo, hi] = milkBand(TICKET, true)
    expect(hi - lo).toBeLessThan(milkBand(TICKET, false)[1] - milkBand(TICKET, false)[0])
    expect(dripBand(TICKET)).toEqual([...CF_DRIP_BAND.vua])
    expect(dripBand({ ...TICKET, strong: true })).toEqual([...CF_DRIP_BAND.dam])
  })

  it('gives a star for the milk and one for the coffee, and takes one for coffee far off or the wrong ice', () => {
    expect(caPheStars({ milk: 'in', drip: 'in', iceOk: true })).toBe(3)
    expect(caPheStars({ milk: 'near', drip: 'in', iceOk: true })).toBe(2)
    expect(caPheStars({ milk: 'in', drip: 'near', iceOk: true })).toBe(2)
    expect(caPheStars({ milk: 'in', drip: 'in', iceOk: false })).toBe(2)
    expect(caPheStars({ milk: 'in', drip: 'far', iceOk: true })).toBe(1)
  })
})

describe('the Cà phê sữa đá game', () => {
  it('makes a perfect cup to 3 stars for every ticket, plain and hard', () => {
    for (const sweet of ['it', 'vua'] as const)
      for (const ice of ['it', 'nhieu'] as const)
        for (const hard of [false, true]) {
          const tk = { sweet, ice, strong: hard }
          const g = new CaPheGame(tk, hard)
          expect(pourTo(g, mid(milkBand(tk, hard)))).toBe('in')
          expect(dripTo(g, mid(dripBand(tk)))).toBe('in')
          for (let i = 0; i < CF_ICE[ice]; i++) g.addIce()
          g.doneIce()
          expect(g.stars()).toBe(3)
        }
  })

  it('pours only while held, at the can speed, and ignores a tap that pours nothing', () => {
    const g = new CaPheGame(TICKET)
    g.tick(500)
    expect(g.milk).toBe(0)
    g.startPour()
    expect(g.stopPour()).toBeNull()
    expect(g.phase).toBe('milk')
    g.startPour()
    g.tick(CF_MILK_POUR_MS / 10)
    expect(g.milk).toBeCloseTo(0.1)
  })

  it('judges the milk on letting go, and stops a can held to the most', () => {
    const little = new CaPheGame(TICKET)
    expect(pourTo(little, 0.05)).toBe('far')
    const lots = new CaPheGame(TICKET)
    lots.startPour()
    for (let i = 0; i < 1000 && lots.phase === 'milk'; i++) lots.tick(10)
    expect(lots.milk).toBe(CF_MILK_MOST)
    expect(lots.milkResult).toBe('far')
    expect(lots.phase).toBe('drip')
  })

  it('drips coffee on top of the milk, and runs over when left to drip full', () => {
    const g = new CaPheGame(TICKET)
    pourTo(g, CF_MILK.vua)
    const start = g.level
    g.tick(1000)
    expect(g.level).toBeCloseTo(start + CF_DRIP_RATE)
    for (let i = 0; i < 2000 && g.phase === 'drip'; i++) g.tick(10)
    expect(g.dripResult).toBe('far')
    expect(g.phase).toBe('ice')
  })

  it('counts ice only on its step and wants the ticket count exactly', () => {
    const g = new CaPheGame(TICKET)
    g.addIce()
    expect(g.ice).toBe(0)
    pourTo(g, CF_MILK.vua)
    dripTo(g, mid(dripBand(TICKET)))
    for (let i = 0; i < CF_ICE.it + 1; i++) g.addIce()
    g.doneIce()
    expect(g.stars()).toBe(2)
  })

  it('ends at the time limit with every step not done far off', () => {
    const g = new CaPheGame(TICKET)
    g.tick(CF_LIMIT_MS)
    expect(g.phase).toBe('done')
    expect(g.stars()).toBe(1)
    expect(g.progress()).toBe(1)
  })
})

describe('Cà phê sữa đá on the restaurant menu', () => {
  it('is not sold until bought, then costs 800.000 đ once, listed last', () => {
    const main = starShop(3, 10_000_000)
    const r = restaurantFor(main)
    expect(r.buyDish('caPhe')).toBeNull()
    expect(main.money).toBe(10_000_000 - DISH_BUY_PRICE.caPhe)
    r.buyDish('bunCha')
    expect(r.menu()).toEqual([...BASE_DISHES, 'bunCha', 'caPhe'])
    expect(r.stock.cafeKit).toBe(STOCK_START)
    const d = r.spawnDiner({ kind: 'student', dish: 'caPhe' })!
    expect(d.ticket).toHaveProperty('sweet')
  })
})

describe('Cà phê sữa đá and the herbs', () => {
  it('takes no herbs: it sells with none left, and a coffee diner holds none', () => {
    const r = restaurantFor(starShop(3, 10_000_000))
    r.buyDish('caPhe')
    r.stock.herbs = 1
    r.spawnDiner({ kind: 'student', dish: 'caPhe' })
    expect(r.herbsLeft()).toBe(1)
    r.spawnDiner({ kind: 'student', dish: 'pho' })
    expect(r.herbsLeft()).toBe(0)
    expect(r.portionsLeft('pho')).toBe(0)
    expect(r.portionsLeft('caPhe')).toBe(STOCK_START - 1)
    expect(r.sellableDishes()).toEqual(['caPhe'])
  })

  it('leaves the herbs alone when a coffee is made', () => {
    const r = restaurantFor(starShop(3, 10_000_000))
    r.buyDish('caPhe')
    const d = r.spawnDiner({ kind: 'student', dish: 'caPhe' })!
    for (let t = 0; d.state !== 'ordering' && t < 30_000; t += 50) r.advance(50)
    const herbs = r.stock.herbs
    const kit = r.stock.cafeKit
    // the owner comes in, takes the order, and the cup is started at the stove
    r.ownerArrives()
    r.tapTile(d.chair!)
    for (let t = 0; r.stock.cafeKit === kit && t < 30_000; t += 50) r.advance(50)
    expect(r.stock.cafeKit).toBe(kit - 1)
    expect(r.stock.herbs).toBe(herbs)
  })
})
