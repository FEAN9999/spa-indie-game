import { describe, expect, it } from 'vitest'
import { HUM_EVERY_MS, VIP_WARN_MIN } from '../../src/config'
import { emptyEventBook } from '../../src/sim/events'
import { emptyIdolBook, type IdolBook, type IdolBooking } from '../../src/sim/idols'
import type { Customer, CustomerState } from '../../src/sim/types'
import { emptyVipBook, type VipBook } from '../../src/sim/vips'
import { t } from '../../src/strings/vi'
import { humNow, humText, idolBookingText, todayToasts } from '../../src/view/idol'
import { bookingText, clockStar, summaryNotes } from '../../src/view/vip'

const idolBook = (booking: IdolBooking): IdolBook => ({ ...emptyIdolBook(), booking })
const vipBook = (day: number, minute: number): VipBook => ({ ...emptyVipBook(), booking: { vip: 'singer', day, minute } })
const guest = (state: CustomerState, idol: Customer['idol'] = 'taylor') => ({ state, idol }) as Customer

describe('star notices', () => {
  it('writes the booking with the time, name and service', () => {
    expect(idolBookingText('idolBookingNote', { idol: 'taylor', day: 5, minute: 900 })).toBe('Ngày mai 15:00,\nngôi sao Taylor Swift hẹn massage')
    expect(idolBookingText('idolTodayToast', { idol: 'gd', day: 5, minute: 660 })).toBe('Hôm nay 11:00, ngôi sao G-Dragon hẹn gội đầu')
  })

  it('orders the summary lines by minute, each with its own first note', () => {
    const star = idolBook({ idol: 'taylor', day: 4, minute: 660 })
    const vip = vipBook(4, 900)
    expect(summaryNotes(false, vip, star, emptyEventBook(), 3, false, false, 4)).toEqual([
      { text: idolBookingText('idolBookingNote', star.booking!), booking: true },
      { text: t('idolFirstNote'), booking: false },
      { text: bookingText('vipBookingNote', vip.booking!), booking: true },
      { text: t('vipFirstNote'), booking: false },
    ])
    const late = idolBook({ idol: 'taylor', day: 4, minute: 1000 })
    expect(summaryNotes(false, vip, late, emptyEventBook(), 3, true, true, 4)).toEqual([
      { text: bookingText('vipBookingNote', vip.booking!), booking: true },
      { text: idolBookingText('idolBookingNote', late.booking!), booking: true },
    ])
  })

  it('shows the first note only until the star hint is done, and nothing without a star', () => {
    const star = idolBook({ idol: 'taylor', day: 4, minute: 660 })
    expect(summaryNotes(false, emptyVipBook(), star, emptyEventBook(), 3, true, true, 4)).toHaveLength(1)
    expect(summaryNotes(false, emptyVipBook(), star, emptyEventBook(), 3, true, false, 4)).toHaveLength(2)
    expect(summaryNotes(false, emptyVipBook(), emptyIdolBook(), emptyEventBook(), 3, false, false, 4)).toEqual([])
  })

  it('shows the clock star for a star from an hour before their minute', () => {
    const star = idolBook({ idol: 'taylor', day: 4, minute: 900 })
    expect(clockStar(emptyVipBook(), star, emptyEventBook(), 4, 900 - VIP_WARN_MIN - 1)).toBe(false)
    expect(clockStar(emptyVipBook(), star, emptyEventBook(), 4, 900 - VIP_WARN_MIN)).toBe(true)
    expect(clockStar(emptyVipBook(), star, emptyEventBook(), 3, 900)).toBe(false)
  })

  it("lists today's reminders, the earlier first", () => {
    const vip = vipBook(4, 900)
    expect(todayToasts(vip, emptyIdolBook(), 4)).toEqual([bookingText('vipTodayToast', vip.booking!)])
    expect(todayToasts(vip, emptyIdolBook(), 3)).toEqual([])
    const star = idolBook({ idol: 'taylor', day: 4, minute: 660 })
    expect(todayToasts(vip, star, 4)).toEqual([idolBookingText('idolTodayToast', star.booking!), bookingText('vipTodayToast', vip.booking!)])
    const tie = idolBook({ idol: 'taylor', day: 4, minute: 900 })
    expect(todayToasts(vip, tie, 4)[0]).toBe(bookingText('vipTodayToast', vip.booking!))
  })
})

describe('star humming', () => {
  it('hums the song title only', () => {
    expect(humText('sontung')).toBe('♪ Lạc Trôi ♪')
  })

  it('hums while walking to or waiting at the seat, after the pause, never over a line', () => {
    for (const state of ['toSeat', 'waiting'] as const) expect(humNow(guest(state), HUM_EVERY_MS, false)).toBe(true)
    for (const state of ['arriving', 'toStation', 'inService', 'leaving'] as const) expect(humNow(guest(state), HUM_EVERY_MS, false)).toBe(false)
    expect(humNow(guest('waiting', null), HUM_EVERY_MS, false)).toBe(false)
    expect(humNow(guest('waiting'), HUM_EVERY_MS, true)).toBe(false)
    expect(humNow(guest('waiting'), HUM_EVERY_MS - 1, false)).toBe(false)
  })
})
