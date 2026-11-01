import { describe, expect, it } from 'vitest'
import { BC_BAND, BC_BROWN_MS, BC_LIMIT_MS, BC_POUR_MS, BC_SAUCE_LINE, DISH_BUY_PRICE, LOW_STOCK, RESTAURANT_RESTOCK_PRICE, STOCK_START } from '../../src/config'
import { BunChaGame, bunChaStars, drawBunChaTicket, grillBand, sauceBand, sidesMatch, type BunChaTicket } from '../../src/sim/bunCha'
import { BASE_DISHES } from '../../src/sim/menu'
import { createRng } from '../../src/sim/rng'
import { parseSave } from '../../src/sim/save'
import { Chain } from '../../src/sim/chain'
import { restaurantFor, starShop } from './helpers'

const TICKET: BunChaTicket = { grill: 'vua', chili: true, extraHerb: false }

/** Ticks until the needle reaches `k` (on the grill) or the sauce does (while pouring). */
const browns = (g: BunChaGame, k: number) => {
  for (let i = 0; i < 10_000 && g.brown < k && g.phase === 'grill'; i++) g.tick(10)
}
const pours = (g: BunChaGame, k: number) => {
  g.startPour()
  for (let i = 0; i < 10_000 && g.sauce < k && g.phase === 'pour'; i++) g.tick(10)
  return g.stopPour()
}
const mid = ([lo, hi]: readonly [number, number] | [number, number]) => (lo + hi) / 2

/** Plays a whole bowl: both sides turned at `turn`, the sides as given, the sauce let go at `sauce`. */
function cook(ticket: BunChaTicket, hard: boolean, turn: number, sauce: number, sides: { rau: number; du: number; ot: number }) {
  const g = new BunChaGame(ticket, hard)
  for (let i = 0; i < 2; i++) {
    browns(g, turn)
    g.flip()
  }
  for (const [side, n] of Object.entries(sides) as [keyof typeof sides, number][]) for (let i = 0; i < n; i++) g.add(side)
  g.doneSides()
  pours(g, sauce)
  return g
}

describe('the Bún chả ticket', () => {
  it('rolls the grill, then the chili, and adds extra herbs for a hard diner', () => {
    const seen = new Set<string>()
    const rng = createRng(3)
    for (let i = 0; i < 200; i++) {
      const tk = drawBunChaTicket(rng, false)
      seen.add(`${tk.grill}:${tk.chili}`)
      expect(tk.extraHerb).toBe(false)
    }
    expect([...seen].sort()).toEqual(['chay:false', 'chay:true', 'vua:false', 'vua:true'])
    expect(drawBunChaTicket(createRng(1), true).extraHerb).toBe(true)
  })

  it("narrows a hard diner's bands", () => {
    expect(grillBand(TICKET, false)).toEqual([...BC_BAND.vua])
    const [lo, hi] = grillBand(TICKET, true)
    expect(lo).toBeGreaterThan(BC_BAND.vua[0])
    expect(hi).toBeLessThan(BC_BAND.vua[1])
    expect(sauceBand(true)[1] - sauceBand(true)[0]).toBeLessThan(sauceBand(false)[1] - sauceBand(false)[0])
  })

  it('matches the sides: herbs (two for extra), papaya, and chili only when asked', () => {
    expect(sidesMatch(TICKET, { rau: 1, du: 1, ot: 1 })).toBe(true)
    expect(sidesMatch(TICKET, { rau: 1, du: 1, ot: 0 })).toBe(false)
    expect(sidesMatch({ ...TICKET, chili: false }, { rau: 1, du: 1, ot: 1 })).toBe(false)
    expect(sidesMatch({ ...TICKET, chili: false }, { rau: 3, du: 2, ot: 0 })).toBe(true)
    expect(sidesMatch({ ...TICKET, extraHerb: true }, { rau: 1, du: 1, ot: 1 })).toBe(false)
    expect(sidesMatch(TICKET, { rau: 1, du: 0, ot: 1 })).toBe(false)
  })

  it('gives a star for both sides in the band and one for the sauce, and takes one for a burnt side or the wrong sides', () => {
    expect(bunChaStars({ flips: ['in', 'in'], pour: 'in', ticketOk: true })).toBe(3)
    expect(bunChaStars({ flips: ['in', 'near'], pour: 'in', ticketOk: true })).toBe(2)
    expect(bunChaStars({ flips: ['in', 'in'], pour: 'near', ticketOk: true })).toBe(2)
    expect(bunChaStars({ flips: ['in', 'in'], pour: 'in', ticketOk: false })).toBe(2)
    expect(bunChaStars({ flips: ['far', 'in'], pour: 'in', ticketOk: true })).toBe(1)
    expect(bunChaStars({ flips: ['far', 'far'], pour: 'far', ticketOk: false })).toBe(1)
  })
})

