import { describe, expect, it } from 'vitest'
import { nearestSpot, placeProblem, PROBLEM_TEXT } from '../../src/sim/build'
import { towerOf } from '../../src/sim/floors'
import { isWalkable, manhattan, parseLayout, tileEq } from '../../src/sim/grid'
import { DEFAULT_ITEMS, shellOf, type Item, type ItemKind } from '../../src/sim/items'
import { SHOP_LAYOUT } from '../../src/sim/layout'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import { formatMoney } from '../../src/strings/format'
import { t } from '../../src/strings/vi'
import { advanceUntil, seatAndWait, startService } from './helpers'

const shop = () => {
  const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
  sim.money = 2_000_000
  return sim
}
const idOf = (sim: SpaSim, kind: ItemKind) => sim.items.find(i => i.kind === kind)!.id

/** Fills every bed but the new one, fetches the next customer and plays until they lie down. */
const serveOnNewBed = (sim: SpaSim) => {
  for (const s of sim.stations) if (s.id !== 17) s.customerId = 999
  const c = seatAndWait(sim)
  sim.tapTile(c.seat!)
  advanceUntil(sim, () => c.state === 'inService')
  return c
}

describe('building the shop', () => {
  it('moves, turns, sells and buys back a screen', () => {
    const sim = shop()
    const screen = idOf(sim, 'screen')
    expect(sim.move(screen, 21, 8, false, true)).toBeNull()
    expect(sim.sell(screen)).toBeNull()
    expect(sim.money).toBe(2_000_000 + 100_000)
    expect(sim.buy('screen', 13, 6, false)).toBeNull()
    expect(sim.money).toBe(2_000_000 + 100_000 - 200_000)
  })
  it('keeps the desk on floor 1, its spot free, and one desk in the shop', () => {
    const sim = shop()
    sim.money = 10_000_000
    const desk = idOf(sim, 'desk')
    expect(sim.canPlace('plant', 21, 13, false)).toBe('overlap')
    expect(sim.canPlace('desk', 18, 2, false)).toBe('overlap') // its spot (7,1) is the back wall
    expect(sim.sell(desk)).toBe('lastDesk')
    sim.floors = 2
    expect(sim.canPlace('desk', 16, 28, false)).toBe('deskFloor')
    expect(sim.buy('desk', 16, 10, false)).toBeNull()
    expect(sim.sell(desk)).toBeNull()
    expect(sim.money).toBe(10_000_000 - 400_000 + 200_000)
    expect(t(PROBLEM_TEXT.lastDesk)).toBe('Tiệm cần ít nhất một quầy lễ tân')
    expect(t(PROBLEM_TEXT.deskFloor)).toBe('Quầy lễ tân chỉ đặt ở tầng 1')
  })
  it('buys a bed by the back wall and serves on it', () => {
    const sim = shop()
    expect(sim.buy('bed', 18, 2, false)).toBeNull()
    expect(sim.money).toBe(2_000_000 - 300_000)
    expect(sim.stations.map(s => s.id)).toEqual([1, 2, 17])
    expect(sim.drainEvents()).toEqual([{ type: 'roomChanged' }])
    const c = serveOnNewBed(sim)
    expect(c.stationId).toBe(17)
    expect(c.pos).toEqual({ x: 18, y: 3 })
    expect(sim.ownerTile()).toEqual({ x: 19, y: 3 })
  })

  it('buys a bed lying across the floor and serves on it, from the work tile behind it', () => {
    const sim = shop()
    expect(sim.buy('bed', 16, 9, false, true)).toBeNull()
    expect(sim.stations.find(s => s.id === 17)).toMatchObject({ bed: { x: 17, y: 9 }, work: { x: 17, y: 8 } })
    const c = serveOnNewBed(sim)
    expect(c.pos).toEqual({ x: 17, y: 9 })
    expect(sim.ownerTile()).toEqual({ x: 17, y: 8 })
    sim.drainEvents()
    sim.completeService(c.id, 3)
    expect(sim.drainEvents()).toContainEqual(expect.objectContaining({ type: 'paid', customerId: c.id }))
  })

  it('refuses a bed away from the back wall, but a mask or massage bed may stand there', () => {
    expect(shop().canPlace('bed', 18, 8, false)).toBe('bedWall')
    expect(shop().canPlace('maskBed', 18, 8, false)).toBeNull()
    expect(shop().canPlace('massageBed', 18, 8, true)).toBeNull()
  })

  it("refuses anything on another item, the desk, the screen or the door's way in", () => {
    const sim = shop()
    // the bench, the desk, the screen, inside the door, the owner's start, a bed's work tile
    const tiles = [[2, 13], [9, 14], [3, 6], [6, 16], [9, 13], [3, 3]]
    expect(tiles.map(([x, y]) => sim.canPlace('plant', x, y, false))).toEqual(tiles.map(() => 'overlap'))
  })

  it('refuses what would cut the shop in two', () => {
    const sim = shop()
    expect(sim.canPlace('plant', 18, 7, false)).toBe('blocksPath')
    expect(sim.canPlace('plant', 18, 5, false)).toBe('blocksPath')
    expect(sim.canPlace('plant', 19, 9, false)).toBeNull()
  })

  it('refuses a bed whose work tile is blocked', () => {
    const sim = shop()
    expect(sim.canPlace('bed', 20, 2, false)).toBeNull()
    expect(sim.buy('plant', 21, 3, false)).toBeNull()
    expect(sim.canPlace('bed', 20, 2, false)).toBe('overlap')
  })

  it('flips a bed to work from its left', () => {
    const sim = shop()
    expect(sim.buy('bed', 20, 2, true)).toBeNull()
    expect(sim.stations.find(s => s.id === 17)!.work).toEqual({ x: 19, y: 3 })
    const c = serveOnNewBed(sim)
    expect(c.pos).toEqual({ x: 20, y: 3 })
    expect(sim.ownerTile()).toEqual({ x: 19, y: 3 })
  })

  it('will not move or sell what a customer is using', () => {
    const sim = shop()
    const bench = idOf(sim, 'bench')
    seatAndWait(sim)
    expect(sim.isBusy(bench)).toBe(true)
    expect(sim.move(bench, 18, 9, false)).toBe('busy')
    expect(sim.sell(bench)).toBe('busy')
    expect(sim.items.find(i => i.id === bench)).toMatchObject({ x: 14, y: 13 })

    // a customer still walking to the bench has a seat on it already; with a second bench, only that stops the move and the sale
    const walking = shop()
    expect(walking.buy('bench', 18, 9, false)).toBeNull()
    const c = walking.spawnCustomer()
    advanceUntil(walking, () => c.state === 'toSeat')
    expect(c.seat).toEqual({ x: 14, y: 13 })
    expect(walking.isBusy(bench)).toBe(true)
    expect(walking.canPlace('bench', 18, 11, false, bench)).toBeNull()
    expect(walking.move(bench, 18, 11, false)).toBe('busy')
    expect(walking.sell(bench)).toBe('busy')
    expect(walking.items.find(i => i.id === bench)).toMatchObject({ x: 14, y: 13 })

    const serving = shop()
    startService(serving)
    expect(serving.isBusy(1)).toBe(true)
    expect(serving.sell(1)).toBe('busy')
    expect(serving.money).toBe(2_000_000)
  })

  it('keeps one bed and one bench', () => {
    const sim = shop()
    expect(sim.sell(2)).toBeNull()
    expect(sim.sell(1)).toBe('lastBed')
    const bench = idOf(sim, 'bench')
    expect(sim.sell(bench)).toBe('lastSeat')
    expect(sim.buy('bench', 18, 9, false)).toBeNull()
    expect(sim.sell(bench)).toBeNull()
    expect(sim.seats.map(s => s.tile)).toEqual([{ x: 18, y: 9 }, { x: 19, y: 9 }, { x: 20, y: 9 }])
  })

  it('refunds half and never spends money it does not have', () => {
    const sim = shop()
    sim.money = 100_000
    expect(sim.canPlace('teaChest', 18, 9, false)).toBeNull()
    expect(sim.buy('teaChest', 18, 9, false)).toBe('money')
    expect(sim.money).toBe(100_000)
    expect(sim.items).toHaveLength(16)
    expect(sim.drainEvents()).toEqual([])
    expect(sim.sell(idOf(sim, 'lotus'))).toBeNull()
    expect(sim.money).toBe(175_000)
  })

  it('moves the furniture for free and keeps its id', () => {
    const sim = shop()
    const lotus = idOf(sim, 'lotus')
    expect(sim.move(lotus, 18, 10, true)).toBeNull()
    expect(sim.items.find(i => i.id === lotus)).toEqual({ id: lotus, kind: 'lotus', x: 18, y: 10, flip: true })
    expect(sim.money).toBe(2_000_000)
    expect(sim.grid.cells[7][21]).toBe('floor')
    expect(sim.grid.cells[10][18]).toBe('decor')
    // the item being moved is out of its own way, so a bed can flip where it stands
    expect(sim.canPlace('bed', 14, 2, true)).toBe('overlap')
    expect(sim.canPlace('bed', 14, 2, true, 1)).toBeNull()
    expect(sim.move(2, 16, 2, true)).toBe('overlap') // its work tile would be bed 1's
  })

  it('tells the view after a move and after a sale', () => {
    const sim = shop()
    const lotus = idOf(sim, 'lotus')
    sim.drainEvents()
    expect(sim.move(lotus, 18, 10, false)).toBeNull()
    expect(sim.drainEvents()).toEqual([{ type: 'roomChanged' }])
    expect(sim.sell(lotus)).toBeNull()
    expect(sim.drainEvents()).toEqual([{ type: 'roomChanged' }])
  })

  it('moves people out of the way', () => {
    const sim = shop()
    sim.owner.pos = { x: 19, y: 9 }
    expect(sim.buy('plant', 19, 9, false)).toBeNull()
    const o = sim.ownerTile()
    expect(isWalkable(sim.grid, o)).toBe(true)
    expect(manhattan(o, { x: 19, y: 9 })).toBe(1)
    expect(sim.owner.pos).toEqual(o)

    const out = shop()
    const c = startService(out)
    out.completeService(c.id, 3)
    out.advance(1000) // off the bed and on the way out
    expect(c.state).toBe('leaving')
    expect(c.path).toContainEqual({ x: 18, y: 12 })
    expect(out.buy('plant', 18, 12, false)).toBeNull()
    expect(c.path).not.toContainEqual({ x: 18, y: 12 })
    expect(c.path.at(-1)).toEqual(out.grid.door)
    advanceUntil(out, () => c.state === 'exiting')
  })

  it('lets no one get shut in a corner', () => {
    const sim = shop()
    sim.owner.pos = { x: 23, y: 3 }
    expect(sim.buy('plant', 22, 3, false)).toBeNull()
    expect(sim.buy('plant', 22, 4, false)).toBeNull()
    // (11,3) and (11,4) are still floor, but nothing can walk out of them
    expect(sim.ownerTile()).toEqual({ x: 21, y: 3 })
    sim.tapTile({ x: 14, y: 14 })
    advanceUntil(sim, () => tileEq(sim.ownerTile(), { x: 14, y: 14 }) && sim.owner.path.length === 0)
  })

  it('tells the player each reason', () => {
    const said = Object.entries(PROBLEM_TEXT).map(([problem, key]) => [problem, t(key, { money: formatMoney(200_000) })])
    expect(Object.fromEntries(said)).toEqual({
      blocksPath: 'Chắn lối đi',
      overlap: 'Đè lên đồ khác',
      bedWall: 'Giường gội phải sát tường sau',
      busy: 'Đang có khách',
      lastBed: 'Tiệm cần ít nhất một giường gội',
      lastSeat: 'Tiệm cần ít nhất một ghế chờ',
      lastDesk: 'Tiệm cần ít nhất một quầy lễ tân',
      seatFloor: 'Ghế chờ chỉ đặt ở tầng 1',
      deskFloor: 'Quầy lễ tân chỉ đặt ở tầng 1',
      money: 'Còn thiếu 200.000 đ',
      gift: 'Quà không bán được',
    })
  })

  it('offers the bed slots only while a bed fits there', () => {
    const sim = shop()
    sim.tapTile({ x: 18, y: 3 })
    expect(sim.drainEvents()).toEqual([{ type: 'bedSlot', slot: { x: 18, y: 2 } }])
    expect(sim.buy('bed', 18, 2, false)).toBeNull()
    sim.drainEvents()
    sim.tapTile({ x: 18, y: 3 })
    expect(sim.drainEvents()).toEqual([])
    expect(sim.owner.path).toEqual([])
  })

  it('places, moves and keeps a turned piece, whose seats stand upright', () => {
    const sim = shop()
    const bench = idOf(sim, 'bench')
    expect(sim.move(bench, 16, 9, false, true)).toBeNull()
    expect(sim.items.find(i => i.id === bench)).toEqual({ id: bench, kind: 'bench', x: 16, y: 9, flip: false, turned: true })
    expect(sim.grid.seats).toEqual([{ x: 16, y: 9 }, { x: 16, y: 10 }, { x: 16, y: 11 }])
    expect(sim.buy('shelf', 14, 9, false, true)).toBeNull()
    expect(sim.items.at(-1)).toMatchObject({ kind: 'shelf', x: 14, y: 9, turned: true })
    expect(sim.move(bench, 14, 13, false)).toBeNull()
    expect('turned' in sim.items.find(i => i.id === bench)!).toBe(false)
    sim.book.gifts.push('silkScreen')
    expect(sim.placeGift('silkScreen', 18, 9, false, true)).toBeNull()
    expect(sim.items.at(-1)).toMatchObject({ kind: 'silkScreen', turned: true, gift: true })
  })
})

