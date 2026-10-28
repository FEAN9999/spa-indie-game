import { PLACES } from '../config'
import type { ItemKind } from './items'
import { SPA_LAYOUT_1A } from './layout'

export type PlaceId = keyof typeof PLACES

export const PLACE_IDS: readonly PlaceId[] = ['beach', 'oldTown', 'uptown']

export const isPlaceId = (x: unknown): x is PlaceId => (PLACE_IDS as readonly unknown[]).includes(x)

/** The places a branch can open at today; the others show "Sắp có". */
export const PLACES_READY: readonly PlaceId[] = ['beach']

/** The first day's room with the stairs turned into floor: a branch has one floor. */
export const BRANCH_LAYOUT: string[] = SPA_LAYOUT_1A.map(row => row.replaceAll('U', '.'))

/** The piece a branch at each place opens with, laid as a gift on a tile that blocks no path and no spot. */
export const PLACE_DECOR: Record<PlaceId, { kind: ItemKind; x: number; y: number }> = {
  beach: { kind: 'surfboard', x: 11, y: 10 },
  oldTown: { kind: 'lanternString', x: 11, y: 10 },
  uptown: { kind: 'orchid', x: 11, y: 10 },
}

/** A service's plain price at a place, to the nearest thousand. */
export const placePrice = (price: number, place: PlaceId): number => Math.round((price * PLACES[place].priceFactor) / 1000) * 1000
