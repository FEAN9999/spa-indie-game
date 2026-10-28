import { C } from '../art/palette'
import { monthStart } from '../sim/calendar'
import { FESTIVALS, festivalOf, type FestivalId } from '../sim/festivals'
import { SERVICES } from '../sim/services'
import type { SpaSim } from '../sim/spa'
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
