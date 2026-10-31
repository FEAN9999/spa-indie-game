import { describe, expect, it } from 'vitest'
import { FLOOR_PRICE, FLOOR_ROWS, HOUSE_PRICE } from '../../src/config'
import { Chain } from '../../src/sim/chain'
import { floorOf } from '../../src/sim/floors'
import { RestaurantSim, type RestaurantEvent } from '../../src/sim/restaurant'
import { createRng } from '../../src/sim/rng'
import { starShop } from './helpers'

/** A chain on day 10 with the restaurant bought and plenty of money left. */
const owned = (money = 100_000_000) => {
  const chain = new Chain(starShop(3, 100_000_000, 7), 7)
  chain.main.day = 10
  expect(chain.buyRestaurant()).toBeNull()
  chain.main.money = money
  const r = chain.restaurant!
  r.drainEvents()
  return { chain, r }
}
const events = (r: RestaurantSim, type: RestaurantEvent['type']) => r.drainEvents().filter(e => e.type === type)
const isFloor = (r: RestaurantSim, x: number, y: number) => r.shellGrid().cells[y][x] === 'floor'

describe('the restaurant buys houses', () => {
  it('buys the near house before the far one on each side, at the spa\'s house prices', () => {
    const { r } = owned()
    expect(r.houseProblem('right')).toBeNull()
    expect(r.housePrice('right')).toBe(HOUSE_PRICE[0])
    expect(r.houseForSale('right')).toEqual({ side: 'right', n: 1 })
    const before = r.money
    expect(r.buyHouse('right')).toBeNull()
    expect(before - r.money).toBe(HOUSE_PRICE[0])
    expect(r.houses.right).toBe(1)
    expect(r.housePrice('right')).toBe(HOUSE_PRICE[1])
    expect(events(r, 'houseBought')).toEqual([{ type: 'houseBought', house: { side: 'right', n: 1 } }])
    expect(r.buyHouse('right')).toBeNull()
    expect(events(r, 'houseBought')).toEqual([{ type: 'houseBought', house: { side: 'right', n: 2 } }])
    expect(r.houseProblem('right')).toBe('max')
    expect(r.buyHouse('right')).toBe('max')
    expect(r.houseForSale('right')).toBeNull()
    expect(r.shownHouses()).toEqual({ left: 1, right: 2 })
    expect(r.drainEvents().filter(e => e.type === 'houseBought')).toEqual([])
  })

  it('refuses a house it cannot pay for and keeps the money', () => {
    const { r } = owned(HOUSE_PRICE[0] - 1)
    expect(r.houseProblem('left')).toBe('money')
    expect(r.houseForSale('left')).toEqual({ side: 'left', n: 1 })
    expect(r.buyHouse('left')).toBe('money')
    expect(r.money).toBe(HOUSE_PRICE[0] - 1)
    expect(r.houses).toEqual({ left: 0, right: 0 })
    expect(r.drainEvents().filter(e => e.type === 'houseBought')).toEqual([])
  })

  it('opens a bought house\'s tiles on every floor', () => {
    const { r } = owned()
    expect(isFloor(r, 7, 10)).toBe(false)
    expect(isFloor(r, 7, 10 + FLOOR_ROWS)).toBe(false)
    expect(r.buyHouse('left')).toBeNull()
    expect(isFloor(r, 7, 10)).toBe(true)
    expect(isFloor(r, 7, 10 + FLOOR_ROWS)).toBe(true)
    expect(r.grid.cells[10][7]).toBe('floor')
  })

  it('grows the cook cap with floors and houses', () => {
    const { r } = owned()
    expect(r.chefCap()).toBe(2)
    expect(r.openFloor(2)).toBeNull()
    expect(r.chefCap()).toBe(4)
    expect(r.openFloor(3)).toBeNull()
    expect(r.chefCap()).toBe(6)
    for (const side of ['left', 'right'] as const) {
      r.buyHouse(side)
      r.buyHouse(side)
    }
    expect(r.chefCap()).toBe(10)
  })
})

