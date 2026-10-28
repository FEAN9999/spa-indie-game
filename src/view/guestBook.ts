import { KINDS, MAIN_KINDS, type MainKind } from '../sim/customers'
import { REGULAR_TEXT } from '../strings/regulars'
import { VIP_TEXT } from '../strings/vips'
import { REGULARS, REGULAR_IDS, bookOpen, isMember, type GuestBook, type RegularId } from '../sim/regulars'
import { VIP_IDS, type VipBook, type VipId, type VipState } from '../sim/vips'

export type RegularRow =
  | { id: RegularId; shown: 'met'; hearts: number; member: boolean }
  | { id: RegularId; shown: 'soon' }
  | { id: RegularId; shown: 'friend'; by: RegularId }

/** One row per regular, in book order: met, or still to come on their own or through a friend. */
export function regularRows(book: GuestBook): RegularRow[] {
  return REGULAR_IDS.map((id): RegularRow => {
    const s = book.regulars[id]
    if (s.met) return { id, shown: 'met', hearts: s.hearts, member: isMember(s) }
    const by = REGULARS[id].introducedBy
    return by === null ? { id, shown: 'soon' } : { id, shown: 'friend', by }
  })
}

export interface KindRow {
  kind: MainKind
  met: boolean
  served: number
  fromDay: number
}

export function kindRows(book: GuestBook): KindRow[] {
  return MAIN_KINDS.map(kind => ({ kind, met: book.kindsMet.includes(kind), served: book.served[kind], fromDay: KINDS[kind].fromDay }))
}

/** What the detail shows: the first words, then the story lines told so far. */
export const detailLines = (book: GuestBook, id: RegularId): string[] => [REGULAR_TEXT[id].intro, ...REGULAR_TEXT[id].story.slice(0, toldLines(book, id))]

/** Story lines told so far: one per heart. */
export const toldLines = (book: GuestBook, id: RegularId): number => book.regulars[id].hearts

export interface VipRow {
  id: VipId
  met: boolean
  visits: number
  best: number
  photo: boolean
}

/** One row per VIP, in book order; she is met once she has visited. */
export function vipRows(vip: VipBook): VipRow[] {
  return VIP_IDS.map(id => ({ id, met: vip.vips[id].visits > 0, ...vip.vips[id] }))
}

/** What a VIP's detail shows: her words on arriving once she has visited, her thanks once she has earned 3 stars. */
export const vipDetailLines = (id: VipId, state: VipState): string[] => {
  if (state.visits === 0) return []
  return state.best === 3 ? [VIP_TEXT[id].arrive, VIP_TEXT[id].thanks] : [VIP_TEXT[id].arrive]
}

export type Tab = 'regulars' | 'kinds' | 'vip'

/** The book's tabs: the VIP tab once a VIP has been booked. */
export const bookTabs = (vip: VipBook): Tab[] => (vip.everBooked ? ['regulars', 'kinds', 'vip'] : ['regulars', 'kinds'])

/** The tab the book opens on: the VIPs' when a VIP is all there is to see yet. */
export const firstTab = (book: GuestBook, vip: VipBook): Tab => (!bookOpen(book) && vip.everBooked ? 'vip' : 'regulars')
