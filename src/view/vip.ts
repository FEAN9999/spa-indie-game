import { VIP_WARN_MIN } from '../config'
import { clockLabel } from '../sim/clock'
import { SERVICES } from '../sim/services'
import type { EventBook } from '../sim/events'
import type { IdolBook } from '../sim/idols'
import { VIPS, type Booking, type VipBook } from '../sim/vips'
import { t } from '../strings/vi'
import { VIP_TEXT } from '../strings/vips'
import { eventNote } from './events'
import { idolBookingText } from './idol'

/** The booking in a sentence: time, title, name and the service in lower case. */
export function bookingText(key: 'vipBookingNote' | 'vipTodayToast', b: Booking): string {
  const text = VIP_TEXT[b.vip]
  return t(key, {
    time: clockLabel(b.minute),
    title: text.title,
    name: text.name,
    service: t(SERVICES[VIPS[b.vip].service].name).toLocaleLowerCase('vi'),
  })
}

/**
 * The notes under the summary rows, the booking's and the event's marked: the first day's note, tomorrow's VIP and star
 * bookings by minute (each followed by its first reminder until that hint is done), then tomorrow's event (never on a VIP's day).
 */
export function summaryNotes(firstDay: boolean, vip: VipBook, idol: IdolBook, events: EventBook, day: number, vipHintDone: boolean, idolHintDone: boolean, rivalTarget: number): { text: string; booking: boolean }[] {
  const notes: { text: string; booking: boolean }[] = []
  if (firstDay) notes.push({ text: t('summaryFirstDay'), booking: false })
  const lines: { minute: number; booking: string; first: string | null }[] = []
  if (vip.booking?.day === day + 1) lines.push({ minute: vip.booking.minute, booking: bookingText('vipBookingNote', vip.booking), first: vipHintDone ? null : t('vipFirstNote') })
  if (idol.booking?.day === day + 1) lines.push({ minute: idol.booking.minute, booking: idolBookingText('idolBookingNote', idol.booking), first: idolHintDone ? null : t('idolFirstNote') })
  for (const line of lines.sort((a, b) => a.minute - b.minute)) {
    notes.push({ text: line.booking, booking: true })
    if (line.first) notes.push({ text: line.first, booking: false })
  }
  if (events.plan?.day === day + 1) notes.push({ text: eventNote(events.plan, rivalTarget), booking: true })
  return notes
}

/** Whether the clock shows its gold star: a VIP, a star or Mi Mi due today, from VIP_WARN_MIN before the minute. */
export function clockStar(vip: VipBook, idol: IdolBook, events: EventBook, day: number, minutes: number): boolean {
  const due = (b: { day: number; minute: number } | null) => b !== null && b.day === day && minutes >= b.minute - VIP_WARN_MIN
  return due(vip.booking) || due(idol.booking) || (events.plan?.kind === 'kol' && due(events.plan))
}
