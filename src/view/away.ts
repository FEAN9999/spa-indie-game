import { C } from '../art/palette'
import { AWAY_MAX_HOURS } from '../config'
import type { AwayResult } from '../sim/away'
import { formatMoney } from '../strings/format'
import { t } from '../strings/vi'
import { placeName } from './chain'
import type { GoldCard } from './festivals'

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

/** How long the owner was away: minutes under an hour, hours and minutes under a day, days and hours after; the zero part is left out. */
export function awayTime(ms: number): string {
  if (ms >= DAY) {
    const d = Math.floor(ms / DAY)
    const h = Math.floor((ms % DAY) / HOUR)
    return h === 0 ? t('awayDays', { d }) : t('awayDaysHours', { d, h })
  }
  if (ms >= HOUR) {
    const h = Math.floor(ms / HOUR)
    const m = Math.floor((ms % HOUR) / MIN)
    return m === 0 ? t('awayHours', { h }) : t('awayHoursMinutes', { h, m })
  }
  return t('awayMinutes', { m: Math.floor(ms / MIN) })
}

/** The card's paragraphs: how the pay is worked out, that a long time away counts as the most, and that nothing else moved. */
export function awayLines(r: AwayResult): string[] {
  const money = formatMoney(Math.round(r.profit / 1000) * 1000)
  const rule = r.places.length > 1 ? t('awayRuleChain', { money }) : r.days === 1 ? t('awayRuleOne', { money }) : t('awayRule', { days: r.days, money })
  const from = r.places.length > 1 ? t('awayShops', { n: r.places.length }) : r.places[0] === 'restaurant' ? t('awayFromRestaurant') : r.places[0] ? t('awayFrom', { place: placeName(r.places[0]) }) : null
  return [...(from ? [from] : []), rule, ...(r.capped ? [t('awayCapped', { hours: AWAY_MAX_HOURS })] : []), t('awayStill')]
}

/** The quiet card, once per shop, that says time away pays when the staff do all the work. */
export const awayTip = (): GoldCard => ({
  icon: { texture: 'badge-coins', disc: C.mustard, tint: C.ink },
  head: t('awayTipHead'),
  name: t('awayTipName'),
  line: t('awayTipLine'),
  quiet: true,
})
