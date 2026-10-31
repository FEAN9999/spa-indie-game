import { describe, expect, it } from 'vitest'
import { addPost, emptyFeed } from '../../src/sim/feed'
import type { FeedBook, PostDraft } from '../../src/sim/feed'
import { milestoneCard } from '../../src/view/phayCards'
import { clampScroll, DRAG_PX, dragTo, inWindow, isDrag, nextNotice, noticeLine, PHAY_BUTTON, phayButtonShown, postTime, shortCount, stackPosts, unreadLabel } from '../../src/view/phay'

describe('the Phây button', () => {
  it('sits under the top bar on the right, lower at a branch under the ribbon', () => expect(PHAY_BUTTON).toEqual({ x: 1010, y: 280, r: 44, branchY: 330 }))

  it('shows once Phây is open, unless the gold card or the morning banner is up', () => {
    expect(phayButtonShown(true, false, false)).toBe(true)
    expect(phayButtonShown(false, false, false)).toBe(false)
    expect(phayButtonShown(true, true, false)).toBe(false)
    expect(phayButtonShown(true, false, true)).toBe(false)
  })

  it('counts unread posts up to 9, then 9+, and nothing at 0', () => {
    expect(unreadLabel(0)).toBe('')
    expect(unreadLabel(1)).toBe('1')
    expect(unreadLabel(9)).toBe('9')
    expect(unreadLabel(10)).toBe('9+')
    expect(unreadLabel(50)).toBe('9+')
  })
})

describe('Phây numbers', () => {
  it('groups counts under 10.000 by dots', () => {
    expect(shortCount(0)).toBe('0')
    expect(shortCount(86)).toBe('86')
    expect(shortCount(1204)).toBe('1.204')
    expect(shortCount(9999)).toBe('9.999')
  })

  it('shortens thousands to K and millions to Tr with a decimal comma, dropping a ,0', () => {
    expect(shortCount(10_000)).toBe('10K')
    expect(shortCount(12_000)).toBe('12K')
    expect(shortCount(48_210)).toBe('48,2K')
    expect(shortCount(1_200_000)).toBe('1,2Tr')
    expect(shortCount(3_000_000)).toBe('3Tr')
  })

  it('never shows 1000K: just under a million rounds to 1Tr', () => {
    expect(shortCount(999_949)).toBe('999,9K')
    expect(shortCount(999_999)).toBe('1Tr')
  })

  it("writes a post's time as its day and clock", () => {
    expect(postTime(45, 10 * 60 + 20)).toBe('Ngày 45 · 10:20')
    expect(postTime(8, 8 * 60 + 5.7)).toBe('Ngày 8 · 08:05')
  })
})

describe('Phây scrolling', () => {
  it('takes a move of more than DRAG_PX as a drag, either way', () => {
    expect(DRAG_PX).toBe(14)
    expect(isDrag(14)).toBe(false)
    expect(isDrag(-14)).toBe(false)
    expect(isDrag(15)).toBe(true)
    expect(isDrag(-15)).toBe(true)
  })

  it('keeps the list between its end at the bottom of the view and its top at the top', () => {
    expect(clampScroll(-5000, 3000, 1700)).toBe(-1300)
    expect(clampScroll(20, 3000, 1700)).toBe(0)
    expect(clampScroll(-600, 3000, 1700)).toBe(-600)
  })

  it('does not scroll a list shorter than the view', () => expect(clampScroll(-10, 800, 1700)).toBe(0))

  it('starts a drag from where the list was, not with a jump of DRAG_PX', () => {
    const hold = { y0: 1000, s0: -300, moved: false }
    expect(dragTo(hold, 1010)).toBeNull()
    expect(dragTo(hold, 980)).toBe(-300)
    expect(dragTo(hold, 950)).toBe(-330)
    expect(dragTo(hold, 1000)).toBe(-280)
  })

  it('stacks posts of known heights down the list, a gap apart, and ends after the last gap', () => {
    expect(stackPosts([300, 500, 200], 414, 26)).toEqual({ spans: [{ top: 414, bottom: 714 }, { top: 740, bottom: 1240 }, { top: 1266, bottom: 1466 }], end: 1492 })
    expect(stackPosts([], 414, 26)).toEqual({ spans: [], end: 414 })
  })

  it('a post is in the window when any of it reaches between the edges, the list moved by the scroll', () => {
    const s = { top: 1000, bottom: 1500 }
    expect(inWindow(s, 0, 400, 2090)).toBe(true)
    expect(inWindow(s, -1100, 400, 2090)).toBe(false)
    expect(inWindow(s, -1099, 400, 2090)).toBe(true)
    expect(inWindow(s, 1090, 400, 2090)).toBe(false)
    expect(inWindow(s, 1089, 400, 2090)).toBe(true)
  })

  it('a 50-post feed builds only the few posts near the window as it opens, and the rest as it scrolls', () => {
    const { spans, end } = stackPosts(Array.from({ length: 50 }, (_, i) => [420, 560, 900][i % 3]), 414, 26)
    const near = (scroll: number) => spans.filter(s => inWindow(s, scroll, 400 - 600, 2090 + 600)).length
    expect(near(0)).toBeLessThanOrEqual(6)
    expect(near(clampScroll(-1e9, end - 400, 1690))).toBeLessThanOrEqual(6)
  })
})

const draft = (over: Partial<PostDraft> = {}): PostDraft => ({
  kind: 'praise', name: 'Chị Thu', face: null, tick: false, stars: null, text: 'Gội đầu rất thích.', pic: null, comments: [], complaint: null, boostable: false, notify: false, ...over,
})
const feedWith = (...notify: boolean[]): FeedBook => {
  const f = { ...emptyFeed(), open: true, followers: 50 }
  notify.forEach((n, i) => addPost(f, draft({ notify: n, name: `Khách ${i + 1}` }), 8, i, () => 0.5))
  return f
}

describe('the Phây notice', () => {
  it('has no notice for posts already there on load', () => {
    const f = feedWith(true, true)
    expect(nextNotice(f, f.nextId - 1)).toBeNull()
  })

  it('picks the newest post that wants a notice, ignoring the quiet ones after it', () => {
    const f = feedWith(true, true, false)
    expect(nextNotice(f, 0)?.id).toBe(2)
  })

  it('skips posts at or before the mark, so older pending ones are folded away', () => {
    const f = feedWith(true, true)
    expect(nextNotice(f, 1)?.id).toBe(2)
    expect(nextNotice(f, 2)).toBeNull()
  })

  it('has nothing for an empty feed', () => expect(nextNotice(emptyFeed(), 0)).toBeNull())

  it('writes one line, name then words, cut with an ellipsis when long', () => {
    expect(noticeLine(feedWith(true).posts[0])).toBe('Khách 1: Gội đầu rất thích.')
    const long = { ...feedWith(true).posts[0], text: 'a'.repeat(120) }
    const line = noticeLine(long)
    expect(line.length).toBeLessThanOrEqual(48)
    expect(line.endsWith('…')).toBe(true)
  })
})

describe('the milestone card', () => {
  it('cheers the count with a tick', () => {
    const card = milestoneCard(100_000)
    expect(card.name).toBe('100.000 người theo dõi!')
    expect(card.icon.texture).toBe('icon-tick')
    expect(card.line).toContain('tích xanh')
  })

  it('names the gold ring at a million and says nothing of a tick before 100.000', () => {
    expect(milestoneCard(1_000_000).line).toContain('viền vàng')
    expect(milestoneCard(1_000).line).not.toContain('tích')
    expect(milestoneCard(10_000).name).toBe('10.000 người theo dõi!')
  })
})
