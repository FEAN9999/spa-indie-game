import { describe, expect, it } from 'vitest'
import { DISH_BUY_PRICE, GC_DIP_MS, GC_DIP_MS_HARD, GC_DIP_SPAN, GC_LIMIT_MS, GC_ROLL, GC_ROLLS, STOCK_START } from '../../src/config'
import { dipBand, drawGoiCuonTicket, GoiCuonGame, goiCuonStars, partsMatch, type GoiCuonTicket } from '../../src/sim/goiCuon'
import { BASE_DISHES } from '../../src/sim/menu'
import { createRng } from '../../src/sim/rng'
import { restaurantFor, starShop } from './helpers'

const TICKET: GoiCuonTicket = { filling: 'tomThit', extraVeg: false }
const midDip = (hard: boolean) => (dipBand(hard).min + dipBand(hard).max) / 2

/** Plays a whole roll: a dip of `dipMs`, the parts as given, then `ups` upward swipes. */
function make(ticket: GoiCuonTicket, hard: boolean, dipMs: number, parts: { tom: number; thit: number; bun: number; rau: number }, ups: number[]) {
  const g = new GoiCuonGame(ticket, hard)
  g.dip(GC_DIP_SPAN + 40, dipMs)
  for (const [part, n] of Object.entries(parts) as [keyof typeof parts, number][]) for (let i = 0; i < n; i++) g.add(part)
  g.doneFilling()
  for (const up of ups) g.roll(10, up)
  return g
}

describe('the Gỏi cuốn ticket', () => {
  it('rolls shrimp-and-pork or shrimp only, and adds extra greens for a hard diner', () => {
    const seen = new Set<string>()
    const rng = createRng(4)
    for (let i = 0; i < 100; i++) seen.add(drawGoiCuonTicket(rng, false).filling)
    expect([...seen].sort()).toEqual(['tom', 'tomThit'])
    expect(drawGoiCuonTicket(createRng(1), false).extraVeg).toBe(false)
    expect(drawGoiCuonTicket(createRng(1), true).extraVeg).toBe(true)
  })

  it('matches the parts: shrimp, pork only when asked, noodles and greens', () => {
    expect(partsMatch(TICKET, { tom: 1, thit: 1, bun: 1, rau: 1 })).toBe(true)
    expect(partsMatch(TICKET, { tom: 1, thit: 0, bun: 1, rau: 1 })).toBe(false)
    expect(partsMatch({ ...TICKET, filling: 'tom' }, { tom: 2, thit: 0, bun: 1, rau: 3 })).toBe(true)
    expect(partsMatch({ ...TICKET, filling: 'tom' }, { tom: 1, thit: 1, bun: 1, rau: 1 })).toBe(false)
    expect(partsMatch({ ...TICKET, extraVeg: true }, { tom: 1, thit: 1, bun: 1, rau: 1 })).toBe(false)
    expect(partsMatch(TICKET, { tom: 1, thit: 1, bun: 0, rau: 1 })).toBe(false)
  })

  it('gives a star for the dip and one for three tight rolls, and takes one for two loose rolls or the wrong parts', () => {
    expect(goiCuonStars({ dip: 'in', tight: 3, loose: 0, ticketOk: true })).toBe(3)
    expect(goiCuonStars({ dip: 'fast', tight: 3, loose: 0, ticketOk: true })).toBe(2)
    expect(goiCuonStars({ dip: 'in', tight: 2, loose: 1, ticketOk: true })).toBe(2)
    expect(goiCuonStars({ dip: 'in', tight: 1, loose: 2, ticketOk: true })).toBe(1)
    expect(goiCuonStars({ dip: 'in', tight: 3, loose: 0, ticketOk: false })).toBe(2)
    expect(goiCuonStars({ dip: null, tight: 0, loose: 3, ticketOk: false })).toBe(1)
  })
})

