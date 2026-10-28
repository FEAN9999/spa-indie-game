import { describe, expect, it } from 'vitest'
import { AWAY_MIN_MS, CANDIDATES_PER_DAY, REGULAR_VISIT_FROM_MIN, REGULAR_VISIT_TO_MIN } from '../../src/config'
import type { ItemKind } from '../../src/sim/items'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import { STARTER_GOAL_IDS, type StarterGoalId } from '../../src/sim/starter'
import type { SimEvent } from '../../src/sim/types'
import { advanceUntil, ownerServes } from './helpers'

const chainShop = () => new SpaSim({ rng: createRng(5), autoSpawn: false, starter: true })
const plainShop = () => new SpaSim({ rng: createRng(5), autoSpawn: false })

const goals = (events: SimEvent[]): StarterGoalId[] => events.flatMap(e => (e.type === 'goalDone' ? [e.goal] : []))

/** The owner serves `n` office workers with shampoo, three stars each; returns the goals they finished. */
function serve(sim: SpaSim, n: number, service: 'shampoo' | 'mask' | 'massage' = 'shampoo'): StarterGoalId[] {
  const done: StarterGoalId[] = []
  for (let i = 0; i < n; i++) done.push(...goals(ownerServes(sim, 3, { kind: 'office', service }).events))
  return done
}

/** The first free spot for `kind`, row by row. */
function spot(sim: SpaSim, kind: ItemKind): { x: number; y: number } {
  for (let y = 0; y < sim.grid.rows; y++) for (let x = 0; x < sim.grid.cols; x++) if (sim.canPlace(kind, x, y, false) === null) return { x, y }
  throw new Error(`no spot for ${kind}`)
}

function buyPlant(sim: SpaSim): StarterGoalId[] {
  sim.drainEvents()
  const at = spot(sim, 'plant')
  expect(sim.buy('plant', at.x, at.y, false)).toBeNull()
  return goals(sim.drainEvents())
}

function placeMaskBed(sim: SpaSim): StarterGoalId[] {
  sim.drainEvents()
  const at = spot(sim, 'maskBed')
  expect(sim.placeGift('maskBed', at.x, at.y, false)).toBeNull()
  return goals(sim.drainEvents())
}

/** Brings a chain shop to the mask gift: four served, a plant bought, six more served. */
function toMaskGift(sim: SpaSim): void {
  sim.money = 1_000_000
  serve(sim, 4)
  buyPlant(sim)
  serve(sim, 6)
}

function endDay(sim: SpaSim): void {
  advanceUntil(sim, () => sim.dayOver, 400_000)
  sim.startDay()
  sim.drainEvents()
}

