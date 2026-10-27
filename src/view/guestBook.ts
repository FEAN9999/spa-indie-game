import { CUSTOMER_KINDS, KINDS, type CustomerKind } from '../sim/customers'
import { REGULARS, REGULAR_IDS, isMember, type GuestBook, type RegularId } from '../sim/regulars'

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
  kind: CustomerKind
  met: boolean
  served: number
  fromDay: number
}

export function kindRows(book: GuestBook): KindRow[] {
  return CUSTOMER_KINDS.map(kind => ({ kind, met: book.kindsMet.includes(kind), served: book.served[kind], fromDay: KINDS[kind].fromDay }))
}

/** Story lines told so far: one per heart. */
export const toldLines = (book: GuestBook, id: RegularId): number => book.regulars[id].hearts
