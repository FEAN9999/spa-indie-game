import { itemTexture } from '../art/furniture'
import { BADGE_BANNER_MS, GOLD_CARD_LINE_MS } from '../config'
import { C } from '../art/palette'
import { monthStart } from '../sim/calendar'
import { FESTIVALS, festivalOf, type FestivalId } from '../sim/festivals'
import { ITEMS } from '../sim/items'
import { SERVICES } from '../sim/services'
import type { SpaSim } from '../sim/spa'
import type { SimEvent } from '../sim/types'
import { formatMoney } from '../strings/format'
import { t } from '../strings/vi'
import { questCount } from './quests'

/** Each festival's two colours: the bunting alternates them, and the first is its sign and its discs. */
export const FESTIVAL_COLORS: Record<FestivalId, [string, string]> = {
  tet: [C.lantern, C.mustard],
  valentine: [C.lotus, C.lantern],
  march8: [C.lotus, C.mustard],
  midAutumn: [C.mustard, C.lantern],
  october20: [C.lotus, C.cobalt],
  noel: [C.leaf, C.lantern],
}

/** The line over the floor buttons in a festival: how far its quest has got, or just its service when the month has no festival quest. */
export function todayLine(sim: SpaSim): { festival: FestivalId; text: string } | null {
  const festival = festivalOf(sim.day)
  if (!festival) return null
  const name = t(FESTIVALS[festival].name)
  const p = sim.progress
  const q = p.monthly
  if (q?.festival === festival && p.monthFrom === monthStart(sim.day)) {
    if (q.state === 'done') return { festival, text: t('todayFestivalDone', { festival: name }) }
    return { festival, text: t('todayFestival', { festival: name, service: t(SERVICES[q.service!].name), count: questCount(q, p.total) }) }
  }
  return { festival, text: t('todayFestivalPlain', { festival: name, service: t(SERVICES[sim.festivalServiceToday()!].name) }) }
}

/** Today's line while the shop is in view: none once the day is over or while a panel covers the shop. */
export function todayShown(sim: SpaSim, covered: boolean): ReturnType<typeof todayLine> {
  return covered || sim.dayOver ? null : todayLine(sim)
}

/** How long a gold card stays: a badge's time for one line, more for each wrapped line so the longest can be read. */
export const goldCardMs = (lines: number): number => BADGE_BANNER_MS + GOLD_CARD_LINE_MS * Math.max(0, lines - 1)

/** A gold card under the top bar: a picture in a disc, a small heading, a name and a line that may wrap. */
export interface GoldCard {
  /** The texture in the disc and the disc's colour. */
  icon: { texture: string; disc: string }
  head: string
  name: string
  line: string
}

const festivalName = (f: FestivalId) => t(FESTIVALS[f].name)
const giftName = (f: FestivalId) => t(ITEMS[FESTIVALS[f].keepsake].name)
const festivalIcon = (f: FestivalId) => ({ texture: itemTexture(FESTIVALS[f].keepsake), disc: FESTIVAL_COLORS[f][0] })

/** The card on a festival's first morning; when the shop lacks the festival's service it says which one customers ask for instead. */
export function festivalStartCard(e: Extract<SimEvent, { type: 'festivalStarted' }>, month: number): GoldCard {
  const spec = FESTIVALS[e.festival]
  const festival = festivalName(e.festival)
  const service = t(SERVICES[e.service].name)
  const line =
    e.service === spec.service
      ? t('festStartLine', { service, why: t(spec.why) })
      : t('festStartLineSwap', { service, wanted: t(SERVICES[spec.service].name) })
  return { icon: festivalIcon(e.festival), head: t('festStartHead', { month, festival }), name: t('festStartName', { festival }), line }
}

/** The card for a finished festival quest: its keepsake the first time, only its money after. */
export function festivalDoneCard(e: Extract<SimEvent, { type: 'festivalQuestDone' }>): GoldCard {
  const gift = giftName(e.festival)
  return {
    icon: festivalIcon(e.festival),
    head: t('festDoneHead', { money: formatMoney(e.quest.reward) }),
    name: e.gift ? t('keepsakeNew', { gift }) : t('festDoneOwned', { gift }),
    line: t(e.gift ? 'festDoneGiftLine' : 'festDoneOwnedLine'),
  }
}

/** The new month's toast: that a missed festival's keepsake waits for next year, unless the shop already has it. */
export function monthToast(e: Extract<SimEvent, { type: 'monthStarted' }>, keepsakes: readonly FestivalId[]): string {
  if (e.ended && !keepsakes.includes(e.ended)) return t('festMissedToast', { festival: festivalName(e.ended), gift: giftName(e.ended) })
  return t('monthQuestToast', { month: e.month })
}

/** The festival quest's last line: the keepsake it gives, or that this time it pays only money. */
export function keepsakeLine(f: FestivalId, owned: boolean): string {
  return t(owned ? 'keepsakeOwned' : 'keepsakeNew', { gift: giftName(f) })
}