describe('the Bún chả game', () => {
  it('cooks a perfect bowl to 3 stars for either grill, plain and hard', () => {
    for (const grill of ['vua', 'chay'] as const)
      for (const hard of [false, true]) {
        const tk = { ...TICKET, grill, extraHerb: hard }
        const g = cook(tk, hard, mid(grillBand(tk, hard)), BC_SAUCE_LINE, { rau: hard ? 2 : 1, du: 1, ot: 1 })
        expect(g.flips).toEqual(['in', 'in'])
        expect(g.pour).toBe('in')
        expect(g.stars()).toBe(3)
      }
  })

  it('judges each side as it is turned and starts the next side from raw', () => {
    const g = new BunChaGame(TICKET)
    browns(g, 0.1)
    expect(g.flip()).toBe('far')
    expect(g.brown).toBe(0)
    browns(g, BC_BAND.vua[0] - 0.04)
    expect(g.flip()).toBe('near')
    expect(g.phase).toBe('sides')
    expect(g.flip()).toBeNull()
  })

  it('turns a side by itself, burnt, once it is fully brown', () => {
    const g = new BunChaGame(TICKET)
    g.tick(BC_BROWN_MS)
    expect(g.flips).toEqual(['far'])
    expect(g.brown).toBe(0)
  })

  it('counts sides only on their step, and pours only while held', () => {
    const g = new BunChaGame(TICKET)
    g.add('rau')
    g.startPour()
    g.tick(100)
    expect([g.counts.rau, g.sauce]).toEqual([0, 0])
    g.flip()
    g.flip()
    g.add('rau')
    g.add('ot')
    expect(g.counts).toEqual({ rau: 1, du: 0, ot: 1 })
    g.doneSides()
    g.add('du')
    expect(g.counts.du).toBe(0)
    g.tick(500)
    expect(g.sauce).toBe(0)
    expect(g.stopPour()).toBeNull()
  })

  it('ignores a tap that pours nothing, and stops a pour held to the brim, spilt', () => {
    const g = new BunChaGame(TICKET)
    g.flip()
    g.flip()
    g.doneSides()
    g.startPour()
    expect(g.stopPour()).toBeNull()
    expect(g.phase).toBe('pour')
    g.startPour()
    g.tick(BC_POUR_MS)
    expect(g.pour).toBe('far')
    expect(g.phase).toBe('done')
  })

  it('ends at the time limit with every step not done counted as far off', () => {
    const g = new BunChaGame(TICKET)
    for (let t = 0; t < BC_LIMIT_MS; t += 100) {
      if (g.phase === 'grill' && g.brown >= mid(BC_BAND.vua)) g.flip()
      g.tick(100)
    }
    expect(g.phase).toBe('done')
    expect(g.flips).toEqual(['in', 'in'])
    expect(g.pour).toBe('far')
    expect(g.stars()).toBe(1)
    expect(g.progress()).toBe(1)
  })

  it('moves the bar through the grill, the sides and the sauce', () => {
    const g = new BunChaGame(TICKET)
    expect(g.progress()).toBe(0)
    g.flip()
    expect(g.progress()).toBe(0.25)
    g.flip()
    expect(g.progress()).toBe(0.6)
    g.doneSides()
    expect(g.progress()).toBe(0.7)
  })
})

