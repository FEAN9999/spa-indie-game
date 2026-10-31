import { describe, expect, it, vi } from 'vitest'
import { FLOOR_PRICE, FLOOR_ROWS, HOUSE_PRICE } from '../../src/config'
import { Chain } from '../../src/sim/chain'
import { ROOF_START } from '../../src/sim/dining'
import { floorOf } from '../../src/sim/floors'
import { RestaurantSim, type RestaurantEvent } from '../../src/sim/restaurant'
import { createRng } from '../../src/sim/rng'
import { restaurantFor, starShop } from './helpers'

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

const floorAt = (pos: { y: number }) => floorOf(Math.round(pos.y))

describe('the rooftop umbrella table', () => {
  const roofChairs = ROOF_START.filter(p => p.kind === 'diningChair').map(p => `${p.x},${p.y}`).sort()

  it('sets out an umbrella table with four chairs when the rooftop opens', () => {
    const { r } = owned()
    expect(r.openFloor(2)).toBeNull()
    expect(r.items.some(i => i.kind === 'umbrellaTable')).toBe(false)
    const before = r.money
    expect(r.openFloor(3)).toBeNull()
    expect(before - r.money).toBe(FLOOR_PRICE[3])
    const umbrellas = r.items.filter(i => i.kind === 'umbrellaTable')
    expect(umbrellas).toHaveLength(1)
    expect(floorOf(umbrellas[0].y)).toBe(3)
    expect(r.items.filter(i => i.kind === 'diningChair' && floorOf(i.y) === 3).map(i => `${i.x},${i.y}`).sort()).toEqual(roofChairs)
    expect(new Set(r.items.map(i => i.id)).size).toBe(r.items.length)
    expect(r.freeSeats().filter(s => floorOf(s.tile.y) === 3)).toHaveLength(4)
  })

  it('keeps the umbrella table on the rooftop', () => {
    const { r } = owned()
    expect(r.openFloor(2)).toBeNull()
    expect(r.openFloor(3)).toBeNull()
    expect(r.canPlace('umbrellaTable', 15, 10, false)).toBe('roofOnly')
    expect(r.canPlace('umbrellaTable', 15, 28, false)).toBe('roofOnly')
    expect(r.canPlace('umbrellaTable', 19, 40, false)).toBeNull()
    expect(r.canPlace('diningTable', 19, 40, false)).toBeNull()
    expect(r.buy('umbrellaTable', 19, 40, false)).toBeNull()
  })

  it('will not sell the last table while an umbrella table stands', () => {
    const { r } = owned()
    expect(r.openFloor(2)).toBeNull()
    expect(r.openFloor(3)).toBeNull()
    const tables = () => r.items.filter(i => i.kind === 'diningTable')
    const umbrella = r.items.find(i => i.kind === 'umbrellaTable')!
    expect(tables()).toHaveLength(2)
    expect(r.sell(tables()[0].id)).toBeNull()
    expect(r.sell(tables()[0].id)).toBeNull()
    expect(tables()).toHaveLength(0)
    expect(r.sell(umbrella.id)).toBe('lastDining')
    expect(r.items.some(i => i.id === umbrella.id)).toBe(true)
  })

  it('lets either the last dining table or the umbrella table go when one of each stands', () => {
    const run = (sellUmbrella: boolean) => {
      const { r } = owned()
      expect(r.openFloor(2)).toBeNull()
      expect(r.openFloor(3)).toBeNull()
      const [a, b] = r.items.filter(i => i.kind === 'diningTable')
      expect(r.sell(a.id)).toBeNull()
      expect(r.sell(sellUmbrella ? r.items.find(i => i.kind === 'umbrellaTable')!.id : b.id)).toBeNull()
    }
    run(true)
    run(false)
  })
})

