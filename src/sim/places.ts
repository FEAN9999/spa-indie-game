import { PLACES } from '../config'
import type { ItemKind } from './items'
import { SHOP_LAYOUT, SPA_LAYOUT_1A } from './layout'

export type PlaceId = keyof typeof PLACES

export const PLACE_IDS: readonly PlaceId[] = ['beach', 'oldTown', 'uptown']

export const isPlaceId = (x: unknown): x is PlaceId => (PLACE_IDS as readonly unknown[]).includes(x)

/** The old shop's first day with the stairs turned into floor, 13 columns wide, for a branch's room art: the stairs are drawn over it. */
export const BRANCH_ROOM: string[] = SPA_LAYOUT_1A.map(row => row.replaceAll('U', '.'))

/** A branch is laid out like the main shop's first day on the wide grid: stairs and all, every house shut. */
export const BRANCH_LAYOUT: string[] = SHOP_LAYOUT

/** The piece a branch at each place opens with, laid as a gift on a tile that blocks no path and no spot: by the left wall, clear of the stairs and hiding nothing. */
export const PLACE_DECOR: Record<PlaceId, { kind: ItemKind; x: number; y: number }> = {
  beach: { kind: 'surfboard', x: 13, y: 10 },
  oldTown: { kind: 'lanternString', x: 13, y: 10 },
  uptown: { kind: 'orchid', x: 13, y: 10 },
}

/** Where a branch saved before its stairs had its piece: the foot of the stairs now. */
export const OLD_DECOR_TILE = { x: 23, y: 10 } as const

/** A service's plain price at a place, to the nearest thousand. */
export const placePrice = (price: number, place: PlaceId): number => Math.round((price * PLACES[place].priceFactor) / 1000) * 1000
