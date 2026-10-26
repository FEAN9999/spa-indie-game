import { ITEM_KINDS, ITEMS, type ItemGroup, type ItemKind } from '../sim/items'

/** Build mode shows this many item cards at a time. */
export const CARDS_PER_PAGE = 4

/** One page of a tab's kinds in catalogue order; turning past either end comes round to the other. */
export function catalogPage(group: ItemGroup, page: number): { kinds: ItemKind[]; page: number; pages: number } {
  const all = ITEM_KINDS.filter(k => ITEMS[k].group === group)
  const pages = Math.ceil(all.length / CARDS_PER_PAGE)
  const p = ((page % pages) + pages) % pages
  return { kinds: all.slice(p * CARDS_PER_PAGE, (p + 1) * CARDS_PER_PAGE), page: p, pages }
}
