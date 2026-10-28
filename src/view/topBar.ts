import { monthOf } from '../sim/calendar'
import { FESTIVALS, festivalOf } from '../sim/festivals'
import { t } from '../strings/vi'

/** Top bar first row in canvas px: money from moneyX, then the star and rating, which end by rowRight, clear of the pause button. */
export const TOP_BAR = { moneyX: 135, starLeft: 441, starW: 45, rowRight: 920 }
const GAP = 16

export interface TopBarLayout {
  moneyScale: number
  starX: number
  ratingX: number
}

/** Keeps the star at the board's spot, pushes it right of long money, and shrinks the money only if the rating would pass rowRight. */
export function layoutTopBar(moneyW: number, ratingW: number): TopBarLayout {
  // the furthest right the star can sit with the rating still ending by rowRight
  const latestStar = TOP_BAR.rowRight - ratingW - GAP - TOP_BAR.starW
  const moneyScale = Math.min(1, (latestStar - GAP - TOP_BAR.moneyX) / moneyW)
  const starLeft = Math.max(Math.min(TOP_BAR.starLeft, latestStar), TOP_BAR.moneyX + moneyW * moneyScale + GAP)
  return { moneyScale, starX: starLeft + TOP_BAR.starW / 2, ratingX: starLeft + TOP_BAR.starW + GAP }
}

/** The top bar's second row: the day, the month, the festival if there is one, and the time. */
export function dayTimeText(day: number, clock: string): string {
  const festival = festivalOf(day)
  return [t('dayLabel', { day }), t('monthLabel', { month: monthOf(day) }), ...(festival ? [t(FESTIVALS[festival].name)] : []), clock].join(' · ')
}
