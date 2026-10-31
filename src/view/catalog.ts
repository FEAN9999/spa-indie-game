import { ITEM_KINDS, ITEMS, layerOf, SET_IDS, type ItemGroup, type ItemKind, type SetId } from '../sim/items'
import { BREED_IDS, type BreedId, type Pet } from '../sim/pets'
import { serviceOfBed, type ServiceId } from '../sim/services'

/** Build mode shows this many item cards at a time. */
const CARDS_PER_PAGE = 4

/** What the Trang trí tab shows: everything, one set's six pieces from any tab, or only the wall pieces or the rugs. */
export type DecorFilter = 'all' | SetId | 'wall' | 'rug'
export const DECOR_FILTERS: DecorFilter[] = ['all', ...SET_IDS, 'wall', 'rug']

const passes = (kind: ItemKind, filter: DecorFilter): boolean =>
  filter === 'wall' || filter === 'rug' ? layerOf(kind) === filter : ITEMS[kind].set === filter

/** A card in the catalogue: a kind to buy, or a regular's gift waiting to be put down. */
export interface CatalogEntry {
  kind: ItemKind
  gift: boolean
}

/**
 * One page of a tab's cards in catalogue order, a bed only once its service is open; turning past either end comes round to the other.
 * A tab starts with one card per waiting gift of its group, oldest first; the gift-only kinds are never for sale.
 * On the Trang trí tab a `filter` other than 'all' shows only its pieces, and no gift, since no gift is in a set or is a wall piece or rug.
 */
export function catalogPage(group: ItemGroup, page: number, open: ServiceId[], gifts: ItemKind[], filter: DecorFilter = 'all'): { entries: CatalogEntry[]; page: number; pages: number } {
  const filtered = group === 'decor' && filter !== 'all'
  const shown = (k: ItemKind) => (filtered ? passes(k, filter) : ITEMS[k].group === group)
  const forSale = ITEM_KINDS.filter(k => shown(k) && !ITEMS[k].giftOnly && (ITEMS[k].group !== 'bed' || open.includes(serviceOfBed(k)!)))
  const waiting = filtered ? [] : gifts.filter(k => ITEMS[k].group === group)
  const all = [...waiting.map(kind => ({ kind, gift: true })), ...forSale.map(kind => ({ kind, gift: false }))]
  const pages = Math.ceil(all.length / CARDS_PER_PAGE)
  const p = ((page % pages) + pages) % pages
  return { entries: all.slice(p * CARDS_PER_PAGE, (p + 1) * CARDS_PER_PAGE), page: p, pages }
}

/** A card in the Thú cưng tab: one of the shop's pets, or a breed to buy. */
export type PetEntry = { pet: Pet } | { breed: BreedId }

/** One page of the Thú cưng tab: the shop's pets in adoption order, then every breed; turning past either end comes round to the other. */
export function petPage(owned: Pet[], page: number): { entries: PetEntry[]; page: number; pages: number } {
  const all: PetEntry[] = [...owned.map(pet => ({ pet })), ...BREED_IDS.map(breed => ({ breed }))]
  const pages = Math.ceil(all.length / CARDS_PER_PAGE)
  const p = ((page % pages) + pages) % pages
  return { entries: all.slice(p * CARDS_PER_PAGE, (p + 1) * CARDS_PER_PAGE), page: p, pages }
}
