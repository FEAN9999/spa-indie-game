import type { BadgeShop } from '../../src/sim/badges'
import { Chain } from '../../src/sim/chain'
import type { ItemKind } from '../../src/sim/items'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import { SERVICE_IDS, type ServiceId } from '../../src/sim/services'
import { noTiers, wageFor, type Staff, type StaffRole, type StaffStats, type Tiers, type TraitId } from '../../src/sim/staff'
import type { Customer, SimEvent } from '../../src/sim/types'

/** A day-40 main shop with mask and massage open and `stars`, ready to open a branch; nobody walks in unless `autoSpawn`. */
export function starShop(stars: 1 | 2 | 3 | 4 | 5 = 3, money = 20_000_000, seed = 1, autoSpawn = false): SpaSim {
  const sim = new SpaSim({ rng: createRng(seed), autoSpawn })
  sim.day = 40
  sim.services = ['shampoo', 'mask', 'massage']
  sim.rank.stars = stars
  sim.profileDone = true
  sim.money = money
  return sim
}

export function advanceUntil(sim: SpaSim, pred: () => boolean, maxMs = 120_000, sink?: SimEvent[]) {
  for (let t = 0; t <= maxMs; t += 100) {
    if (sink) sink.push(...sim.drainEvents())
    if (pred()) return
    sim.advance(100)
  }
  throw new Error('condition not reached')
}

type SpawnOptions = NonNullable<Parameters<SpaSim['spawnCustomer']>[0]>

/** What the helpers spawn unless told otherwise, so the tests keep one known kind and service. */
const KNOWN: SpawnOptions = { kind: 'office', service: 'shampoo' }

export const seatAndWait = (sim: SpaSim, opts: SpawnOptions = KNOWN): Customer => {
  const c = sim.spawnCustomer(opts)
  advanceUntil(sim, () => c.state === 'waiting')
  return c
}

export const startService = (sim: SpaSim, opts: SpawnOptions = KNOWN): Customer => {
  const c = seatAndWait(sim, opts)
  sim.tapTile(c.seat!)
  advanceUntil(sim, () => c.state === 'inService')
  return c
}

/** The owner serves one customer with `stars`; returns what they paid and the events that came with it. */
export function ownerServes(sim: SpaSim, stars: 1 | 2 | 3, opts?: SpawnOptions): { amount: number; tip: number; events: SimEvent[] } {
  const c = startService(sim, opts)
  sim.drainEvents()
  sim.completeService(c.id, stars)
  const events = sim.drainEvents()
  const paid = events.find(e => e.type === 'paid')
  if (paid?.type !== 'paid') throw new Error('no payment')
  return { amount: paid.amount, tip: paid.tip, events }
}

/** One customer waiting, a second walking to a seat, the owner on the way to fetch the first. */
export function busyShop(): SpaSim {
  const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
  const first = seatAndWait(sim)
  const second = sim.spawnCustomer()
  advanceUntil(sim, () => second.state === 'toSeat')
  sim.advance(200)
  sim.tapTile(first.seat!)
  sim.advance(300)
  sim.money = 123456
  sim.drainEvents()
  return sim
}

/** Hires a person with a fixed look and name, without drawing from the sim's rng. */
export function hireStaff(sim: SpaSim, role: StaffRole, stats: StaffStats = { skill: 3, speed: 3, friendly: 3, stamina: 3 }, tiers: Partial<Tiers> = {}, trait: TraitId = 'studious'): Staff {
  sim.candidates.push({ name: `Test ${sim.staff.length + 1}`, role, look: { skin: 0, hair: 0, hairStyle: 0, shirt: 0 }, stats, wage: wageFor(stats), rare: false, tiers: { ...noTiers(), ...tiers }, trait })
  const problem = sim.hire(sim.candidates.length - 1)
  if (problem) throw new Error(`cannot hire: ${problem}`)
  return sim.staff[sim.staff.length - 1]
}

/**
 * Ten days of a shop with one technician and nobody else serving: who came each day and who applied the next morning.
 * Compared against a log made before a change, it checks that new rules leave the shop's draws alone.
 */
