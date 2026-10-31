import { C } from '../art/palette'
import { INSPECT_BEAUTY, LOW_STOCK, POWER_FROM_MIN, POWER_TO_MIN, POWER_WARN_MIN } from '../config'
import { clockLabel } from '../sim/clock'
import { hotDaysLeft, MACHINES, type EventKind, type EventPlan, type HotBy } from '../sim/events'
import { SERVICES, type ServiceId } from '../sim/services'
import type { SpaSim } from '../sim/spa'
import { STOCK_NAME } from '../sim/stock'
import type { SimEvent } from '../sim/types'
import { formatMoney } from '../strings/format'
import { IDOL_TEXT } from '../strings/idols'
import { t, type StringKey } from '../strings/vi'
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

/** Each event's summary note, and its morning card's name and line. */
const EVENT_TEXT: Record<EventKind, { note: StringKey; name: StringKey; line: StringKey }> = {
  kol: { note: 'eventNoteKol', name: 'eventKolName', line: 'eventKolLine' },
  inspect: { note: 'eventNoteInspect', name: 'eventInspectName', line: 'eventInspectLine' },
  rival: { note: 'eventNoteRival', name: 'eventRivalName', line: 'eventRivalLine' },
  power: { note: 'eventNotePower', name: 'eventPowerName', line: 'eventPowerLine' },
}

/** What the event texts fill in: the event's time, the rival's 3-star `target`, and the power cut's hours. */
const eventParams = (plan: EventPlan, target: number) => ({
  time: clockLabel(plan.minute),
  n: target,
  from: clockLabel(POWER_FROM_MIN),
  to: clockLabel(POWER_TO_MIN),
  hours: (POWER_TO_MIN - POWER_FROM_MIN) / 60,
})

/** The summary's line for tomorrow's event; `target` is the rival's 3-star count. */
export function eventNote(plan: EventPlan, target: number): string {
  return t(EVENT_TEXT[plan.kind].note, eventParams(plan, target))
}

/** The quiet card on the morning of an event; `target` is the rival's 3-star count. */
export function eventCard(plan: EventPlan, target: number): GoldCard {
  const text = EVENT_TEXT[plan.kind]
  const params = eventParams(plan, target)
  return { icon: EVENT_ICON[plan.kind], head: t('eventHead'), name: t(text.name, params), line: t(text.line, params), quiet: true }
}

/** The gold card when the rival's challenge is met. */
export function rivalBeatenCard(e: Extract<SimEvent, { type: 'rivalBeaten' }>): GoldCard {
  return {
    icon: { texture: 'heart-full', disc: C.lotus },
    head: t('rivalBeatenHead', { money: formatMoney(e.reward) }),
    name: t('rivalBeatenName'),
    line: t('rivalBeatenLine'),
  }
}

/** The toast an hour before the power cut, naming the shop's machine services in lower case. */
export function powerWarnText(machines: ServiceId[]): string {
  const names = MACHINES.filter(id => machines.includes(id)).map(id => t(SERVICES[id].name).toLocaleLowerCase('vi'))
  return t('powerWarnToast', { hours: POWER_WARN_MIN / 60, machines: names.join(', ') })
}

/** The quiet card on a hot morning; Mi Mi's head for her video, a star's name otherwise. */
export function hotCard(by: HotBy): GoldCard {
  const head = by === 'kol' ? t('hotHead') : t('hotIdolHead', { name: IDOL_TEXT[by].name })
  return { icon: EVENT_ICON.hot, head, name: t('hotName'), line: t('hotLine'), quiet: true }
}

/**
 * Today's line for an event: the power cut until the power is back, the inspection until done, Mi Mi booked, in the shop,
 * or none once she is on her way out, then the rival's count.
 */
export function eventLine(sim: SpaSim): TodayLine | null {
  const plan = sim.eventBook.plan?.day === sim.day ? sim.eventBook.plan : null
  const to = clockLabel(POWER_TO_MIN)
  if (plan?.kind === 'power' && sim.clock.minutes < POWER_FROM_MIN) return { icon: EVENT_ICON.power, text: t('eventPowerName', { from: clockLabel(POWER_FROM_MIN), to }) }
  if (sim.powerOut()) return { icon: EVENT_ICON.power, text: t('todayPowerOut', { to }) }
  if (plan?.kind === 'inspect' && !sim.eventBook.inspected) return { icon: EVENT_ICON.inspect, text: t('todayInspect', { time: clockLabel(plan.minute) }) }
  if (plan?.kind === 'kol') return { icon: EVENT_ICON.kol, text: t('todayKol', { time: clockLabel(plan.minute) }) }
  if (sim.customers.some(c => c.kol && c.state !== 'leaving' && c.state !== 'exiting')) return { icon: EVENT_ICON.kol, text: t('todayKolHere') }
  if (plan?.kind === 'rival') {
    const target = sim.rivalTarget()
    const n = sim.eventBook.count
    return { icon: EVENT_ICON.rival, text: n >= target ? t('todayRivalDone') : t('todayRival', { n, target }) }
  }
  return null
}

/** Today's line on a hot day, counting down to its last. */
export function hotLine(sim: SpaSim): TodayLine | null {
  const left = hotDaysLeft(sim.eventBook, sim.day)
  if (left === 0) return null
  return { icon: EVENT_ICON.hot, text: left === 1 ? t('todayHotLast') : t('todayHot', { n: left }) }
}

/** The Phây logo, for the morning a boosted post runs. */
const BOOST_ICON = { texture: 'icon-heart', disc: C.teal }

/** Today's line while a post bought yesterday is boosted: the main shop's alone. */
export function boostLine(sim: SpaSim): TodayLine | null {
  return sim.boostTier() ? { icon: BOOST_ICON, text: t('todayBoost') } : null
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
