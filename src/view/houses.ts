import { BRANCH_HOUSE_LOOK } from '../art/branchHouses'
import { HOUSE_LOOK, houseKey } from '../art/houses'
import { HOUSE_COLS, MAP_X, SHOP_X0, TILE } from '../config'
import type { House, Houses, Side } from '../sim/layout'
import type { PlaceId } from '../sim/places'
import { MAP_VIEW, type Rect } from './camera'

/** One house on the position strip: its world x and width, and its wall colour once bought, or null while it is for sale. */
export interface StripLot {
  x: number
  w: number
  fill: string | null
}

/** The grid column a house's own six columns start at: the far side of the old shop's wall, outward. */
const firstCol = (h: House): number => (h.side === 'left' ? SHOP_X0 - h.n * HOUSE_COLS : SHOP_X0 + 13 + (h.n - 1) * HOUSE_COLS)

/** The world rect of a house's own six columns, the full height of the map. */
export const houseRect = (h: House): Rect => ({ x: MAP_X + firstCol(h) * TILE, y: MAP_VIEW.y, w: HOUSE_COLS * TILE, h: MAP_VIEW.h })

/** The left edge of a bought house's image, which starts on the middle of the old wall column: half a tile in on the right, flush on the left. */
export const houseImageX = (h: House): number => houseRect(h).x - (h.side === 'right' ? TILE / 2 : 0)

/** Each side's houses from the shop outward, from `from` + 1 up to `to`. */
export const housesBetween = (from: Houses, to: Houses): House[] =>
  (['left', 'right'] as Side[]).flatMap(side => {
    const out: House[] = []
    for (let n = from[side] + 1; n <= to[side]; n++) out.push({ side, n: n as 1 | 2 })
    return out
  })

/** The houses the map shows for sale: those shown but not bought. */
export const forSale = (bought: Houses, shown: Houses): House[] => housesBetween(bought, shown)

/** The house for sale under world x, or null. */
export const saleAt = (bought: Houses, shown: Houses, worldX: number): House | null =>
  forSale(bought, shown).find(h => {
    const r = houseRect(h)
    return worldX >= r.x && worldX < r.x + r.w
  }) ?? null

/** The floor in tiles with `h` bought, right and bottom exclusive; a bench's mat is cut off at its edges. */
export const innerFloor = (h: Houses): { left: number; top: number; right: number; bottom: number } => ({
  left: SHOP_X0 + 1 - h.left * HOUSE_COLS,
  top: 2,
  right: SHOP_X0 + 12 + h.right * HOUSE_COLS,
  bottom: 17,
})

/** A bought house's texture on `floor`: the main shop's (place null) by floor, a branch's by its place. */
export const houseTextureKey = (place: PlaceId | null, h: House, floor: number): string =>
  place ? `house-${place}-${houseKey(h)}` : `house-${houseKey(h)}-${floor}`

/** A house for sale's roof: the main shop's (place null) by house, a branch's one for the place. */
export const saleTextureKey = (place: PlaceId | null, h: House): string => (place ? `sale-${place}` : `sale-${houseKey(h)}`)

/** A bought house's colour: the main shop's wall, or a branch's wall, board band or trim. */
export const houseColor = (place: PlaceId | null, h: House): string => (place ? BRANCH_HOUSE_LOOK[place].colors[houseKey(h)] : HOUSE_LOOK[houseKey(h)].wall)

/** Every house the strip shows: bought ones in their colour at `place` (null for the main shop), the ones for sale empty. */
export const stripLots = (bought: Houses, shown: Houses, place: PlaceId | null = null): StripLot[] =>
  housesBetween({ left: 0, right: 0 }, shown).map(h => {
    const r = houseRect(h)
    return { x: r.x, w: r.w, fill: h.n <= bought[h.side] ? houseColor(place, h) : null }
  })
