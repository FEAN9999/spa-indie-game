import { PLACES } from '../config'
import { SPA_LAYOUT_1A } from './layout'

export type PlaceId = keyof typeof PLACES

export const PLACE_IDS: readonly PlaceId[] = ['beach', 'oldTown', 'uptown']

export const isPlaceId = (x: unknown): x is PlaceId => (PLACE_IDS as readonly unknown[]).includes(x)

/** The places a branch can open at today; the others show "Sắp có". */
export const PLACES_READY: readonly PlaceId[] = ['beach']

/** The first day's room with the stairs turned into floor: a branch has one floor. */
export const BRANCH_LAYOUT: string[] = SPA_LAYOUT_1A.map(row => row.replaceAll('U', '.'))

/** A service's plain price at a place, to the nearest thousand. */
export const placePrice = (price: number, place: PlaceId): number => Math.round((price * PLACES[place].priceFactor) / 1000) * 1000
