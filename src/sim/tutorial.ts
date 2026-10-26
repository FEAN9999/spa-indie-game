import type { SpaSim } from './spa'

export type Pointer = { hint: 'tapCustomer' | 'patience'; customerId: number }

/** The one hint to show right now, or null. Never blocks input. */
export function pickHint(sim: SpaSim): Pointer | null {
  if (sim.paused || sim.dayOver || sim.servingCustomerId !== null) return null
  const waiting = sim.customers.filter(c => c.state === 'waiting').sort((a, b) => a.id - b.id)
  if (!sim.hintDone('tapCustomer')) {
    if (sim.owner.task !== null || waiting.length === 0) return null
    return { hint: 'tapCustomer', customerId: waiting[0].id }
  }
  if (!sim.hintDone('patience')) {
    const c = waiting.find(x => x.patienceMs < x.patienceMaxMs / 2)
    if (c) return { hint: 'patience', customerId: c.id }
  }
  return null
}