describe('the restaurant opens floors', () => {
  it('opens floor 2 before the rooftop, at the spa\'s floor prices', () => {
    const { r } = owned()
    expect(r.maxFloors()).toBe(3)
    expect(r.floorProblem(3)).toBe('order')
    expect(r.floorProblem(2)).toBeNull()
    expect(r.grid.links).toEqual([])
    let before = r.money
    expect(r.openFloor(2)).toBeNull()
    expect(before - r.money).toBe(FLOOR_PRICE[2])
    expect(r.floors).toBe(2)
    expect(r.grid.links.length).toBeGreaterThan(0)
    expect(events(r, 'floorOpened')).toEqual([{ type: 'floorOpened', floor: 2 }])
    before = r.money
    expect(r.openFloor(3)).toBeNull()
    expect(before - r.money).toBe(FLOOR_PRICE[3])
    expect(r.floors).toBe(3)
    expect(events(r, 'floorOpened')).toEqual([{ type: 'floorOpened', floor: 3 }])
    expect(r.floorProblem(4)).toBe('max')
    expect(r.openFloor(3)).toBe('max')
  })

  it('refuses a floor it cannot pay for', () => {
    const { r } = owned(FLOOR_PRICE[2] - 1)
    expect(r.floorProblem(2)).toBe('money')
    expect(r.openFloor(2)).toBe('money')
    expect(r.floors).toBe(1)
    expect(r.money).toBe(FLOOR_PRICE[2] - 1)
  })

  it('will not open a floor whose stairs the door cannot reach', () => {
    const { chain, r } = owned()
    const data = { ...r.toSave(), ownerAt: 'street' as const }
    data.items.push({ id: 90, kind: 'diningChair', x: 22, y: 10, flip: false }, { id: 91, kind: 'diningChair', x: 23, y: 11, flip: false })
    data.nextItemId = 92
    const walled = RestaurantSim.fromSave(data, { host: chain.main, rng: createRng(7 + 101), autoSpawn: false })
    expect(walled.floorProblem(2)).toBe('blocked')
    expect(walled.openFloor(2)).toBe('blocked')
    expect(walled.floors).toBe(1)
  })
})

describe('diners and a grown restaurant', () => {
  it('seats diners on floor 1 before upstairs', () => {
    const { r } = owned()
    expect(r.openFloor(2)).toBeNull()
    expect(r.buy('diningTable', 14, 28, false)).toBeNull()
    expect(r.buy('diningChair', 14, 27, false)).toBeNull()
    expect(r.freeSeats().some(s => floorOf(s.tile.y) === 2)).toBe(true)
    for (let n = 0; n < 8; n++) {
      expect(floorOf(r.freeSeats()[0].tile.y)).toBe(1)
      expect(r.spawnDiner({ kind: 'student', dish: 'pho' })).not.toBeNull()
    }
    expect(r.freeSeats().map(s => floorOf(s.tile.y))).toEqual([2])
    const ninth = r.spawnDiner({ kind: 'student', dish: 'pho' })!
    expect(floorOf(ninth.chair!.y)).toBe(2)
  })

  it('a diner walking to a chair still gets there when a house is bought', () => {
    const { r } = owned()
    const d = r.spawnDiner({ kind: 'student', dish: 'pho' })!
    for (let t = 0; d.state !== 'toChair' || d.path.length === 0; t += 50) {
      expect(t).toBeLessThan(30_000)
      r.advance(50)
    }
    expect(r.buyHouse('right')).toBeNull()
    for (let t = 0; d.state === 'toChair'; t += 50) {
      expect(t).toBeLessThan(30_000)
      r.advance(50)
    }
    expect(d.state).toBe('ordering')
  })

  it('a grown restaurant comes back from its save', () => {
    const { chain, r } = owned()
    expect(r.buyHouse('left')).toBeNull()
    expect(r.openFloor(2)).toBeNull()
    const back = RestaurantSim.fromSave({ ...r.toSave(), ownerAt: 'street' }, { host: chain.main, rng: createRng(7 + 101), autoSpawn: false })
    expect(back.houses).toEqual({ left: 1, right: 0 })
    expect(back.floors).toBe(2)
    expect(back.grid.links.length).toBe(r.grid.links.length)
    expect(isFloor(back, 7, 10)).toBe(true)
  })
})
