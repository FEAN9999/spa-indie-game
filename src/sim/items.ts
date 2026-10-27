import type { StringKey } from '../strings/vi'
import { SPA_LAYOUT_1A } from './layout'
import type { Tile } from './types'

export type ItemKind =
  | 'bed' | 'maskBed' | 'massageBed' | 'bench' | 'plant' | 'tea' | 'planter' | 'slippers'
  | 'shelf' | 'cabinet' | 'lotus' | 'vase' | 'teaChest' | 'jar'
  | 'bambooBench' | 'bambooTea' | 'bambooShelf' | 'bambooLamp' | 'clayJar' | 'areca'
  | 'vyPainting' | 'silkScreen' | 'regularsBoard'

export type ItemGroup = 'bed' | 'seat' | 'decor'
export type SetId = 'saigon' | 'bamboo'

export interface ItemSpec {
  w: number
  h: number
  price: number
  beauty: number
  group: ItemGroup
  set?: SetId
  name: StringKey
  /** Given by a regular, never sold in the catalogue. */
  giftOnly?: true
}

export const ITEMS: Record<ItemKind, ItemSpec> = {
  bed: { w: 1, h: 3, price: 300000, beauty: 0, group: 'bed', name: 'itemBed' },
  maskBed: { w: 1, h: 3, price: 350000, beauty: 0, group: 'bed', name: 'itemMaskBed' },
  massageBed: { w: 1, h: 3, price: 450000, beauty: 0, group: 'bed', name: 'itemMassageBed' },
  bench: { w: 3, h: 1, price: 150000, beauty: 1, group: 'seat', name: 'itemBench' },
  plant: { w: 1, h: 1, price: 40000, beauty: 1, group: 'decor', name: 'itemPlant' },
  tea: { w: 2, h: 1, price: 60000, beauty: 2, group: 'decor', name: 'itemTea' },
  planter: { w: 3, h: 1, price: 60000, beauty: 2, group: 'decor', name: 'itemPlanter' },
  slippers: { w: 2, h: 1, price: 50000, beauty: 1, group: 'decor', name: 'itemSlippers' },
  shelf: { w: 3, h: 1, price: 120000, beauty: 3, group: 'decor', set: 'saigon', name: 'itemShelf' },
  cabinet: { w: 3, h: 1, price: 150000, beauty: 3, group: 'decor', set: 'saigon', name: 'itemCabinet' },
  lotus: { w: 2, h: 1, price: 150000, beauty: 4, group: 'decor', set: 'saigon', name: 'itemLotus' },
  vase: { w: 1, h: 1, price: 80000, beauty: 2, group: 'decor', set: 'saigon', name: 'itemVase' },
  teaChest: { w: 3, h: 1, price: 250000, beauty: 5, group: 'decor', set: 'saigon', name: 'itemTeaChest' },
  jar: { w: 1, h: 1, price: 120000, beauty: 3, group: 'decor', set: 'saigon', name: 'itemJar' },
  bambooBench: { w: 3, h: 1, price: 180000, beauty: 3, group: 'seat', set: 'bamboo', name: 'itemBambooBench' },
  bambooTea: { w: 2, h: 1, price: 70000, beauty: 2, group: 'decor', set: 'bamboo', name: 'itemBambooTea' },
  bambooShelf: { w: 2, h: 1, price: 100000, beauty: 3, group: 'decor', set: 'bamboo', name: 'itemBambooShelf' },
  bambooLamp: { w: 1, h: 1, price: 60000, beauty: 2, group: 'decor', set: 'bamboo', name: 'itemBambooLamp' },
  clayJar: { w: 1, h: 1, price: 90000, beauty: 3, group: 'decor', set: 'bamboo', name: 'itemClayJar' },
  areca: { w: 1, h: 1, price: 80000, beauty: 3, group: 'decor', set: 'bamboo', name: 'itemAreca' },
  vyPainting: { w: 1, h: 1, price: 0, beauty: 4, group: 'decor', giftOnly: true, name: 'itemVyPainting' },
  silkScreen: { w: 2, h: 1, price: 0, beauty: 5, group: 'decor', giftOnly: true, name: 'itemSilkScreen' },
  regularsBoard: { w: 2, h: 1, price: 0, beauty: 6, group: 'decor', giftOnly: true, name: 'itemRegularsBoard' },
}