describe('gift furniture', () => {
  it('places a pending gift once at no cost', () => {
    const sim = shop()
    sim.book.gifts = ['vase']
    sim.drainEvents()
    expect(sim.placeGift('vase', 14, 13, false)).toBe('overlap') // on the bench
    expect(sim.book.gifts).toEqual(['vase'])
    expect(sim.placeGift('vase', 18, 9, false)).toBeNull()
    expect(sim.money).toBe(2_000_000)
    expect(sim.items.at(-1)).toEqual({ id: 17, kind: 'vase', x: 18, y: 9, flip: false, gift: true })
    expect(sim.book.gifts).toEqual([])
    expect(sim.drainEvents()).toEqual([{ type: 'roomChanged' }])
    expect(sim.placeGift('vase', 19, 11, false)).toBe('gift')
    expect(sim.items).toHaveLength(17)
  })

  it('takes only the oldest of the same gift off the list', () => {
    const sim = shop()
    sim.book.gifts = ['vase', 'lotus', 'vase']
    expect(sim.placeGift('vase', 18, 9, false)).toBeNull()
    expect(sim.book.gifts).toEqual(['lotus', 'vase'])
    expect(sim.placeGift('tea', 18, 11, false)).toBe('gift')
  })

  it('refuses to sell a gift', () => {
    const sim = shop()
    sim.book.gifts = ['vase']
    expect(sim.placeGift('vase', 18, 9, false)).toBeNull()
    const id = sim.items.at(-1)!.id
    sim.drainEvents()
    expect(sim.sell(id)).toBe('gift')
    expect(sim.items.find(i => i.id === id)).toMatchObject({ kind: 'vase', gift: true })
    expect(sim.money).toBe(2_000_000)
    expect(sim.drainEvents()).toEqual([])

    // before any other check: a gift bench in use, and the shop's last seat, still says it is a gift
    const busy = shop()
    const bench = busy.items.find(i => i.kind === 'bench')!
    bench.gift = true
    seatAndWait(busy)
    expect(busy.sell(bench.id)).toBe('gift')
  })

  it('moves a gift like any piece', () => {
    const sim = shop()
    sim.book.gifts = ['silkScreen']
    expect(sim.placeGift('silkScreen', 18, 9, false)).toBeNull()
    const id = sim.items.at(-1)!.id
    expect(sim.move(id, 18, 10, true)).toBeNull()
    expect(sim.items.find(i => i.id === id)).toEqual({ id, kind: 'silkScreen', x: 18, y: 10, flip: true, gift: true })
    expect(sim.money).toBe(2_000_000)
  })
})