describe('Bún chả on the restaurant menu', () => {
  it('is not sold until bought, then costs 1.200.000 đ once', () => {
    const main = starShop(3, 10_000_000)
    const r = restaurantFor(main)
    expect(r.menu()).toEqual([...BASE_DISHES])
    expect(r.sellableDishes()).not.toContain('bunCha')
    expect(r.buyProblem('bunCha')).toBeNull()
    expect(r.buyDish('bunCha')).toBeNull()
    expect(main.money).toBe(10_000_000 - DISH_BUY_PRICE.bunCha)
    expect(r.menu()).toEqual([...BASE_DISHES, 'bunCha'])
    expect(r.sellableDishes()).toContain('bunCha')
    expect(r.stock.chaKit).toBe(STOCK_START)
    expect(r.buyDish('bunCha')).toBe('have')
    expect(main.money).toBe(10_000_000 - DISH_BUY_PRICE.bunCha)
  })

  it('cannot be bought short of money or in debt', () => {
    expect(restaurantFor(starShop(3, DISH_BUY_PRICE.bunCha - 1)).buyDish('bunCha')).toBe('money')
    expect(restaurantFor(starShop(3, -1)).buyProblem('bunCha')).toBe('money')
  })

  it('serves a diner who orders it with a Bún chả ticket, using its stock and a herb', () => {
    const r = restaurantFor(starShop(3, 10_000_000))
    r.buyDish('bunCha')
    const d = r.spawnDiner({ kind: 'student', dish: 'bunCha' })!
    expect(d.ticket).toHaveProperty('grill')
    expect(r.portionsLeft('bunCha')).toBe(STOCK_START - 1)
  })

  it('offers cooks with a Bún chả specialty only once it is on the menu', () => {
    const main = starShop(3, 10_000_000)
    const r = restaurantFor(main)
    const specialties = () => {
      const out = new Set<string>()
      for (let i = 0; i < 40; i++) {
        for (const c of r.todayCandidates()) for (const [d, n] of Object.entries(c.tiers)) if (n > 0) out.add(d)
        main.day++
      }
      return out
    }
    expect(specialties().has('bunCha')).toBe(false)
    r.buyDish('bunCha')
    expect(specialties().has('bunCha')).toBe(true)
  })

  it('restocks its item alone only once it is on the menu', () => {
    const main = starShop(3, 10_000_000)
    const r = restaurantFor(main)
    r.stock.chaKit = LOW_STOCK
    r.ownerAway = true
    r.advance(100)
    expect(r.stock.chaKit).toBe(LOW_STOCK)
    r.buyDish('bunCha')
    const money = main.money
    r.advance(100)
    expect(r.stock.chaKit).toBeGreaterThan(LOW_STOCK)
    expect(main.money).toBe(money - RESTAURANT_RESTOCK_PRICE.chaKit)
  })

  it('keeps what was bought through a save', () => {
    const chain = new Chain(starShop(3, 20_000_000), 11)
    const r = restaurantFor(chain.main)
    r.buyDish('bunCha')
    const raw = structuredClone({ ...chain.main.toSave(), restaurant: { ...r.toSave(), ownerAt: 'spa' } })
    expect(parseSave(raw).restaurant?.bought).toEqual(['bunCha'])
    const odd = structuredClone(raw) as { restaurant: { bought: unknown } }
    odd.restaurant.bought = ['bunCha', 'pho', 'nope', 3]
    expect(parseSave(odd).restaurant?.bought).toEqual(['bunCha'])
    odd.restaurant.bought = 'bunCha'
    expect(parseSave(odd).restaurant?.bought).toEqual([])
  })
})

describe('turning the Bún chả basket', () => {
  it('keeps how brown each side was when it was turned', () => {
    const g = new BunChaGame(TICKET)
    g.tick(1000)
    g.flip()
    g.tick(BC_BROWN_MS)
    expect(g.turnedAt).toEqual([1000 / BC_BROWN_MS, 1])
  })
})
