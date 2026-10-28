import { FESTIVAL_FROM_DAY } from '../config'
import type { StringKey } from '../strings/vi'
import { monthOf } from './calendar'
import type { ItemKind } from './items'
import { SERVICE_IDS, type ServiceId } from './services'

export type FestivalId = 'tet' | 'valentine' | 'march8' | 'midAutumn' | 'october20' | 'noel'

export interface FestivalSpec {
  /** The month of the year the festival fills. */
  month: number
  /** The service half the customers ask for, if the shop has it. */
  service: ServiceId
  /** The gift its quest gives, once. */
  keepsake: ItemKind
  name: StringKey
  /** The words on the sign hung in the room. */
  sign: StringKey
  /** Why customers want the service then. */
  why: StringKey
}

export const FESTIVALS: Record<FestivalId, FestivalSpec> = {
  tet: { month: 1, service: 'shampoo', keepsake: 'maiBranch', name: 'festTet', sign: 'signTet', why: 'whyTet' },
  valentine: { month: 2, service: 'mask', keepsake: 'heartFrame', name: 'festValentine', sign: 'signValentine', why: 'whyValentine' },
  march8: { month: 3, service: 'massage', keepsake: 'roseVase', name: 'festMarch8', sign: 'signMarch8', why: 'whyMarch8' },
  midAutumn: { month: 8, service: 'steam', keepsake: 'starLantern', name: 'festMidAutumn', sign: 'signMidAutumn', why: 'whyMidAutumn' },
  october20: { month: 10, service: 'mud', keepsake: 'flowerBasket', name: 'festOctober20', sign: 'signOctober20', why: 'whyOctober20' },
  noel: { month: 12, service: 'stone', keepsake: 'xmasTree', name: 'festNoel', sign: 'signNoel', why: 'whyNoel' },
}

export const FESTIVAL_IDS = Object.keys(FESTIVALS) as FestivalId[]

/** The festivals whose keepsake the shop has been given. */
export interface FestivalBook {
  keepsakes: FestivalId[]
}

export const emptyFestivalBook = (): FestivalBook => ({ keepsakes: [] })

/** The festival filling the day's month; none before FESTIVAL_FROM_DAY, while the player is still learning. */
export function festivalOf(day: number): FestivalId | null {
  if (day < FESTIVAL_FROM_DAY) return null
  return FESTIVAL_IDS.find(id => FESTIVALS[id].month === monthOf(day)) ?? null
}

/** The festival's service if the shop has it, else the nearest cheaper one it has; shampoo is always there. */
export function festivalService(id: FestivalId, open: readonly ServiceId[]): ServiceId {
  const from = SERVICE_IDS.indexOf(FESTIVALS[id].service)
  return SERVICE_IDS.slice(0, from + 1).reverse().find(s => open.includes(s)) ?? 'shampoo'
}
