import { C } from '../art/palette'
import { INSPECT_BEAUTY, LOW_STOCK } from '../config'
import { clockLabel } from '../sim/clock'
import { hotDaysLeft, type EventKind, type EventPlan } from '../sim/events'
import type { SpaSim } from '../sim/spa'
import { STOCK_NAME } from '../sim/stock'
import type { SimEvent } from '../sim/types'
import { formatMoney } from '../strings/format'
import { t } from '../strings/vi'
import type { GoldCard } from './festivals'
import type { TodayLine } from './today'

/** Each event's picture and the colour of its disc; the hot days have Mi Mi's sparkle. */
export const EVENT_ICON: Record<EventKind | 'hot', { texture: string; disc: string }> = {
  kol: { texture: 'event-phone', disc: C.lotus },
  inspect: { texture: 'event-clip', disc: C.water },
  rival: { texture: 'event-shop', disc: C.wall },
  power: { texture: 'event-bolt', disc: C.glow },
  hot: { texture: 'event-spark', disc: C.mustard },
}

/** The summary's line for tomorrow's event. */
export function eventNote(plan: EventPlan): string {
  return t(plan.kind === 'kol' ? 'eventNoteKol' : 'eventNoteInspect', { time: clockLabel(plan.minute) })
}

/** The quiet card on the morning of an event. */
export function eventCard(plan: EventPlan): GoldCard {
  const time = clockLabel(plan.minute)
  const kol = plan.kind === 'kol'
  return {
    icon: EVENT_ICON[plan.kind],
    head: t('eventHead'),
    name: t(kol ? 'eventKolName' : 'eventInspectName'),
    line: t(kol ? 'eventKolLine' : 'eventInspectLine', { time }),
    quiet: true,
  }
}

/** The quiet card on the first hot morning. */
export function hotCard(): GoldCard {
  return { icon: EVENT_ICON.hot, head: t('hotHead'), name: t('hotName'), line: t('hotLine'), quiet: true }
}

/** Today's line for an event: the inspection until done, then Mi Mi booked, in the shop, or none once she is on her way out. */
export function eventLine(sim: SpaSim): TodayLine | null {
  const plan = sim.eventBook.plan?.day === sim.day ? sim.eventBook.plan : null
  if (plan?.kind === 'inspect' && !sim.eventBook.inspected) return { icon: EVENT_ICON.inspect, text: t('todayInspect', { time: clockLabel(plan.minute) }) }
  if (plan?.kind === 'kol') return { icon: EVENT_ICON.kol, text: t('todayKol', { time: clockLabel(plan.minute) }) }
  if (sim.customers.some(c => c.kol && c.state !== 'leaving' && c.state !== 'exiting')) return { icon: EVENT_ICON.kol, text: t('todayKolHere') }
  return null
}

/** Today's line on a hot day, counting down to its last. */
export function hotLine(sim: SpaSim): TodayLine | null {
  const left = hotDaysLeft(sim.eventBook, sim.day)
  if (left === 0) return null
  return { icon: EVENT_ICON.hot, text: left === 1 ? t('todayHotLast') : t('todayHot', { n: left }) }
}

type Inspected = Extract<SimEvent, { type: 'inspected' }>

/** The inspection card's three rows: each check, what the inspector saw, and whether it passed. */
export function inspectRows(e: Inspected): { name: string; detail: string; ok: boolean }[] {
  return [
    {
      name: t('inspectStock'),
      detail: e.low ? t('inspectStockLow', { item: t(STOCK_NAME[e.low.item]), count: e.low.count }) : t('inspectStockOk', { n: LOW_STOCK + 1 }),
      ok: e.checks.stock,
    },
    { name: t('inspectCalm'), detail: e.lost > 0 ? t('inspectCalmLost', { n: e.lost }) : t('inspectCalmOk'), ok: e.checks.calm },
    { name: t('inspectTidy'), detail: t('inspectTidyLine', { beauty: Math.floor(e.beauty), need: INSPECT_BEAUTY }), ok: e.checks.tidy },
  ]
}

/** The inspection's outcome: the reward with the Giấy khen or money line, or that it is no fine with a hint for the first failed check. */
export function inspectResult(e: Inspected): { ok: boolean; head: string; line: string } {
  const ok = e.checks.stock && e.checks.calm && e.checks.tidy
  if (ok) return { ok, head: t('inspectPass', { money: formatMoney(e.reward) }), line: t(e.cert ? 'inspectPassCert' : 'inspectPassMoney') }
  const hint = !e.checks.stock ? 'inspectHintStock' : !e.checks.calm ? 'inspectHintCalm' : 'inspectHintTidy'
  return { ok, head: t('inspectFail'), line: t(hint) }
}
