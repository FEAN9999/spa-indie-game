import { describe, expect, it } from 'vitest'
import { CT_BURN_MS, CT_FAN_PX, CT_GRILL_MS, CT_HEAT, CT_LIMIT_MS, CT_OIL_AT, CT_OIL_SPOTS, CT_SPOT_GAP_MS, CT_SPOT_MS, CT_SPOT_MS_HARD, CT_SPOT_R, DISH_BUY_PRICE, STOCK_START } from '../../src/config'
import { ComTamGame, comTamStars, ctHeat, drawComTamTicket, partsMatch, type ComTamTicket } from '../../src/sim/comTam'
import { BASE_DISHES } from '../../src/sim/menu'
import { createRng } from '../../src/sim/rng'
import { restaurantFor, starShop } from './helpers'

const TICKET: ComTamTicket = { combo: 'bi', extraPickle: false }

/** Fans whenever the heat drops under the band's middle, ticking in 50 ms steps, until the chop is grilled. */
function grillWell(g: ComTamGame) {
  const [lo, hi] = ctHeat(g.hard).band
  for (let i = 0; i < 2000 && g.phase === 'grill'; i++) {
    if (g.heat < (lo + hi) / 2) g.fan(CT_FAN_PX)
    g.tick(50)
  }
}
/** Waits for the lit oil spot and taps it. */
function catchSpot(g: ComTamGame) {
  for (let i = 0; i < 200 && g.litSpot() === null && g.phase === 'oil'; i++) g.tick(10)
  const lit = g.litSpot()
  if (lit === null) return null
  return g.tap(CT_OIL_AT[lit].x + 10, CT_OIL_AT[lit].y - 10)
}

describe('the Cơm tấm ticket', () => {
  it('rolls skin, meatloaf or egg beside the chop, and adds extra pickles for a hard diner', () => {
    const seen = new Set<string>()
    const rng = createRng(6)
    for (let i = 0; i < 100; i++) seen.add(drawComTamTicket(rng, false).combo)
    expect([...seen].sort()).toEqual(['bi', 'cha', 'trung'])
    expect(drawComTamTicket(createRng(1), true).extraPickle).toBe(true)
  })

  it('matches the sides: only the ticket one of the three, and pickles', () => {
    expect(partsMatch(TICKET, { bi: 1, cha: 0, trung: 0, chua: 1 })).toBe(true)
    expect(partsMatch(TICKET, { bi: 2, cha: 0, trung: 0, chua: 3 })).toBe(true)
    expect(partsMatch(TICKET, { bi: 1, cha: 1, trung: 0, chua: 1 })).toBe(false)
    expect(partsMatch(TICKET, { bi: 0, cha: 0, trung: 1, chua: 1 })).toBe(false)
    expect(partsMatch(TICKET, { bi: 1, cha: 0, trung: 0, chua: 0 })).toBe(false)
    expect(partsMatch({ ...TICKET, extraPickle: true }, { bi: 1, cha: 0, trung: 0, chua: 1 })).toBe(false)
  })

  it('gives a star for a chop grilled right and one for the oil, and takes one for a burnt chop or the wrong sides', () => {
    expect(comTamStars({ grill: 'in', caught: 5, ticketOk: true })).toBe(3)
    expect(comTamStars({ grill: 'in', caught: 4, ticketOk: true })).toBe(3)
    expect(comTamStars({ grill: 'near', caught: 5, ticketOk: true })).toBe(2)
    expect(comTamStars({ grill: 'in', caught: 3, ticketOk: true })).toBe(2)
    expect(comTamStars({ grill: 'far', caught: 5, ticketOk: true })).toBe(1)
    expect(comTamStars({ grill: 'in', caught: 5, ticketOk: false })).toBe(2)
  })
})

describe('the Cơm tấm grill', () => {
  it('raises the heat once for every stretch of fanning, and only while grilling', () => {
    const g = new ComTamGame(TICKET, false, createRng(1))
    expect(g.fan(CT_FAN_PX - 1)).toBe(0)
    expect(g.heat).toBe(CT_HEAT.start)
    expect(g.fan(1)).toBe(1)
    expect(g.fan(CT_FAN_PX * 2)).toBe(2)
    expect(g.heat).toBeCloseTo(CT_HEAT.start + 3 * CT_HEAT.fan)
    expect(g.fan(-CT_FAN_PX)).toBe(1)
  })

  it('cools the coals without fanning and never grills them below the band', () => {
    const g = new ComTamGame(TICKET, false, createRng(1))
    g.tick(1000)
    expect(g.heat).toBeCloseTo(CT_HEAT.start - CT_HEAT.decay)
    expect(g.done).toBe(0)
  })

  it('grills while the heat is in the band, and judges the chop right when it never burnt', () => {
    const g = new ComTamGame(TICKET, false, createRng(1))
    grillWell(g)
    expect(g.phase).toBe('top')
    expect(g.grill).toBe('in')
    expect(g.elapsedMs).toBeGreaterThanOrEqual(CT_GRILL_MS)
  })

  it('burns while the heat is over the mark, and judges by how long', () => {
    const near = new ComTamGame(TICKET, false, createRng(1))
    near.fan(CT_FAN_PX * 10)
    for (let i = 0; i < 10; i++) near.tick(50)
    expect(near.burnMs).toBeGreaterThan(CT_BURN_MS.in)
    grillWell(near)
    expect(near.grill).toBe('near')
    const far = new ComTamGame(TICKET, false, createRng(1))
    for (let i = 0; i < 30; i++) {
      far.fan(CT_FAN_PX * 3)
      far.tick(100)
    }
    grillWell(far)
    expect(far.grill).toBe('far')
  })
})

