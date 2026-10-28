import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import { noTiers, wageFor, type Staff, type StaffRole, type StaffStats, type Tiers, type TraitId } from '../../src/sim/staff'
import type { Customer, SimEvent } from '../../src/sim/types'

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