export function runLog(days = 10): { day: number; arrivals: string[]; candidates: string[] }[] {
  const sim = new SpaSim({ rng: createRng(2024) })
  sim.profileDone = true
  hireStaff(sim, 'technician')
  const log: { day: number; arrivals: string[]; candidates: string[] }[] = []
  for (let d = 0; d < days; d++) {
    const arrivals: string[] = []
    for (let t = 0; !sim.dayOver; t += 100) {
      if (t > 400_000) throw new Error('day did not end')
      sim.advance(100)
      for (const e of sim.drainEvents()) {
        if (e.type !== 'customerArrived') continue
        const c = sim.customers.find(x => x.id === e.id)!
        arrivals.push(`${c.id}:${c.kind}:${c.service}:${c.regular ?? ''}:${c.vip ?? ''}`)
      }
    }
    const day = sim.day
    sim.startDay()
    log.push({ day, arrivals, candidates: sim.candidates.map(c => `${c.name}:${c.role}`) })
  }
  return log
}

/** A shop snapshot with nothing done yet, for the badge rules. */
export const zeroShop = (): BadgeShop => ({
  served: 0,
  owner3: 0,
  bestServed: 0,
  cleanDay: false,
  members: 0,
  fullHearts: 0,
  photos: 0,
  boardHung: false,
  services: 0,
  recipes: 0,
  floors: 1,
  beauty: 0,
  technicians: 0,
  masterTier: 0,
  money: 0,
  bestProfit: 0,
  dailies: 0,
  day: 1,
})

/** Buys `kind` at the first tile `canPlace` accepts, scanning rows top to bottom and columns left to right, not flipped. */
export function placeFirst(sim: SpaSim, kind: ItemKind): void {
  for (let y = 0; y < 60; y++)
    for (let x = 0; x < 40; x++)
      if (sim.canPlace(kind, x, y, false) === null) {
        const problem = sim.buy(kind, x, y, false)
        if (problem) throw new Error(`cannot buy ${kind}: ${problem}`)
        return
      }
  throw new Error(`no room for ${kind}`)
}

const OLD_SERVICES: ServiceId[] = ['shampoo', 'mask', 'massage', 'steam', 'stone', 'mud']

/**
 * Four days of a 3-star chain with the six old services open: who came to each shop, who applied and which quests were given.
 * Compared against a log made before Chà muối biển, it checks that a shop that has not learned it draws exactly as before.
 */
export function sixServiceLog(days = 4, before?: (chain: Chain) => void): { days: { day: number; main: string[]; beach: string[]; candidates: string[]; quests: string[] }[]; next: number } {
  const rng = createRng(2025)
  const main = new SpaSim({ rng })
  main.day = 40
  main.rank.stars = 3
  main.profileDone = true
  main.money = 50_000_000
  main.services = [...OLD_SERVICES]
  for (const kind of ['maskBed', 'massageBed', 'steamTent', 'stoneBed', 'mudTub'] as const) placeFirst(main, kind)
  for (let i = 0; i < 3; i++) hireStaff(main, 'technician')
  const chain = new Chain(main, 11)
  chain.open('beach')
  const beach = chain.shop('beach')!
  hireStaff(beach, 'technician')
  before?.(chain)
  const seen = { main: new Set<number>(), beach: new Set<number>() }
  const log = (shop: SpaSim, ids: Set<number>, out: string[]) => {
    for (const c of shop.customers)
      if (!ids.has(c.id)) {
        ids.add(c.id)
        out.push(`${c.id}:${c.kind}:${c.service}:${c.regular ?? ''}:${c.vip ?? ''}:${c.kol}`)
      }
  }
  const out: { day: number; main: string[]; beach: string[]; candidates: string[]; quests: string[] }[] = []
  for (let d = 0; d < days; d++) {
    const row = { day: main.day, main: [] as string[], beach: [] as string[], candidates: [] as string[], quests: [] as string[] }
    for (let t = 0; !main.dayOver; t += 100) {
      if (t > 400_000) throw new Error('day did not end')
      chain.advance(100)
      main.drainEvents()
      log(main, seen.main, row.main)
      log(beach, seen.beach, row.beach)
    }
    chain.finishDay()
    chain.startDay()
    row.candidates = main.candidates.map(c => `${c.name}:${c.role}:${SERVICE_IDS.filter(id => c.tiers[id] > 0).map(id => `${id}${c.tiers[id]}`).join(',')}`)
    row.quests = main.progress.daily.map(q => `${q.kind}:${q.service}:${q.target}`)
    out.push(row)
  }
  return { days: out, next: rng() }
}
