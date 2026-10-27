import { UNLOCK_DAY } from '../config'
import type { SpaSim } from './spa'

export type Pointer = { hint: 'tapCustomer' | 'patience' | 'regular' | 'vip'; customerId: number } | { hint: 'openBuild' } | { hint: 'openStaff' } | { hint: 'openServices' } | { hint: 'openStock' } | { hint: 'openBook' }

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
  if (!sim.hintDone('regular')) {
    const c = waiting.find(x => x.regular !== null)
    if (c) return { hint: 'regular', customerId: c.id }
  }
  if (!sim.hintDone('vip')) {
    const c = waiting.find(x => x.vip !== null)
    if (c) return { hint: 'vip', customerId: c.id }
  }
  if (sim.bookShown() && (sim.hintDone('regular') || sim.hintDone('vip')) && !sim.hintDone('openBook')) return { hint: 'openBook' }
  // only on the day each button opens: a shop already past it gets the badge but no hand
  if (sim.day === UNLOCK_DAY.build && !sim.hintDone('openBuild')) return { hint: 'openBuild' }
  if (sim.day === UNLOCK_DAY.staff && !sim.hintDone('openStaff')) return { hint: 'openStaff' }
  if (sim.day === UNLOCK_DAY.services && !sim.hintDone('openServices')) return { hint: 'openServices' }
  if (sim.day === UNLOCK_DAY.stock && !sim.hintDone('openStock')) return { hint: 'openStock' }
  return null
}
