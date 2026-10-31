import { CERTIFICATE_BEAUTY, KEEPSAKE_BEAUTY, MERIT_BEAUTY, TROPHY_BEAUTY } from '../config'
import type { StringKey } from '../strings/vi'
import { SHOP_LAYOUT } from './layout'
import type { Facing, Tile, Vec } from './types'

export type ItemKind =
  | 'bed' | 'maskBed' | 'massageBed' | 'steamTent' | 'stoneBed' | 'mudTub' | 'scrubBed' | 'footChair' | 'nailDesk' | 'bench' | 'plant' | 'tea' | 'planter' | 'slippers' | 'screen' | 'desk'
  | 'shelf' | 'cabinet' | 'lotus' | 'vase' | 'teaChest' | 'jar'
  | 'bambooBench' | 'bambooTea' | 'bambooShelf' | 'bambooLamp' | 'clayJar' | 'areca'
  | 'vyPainting' | 'silkScreen' | 'regularsBoard'
  | 'photoSinger' | 'photoMiss' | 'photoStar' | 'photoChef' | 'goldBoard'
  | 'photoIdolSontung' | 'photoIdolTaylor' | 'photoIdolGd' | 'photoIdolJennie' | 'photoIdolHieuthuhai' | 'photoIdolWeeknd' | 'photoIdolTaeyang' | 'photoIdolBieber' | 'photoIdolDaesung' | 'starWall'
  | 'maiBranch' | 'heartFrame' | 'roseVase' | 'starLantern' | 'flowerBasket' | 'xmasTree'
  | 'certificate' | 'trophy' | 'merit' | 'surfboard' | 'lanternString' | 'orchid'
  | 'waterfall' | 'bonsai' | 'stoneLamp' | 'inkBamboo' | 'candleShelf' | 'sedgeRug'
  | 'gramophone' | 'standFan' | 'sewingMachine' | 'pendulumClock' | 'birdCage' | 'redRug'
  | 'fishTank' | 'bougainvillea' | 'sunflowerVase' | 'fernBasket' | 'succulentShelf' | 'grassRug'
  | 'lacquerPainting' | 'rattanMirror' | 'wallLantern' | 'conicalHat' | 'runnerRug' | 'roundRug' | 'brocadeRug'

export type ItemGroup = 'bed' | 'seat' | 'decor'
export type SetId = 'saigon' | 'bamboo' | 'zen' | 'retro' | 'garden'
export const SET_IDS: SetId[] = ['saigon', 'bamboo', 'zen', 'retro', 'garden']
/** Where a decor piece goes: hung on the back wall's lower row, or laid flat under everything on the floor. */
export type Layer = 'floor' | 'wall' | 'rug'

export interface ItemSpec {
  w: number
  h: number
  price: number
  beauty: number
  group: ItemGroup
  set?: SetId
  /** A wall piece or a rug; any other piece stands on the floor. */
  layer?: 'wall' | 'rug'
  name: StringKey
  /** Given by a regular, never sold in the catalogue. */
  giftOnly?: true
}

