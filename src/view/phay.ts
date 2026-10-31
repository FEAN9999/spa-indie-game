import { clockLabel } from '../sim/clock'
import { formatCount } from '../strings/format'
import { t } from '../strings/vi'

/** The phone button under the top bar, in the zoom buttons' column; at a branch it sits under the ribbon. */
export const PHAY_BUTTON = { x: 1010, y: 280, r: 44, branchY: 330 }
/** A finger that moves more than this is scrolling the list, not tapping it. */
export const DRAG_PX = 14

/** A like or follower count: dots under 10.000, then K and Tr with a decimal comma and no ",0". */
export function shortCount(n: number): string {
  if (n < 10_000) return formatCount(n)
  // 999.950 and up would round to "1000K"
  const [v, unit] = n < 999_950 ? [n / 1_000, 'K'] : [n / 1_000_000, 'Tr']
  return v.toFixed(1).replace(/\.0$/, '').replace('.', ',') + unit
}

/** The red dot's words: nothing at 0, "9+" past 9. */
export function unreadLabel(n: number): string {
  return n <= 0 ? '' : n > 9 ? '9+' : String(n)
}

export function postTime(day: number, minute: number): string {
  return `${t('dayLabel', { day })} · ${clockLabel(minute)}`
}

/** The list's offset kept between its end at the view's bottom and its top at the view's top; a short list stays at 0. */
export function clampScroll(y: number, listH: number, viewH: number): number {
  return Math.max(Math.min(0, viewH - listH), Math.min(0, y))
}

export function isDrag(dy: number): boolean {
  return Math.abs(dy) > DRAG_PX
}

/** The button shows once Phây is open, but not under the gold card or the morning banner, which take its spot. */
export function phayButtonShown(open: boolean, cardUp: boolean, bannerUp: boolean): boolean {
  return open && !cardUp && !bannerUp
}
