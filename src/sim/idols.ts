import type { ItemKind } from './items'
import type { ServiceId } from './services'
import type { Look } from './types'

export type IdolId = 'sontung' | 'taylor' | 'gd' | 'jennie' | 'hieuthuhai' | 'weeknd' | 'taeyang' | 'bieber' | 'daesung'
/** Book order and the order they are first booked in. */
export const IDOL_IDS: IdolId[] = ['sontung', 'taylor', 'gd', 'jennie', 'hieuthuhai', 'weeknd', 'taeyang', 'bieber', 'daesung']

export interface IdolSpec {
  look: Look
  service: ServiceId
  /** The signed photo this star gives. */
  photo: ItemKind
}

/** The view reads only the skin and the hair style of a star's look. */
const look = (skin: number, hairStyle: number): Look => ({ skin, hair: 0, hairStyle, shirt: 0 })

export const IDOLS: Record<IdolId, IdolSpec> = {
  sontung: { look: look(0, 2), service: 'massage', photo: 'photoIdolSontung' },
  taylor: { look: look(0, 1), service: 'massage', photo: 'photoIdolTaylor' },
  gd: { look: look(0, 2), service: 'shampoo', photo: 'photoIdolGd' },
  jennie: { look: look(0, 1), service: 'mask', photo: 'photoIdolJennie' },
  hieuthuhai: { look: look(0, 2), service: 'shampoo', photo: 'photoIdolHieuthuhai' },
  weeknd: { look: look(3, 2), service: 'shampoo', photo: 'photoIdolWeeknd' },
  taeyang: { look: look(1, 2), service: 'massage', photo: 'photoIdolTaeyang' },
  bieber: { look: look(0, 2), service: 'mask', photo: 'photoIdolBieber' },
  daesung: { look: look(0, 2), service: 'mask', photo: 'photoIdolDaesung' },
}
