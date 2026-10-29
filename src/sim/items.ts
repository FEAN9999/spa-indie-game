import { CERTIFICATE_BEAUTY, KEEPSAKE_BEAUTY, MERIT_BEAUTY, TROPHY_BEAUTY } from '../config'
import type { StringKey } from '../strings/vi'
import { SPA_LAYOUT_1A } from './layout'
import type { Tile } from './types'

export type ItemKind =
  | 'bed' | 'maskBed' | 'massageBed' | 'steamTent' | 'stoneBed' | 'mudTub' | 'scrubBed' | 'footChair' | 'bench' | 'plant' | 'tea' | 'planter' | 'slippers'
  | 'shelf' | 'cabinet' | 'lotus' | 'vase' | 'teaChest' | 'jar'
  | 'bambooBench' | 'bambooTea' | 'bambooShelf' | 'bambooLamp' | 'clayJar' | 'areca'
  | 'vyPainting' | 'silkScreen' | 'regularsBoard'
  | 'photoSinger' | 'photoMiss' | 'photoStar' | 'photoChef' | 'goldBoard'
  | 'photoIdolSontung' | 'photoIdolTaylor' | 'photoIdolGd' | 'photoIdolJennie' | 'photoIdolHieuthuhai' | 'photoIdolWeeknd' | 'photoIdolTaeyang' | 'photoIdolBieber' | 'photoIdolDaesung' | 'starWall'
  | 'maiBranch' | 'heartFrame' | 'roseVase' | 'starLantern' | 'flowerBasket' | 'xmasTree'
  | 'certificate' | 'trophy' | 'merit' | 'surfboard' | 'lanternString' | 'orchid'

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
  steamTent: { w: 2, h: 2, price: 500000, beauty: 0, group: 'bed', name: 'itemSteamTent' },
  stoneBed: { w: 1, h: 3, price: 550000, beauty: 0, group: 'bed', name: 'itemStoneBed' },
  mudTub: { w: 2, h: 3, price: 700000, beauty: 0, group: 'bed', name: 'itemMudTub' },
  scrubBed: { w: 1, h: 3, price: 600_000, beauty: 0, group: 'bed', name: 'itemScrubBed' },
  footChair: { w: 1, h: 2, price: 650_000, beauty: 0, group: 'bed', name: 'itemFootChair' },
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
  photoSinger: { w: 1, h: 1, price: 0, beauty: 4, group: 'decor', giftOnly: true, name: 'itemPhotoSinger' },
  photoMiss: { w: 1, h: 1, price: 0, beauty: 4, group: 'decor', giftOnly: true, name: 'itemPhotoMiss' },
  photoStar: { w: 1, h: 1, price: 0, beauty: 4, group: 'decor', giftOnly: true, name: 'itemPhotoStar' },
  photoChef: { w: 1, h: 1, price: 0, beauty: 4, group: 'decor', giftOnly: true, name: 'itemPhotoChef' },
  goldBoard: { w: 2, h: 1, price: 0, beauty: 7, group: 'decor', giftOnly: true, name: 'itemGoldBoard' },
  photoIdolSontung: { w: 1, h: 1, price: 0, beauty: 5, group: 'decor', giftOnly: true, name: 'itemPhotoIdolSontung' },
  photoIdolTaylor: { w: 1, h: 1, price: 0, beauty: 5, group: 'decor', giftOnly: true, name: 'itemPhotoIdolTaylor' },
  photoIdolGd: { w: 1, h: 1, price: 0, beauty: 5, group: 'decor', giftOnly: true, name: 'itemPhotoIdolGd' },
  photoIdolJennie: { w: 1, h: 1, price: 0, beauty: 5, group: 'decor', giftOnly: true, name: 'itemPhotoIdolJennie' },
  photoIdolHieuthuhai: { w: 1, h: 1, price: 0, beauty: 5, group: 'decor', giftOnly: true, name: 'itemPhotoIdolHieuthuhai' },
  photoIdolWeeknd: { w: 1, h: 1, price: 0, beauty: 5, group: 'decor', giftOnly: true, name: 'itemPhotoIdolWeeknd' },
  photoIdolTaeyang: { w: 1, h: 1, price: 0, beauty: 5, group: 'decor', giftOnly: true, name: 'itemPhotoIdolTaeyang' },
  photoIdolBieber: { w: 1, h: 1, price: 0, beauty: 5, group: 'decor', giftOnly: true, name: 'itemPhotoIdolBieber' },
  photoIdolDaesung: { w: 1, h: 1, price: 0, beauty: 5, group: 'decor', giftOnly: true, name: 'itemPhotoIdolDaesung' },
  starWall: { w: 2, h: 1, price: 0, beauty: 9, group: 'decor', giftOnly: true, name: 'itemStarWall' },
  maiBranch: { w: 1, h: 1, price: 0, beauty: KEEPSAKE_BEAUTY, group: 'decor', giftOnly: true, name: 'itemMaiBranch' },
  heartFrame: { w: 1, h: 1, price: 0, beauty: KEEPSAKE_BEAUTY, group: 'decor', giftOnly: true, name: 'itemHeartFrame' },
  roseVase: { w: 1, h: 1, price: 0, beauty: KEEPSAKE_BEAUTY, group: 'decor', giftOnly: true, name: 'itemRoseVase' },
  starLantern: { w: 1, h: 1, price: 0, beauty: KEEPSAKE_BEAUTY, group: 'decor', giftOnly: true, name: 'itemStarLantern' },
  flowerBasket: { w: 1, h: 1, price: 0, beauty: KEEPSAKE_BEAUTY, group: 'decor', giftOnly: true, name: 'itemFlowerBasket' },
  xmasTree: { w: 1, h: 1, price: 0, beauty: KEEPSAKE_BEAUTY, group: 'decor', giftOnly: true, name: 'itemXmasTree' },
  certificate: { w: 1, h: 1, price: 0, beauty: CERTIFICATE_BEAUTY, group: 'decor', giftOnly: true, name: 'itemCertificate' },
  trophy: { w: 1, h: 1, price: 0, beauty: TROPHY_BEAUTY, group: 'decor', giftOnly: true, name: 'itemTrophy' },
  merit: { w: 1, h: 1, price: 0, beauty: MERIT_BEAUTY, group: 'decor', giftOnly: true, name: 'itemMerit' },
  surfboard: { w: 1, h: 1, price: 0, beauty: 3, group: 'decor', giftOnly: true, name: 'itemSurfboard' },
  lanternString: { w: 1, h: 1, price: 0, beauty: 3, group: 'decor', giftOnly: true, name: 'itemLanternString' },
  orchid: { w: 1, h: 1, price: 0, beauty: 3, group: 'decor', giftOnly: true, name: 'itemOrchid' },
}

export const ITEM_KINDS = Object.keys(ITEMS) as ItemKind[]

export interface Item {
  id: number
  kind: ItemKind
  /** Top-left tile of the footprint; a bed's head. */
  x: number
  y: number
  flip: boolean
  /** Received as a regular's gift: placed once, movable, never sold. */
  gift?: boolean
}

export function footprint(item: Item): Tile[] {
  const { w, h } = ITEMS[item.kind]
  const tiles: Tile[] = []
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) tiles.push({ x: item.x + dx, y: item.y + dy })
  return tiles
}

/** Where the owner stands to serve a bed, beside its second row; only beds of any service have one. */
export function workTile(item: Item): Tile | null {
  if (ITEMS[item.kind].group !== 'bed') return null
  return { x: item.flip ? item.x - 1 : item.x + ITEMS[item.kind].w, y: item.y + 1 }
}

/** Where a bed's customer lies: on its second row, on the side next to the work tile. Beds only. */
export function bedTile(item: Item): Tile {
  return { x: item.flip ? item.x : item.x + ITEMS[item.kind].w - 1, y: item.y + 1 }
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
