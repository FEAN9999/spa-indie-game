import { BOOST } from '../config'
import { clockLabel } from '../sim/clock'
import type { BoostTier, FeedBook, Post } from '../sim/feed'
import { formatCount } from '../strings/format'
import { t, type StringKey } from '../strings/vi'

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

/** A finger on the list: where it went down (re-based where it became a drag) and the scroll then. */
export interface Hold {
  y0: number
  s0: number
  moved: boolean
}

/** The scroll for the finger at `y`, or null while it is still a tap; the drag starts where the finger passed DRAG_PX, so the list never jumps. */
export function dragTo(hold: Hold, y: number): number | null {
  if (!hold.moved) {
    if (!isDrag(y - hold.y0)) return null
    hold.moved = true
    hold.y0 = y
  }
  return hold.s0 + y - hold.y0
}

/** A post's place in the list before scrolling. */
export interface Span {
  top: number
  bottom: number
}

/** Posts of these heights laid down from `top`, `gap` apart: their spans, and where the list ends after the last gap. */
export function stackPosts(heights: readonly number[], top: number, gap: number): { spans: Span[]; end: number } {
  const spans: Span[] = []
  let y = top
  for (const h of heights) {
    spans.push({ top: y, bottom: y + h })
    y += h + gap
  }
  return { spans, end: y }
}

/** Whether any of a post reaches between `from` and `to` with the list moved by `scroll`. */
export function inWindow(s: Span, scroll: number, from: number, to: number): boolean {
  return s.bottom + scroll > from && s.top + scroll < to
}

/** The button shows once Phây is open, but not under the gold card or the morning banner, which take its spot. */
export function phayButtonShown(open: boolean, cardUp: boolean, bannerUp: boolean): boolean {
  return open && !cardUp && !bannerUp
}

/** A complaint still waiting for the shop's answer gets the Trả lời button; one saved without its replies never does. */
export function replyButtonShown(post: Post): boolean {
  return post.complaint !== null && post.complaint.answered === null
}

/** A boostable post not yet boosted gets the Đẩy bài button; complaints are never boostable, so it never meets Trả lời. */
export function boostButtonShown(post: Post): boolean {
  return post.boostable && post.boosted === null
}

/** A boosted post's label: Đang đẩy from the day it is bought through the day it runs, Đã đẩy after (or when the save never named the post). */
export function boostLabel(post: Post, feed: FeedBook, day: number): string | null {
  if (post.boosted === null) return null
  return feed.boosts.some(b => b.post === post.id && b.day >= day) ? t('phayBoosting') : t('phayBoosted')
}

export const BOOST_NAME: Record<BoostTier, StringKey> = { small: 'phayBoostSmall', medium: 'phayBoostMedium', large: 'phayBoostLarge' }

/** What a tier brings the next day: the extra customers in percent and the tip factor with a decimal comma. */
export function boostGain(tier: BoostTier): string {
  const { arrival, tip } = BOOST[tier]
  return t('phayBoostGain', { n: Math.round((arrival - 1) * 100), tip: String(tip).replace('.', ',') })
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
