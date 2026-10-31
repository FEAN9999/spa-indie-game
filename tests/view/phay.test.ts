import { describe, expect, it } from 'vitest'
import { clampScroll, DRAG_PX, isDrag, PHAY_BUTTON, phayButtonShown, postTime, shortCount, unreadLabel } from '../../src/view/phay'

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
})
