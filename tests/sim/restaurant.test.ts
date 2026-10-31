import { describe, expect, it } from 'vitest'
import { DINING_START, diningSeats } from '../../src/sim/dining'
import { tileEq } from '../../src/sim/grid'
import { ITEMS, type ItemKind } from '../../src/sim/items'
import { findPath } from '../../src/sim/path'
import { restaurantFor, starShop } from './helpers'

const setup = () => {
  const main = starShop(3, 10_000_000)
  return { main, r: restaurantFor(main) }
}
const count = (r: ReturnType<typeof setup>['r'], kind: ItemKind) => r.items.filter(i => i.kind === kind).length

describe('the restaurant room', () => {
  it('opens with two stoves, two tables, eight chairs and the serving counter', () => {
    const { r } = setup()
    expect(count(r, 'stove')).toBe(2)
    expect(count(r, 'diningTable')).toBe(2)
    expect(count(r, 'diningChair')).toBe(8)
    expect(count(r, 'servingCounter')).toBe(2)
    expect(diningSeats(r.items)).toHaveLength(8)
    expect(r.grid.door).toEqual({ x: 18, y: 17 })
    expect(r.grid.works).toContainEqual({ x: 15, y: 3 })
    expect(r.grid.works).toContainEqual({ x: 18, y: 3 })
  })

  it('lays every start piece where the build rules allow it', () => {
    const { r } = setup()
    expect(r.items).toHaveLength(DINING_START.length)
    for (const item of r.items) expect(r.canPlace(item.kind, item.x, item.y, item.flip, item.id), item.kind).toBeNull()
  })

  it('walks from the door to every chair and every stove', () => {
    const { r } = setup()
    for (const seat of diningSeats(r.items)) expect(findPath(r.grid, r.grid.door, t => tileEq(t, seat.tile)), JSON.stringify(seat.tile)).not.toBeNull()
    for (const work of r.grid.works) expect(findPath(r.grid, r.grid.door, t => tileEq(t, work)), JSON.stringify(work)).not.toBeNull()
  })

  it('seats a diner only on a chair that touches a table', () => {
    const { r } = setup()
    expect(r.buy('diningChair', 14, 12, false)).toBeNull()
    expect(diningSeats(r.items)).toHaveLength(8)
    expect(r.buy('diningTable', 14, 13, false)).toBeNull()
    const seats = diningSeats(r.items)
    expect(seats).toHaveLength(9)
    expect(seats.find(s => tileEq(s.tile, { x: 14, y: 12 }))?.facing).toBe('down')
  })

  it('buys and sells from the shared purse', () => {
    const { main, r } = setup()
    const before = main.money
    expect(r.money).toBe(before)
    expect(r.buy('stove', 21, 3, false)).toBeNull()
    expect(main.money).toBe(before - 400_000)
    const id = r.items[r.items.length - 1].id
    expect(r.sell(id)).toBeNull()
    expect(main.money).toBe(before - 400_000 + Math.floor(ITEMS.stove.price / 2))
    expect(r.items.some(i => i.id === id)).toBe(false)
  })

  it('refuses a purchase the purse cannot pay and a spot that is taken', () => {
    const main = starShop(3, 100_000)
    const r = restaurantFor(main)
    expect(r.buy('stove', 21, 3, false)).toBe('money')
    main.money = 10_000_000
    expect(r.buy('stove', 15, 2, false)).toBe('overlap')
    expect(main.money).toBe(10_000_000)
  })

  it('refuses spa pieces in the restaurant', () => {
    const { r } = setup()
    expect(r.canPlace('bed', 14, 12, false)).toBe('wrongShop')
    expect(r.canPlace('bench', 14, 12, false)).toBe('wrongShop')
    expect(r.canPlace('plant', 14, 12, false)).toBeNull()
  })

  it('refuses to sell the last stove, table or chair', () => {
    const { r } = setup()
    const ids = (kind: ItemKind) => r.items.filter(i => i.kind === kind).map(i => i.id)
    expect(r.sell(ids('stove')[0])).toBeNull()
    expect(r.sell(ids('diningTable')[0])).toBeNull()
    for (let n = 0; n < 7; n++) expect(r.sell(ids('diningChair')[0])).toBeNull()
    for (const kind of ['stove', 'diningTable', 'diningChair'] as const) expect(r.sell(ids(kind)[0]), kind).toBe('lastDining')
    expect(count(r, 'stove')).toBe(1)
    const stove = r.items.find(i => i.kind === 'stove')!
    expect(r.move(stove.id, 21, 3, false)).toBeNull()
    expect(r.items.find(i => i.id === stove.id)).toMatchObject({ x: 21, y: 3 })
  })

  it('tells the view the room changed, and counts beauty from its pieces', () => {
    const { r } = setup()
    expect(r.drainEvents()).toEqual([])
    r.buy('plant', 14, 12, false)
    expect(r.drainEvents()).toEqual([{ type: 'roomChanged' }])
    expect(r.drainEvents()).toEqual([])
    expect(r.beauty()).toBeGreaterThan(0)
    expect(r.isBusy(r.items[0].id)).toBe(false)
  })
})
