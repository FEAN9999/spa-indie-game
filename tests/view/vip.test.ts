import { describe, expect, it } from 'vitest'
import { VIP_WARN_MIN } from '../../src/config'
import { emptyEventBook } from '../../src/sim/events'
import { emptyVipBook, type VipBook } from '../../src/sim/vips'
import { t } from '../../src/strings/vi'
import { bookingText, clockStar, summaryNotes } from '../../src/view/vip'

const booked = (day: number, minute: number): VipBook => ({ ...emptyVipBook(), booking: { vip: 'singer', day, minute } })

describe('VIP notes and clock star', () => {
  it("writes tomorrow's booking with the time, title, name and service", () => {
    expect(bookingText('vipBookingNote', { vip: 'singer', day: 4, minute: 900 })).toBe('Ngày mai 15:00,\nca sĩ Mây Chiều hẹn massage')
    expect(bookingText('vipTodayToast', { vip: 'chef', day: 4, minute: 630 })).toBe('Hôm nay 10:30, đầu bếp Tám Lửa hẹn gội đầu')
  })

  it('adds the VIP reminder until the VIP hint is done', () => {
    const vip = booked(4, 900)
    expect(summaryNotes(false, vip, emptyEventBook(), 3, false, 4)).toEqual([
      { text: bookingText('vipBookingNote', vip.booking!), booking: true },
      { text: t('vipFirstNote'), booking: false },
    ])
    expect(summaryNotes(false, vip, emptyEventBook(), 3, true, 4)).toEqual([{ text: bookingText('vipBookingNote', vip.booking!), booking: true }])
  })

  it("puts the first day's note first and adds nothing without a booking for tomorrow", () => {
    expect(summaryNotes(true, emptyVipBook(), emptyEventBook(), 1, false, 4)).toEqual([{ text: t('summaryFirstDay'), booking: false }])
    expect(summaryNotes(false, emptyVipBook(), emptyEventBook(), 1, false, 4)).toEqual([])
    expect(summaryNotes(false, booked(6, 900), emptyEventBook(), 3, false, 4)).toEqual([])
    const vip = booked(4, 900)
    expect(summaryNotes(true, vip, emptyEventBook(), 3, true, 4)[0]).toEqual({ text: t('summaryFirstDay'), booking: false })
    expect(summaryNotes(true, vip, emptyEventBook(), 3, true, 4)).toHaveLength(2)
  })

  it('shows the clock star from an hour before her time, only on her day', () => {
    const vip = booked(4, 900)
    expect(clockStar(vip, emptyEventBook(), 4, 900 - VIP_WARN_MIN - 1)).toBe(false)
    expect(clockStar(vip, emptyEventBook(), 4, 900 - VIP_WARN_MIN)).toBe(true)
    expect(clockStar(vip, emptyEventBook(), 4, 899)).toBe(true)
    expect(clockStar(vip, emptyEventBook(), 3, 900)).toBe(false)
    expect(clockStar(emptyVipBook(), emptyEventBook(), 4, 900)).toBe(false)
  })
})