describe('where a new piece starts', () => {
  const centre = { x: 18, y: 9 }
  const spotFor = (sim: SpaSim, kind: ItemKind) => nearestSpot(sim.grid, centre, t => sim.canPlace(kind, t.x, t.y, false) === null)

  it('starts on the middle of the shop when it is free', () => {
    expect(spotFor(shop(), 'plant')).toEqual(centre)
  })

  it('tries the rings around the middle, nearest first', () => {
    const sim = shop()
    expect(sim.buy('plant', 18, 9, false)).toBeNull()
    const spot = spotFor(sim, 'plant')!
    expect(Math.max(Math.abs(spot.x - 18), Math.abs(spot.y - 9))).toBe(1)
  })

  it('puts a bed by the back wall', () => {
    expect(spotFor(shop(), 'bed')).toEqual({ x: 18, y: 2 })
  })

  it('stays inside the grid and gives up when nothing fits', () => {
    const tried: { x: number; y: number }[] = []
    expect(nearestSpot({ cols: 37, rows: 18 }, centre, t => (tried.push(t), false))).toBeNull()
    expect(tried).toHaveLength(37 * 18)
    expect(new Set(tried.map(t => `${t.x},${t.y}`)).size).toBe(37 * 18)
  })
})

describe('placeProblem on the tall grid', () => {
  const shell = parseLayout(towerOf(shellOf(SHOP_LAYOUT)))
  const others = DEFAULT_ITEMS
  const extras = { door: shell.door }
  const problem = (kind: ItemKind, x: number, y: number, floors: number, flip = false) =>
    placeProblem(shell, others, { id: 99, kind, x, y, flip }, { ...extras, floors })

  it('keeps the stairs and their feet clear on every floor', () => {
    expect(problem('plant', 23, 8, 3)).toBe('overlap')
    expect(problem('plant', 23, 10, 3)).toBe('overlap')
    expect(problem('plant', 23, 28, 3)).toBe('overlap')
    expect(problem('massageBed', 23, 7, 3, true)).toBe('overlap')
  })

  it('keeps seats on floor 1 and off floors that are locked', () => {
    expect(problem('bench', 14, 25, 2)).toBe('seatFloor')
    expect(problem('plant', 17, 25, 1)).toBe('overlap')
  })

  it("refuses what would shut a desk's owner spot in", () => {
    const side = { id: 98, kind: 'plant' as const, x: 20, y: 13, flip: false }
    const other = { id: 97, kind: 'plant' as const, x: 22, y: 13, flip: false }
    const seal = (x: number, y: number) => placeProblem(shell, [...others, side, other], { id: 99, kind: 'plant', x, y, flip: false }, { ...extras, floors: 1 })
    expect(placeProblem(shell, [...others, side], { ...other, id: 99 }, { ...extras, floors: 1 })).toBeNull()
    expect(seal(21, 12)).toBe('blocksPath')
  })

  it('refuses what would shut the floor-1 foot in', () => {
    expect(problem('plant', 22, 10, 1)).toBe('blocksPath')
  })

  it('refuses what would shut the foot of an open floor in', () => {
    const plant = { id: 98, kind: 'plant' as const, x: 22, y: 28, flip: false }
    const second = { id: 99, kind: 'plant' as const, x: 23, y: 29, flip: false }
    expect(placeProblem(shell, [...others, plant], second, { ...extras, floors: 2 })).toBe('blocksPath')
    expect(placeProblem(shell, [...others, plant], second, { ...extras, floors: 1 })).toBe('overlap')
  })

  it('lets a shop whose foot is shut in already build elsewhere, but not shut in a foot the door still reaches', () => {
    const shutIn = [...others, { id: 97, kind: 'plant' as const, x: 22, y: 28, flip: false }, { id: 98, kind: 'plant' as const, x: 23, y: 29, flip: false }]
    const at = (x: number, y: number) => placeProblem(shell, shutIn, { id: 99, kind: 'plant', x, y, flip: false }, { ...extras, floors: 2 })
    expect(at(14, 20)).toBeNull()
    expect(at(18, 9)).toBeNull()
    expect(at(22, 10)).toBe('blocksPath')
  })
})