export const ITEMS: Record<ItemKind, ItemSpec> = {
  bed: { w: 1, h: 3, price: 450000, beauty: 0, group: 'bed', name: 'itemBed' },
  maskBed: { w: 1, h: 3, price: 525000, beauty: 0, group: 'bed', name: 'itemMaskBed' },
  massageBed: { w: 1, h: 3, price: 675000, beauty: 0, group: 'bed', name: 'itemMassageBed' },
  steamTent: { w: 2, h: 2, price: 750000, beauty: 0, group: 'bed', name: 'itemSteamTent' },
  stoneBed: { w: 1, h: 3, price: 825000, beauty: 0, group: 'bed', name: 'itemStoneBed' },
  mudTub: { w: 2, h: 3, price: 1050000, beauty: 0, group: 'bed', name: 'itemMudTub' },
  scrubBed: { w: 1, h: 3, price: 900_000, beauty: 0, group: 'bed', name: 'itemScrubBed' },
  footChair: { w: 1, h: 2, price: 975_000, beauty: 0, group: 'bed', name: 'itemFootChair' },
  nailDesk: { w: 2, h: 2, price: 1_125_000, beauty: 0, group: 'bed', name: 'itemNailDesk' },
  bench: { w: 3, h: 1, price: 225000, beauty: 1, group: 'seat', name: 'itemBench' },
  plant: { w: 1, h: 1, price: 60000, beauty: 1, group: 'decor', name: 'itemPlant' },
  tea: { w: 2, h: 1, price: 90000, beauty: 2, group: 'decor', name: 'itemTea' },
  planter: { w: 3, h: 1, price: 90000, beauty: 2, group: 'decor', name: 'itemPlanter' },
  slippers: { w: 2, h: 1, price: 75000, beauty: 1, group: 'decor', name: 'itemSlippers' },
  screen: { w: 5, h: 1, price: 300_000, beauty: 0, group: 'decor', name: 'itemScreen' },
  desk: { w: 3, h: 1, price: 600_000, beauty: 0, group: 'decor', name: 'itemDesk' },
  shelf: { w: 3, h: 1, price: 180000, beauty: 3, group: 'decor', set: 'saigon', name: 'itemShelf' },
  cabinet: { w: 3, h: 1, price: 225000, beauty: 3, group: 'decor', set: 'saigon', name: 'itemCabinet' },
  lotus: { w: 2, h: 1, price: 225000, beauty: 4, group: 'decor', set: 'saigon', name: 'itemLotus' },
  vase: { w: 1, h: 1, price: 120000, beauty: 2, group: 'decor', set: 'saigon', name: 'itemVase' },
  teaChest: { w: 3, h: 1, price: 375000, beauty: 5, group: 'decor', set: 'saigon', name: 'itemTeaChest' },
  jar: { w: 1, h: 1, price: 180000, beauty: 3, group: 'decor', set: 'saigon', name: 'itemJar' },
  bambooBench: { w: 3, h: 1, price: 270000, beauty: 3, group: 'seat', set: 'bamboo', name: 'itemBambooBench' },
  bambooTea: { w: 2, h: 1, price: 105000, beauty: 2, group: 'decor', set: 'bamboo', name: 'itemBambooTea' },
  bambooShelf: { w: 2, h: 1, price: 150000, beauty: 3, group: 'decor', set: 'bamboo', name: 'itemBambooShelf' },
  bambooLamp: { w: 1, h: 1, price: 90000, beauty: 2, group: 'decor', set: 'bamboo', name: 'itemBambooLamp' },
  clayJar: { w: 1, h: 1, price: 135000, beauty: 3, group: 'decor', set: 'bamboo', name: 'itemClayJar' },
  areca: { w: 1, h: 1, price: 120000, beauty: 3, group: 'decor', set: 'bamboo', name: 'itemAreca' },
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
  waterfall: { w: 2, h: 1, price: 330_000, beauty: 5, group: 'decor', set: 'zen', name: 'itemWaterfall' },
  bonsai: { w: 1, h: 1, price: 195_000, beauty: 3, group: 'decor', set: 'zen', name: 'itemBonsai' },
  stoneLamp: { w: 1, h: 1, price: 135_000, beauty: 2, group: 'decor', set: 'zen', name: 'itemStoneLamp' },
  inkBamboo: { w: 2, h: 1, price: 240_000, beauty: 4, group: 'decor', set: 'zen', layer: 'wall', name: 'itemInkBamboo' },
  candleShelf: { w: 1, h: 1, price: 120_000, beauty: 2, group: 'decor', set: 'zen', layer: 'wall', name: 'itemCandleShelf' },
  sedgeRug: { w: 2, h: 2, price: 225_000, beauty: 3, group: 'decor', set: 'zen', layer: 'rug', name: 'itemSedgeRug' },
  gramophone: { w: 1, h: 1, price: 270_000, beauty: 4, group: 'decor', set: 'retro', name: 'itemGramophone' },
  standFan: { w: 1, h: 1, price: 120_000, beauty: 2, group: 'decor', set: 'retro', name: 'itemStandFan' },
  sewingMachine: { w: 2, h: 1, price: 240_000, beauty: 3, group: 'decor', set: 'retro', name: 'itemSewingMachine' },
  pendulumClock: { w: 1, h: 1, price: 225_000, beauty: 4, group: 'decor', set: 'retro', layer: 'wall', name: 'itemPendulumClock' },
  birdCage: { w: 1, h: 1, price: 150_000, beauty: 3, group: 'decor', set: 'retro', layer: 'wall', name: 'itemBirdCage' },
  redRug: { w: 3, h: 2, price: 330_000, beauty: 4, group: 'decor', set: 'retro', layer: 'rug', name: 'itemRedRug' },
  fishTank: { w: 2, h: 1, price: 375_000, beauty: 5, group: 'decor', set: 'garden', name: 'itemFishTank' },
  bougainvillea: { w: 1, h: 1, price: 135_000, beauty: 2, group: 'decor', set: 'garden', name: 'itemBougainvillea' },
  sunflowerVase: { w: 1, h: 1, price: 120_000, beauty: 2, group: 'decor', set: 'garden', name: 'itemSunflowerVase' },
  fernBasket: { w: 1, h: 1, price: 105_000, beauty: 2, group: 'decor', set: 'garden', layer: 'wall', name: 'itemFernBasket' },
  succulentShelf: { w: 2, h: 1, price: 180_000, beauty: 3, group: 'decor', set: 'garden', layer: 'wall', name: 'itemSucculentShelf' },
  grassRug: { w: 2, h: 2, price: 210_000, beauty: 3, group: 'decor', set: 'garden', layer: 'rug', name: 'itemGrassRug' },
  lacquerPainting: { w: 2, h: 1, price: 300_000, beauty: 5, group: 'decor', layer: 'wall', name: 'itemLacquerPainting' },
  rattanMirror: { w: 1, h: 1, price: 135_000, beauty: 2, group: 'decor', layer: 'wall', name: 'itemRattanMirror' },
  wallLantern: { w: 1, h: 1, price: 90_000, beauty: 1, group: 'decor', layer: 'wall', name: 'itemWallLantern' },
  conicalHat: { w: 1, h: 1, price: 75_000, beauty: 1, group: 'decor', layer: 'wall', name: 'itemConicalHat' },
  runnerRug: { w: 1, h: 3, price: 135_000, beauty: 2, group: 'decor', layer: 'rug', name: 'itemRunnerRug' },
  roundRug: { w: 2, h: 2, price: 165_000, beauty: 2, group: 'decor', layer: 'rug', name: 'itemRoundRug' },
  brocadeRug: { w: 2, h: 3, price: 270_000, beauty: 4, group: 'decor', layer: 'rug', name: 'itemBrocadeRug' },
}

