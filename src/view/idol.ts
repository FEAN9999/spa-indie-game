import { HUM_EVERY_MS } from '../config'
import { clockLabel } from '../sim/clock'
import { IDOLS, type IdolBook, type IdolBooking, type IdolId } from '../sim/idols'
import { SERVICES } from '../sim/services'
import type { Customer } from '../sim/types'
import type { VipBook } from '../sim/vips'
import { IDOL_TEXT } from '../strings/idols'
import { t } from '../strings/vi'
import { bookingText } from './vip'

/** The star's booking in a sentence: time, name and the service in lower case. */
export function idolBookingText(key: 'idolBookingNote' | 'idolTodayToast', b: IdolBooking): string {
  return t(key, {
    time: clockLabel(b.minute),
    name: IDOL_TEXT[b.idol].name,
    service: t(SERVICES[IDOLS[b.idol].service].name).toLocaleLowerCase('vi'),
  })
}

/** Today's VIP and star reminders, the earlier minute first and the VIP first on a tie. */
export function todayToasts(vip: VipBook, idol: IdolBook, day: number): string[] {
  const list: { minute: number; text: string }[] = []
  if (vip.booking?.day === day) list.push({ minute: vip.booking.minute, text: bookingText('vipTodayToast', vip.booking) })
  if (idol.booking?.day === day) list.push({ minute: idol.booking.minute, text: idolBookingText('idolTodayToast', idol.booking) })
  return list.sort((a, b) => a.minute - b.minute).map(x => x.text)
}

/** What a waiting star hums: the song's title between notes, never its words. */
export function humText(id: IdolId): string {
  return `♪ ${IDOL_TEXT[id].song} ♪`
}

/** Whether a star hums now: on the way to or waiting at the seat, after HUM_EVERY_MS and not over a line. */
export function humNow(c: Customer, sinceMs: number, talking: boolean): boolean {
  return c.idol !== null && (c.state === 'toSeat' || c.state === 'waiting') && sinceMs >= HUM_EVERY_MS && !talking
}