describe('diners upstairs', () => {
  /** Opens floor 2 (with a table and a chair of its own) and perhaps the rooftop, and puts every floor-1 chair away so the next diner sits upstairs. */
  const upstairs = (roof: boolean) => {
    const r = restaurantFor(starShop(3, 100_000_000, 7), { seed: 7 })
    expect(r.openFloor(2)).toBeNull()
    expect(r.buy('diningTable', 14, 28, false)).toBeNull()
    expect(r.buy('diningChair', 14, 27, false)).toBeNull()
    if (roof) expect(r.openFloor(3)).toBeNull()
    for (const chair of r.items.filter(i => i.kind === 'diningChair' && floorOf(i.y) === 1)) expect(r.sell(chair.id)).toBeNull()
    r.ownerArrives()
    r.drainEvents()
    return r
  }
  /** Spawns a Phở diner and runs until they sit with their ticket. */
  const seatOne = (r: RestaurantSim) => {
    const d = r.spawnDiner({ kind: 'student', dish: 'pho' })!
    for (let t = 0; d.state !== 'ordering'; t += 50) {
      expect(t).toBeLessThan(60_000)
      r.advance(50)
    }
    r.drainEvents()
    return d
  }
  /** Taps the diner, cooks with 3 stars, and runs until they have paid; returns the events and the floors the owner stood on. */
  const serve = (r: RestaurantSim, d: ReturnType<typeof seatOne>) => {
    const seen: RestaurantEvent[] = []
    const floors = new Set<number>()
    const run = (until: () => boolean) => {
      for (let t = 0; !until(); t += 50) {
        expect(t).toBeLessThan(60_000)
        r.advance(50)
        floors.add(floorAt(r.owner.pos))
        seen.push(...r.drainEvents())
      }
    }
    r.tapTile(d.chair!)
    run(() => seen.some(e => e.type === 'cookReady'))
    r.completeCooking(d.id, 3)
    run(() => seen.some(e => e.type === 'dinerPaid'))
    return { seen, floors, run }
  }

  it('serves a diner seated upstairs: the owner climbs, cooks, carries, and the diner pays once', () => {
    const r = upstairs(false)
    const d = seatOne(r)
    const chair = { ...d.chair! }
    expect(floorOf(chair.y)).toBe(2)
    const { seen, floors, run } = serve(r, d)
    expect(seen.filter(e => e.type === 'dinerPaid')).toEqual([{ type: 'dinerPaid', dinerId: d.id, amount: 30_000, tip: 10_000, tile: chair }])
    expect(floors.has(2)).toBe(true)
    run(() => r.diners.length === 0)
    expect(seen.filter(e => e.type === 'dinerPaid')).toHaveLength(1)
    expect(r.stats.served).toBe(1)
    expect(r.freeSeats()).toHaveLength(r.grid.seats.length)
  })

  it('seats a diner at the rooftop table when nothing below is free, and serves it', () => {
    const r = upstairs(true)
    for (const chair of r.items.filter(i => i.kind === 'diningChair' && floorOf(i.y) === 2)) expect(r.sell(chair.id)).toBeNull()
    const d = seatOne(r)
    expect(floorOf(d.chair!.y)).toBe(3)
    const { seen, floors, run } = serve(r, d)
    expect(floors.has(3)).toBe(true)
    run(() => r.diners.length === 0)
    expect(seen.filter(e => e.type === 'dinerPaid')).toHaveLength(1)
  })

  it('at closing a diner on the rooftop walks down and the day closes', () => {
    const chain = new Chain(starShop(3, 100_000_000, 7), 7)
    chain.main.day = 10
    expect(chain.buyRestaurant()).toBeNull()
    chain.main.money = 100_000_000
    const r = chain.restaurant!
    expect(r.openFloor(2)).toBeNull()
    expect(r.openFloor(3)).toBeNull()
    for (const chair of r.items.filter(i => i.kind === 'diningChair' && floorOf(i.y) < 3)) expect(r.sell(chair.id)).toBeNull()
    const d = r.spawnDiner({ kind: 'student', dish: 'pho' })!
    expect(floorOf(d.chair!.y)).toBe(3)
    const close = vi.spyOn(r, 'closeDay')
    chain.main.clock.minutes = 19 * 60 + 59
    let onRoof = false
    let walkedDown = false
    for (let t = 0; !chain.main.dayOver; t += 100) {
      expect(t).toBeLessThan(900_000)
      chain.advance(100)
      const at = r.diners.find(x => x.id === d.id)
      if (at && floorAt(at.pos) === 3) onRoof = true
      if (at && onRoof && floorAt(at.pos) < 3) walkedDown = true
    }
    expect(onRoof).toBe(true)
    expect(walkedDown).toBe(true)
    expect(r.diners).toHaveLength(0)
    expect(close).toHaveBeenCalledTimes(1)
    const money = chain.main.money
    chain.advance(100)
    chain.advance(100)
    expect(chain.main.money).toBe(money)
    expect(close).toHaveBeenCalledTimes(1)
  })
})
