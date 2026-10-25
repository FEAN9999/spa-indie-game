import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
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