describe('a new shop runs the starter chain', () => {
  it('brings Chú Sáu as its first customer', () => {
    const sim = new SpaSim({ rng: createRng(5), starter: true })
    advanceUntil(sim, () => sim.customers.length > 0)
    expect(sim.customers[0].regular).toBe('sau')
    expect(sim.book.regulars.sau.met).toBe(true)
  })

  it('a plain shop brings a stranger first', () => {
    const sim = new SpaSim({ rng: createRng(5) })
    advanceUntil(sim, () => sim.customers.length > 0)
    expect(sim.customers[0].regular).toBeNull()
  })

  it('pays firstGuest into money and the day on the first customer served', () => {
    const sim = chainShop()
    const before = sim.money
    const r = ownerServes(sim, 2)
    expect(goals(r.events)).toEqual(['firstGuest'])
    expect(r.events.find(e => e.type === 'goalDone')).toEqual({ type: 'goalDone', goal: 'firstGuest', reward: 20_000, opens: null })
    expect(sim.money).toBe(before + r.amount + r.tip + 20_000)
    expect(sim.stats.quests).toBe(20_000)
  })

  it('opens build on day 1 once four are served', () => {
    const sim = chainShop()
    expect(sim.featureOpen('build')).toBe(false)
    expect(serve(sim, 4)).toEqual(['firstGuest', 'threeStars', 'serveFew'])
    expect(sim.featureOpen('build')).toBe(true)
    expect(sim.openDay('build')).toBe(1)
    expect(sim.featureOpen('staff')).toBe(false)
  })

  it('counts a plant bought, but not one moved', () => {
    const sim = chainShop()
    serve(sim, 4)
    const plant = sim.items.find(i => i.kind === 'plant')!
    const at = spot(sim, 'plant')
    expect(sim.move(plant.id, at.x, at.y, false)).toBeNull()
    expect(goals(sim.drainEvents())).toEqual([])
    expect(buyPlant(sim)).toEqual(['buyDecor'])
    expect(sim.stats.quests).toBe(20_000 + 30_000 + 30_000 + 40_000)
  })

  it('opens mask free at ten served, with a mask bed to place, and opens services', () => {
    const sim = chainShop()
    toMaskGift(sim)
    expect(sim.services).toEqual(['shampoo', 'mask'])
    expect(sim.book.gifts).toEqual(['maskBed'])
    expect(sim.featureOpen('services')).toBe(true)
    expect(sim.starter.maskNext).toBe(true)
  })

  it('pays the opening price back, with the bed, when mask was already paid for', () => {
    const sim = chainShop()
    sim.money = 1_000_000
    serve(sim, 4)
    buyPlant(sim)
    expect(sim.openService('mask')).toBeNull()
    sim.drainEvents()
    const r = serve(sim, 5)
    expect(r).toEqual([])
    const last = ownerServes(sim, 3).events.find(e => e.type === 'goalDone')
    expect(last).toEqual({ type: 'goalDone', goal: 'serveMore', reward: 200_000, opens: 'services' })
    expect(sim.services).toEqual(['shampoo', 'mask'])
    expect(sim.book.gifts).toEqual(['maskBed'])
  })

  it('finishes placeMaskBed at once when a mask bed is already down', () => {
    const sim = chainShop()
    sim.money = 2_000_000
    serve(sim, 4)
    buyPlant(sim)
    sim.openService('mask')
    const at = spot(sim, 'maskBed')
    sim.buy('maskBed', at.x, at.y, false)
    serve(sim, 5)
    expect(serve(sim, 1)).toEqual(['serveMore', 'placeMaskBed'])
  })

  it('sends the next plain customer to mask once the gift bed is down, then draws as usual', () => {
    const sim = chainShop()
    toMaskGift(sim)
    expect(sim.spawnCustomer().service).not.toBe('mask')
    expect(placeMaskBed(sim)).toEqual(['placeMaskBed'])
    expect(sim.spawnCustomer({ regular: 'vy' }).service).not.toBe('mask')
    expect(sim.spawnCustomer().service).toBe('mask')
    expect(sim.starter.maskNext).toBe(false)
  })

  it('opens staff at sixteen served and fills today’s candidates at once', () => {
    const sim = chainShop()
    toMaskGift(sim)
    placeMaskBed(sim)
    expect(serve(sim, 2, 'mask')).toEqual(['maskTwice'])
    expect(sim.candidates).toEqual([])
    expect(serve(sim, 4)).toEqual(['serveMany'])
    expect(sim.featureOpen('staff')).toBe(true)
    expect(sim.candidates.length).toBe(CANDIDATES_PER_DAY)
    expect(sim.candidatesDay).toBe(1)
    const tech = sim.candidates.findIndex(c => c.role === 'technician')
    if (tech >= 0) {
      sim.drainEvents()
      expect(sim.hire(tech)).toBeNull()
      expect(goals(sim.drainEvents())).toEqual(['hireTech'])
    }
  })

  it('finishes the chain on massage, and sets the day it was done', () => {
    const sim = chainShop()
    toMaskGift(sim)
    placeMaskBed(sim)
    serve(sim, 2, 'mask')
    serve(sim, 4)
    sim.starter.at = STARTER_GOAL_IDS.indexOf('openMassage') // past hireTech, whatever today's candidates are
    sim.money = 2_000_000
    sim.drainEvents()
    expect(sim.openService('massage')).toBeNull()
    expect(goals(sim.drainEvents())).toEqual(['openMassage'])
    const at = spot(sim, 'massageBed')
    sim.buy('massageBed', at.x, at.y, false)
    expect(serve(sim, 2, 'massage')).toEqual(['massageTwice'])
    expect(sim.starter.doneDay).toBe(1)
  })

  it('opens build on day 2 by its day when serveFew is not done, and serveFew still pays later', () => {
    const sim = chainShop()
    endDay(sim)
    expect(sim.day).toBe(2)
    expect(sim.featureOpen('build')).toBe(true)
    expect(sim.openDay('build')).toBe(2)
    expect(serve(sim, 4)).toEqual(['firstGuest', 'threeStars', 'serveFew'])
    expect(sim.openDay('build')).toBe(2)
  })

  it('a plain shop never finishes a goal and opens its buttons by day', () => {
    const sim = plainShop()
    expect(serve(sim, 4)).toEqual([])
    expect(sim.featureOpen('build')).toBe(false)
    expect(sim.questsButtonOpen()).toBe(false)
    endDay(sim)
    expect(sim.featureOpen('build')).toBe(true)
    expect(sim.featureOpen('staff')).toBe(false)
    endDay(sim)
    expect(sim.featureOpen('staff')).toBe(true)
  })

  it('opens the quest button from day 1 for a chain shop, with the daily quests still shut', () => {
    const sim = chainShop()
    expect(sim.questsButtonOpen()).toBe(true)
    expect(sim.questsOpen()).toBe(false)
  })

  it('brings a Chú Sáu met on day 1 back on day 2, between 9:00 and 17:00', () => {
    const sim = chainShop()
    const sau = sim.spawnCustomer({ regular: 'sau' })
    advanceUntil(sim, () => sau.state === 'waiting')
    sim.tapTile(sau.seat!)
    advanceUntil(sim, () => sau.state === 'inService')
    sim.completeService(sau.id, 3)
    endDay(sim)
    const at = sim.book.regulars.sau.visitAt!
    expect(at).toBeGreaterThanOrEqual(REGULAR_VISIT_FROM_MIN)
    expect(at).toBeLessThan(REGULAR_VISIT_TO_MIN)
  })

  it('brings a plain shop no Chú Sáu on day 2', () => {
    const sim = plainShop()
    endDay(sim)
    expect(sim.book.regulars.sau.visitAt).toBeNull()
  })

  it('waits with the away tip until staff opens, by goal or by day', () => {
    const early = chainShop()
    toMaskGift(early)
    placeMaskBed(early)
    serve(early, 2, 'mask')
    expect(early.comeBack(AWAY_MIN_MS).tip).toBe(false)
    serve(early, 4)
    expect(early.comeBack(AWAY_MIN_MS).tip).toBe(true)
  })
})
