import { describe, expect, it } from 'vitest'
import { createRng, type Rng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import type { SimEvent } from '../../src/sim/types'
import { startService } from './helpers'

/** A shop with mask and massage open and 1 000 000 in the till. */
const shop = (rng: Rng = createRng(1)) => {
  const sim = new SpaSim({ rng, autoSpawn: false })
  sim.money = 2_000_000
  expect(sim.openService('mask')).toBeNull()
  expect(sim.openService('massage')).toBeNull()
  sim.money = 1_000_000
  return sim
}

/** A seeded rng whose coming draws a test can set: `next.push(0)` makes the next draw 0. */
function scripted(seed = 1) {
  const rng = createRng(seed)
  const r = { next: [] as number[], rng: () => r.next.shift() ?? rng() }
  return r
}

const WRONG = ['pomelo', 'lemongrass', 'salt'] as const
const RIGHT = ['pomelo', 'lemongrass', 'ginger'] as const

describe('mixing at the bench', () => {
  it('charges a new bowl, answers a repeat for free and solves the recipe with the right one', () => {
    const sim = shop()
    const stats = structuredClone(sim.stats)
    expect(sim.mixRecipe('steam', [...WRONG])).toEqual({ kind: 'tried', right: 2 })
    expect(sim.money).toBe(970_000)
    expect(sim.recipes.steam.tries).toEqual([{ mix: [...WRONG], right: 2 }])

    expect(sim.mixRecipe('steam', ['salt', 'pomelo', 'lemongrass'])).toEqual({ kind: 'repeat', right: 2 })
    expect(sim.money).toBe(970_000)
    expect(sim.recipes.steam.tries).toHaveLength(1)

    expect(sim.serviceProblem('steam')).toBe('recipe')
    expect(sim.mixRecipe('steam', [...RIGHT])).toEqual({ kind: 'tried', right: 3 })
    expect(sim.recipes.steam.solved).toBe(true)
    expect(sim.serviceProblem('steam')).toBeNull()
    expect(sim.stats).toEqual(stats)
  })

  it('needs the full price for a new bowl, but answers a repeat whatever the till holds', () => {
    const exact = shop()
    exact.money = 30_000
    expect(exact.mixRecipe('steam', [...WRONG])).toEqual({ kind: 'tried', right: 2 })
    expect(exact.money).toBe(0)

    const short = shop()
    short.money = 29_999
    expect(short.mixRecipe('steam', [...WRONG])).toEqual({ kind: 'problem', problem: 'money' })
    expect(short.money).toBe(29_999)
    expect(short.recipes.steam.tries).toEqual([])

    const debt = shop()
    debt.money = -1
    expect(debt.mixRecipe('steam', [...WRONG])).toEqual({ kind: 'problem', problem: 'debt' })
    expect(debt.money).toBe(-1)
    expect(debt.recipes.steam.tries).toEqual([])

    const repeat = shop()
    repeat.mixRecipe('steam', [...WRONG])
    for (const money of [0, -1]) {
      repeat.money = money
      expect(repeat.mixRecipe('steam', ['lemongrass', 'salt', 'pomelo'])).toEqual({ kind: 'repeat', right: 2 })
      expect(repeat.money).toBe(money)
    }
  })

  it('refuses a bowl that is not three ingredients, a shop without massage and a solved recipe', () => {
    expect(() => shop().mixRecipe('steam', ['pomelo', 'lemongrass'])).toThrow('Not a mix')

    const noBench = new SpaSim({ rng: createRng(1), autoSpawn: false })
    noBench.money = 1_000_000
    expect(noBench.openService('mask')).toBeNull()
    expect(() => noBench.mixRecipe('steam', [...WRONG])).toThrow('bench is not open')
    expect(noBench.money).toBe(700_000)

    const solved = shop()
    solved.mixRecipe('steam', [...RIGHT])
    expect(() => solved.mixRecipe('steam', [...WRONG])).toThrow('is solved')
    expect(solved.money).toBe(970_000)
  })
})

describe('hints from regulars', () => {
  /** Serves the regular a shampoo by the owner with the next draws set to pass a hint; returns the visit's events. */
  const visit = (sim: SpaSim, r: ReturnType<typeof scripted>, stars: 1 | 2 | 3, regular: 'hanh' | 'khoa' = 'hanh') => {
    const c = startService(sim, { regular, service: 'shampoo' })
    sim.drainEvents()
    r.next.push(0, 0)
    sim.completeService(c.id, stars)
    return { c, ev: sim.drainEvents() }
  }
  const hints = (ev: SimEvent[]) => ev.filter(e => e.type === 'recipeHint')

  it("lets a happy regular tell one of the recipe's hints", () => {
    const r = scripted()
    const sim = shop(r.rng)
    const { c, ev } = visit(sim, r, 2)
    const [hint] = hints(ev)
    expect(hint).toMatchObject({ type: 'recipeHint', customerId: c.id, regular: 'hanh', recipe: 'steam' })
    if (hint?.type !== 'recipeHint') throw new Error('no hint')
    expect(['pomelo', 'lemongrass']).toContain(hint.ingredient)
    expect(sim.recipes.steam.heard).toEqual([hint.ingredient])
  })

  it('tells nothing on a 1-star visit, before massage, once solved, with both heard, or with the gift', () => {
    const oneStar = scripted()
    const a = shop(oneStar.rng)
    expect(hints(visit(a, oneStar, 1).ev)).toEqual([])
    expect(a.recipes.steam.heard).toEqual([])

    const early = scripted()
    const b = new SpaSim({ rng: early.rng, autoSpawn: false })
    expect(hints(visit(b, early, 3).ev)).toEqual([])
    expect(b.recipes.steam.heard).toEqual([])

    const solved = scripted()
    const d = shop(solved.rng)
    d.mixRecipe('steam', [...RIGHT])
    d.recipes.stone.solved = true
    d.recipes.mud.solved = true
    expect(hints(visit(d, solved, 3).ev)).toEqual([])
    expect(d.recipes.steam.heard).toEqual([])

    const heard = scripted()
    const e = shop(heard.rng)
    e.recipes.steam.heard = ['pomelo', 'lemongrass']
    e.recipes.stone.heard = ['coconut', 'cajeput']
    e.recipes.mud.heard = ['mineralMud', 'salt']
    expect(hints(visit(e, heard, 3).ev)).toEqual([])
    expect(e.recipes.steam.heard).toEqual(['pomelo', 'lemongrass'])

    const gift = scripted()
    const f = shop(gift.rng)
    f.book.regulars.khoa = { meetDay: 13, met: true, points: 16, hearts: 4, visitAt: null }
    const { ev } = visit(f, gift, 3, 'khoa')
    expect(ev.some(x => x.type === 'gift')).toBe(true)
    expect(hints(ev)).toEqual([])
    expect(f.recipes.steam.heard).toEqual([])
  })

  it('tells the hint after a new heart', () => {
    const r = scripted()
    const sim = shop(r.rng)
    sim.book.regulars.hanh = { meetDay: 7, met: true, points: 2, hearts: 0, visitAt: null }
    const { ev } = visit(sim, r, 2)
    expect(ev.some(x => x.type === 'gift')).toBe(false)
    expect(ev.map(x => x.type).filter(t => t === 'heart' || t === 'recipeHint')).toEqual(['heart', 'recipeHint'])
  })
})
