import { PLACES } from '../config'
import type { ItemKind } from './items'
import { SPA_LAYOUT_1A, widen } from './layout'

export type PlaceId = keyof typeof PLACES

export const PLACE_IDS: readonly PlaceId[] = ['beach', 'oldTown', 'uptown']

export const isPlaceId = (x: unknown): x is PlaceId => (PLACE_IDS as readonly unknown[]).includes(x)

/** The old shop's first day with the stairs turned into floor, 13 columns wide, for a branch's room art: a branch has one floor. */
export const BRANCH_ROOM: string[] = SPA_LAYOUT_1A.map(row => row.replaceAll('U', '.'))

/** A branch on the wide grid, every house shut. */
export const BRANCH_LAYOUT: string[] = widen(BRANCH_ROOM)

/** The piece a branch at each place opens with, laid as a gift on a tile that blocks no path and no spot. */
export const PLACE_DECOR: Record<PlaceId, { kind: ItemKind; x: number; y: number }> = {
  beach: { kind: 'surfboard', x: 23, y: 10 },
  oldTown: { kind: 'lanternString', x: 23, y: 10 },
  uptown: { kind: 'orchid', x: 23, y: 10 },
}

/** A service's plain price at a place, to the nearest thousand. */
export const placePrice = (price: number, place: PlaceId): number => Math.round((price * PLACES[place].priceFactor) / 1000) * 1000