export const ITEM_KINDS = Object.keys(ITEMS) as ItemKind[]

export interface Item {
  id: number
  kind: ItemKind
  /** Top-left tile of the footprint; a bed's head. */
  x: number
  y: number
  flip: boolean
}

export function footprint(item: Item): Tile[] {
  const { w, h } = ITEMS[item.kind]
  const tiles: Tile[] = []
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) tiles.push({ x: item.x + dx, y: item.y + dy })
  return tiles
}

/** Where the owner stands to serve a bed; only beds of any service have one. */
export function workTile(item: Item): Tile | null {
  if (ITEMS[item.kind].group !== 'bed') return null
  return { x: item.flip ? item.x - 1 : item.x + 1, y: item.y + 1 }
}

export function seatTiles(item: Item): Tile[] {
  return ITEMS[item.kind].group === 'seat' ? footprint(item) : []
}

/** Layout characters that stand for a movable item, besides the bed chars. */
const RUN_KINDS: Record<string, ItemKind> = {
  S: 'bench', P: 'plant', K: 'cabinet', L: 'shelf', O: 'lotus', V: 'vase', T: 'tea', G: 'slippers', Y: 'planter',
}
const ITEM_CHARS = new Set(['B', 'C', 'W', 'E', ...Object.keys(RUN_KINDS)])

export function itemsFromLayout(rows: string[]): Item[] {
  const items: Omit<Item, 'id'>[] = []
  const used = new Set<string>()
  const key = (x: number, y: number) => `${x},${y}`
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (used.has(key(x, y))) continue
      const ch = row[x]
      if (ch === 'B' && rows[y + 1]?.[x] === 'C' && rows[y + 2]?.[x] === 'B') {
        const onRight = rows[y + 1][x + 1] === 'W'
        if (!onRight && rows[y + 1][x - 1] !== 'W') throw new Error(`Bed at ${x},${y + 1} has no work tile on its right`)
        const flip = !onRight
        items.push({ kind: 'bed', x, y, flip })
        for (let dy = 0; dy < 3; dy++) used.add(key(x, y + dy))
        used.add(key(flip ? x - 1 : x + 1, y + 1))
        continue
      }
      const kind = RUN_KINDS[ch]
      if (!kind) continue
      const w = ITEMS[kind].w
      let end = x
      while (row[end + 1] === ch) end++
      for (let left = x; left <= end; left += w) {
        items.push({ kind, x: left, y, flip: false })
        for (let dx = 0; dx < w; dx++) used.add(key(left + dx, y))
      }
    }
  })
  return items.map((it, i) => ({ ...it, id: i + 1 }))
}

/** How many of a set's 6 kinds the shop holds. */
export function setProgress(items: Item[], set: SetId): number {
  return new Set(items.filter(i => ITEMS[i.kind].set === set).map(i => i.kind)).size
}

/** Sum of every item's beauty; items of a complete set count half again. */
export function beautyOf(items: Item[]): number {
  const full = new Set<SetId>()
  for (const set of ['saigon', 'bamboo'] as const) if (setProgress(items, set) === 6) full.add(set)
  return items.reduce((sum, i) => {
    const { beauty, set } = ITEMS[i.kind]
    return sum + (set && full.has(set) ? beauty * 1.5 : beauty)
  }, 0)
}

/** The layout with every item char blanked out, leaving walls, door, screen and desk. */
export function shellOf(rows: string[]): string[] {
  return rows.map(r => [...r].map(ch => (ITEM_CHARS.has(ch) ? '.' : ch)).join(''))
}

export const DEFAULT_ITEMS: Item[] = itemsFromLayout(SPA_LAYOUT_1A)

/** The empty bed slots of the default shop, as bed top-left tiles. */
export const BED_SLOTS: Tile[] = [...SPA_LAYOUT_1A.flatMap((r, y) => [...r].flatMap((ch, x) => (ch === 'E' ? [{ x, y }] : [])))]
