import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import { wageFor, type Staff, type StaffRole, type StaffStats } from '../../src/sim/staff'
import type { Customer, SimEvent } from '../../src/sim/types'

export function advanceUntil(sim: SpaSim, pred: () => boolean, maxMs = 120_000, sink?: SimEvent[]) {
  for (let t = 0; t <= maxMs; t += 100) {
    if (sink) sink.push(...sim.drainEvents())
    if (pred()) return
    sim.advance(100)
  }
  throw new Error('condition not reached')
}

export const seatAndWait = (sim: SpaSim): Customer => {
  const c = sim.spawnCustomer()
  advanceUntil(sim, () => c.state === 'waiting')
  return c
}

export const startService = (sim: SpaSim): Customer => {
  const c = seatAndWait(sim)
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
export function hireStaff(sim: SpaSim, role: StaffRole, stats: StaffStats = { skill: 3, speed: 3, friendly: 3, stamina: 3 }): Staff {
  sim.candidates.push({ name: `Test ${sim.staff.length + 1}`, role, look: { skin: 0, hair: 0, hairStyle: 0, shirt: 0 }, stats, wage: wageFor(stats), rare: false })
  const problem = sim.hire(sim.candidates.length - 1)
  if (problem) throw new Error(`cannot hire: ${problem}`)
  return sim.staff[sim.staff.length - 1]
}