describe('turned beds', () => {
  const extras = { door: { x: 18, y: 17 }, floors: 1 }
  it('places a turned shampoo bed mid-room, never against the back wall, and keeps the wall rule for a standing one', () => {
    const shell = parseLayout(shellOf(SHOP_LAYOUT))
    const bed = (x: number, y: number, turned: boolean): Item => ({ id: 30, kind: 'bed', x, y, flip: false, ...(turned && { turned }) })
    expect(placeProblem(shell, DEFAULT_ITEMS, bed(16, 9, true), extras)).toBeNull()
    expect(placeProblem(shell, DEFAULT_ITEMS, bed(18, 2, true), extras)).toBe('overlap')
    expect(placeProblem(shell, DEFAULT_ITEMS, bed(16, 9, false), extras)).toBe('bedWall')
  })
  it('refuses a turned bed whose work tile is walled in', () => {
    const shell = parseLayout(shellOf(SHOP_LAYOUT))
    const bed: Item = { id: 30, kind: 'massageBed', x: 16, y: 9, flip: false, turned: true }
    expect(placeProblem(shell, DEFAULT_ITEMS, bed, extras)).toBeNull()
    const walls: Item[] = [[16, 8], [18, 8], [17, 7]].map(([x, y], i) => ({ id: 40 + i, kind: 'plant', x, y, flip: false }))
    expect(placeProblem(shell, [...DEFAULT_ITEMS, ...walls], bed, extras)).toBe('blocksPath')
  })
  it('places a turned bed on an open floor 2', () => {
    const tall = parseLayout(towerOf(shellOf(SHOP_LAYOUT)))
    const bed: Item = { id: 30, kind: 'massageBed', x: 16, y: 24, flip: false, turned: true }
    expect(placeProblem(tall, DEFAULT_ITEMS, bed, { door: tall.door, floors: 2 })).toBeNull()
  })
})
