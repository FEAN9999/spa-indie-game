import { VIP_WARN_MIN } from '../config'
import { clockLabel } from '../sim/clock'
import { SERVICES } from '../sim/services'
import { VIPS, type Booking, type VipBook } from '../sim/vips'
import { t } from '../strings/vi'
import { VIP_TEXT } from '../strings/vips'

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

/** The notes under the summary rows: the first day's note, tomorrow's booking, then the VIP reminder until the VIP hint is done. */
export function summaryNotes(firstDay: boolean, vip: VipBook, day: number, vipHintDone: boolean): string[] {
  const notes: string[] = []
  if (firstDay) notes.push(t('summaryFirstDay'))
  if (vip.booking?.day === day + 1) {
    notes.push(bookingText('vipBookingNote', vip.booking))
    if (!vipHintDone) notes.push(t('vipFirstNote'))
  }
  return notes
}

/** Whether the clock shows its gold star: a booking today, from VIP_WARN_MIN before its minute. */
export function clockStar(vip: VipBook, day: number, minutes: number): boolean {
  return vip.booking !== null && vip.booking.day === day && minutes >= vip.booking.minute - VIP_WARN_MIN
}