describe('the Gỏi cuốn game', () => {
  it('rolls a perfect one to 3 stars, plain and hard', () => {
    for (const hard of [false, true]) {
      const g = make({ ...TICKET, extraVeg: hard }, hard, midDip(hard), { tom: 2, thit: 1, bun: 1, rau: hard ? 2 : 1 }, [300, 300, 300])
      expect(g.dipResult).toBe('in')
      expect(g.rolls).toEqual(['tight', 'tight', 'tight'])
      expect(g.stars()).toBe(3)
    }
  })

  it('judges the dip by how long the stroke took, and ignores one too short across the water', () => {
    expect(new GoiCuonGame(TICKET).dip(GC_DIP_SPAN - 1, midDip(false))).toBe('short')
    expect(new GoiCuonGame(TICKET).dip(GC_DIP_SPAN, GC_DIP_MS.min - 1)).toBe('fast')
    expect(new GoiCuonGame(TICKET).dip(GC_DIP_SPAN, GC_DIP_MS.max + 1)).toBe('slow')
    expect(new GoiCuonGame(TICKET).dip(GC_DIP_SPAN, GC_DIP_MS.min)).toBe('in')
    expect(new GoiCuonGame(TICKET, true).dip(GC_DIP_SPAN, GC_DIP_MS.min)).toBe('fast')
    expect(new GoiCuonGame(TICKET, true).dip(GC_DIP_SPAN, GC_DIP_MS_HARD.max)).toBe('in')
    const g = new GoiCuonGame(TICKET)
    g.dip(GC_DIP_SPAN - 1, 500)
    expect(g.phase).toBe('dip')
    g.dip(GC_DIP_SPAN, 500)
    expect(g.phase).toBe('fill')
    expect(g.dip(GC_DIP_SPAN, 500)).toBeNull()
  })

  it('counts the parts only on their step', () => {
    const g = new GoiCuonGame(TICKET)
    g.add('tom')
    expect(g.counts.tom).toBe(0)
    g.dip(GC_DIP_SPAN, 500)
    g.add('tom')
    g.add('rau')
    g.doneFilling()
    g.add('bun')
    expect(g.counts).toEqual({ tom: 1, thit: 0, bun: 0, rau: 1 })
  })

  it('takes a long upward swipe as tight, a short one as loose, and a tiny or slanted one as nothing', () => {
    const g = new GoiCuonGame(TICKET)
    expect(g.roll(0, 300)).toBeNull()
    g.dip(GC_DIP_SPAN, 500)
    g.doneFilling()
    expect(g.roll(0, GC_ROLL.short - 1)).toBeNull()
    expect(g.roll(200, 250)).toBeNull()
    expect(g.roll(0, -300)).toBeNull()
    expect(g.roll(20, GC_ROLL.long)).toBe('tight')
    expect(g.roll(-20, GC_ROLL.long - 1)).toBe('loose')
    expect(g.progress()).toBeCloseTo(0.6 + 0.4 * (2 / GC_ROLLS))
  })

  it('needs a longer swipe for a tight roll with a hard diner', () => {
    const g = new GoiCuonGame(TICKET, true)
    g.dip(GC_DIP_SPAN, midDip(true))
    g.doneFilling()
    expect(g.roll(0, GC_ROLL.long)).toBe('loose')
    expect(g.roll(0, GC_ROLL.longHard)).toBe('tight')
  })

  it('ends at the time limit with the rolls not made counted loose', () => {
    const g = new GoiCuonGame(TICKET)
    g.dip(GC_DIP_SPAN, 500)
    g.tick(GC_LIMIT_MS)
    expect(g.phase).toBe('done')
    expect(g.rolls).toEqual(['loose', 'loose', 'loose'])
    expect(g.stars()).toBe(1)
  })
})

describe('Gỏi cuốn on the restaurant menu', () => {
  it('is not sold until bought, then costs 1.000.000 đ once, listed after Bún chả', () => {
    const main = starShop(3, 10_000_000)
    const r = restaurantFor(main)
    expect(r.buyDish('goiCuon')).toBeNull()
    expect(main.money).toBe(10_000_000 - DISH_BUY_PRICE.goiCuon)
    expect(r.menu()).toEqual([...BASE_DISHES, 'goiCuon'])
    r.buyDish('bunCha')
    expect(r.bought).toEqual(['bunCha', 'goiCuon'])
    expect(r.menu()).toEqual([...BASE_DISHES, 'bunCha', 'goiCuon'])
    expect(r.stock.cuonKit).toBe(STOCK_START)
  })

  it('seats a diner who orders it with a Gỏi cuốn ticket', () => {
    const r = restaurantFor(starShop(3, 10_000_000))
    r.buyDish('goiCuon')
    const d = r.spawnDiner({ kind: 'student', dish: 'goiCuon' })!
    expect(d.ticket).toHaveProperty('extraVeg')
    expect(r.portionsLeft('goiCuon')).toBe(STOCK_START - 1)
  })
})
