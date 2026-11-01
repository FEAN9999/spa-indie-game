import { claimed, nearestSpot, placeProblem } from './build'
import { tileEq, type Grid } from './grid'
import { ITEMS, type Item, type ItemKind } from './items'
import { OLD_DECOR_TILE, PLACE_DECOR, type PlaceId } from './places'
import type { SaveData } from './save'

/** What clearing the stairs spot did: how many items went (what they refunded, and how many were gifts back in the guest book), the one the shop cannot do without and has no room for, and the customers sent home. */
export interface StairsNote {
  count: number
  refund: number
  gifts: number
  rebuy: ItemKind | null
  leavers: number[]
}

/**
 * An older shop's furniture may stand where the stairs now are: that spot, `shell`'s stairs and feet, is cleared in `d`.
 * The last shampoo bed or the last seat item is moved to the nearest place on floor 1 that takes it, or sold if nothing does;
 * anything else is sold at full price, or, for a gift, goes back to the guest book.
 * Customers who were on a touched item are set to leave; the caller sends them off.
 */
export function clearStairs(d: SaveData, shell: Grid): StairsNote {
  const spot = [...shell.stairs, ...shell.feet]
  const touched = d.items.filter(i => claimed(i).some(t => spot.some(s => tileEq(s, t)))).sort((a, b) => a.id - b.id)
  const note: StairsNote = { count: 0, refund: 0, gifts: 0, rebuy: null, leavers: [] }
  if (touched.length === 0) return note

  const touchedIds = new Set(touched.map(i => i.id))
  const classOf = (i: Item) => (i.kind === 'bed' ? 'bed' : ITEMS[i.kind].group === 'seat' ? 'seat' : null)
  const inside = { x: shell.door.x, y: shell.door.y - 1 }
  let kept = d.items.filter(i => !touchedIds.has(i.id))
  for (const item of touched) {
    const needed = classOf(item) !== null && !kept.some(i => classOf(i) === classOf(item))
    const fits = (t: { x: number; y: number }): Item | null =>
      [item.flip, !item.flip].map(flip => ({ ...item, x: t.x, y: t.y, flip })).find(c => placeProblem(shell, kept, c, { door: shell.door, floors: 1 }) === null) ?? null
    const spotFor = needed ? nearestSpot(shell, inside, t => fits(t) !== null) : null
    if (spotFor) {
      kept = [...kept, fits(spotFor)!]
      continue
    }
    note.count++
    if (item.gift) {
      d.book.gifts.push(item.kind)
      note.gifts++
    } else note.refund += ITEMS[item.kind].price
    if (needed) note.rebuy = item.kind
  }
  d.items = kept.sort((a, b) => a.id - b.id)
  d.money += note.refund

  const onTouched = (c: SaveData['customers'][number]) => (c.stationId !== null && touchedIds.has(c.stationId)) || (c.seat !== null && touched.some(i => ITEMS[i.kind].group === 'seat' && claimed(i).some(t => tileEq(t, c.seat!))))
  for (const c of d.customers.filter(onTouched)) {
    Object.assign(c, { stationId: null, seat: null, state: 'leaving' })
    note.leavers.push(c.id)
  }
  if (d.servingCustomerId !== null && note.leavers.includes(d.servingCustomerId)) d.servingCustomerId = null
  const task = d.owner.task
  if (task && note.leavers.includes(task.customerId)) d.owner.task = null
  return note
}

/**
 * A branch saved before its stairs has its place's piece where their foot now is: in `d`, it moves to the piece's new tile on `shell` when it can
 * stand there, and is otherwise left where it is for clearStairs to send back to the guest book.
 */
export function moveOldDecor(d: SaveData, place: PlaceId, shell: Grid): void {
  const { kind, x, y } = PLACE_DECOR[place]
  const piece = d.items.find(i => i.gift && i.kind === kind && i.x === OLD_DECOR_TILE.x && i.y === OLD_DECOR_TILE.y)
  if (!piece) return
  const others = d.items.filter(i => i !== piece)
  if (placeProblem(shell, others, { ...piece, x, y }, { door: shell.door, floors: d.floors }) === null) Object.assign(piece, { x, y })
}
