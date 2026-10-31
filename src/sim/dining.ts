import { ITEMS, type ItemKind } from './items'

/** The restaurant's bare room, 13 columns like the old spa shop, its stairs in the same place; widen() puts it on the wide grid. */
export const DINING_SHELL: string[] = [
  '#############',
  '#############',
  ...Array.from({ length: 5 }, () => '#...........#'),
  ...Array.from({ length: 3 }, () => '#..........U#'),
  ...Array.from({ length: 7 }, () => '#...........#'),
  '######D######',
]

export type ShopSide = 'spa' | 'restaurant'

/** Whether a piece may stand in `shop`: beds, waiting seats and the reception desk are the spa's, the dining pieces and the restaurant's decor its own; the rest is shared. */
export function placeableIn(kind: ItemKind, shop: ShopSide): boolean {
  const { group, shop: only } = ITEMS[kind]
  if (shop === 'restaurant') return group !== 'bed' && group !== 'seat' && kind !== 'desk'
  return only !== 'restaurant'
}
