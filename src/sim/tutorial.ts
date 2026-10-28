import { UNLOCK_DAY } from '../config'
import type { SpaSim } from './spa'
import { currentGoal } from './starter'
import type { Feature } from './unlocks'

export type Pointer = { hint: 'tapCustomer' | 'patience' | 'regular' | 'vip'; customerId: number } | { hint: 'openBuild' } | { hint: 'openStaff' } | { hint: 'openServices' } | { hint: 'openStock' } | { hint: 'openBook' } | { hint: 'openFloor' } | { hint: 'openQuests' } | { hint: 'placeGift' }

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
  if (sim.bookShown() && (sim.hintDone('regular') || sim.hintDone('vip')) && !sim.hintDone(sim.bookHint())) return { hint: 'openBook' }
  // the starter chain's mask bed waits in build mode while its goal is the one being worked on
  if (currentGoal(sim.starter) === 'placeMaskBed' && sim.book.gifts.includes('maskBed')) return { hint: 'placeGift' }
  // from the day each button opens, by a starter goal or its day, up to its day: a shop already past it gets the badge but no hand
  const due = (f: Feature) => sim.day >= sim.openDay(f) && sim.day <= UNLOCK_DAY[f]
  if (due('build') && !sim.hintDone('openBuild')) return { hint: 'openBuild' }
  if (due('staff') && !sim.hintDone('openStaff')) return { hint: 'openStaff' }
  if (due('services') && !sim.hintDone('openServices')) return { hint: 'openServices' }
  if (due('stock') && !sim.hintDone('openStock')) return { hint: 'openStock' }
  if (due('quests') && !sim.hintDone('openQuests')) return { hint: 'openQuests' }
  if (sim.floors > 1 && !sim.hintDone('openFloor')) return { hint: 'openFloor' }
  return null
}