export const ITEM_KINDS = Object.keys(ITEMS) as ItemKind[]

export function layerOf(kind: ItemKind): Layer {
  return ITEMS[kind].layer ?? 'floor'
}

export interface Item {
  id: number
  kind: ItemKind
  /** Top-left tile of the footprint; a bed's head. */
  x: number
  y: number
  flip: boolean
  /** Received as a regular's gift: placed once, movable, never sold. */
  gift?: boolean
  /** Turned a quarter: a long piece stands on its side, a bed lies across the floor; its footprint is h × w. Saved only when true. */
  turned?: boolean
}

/** The footprint's width and height, swapped when the piece is turned. */
export function size(item: { kind: ItemKind; turned?: boolean }): { w: number; h: number } {
  const { w, h } = ITEMS[item.kind]
  return item.turned ? { w: h, h: w } : { w, h }
}

/** Whether a piece has a side to stand on: any bed, which then lies across the floor, or any piece that is not square; a wall piece never turns. */
export function canTurn(kind: ItemKind): boolean {
  const { w, h, group } = ITEMS[kind]
  if (layerOf(kind) === 'wall') return false
  return group === 'bed' || w !== h
}

/** The next facing, a new item: turned about its middle tile, then back with `flip` toggled; a piece that cannot turn only mirrors. */
export function nextFacing(item: Item): Item {
  if (!canTurn(item.kind)) return { ...item, flip: !item.flip }
  const { w, h } = size(item)
  const next: Item = { ...item, flip: item.turned ? !item.flip : item.flip, turned: !item.turned }
  const { w: nw, h: nh } = size(next)
  next.x = item.x + Math.floor(w / 2) - Math.floor(nw / 2)
  next.y = item.y + Math.floor(h / 2) - Math.floor(nh / 2)
  if (!next.turned) delete next.turned
  return next
}

export function footprint(item: Item): Tile[] {
  const { w, h } = size(item)
  const tiles: Tile[] = []
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) tiles.push({ x: item.x + dx, y: item.y + dy })
  return tiles
}

/** Where the owner stands to serve a bed, beside its second row, or behind a turned bed's customer; only beds of any service have one. */
export function workTile(item: Item): Tile | null {
  if (ITEMS[item.kind].group !== 'bed') return null
  if (item.turned) {
    const { x, y } = bedTile(item)
    return { x, y: y - 1 }
  }
  return { x: item.flip ? item.x - 1 : item.x + ITEMS[item.kind].w, y: item.y + 1 }
}

