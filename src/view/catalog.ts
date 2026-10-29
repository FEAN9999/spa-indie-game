import { ITEM_KINDS, ITEMS, type ItemGroup, type ItemKind } from '../sim/items'
import { BREED_IDS, type BreedId, type Pet } from '../sim/pets'
import { serviceOfBed, type ServiceId } from '../sim/services'

/** Build mode shows this many item cards at a time. */
const CARDS_PER_PAGE = 4

/** A card in the catalogue: a kind to buy, or a regular's gift waiting to be put down. */
export interface CatalogEntry {
  kind: ItemKind
  gift: boolean
}

/**
 * One page of a tab's cards in catalogue order, a bed only once its service is open; turning past either end comes round to the other.
 * A tab starts with one card per waiting gift of its group, oldest first; the gift-only kinds are never for sale.
 */
export function catalogPage(group: ItemGroup, page: number, open: ServiceId[], gifts: ItemKind[]): { entries: CatalogEntry[]; page: number; pages: number } {
  const forSale = ITEM_KINDS.filter(k => ITEMS[k].group === group && !ITEMS[k].giftOnly && (group !== 'bed' || open.includes(serviceOfBed(k)!)))
  const all = [...gifts.filter(k => ITEMS[k].group === group).map(kind => ({ kind, gift: true })), ...forSale.map(kind => ({ kind, gift: false }))]
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
