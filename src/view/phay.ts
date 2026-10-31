import { clockLabel } from '../sim/clock'
import type { FeedBook, Post } from '../sim/feed'
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

/** How long a notice stays down, fades included. */
export const NOTICE_MS = 4000
const NOTICE_CHARS = 48

/** The newest post with a notice that came after the mark; the older ones waiting are folded into the red count. */
export function nextNotice(feed: FeedBook, notified: number): Post | null {
  for (let i = feed.posts.length - 1; i >= 0; i--) {
    const p = feed.posts[i]
    if (p.id <= notified) return null
    if (p.notify) return p
  }
  return null
}

/** The notice's one line: the name, then the words, cut with an ellipsis to fit. */
export function noticeLine(post: Post): string {
  const line = `${post.name}: ${post.text}`
  return line.length <= NOTICE_CHARS ? line : line.slice(0, NOTICE_CHARS - 1).trimEnd() + '…'
}