describe('the Cơm tấm sides and oil', () => {
  const toOil = (g: ComTamGame) => {
    grillWell(g)
    g.add('bi')
    g.add('chua')
    g.doneTopping()
  }

  it('counts the sides only on their step', () => {
    const g = new ComTamGame(TICKET, false, createRng(1))
    g.add('bi')
    expect(g.counts.bi).toBe(0)
    toOil(g)
    g.add('cha')
    expect(g.counts).toEqual({ bi: 1, cha: 0, trung: 0, chua: 1 })
  })

  it('lights five different spots one after another, each after a pause', () => {
    const g = new ComTamGame(TICKET, false, createRng(9))
    expect(new Set(g.spots).size).toBe(CT_OIL_SPOTS)
    toOil(g)
    expect(g.litSpot()).toBeNull()
    g.tick(CT_SPOT_GAP_MS)
    expect(g.litSpot()).toBe(g.spots[0])
  })

  it('catches a spot tapped close, ignores a tap between spots, and calls a wide tap missed', () => {
    const g = new ComTamGame(TICKET, false, createRng(9))
    toOil(g)
    expect(g.tap(CT_OIL_AT[g.spots[0]].x, CT_OIL_AT[g.spots[0]].y)).toBeNull()
    g.tick(CT_SPOT_GAP_MS)
    const at = CT_OIL_AT[g.spots[0]]
    expect(g.tap(at.x + CT_SPOT_R + 5, at.y)).toBe('missed')
    expect(g.tap(at.x, at.y + CT_SPOT_R - 5)).toBe('caught')
    expect(g.caught).toEqual([true])
    expect(g.litSpot()).toBeNull()
  })

  it('lets a spot fade uncaught, sooner for a hard diner', () => {
    const g = new ComTamGame(TICKET, false, createRng(9))
    toOil(g)
    expect(g.tick(CT_SPOT_GAP_MS + CT_SPOT_MS - 1)).toBeNull()
    expect(g.tick(1)).toBe('faded')
    expect(g.caught).toEqual([false])
    const hard = new ComTamGame({ ...TICKET, extraPickle: true }, true, createRng(9))
    grillWell(hard)
    hard.doneTopping()
    expect(hard.tick(CT_SPOT_GAP_MS + CT_SPOT_MS_HARD)).toBe('faded')
  })

  it('cooks a perfect plate to 3 stars, plain and hard', () => {
    for (const hard of [false, true]) {
      const g = new ComTamGame({ combo: 'trung', extraPickle: hard }, hard, createRng(4))
      grillWell(g)
      g.add('trung')
      g.add('chua')
      if (hard) g.add('chua')
      g.doneTopping()
      for (let i = 0; i < CT_OIL_SPOTS; i++) expect(catchSpot(g)).toBe('caught')
      expect(g.phase).toBe('done')
      expect(g.stars()).toBe(3)
      expect(g.progress()).toBe(1)
    }
  })

  it('ends at the time limit with an ungrilled chop far off and the spots left uncaught', () => {
    const g = new ComTamGame(TICKET, false, createRng(1))
    g.tick(CT_LIMIT_MS)
    expect(g.phase).toBe('done')
    expect(g.grill).toBe('far')
    expect(g.caught).toEqual(Array(CT_OIL_SPOTS).fill(false))
    expect(g.stars()).toBe(1)
  })
})

describe('Cơm tấm on the restaurant menu', () => {
  it('is not sold until bought, then costs 1.500.000 đ once, listed last', () => {
    const main = starShop(3, 10_000_000)
    const r = restaurantFor(main)
    expect(r.buyDish('comTam')).toBeNull()
    expect(main.money).toBe(10_000_000 - DISH_BUY_PRICE.comTam)
    r.buyDish('bunCha')
    expect(r.menu()).toEqual([...BASE_DISHES, 'bunCha', 'comTam'])
    expect(r.stock.tamKit).toBe(STOCK_START)
    const d = r.spawnDiner({ kind: 'student', dish: 'comTam' })!
    expect(d.ticket).toHaveProperty('combo')
  })
})