/** Where a bed's customer lies: on its second row, on the side next to the work tile; on a turned bed, on its top row, second from the head. Beds only. */
export function bedTile(item: Item): Tile {
  if (item.turned) return { x: item.flip ? item.x + size(item).w - 2 : item.x + 1, y: item.y }
  return { x: item.flip ? item.x : item.x + ITEMS[item.kind].w - 1, y: item.y + 1 }
}

/** The way a bed's head points: up the floor, or left across it when turned, right when flipped. */
export function headSide(item: Item): Vec {
  if (!item.turned) return { x: 0, y: -1 }
  return { x: item.flip ? 1 : -1, y: 0 }
}

/** The footprint's centre minus the customer tile's centre, in tiles. */
export function bedCentreOffset(item: Item): Vec {
  const { w, h } = size(item)
  const bed = bedTile(item)
  return { x: item.x + w / 2 - (bed.x + 0.5), y: item.y + h / 2 - (bed.y + 0.5) }
}

/** The way the owner faces a customer from the work tile: down at a turned bed, else across to it. */
export function workFacing(s: { bed: Tile; work: Tile }): Facing {
  if (s.work.y < s.bed.y) return 'down'
  return s.bed.x < s.work.x ? 'left' : 'right'
}

/** A piece stood on its side, drawn upright; a turned bed or rug lies across the floor instead. */
export function isUpright(item: Item): boolean {
  return item.turned === true && ITEMS[item.kind].group !== 'bed' && layerOf(item.kind) !== 'rug'
}

/** Where the owner stands behind a desk, beside its end away from the customers; only a desk has one. A turned desk faces right, or left when flipped. */
export function deskSpot(item: Item): Tile | null {
  if (item.kind !== 'desk') return null
  if (!item.turned) return { x: item.x + 1, y: item.y - 1 }
  return { x: item.flip ? item.x + 1 : item.x - 1, y: item.y + 1 }
}

/** The way a customer sits on a seat piece: down at its front, or right (left when flipped) once it stands upright. */
export function seatFacing(item: Item): Facing {
  return item.turned ? (item.flip ? 'left' : 'right') : 'down'
}

export function seatTiles(item: Item): Tile[] {
  return ITEMS[item.kind].group === 'seat' ? footprint(item) : []
}

/** Layout characters that stand for a movable item, besides the bed chars. */
const RUN_KINDS: Record<string, ItemKind> = {
  S: 'bench', P: 'plant', K: 'cabinet', L: 'shelf', O: 'lotus', V: 'vase', T: 'tea', G: 'slippers', Y: 'planter', H: 'screen', R: 'desk',
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
  // the screens and the desk come last, so the pieces that were always furniture keep their ids
  const fixed = (it: Omit<Item, 'id'>) => it.kind === 'screen' || it.kind === 'desk'
  return [...items.filter(it => !fixed(it)), ...items.filter(fixed)].map((it, i) => ({ ...it, id: i + 1 }))
}

/** How many of a set's 6 kinds the shop holds. */
export function setProgress(items: Item[], set: SetId): number {
  return new Set(items.filter(i => ITEMS[i.kind].set === set).map(i => i.kind)).size
}

/** Sum of every item's beauty; items of a complete set count half again. */
export function beautyOf(items: Item[]): number {
  const full = new Set<SetId>()
  for (const set of SET_IDS) if (setProgress(items, set) === 6) full.add(set)
  return items.reduce((sum, i) => {
    const { beauty, set } = ITEMS[i.kind]
    return sum + (set && full.has(set) ? beauty * 1.5 : beauty)
  }, 0)
}

/** The layout with every item char blanked out, leaving walls, door and stairs. */
export function shellOf(rows: string[]): string[] {
  return rows.map(r => [...r].map(ch => (ITEM_CHARS.has(ch) ? '.' : ch)).join(''))
}

export const DEFAULT_ITEMS: Item[] = itemsFromLayout(SHOP_LAYOUT)

/** The empty bed slots of the default shop, as bed top-left tiles. */
export const BED_SLOTS: Tile[] = [...SHOP_LAYOUT.flatMap((r, y) => [...r].flatMap((ch, x) => (ch === 'E' ? [{ x, y }] : [])))]
