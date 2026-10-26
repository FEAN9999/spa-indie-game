import { describe, expect, it } from 'vitest'
import { PROBLEM_TEXT } from '../../src/sim/build'
import { isWalkable, manhattan, tileEq } from '../../src/sim/grid'
import type { ItemKind } from '../../src/sim/items'
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
  for (const s of sim.stations) if (s.id !== 14) s.customerId = 999
  const c = seatAndWait(sim)
  sim.tapTile(c.seat!)
  advanceUntil(sim, () => c.state === 'inService')
  return c
}

describe('building the shop', () => {
  it('buys a bed by the back wall and serves on it', () => {
    const sim = shop()
    expect(sim.buy('bed', 6, 2, false)).toBeNull()
    expect(sim.money).toBe(2_000_000 - 300_000)
    expect(sim.stations.map(s => s.id)).toEqual([1, 2, 14])
    expect(sim.drainEvents()).toEqual([{ type: 'roomChanged' }])
    const c = serveOnNewBed(sim)
    expect(c.stationId).toBe(14)
    expect(c.pos).toEqual({ x: 6, y: 3 })
    expect(sim.ownerTile()).toEqual({ x: 7, y: 3 })
  })

  it('refuses a bed away from the back wall', () => {
    expect(shop().canPlace('bed', 6, 8, false)).toBe('bedWall')
  })

  it("refuses anything on another item, the desk, the screen or the door's way in", () => {
    const sim = shop()
    // the bench, the desk, the screen, inside the door, the owner's start, a bed's work tile
    const tiles = [[2, 13], [9, 14], [3, 6], [6, 16], [9, 13], [3, 3]]
    expect(tiles.map(([x, y]) => sim.canPlace('plant', x, y, false))).toEqual(tiles.map(() => 'overlap'))
  })

  it('refuses what would cut the shop in two', () => {
    const sim = shop()
    expect(sim.canPlace('plant', 6, 7, false)).toBe('blocksPath')
    expect(sim.canPlace('plant', 6, 5, false)).toBe('blocksPath')
    expect(sim.canPlace('plant', 7, 9, false)).toBeNull()
  })

  it('refuses a bed whose work tile is blocked', () => {
    const sim = shop()
    expect(sim.canPlace('bed', 8, 2, false)).toBeNull()
    expect(sim.buy('plant', 9, 3, false)).toBeNull()
    expect(sim.canPlace('bed', 8, 2, false)).toBe('overlap')
  })

  it('flips a bed to work from its left', () => {
    const sim = shop()
    expect(sim.buy('bed', 8, 2, true)).toBeNull()
    expect(sim.stations.find(s => s.id === 14)!.work).toEqual({ x: 7, y: 3 })
    const c = serveOnNewBed(sim)
    expect(c.pos).toEqual({ x: 8, y: 3 })
    expect(sim.ownerTile()).toEqual({ x: 7, y: 3 })
  })

  it('will not move or sell what a customer is using', () => {
    const sim = shop()
    const bench = idOf(sim, 'bench')
    seatAndWait(sim)
    expect(sim.isBusy(bench)).toBe(true)
    expect(sim.move(bench, 6, 9, false)).toBe('busy')
    expect(sim.sell(bench)).toBe('busy')
    expect(sim.items.find(i => i.id === bench)).toMatchObject({ x: 2, y: 13 })

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
    expect(sim.buy('bench', 6, 9, false)).toBeNull()
    expect(sim.sell(bench)).toBeNull()
    expect(sim.seats.map(s => s.tile)).toEqual([{ x: 6, y: 9 }, { x: 7, y: 9 }, { x: 8, y: 9 }])
  })

  it('refunds half and never spends money it does not have', () => {
    const sim = shop()
    sim.money = 100_000
    expect(sim.canPlace('teaChest', 6, 9, false)).toBeNull()
    expect(sim.buy('teaChest', 6, 9, false)).toBe('money')
    expect(sim.money).toBe(100_000)
    expect(sim.items).toHaveLength(13)
    expect(sim.drainEvents()).toEqual([])
    expect(sim.sell(idOf(sim, 'lotus'))).toBeNull()
    expect(sim.money).toBe(175_000)
  })

  it('moves the furniture for free and keeps its id', () => {
    const sim = shop()
    const lotus = idOf(sim, 'lotus')
    expect(sim.move(lotus, 6, 10, true)).toBeNull()
    expect(sim.items.find(i => i.id === lotus)).toEqual({ id: lotus, kind: 'lotus', x: 6, y: 10, flip: true })
    expect(sim.money).toBe(2_000_000)
    expect(sim.grid.cells[7][9]).toBe('floor')
    expect(sim.grid.cells[10][6]).toBe('decor')
    // the item being moved is out of its own way, so a bed can flip where it stands
    expect(sim.canPlace('bed', 2, 2, true)).toBe('overlap')
    expect(sim.canPlace('bed', 2, 2, true, 1)).toBeNull()
    expect(sim.move(2, 4, 2, true)).toBe('overlap') // its work tile would be bed 1's
  })

  it('moves people out of the way', () => {
    const sim = shop()
    sim.owner.pos = { x: 7, y: 9 }
    expect(sim.buy('plant', 7, 9, false)).toBeNull()
    const o = sim.ownerTile()
    expect(isWalkable(sim.grid, o)).toBe(true)
    expect(manhattan(o, { x: 7, y: 9 })).toBe(1)
    expect(sim.owner.pos).toEqual(o)

    const out = shop()
    const c = startService(out)
    out.completeService(c.id, 3)
    out.advance(1000) // off the bed and on the way out
    expect(c.state).toBe('leaving')
    expect(c.path).toContainEqual({ x: 6, y: 12 })
    expect(out.buy('plant', 6, 12, false)).toBeNull()
    expect(c.path).not.toContainEqual({ x: 6, y: 12 })
    expect(c.path.at(-1)).toEqual(out.grid.door)
    advanceUntil(out, () => c.state === 'exiting')
  })

  it('lets no one get shut in a corner', () => {
    const sim = shop()
    sim.owner.pos = { x: 11, y: 3 }
    expect(sim.buy('plant', 10, 3, false)).toBeNull()
    expect(sim.buy('plant', 10, 4, false)).toBeNull()
    // (11,3) and (11,4) are still floor, but nothing can walk out of them
    expect(sim.ownerTile()).toEqual({ x: 9, y: 3 })
    sim.tapTile({ x: 2, y: 14 })
    advanceUntil(sim, () => tileEq(sim.ownerTile(), { x: 2, y: 14 }) && sim.owner.path.length === 0)
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
      money: 'Còn thiếu 200.000 đ',
    })
  })

  it('offers the bed slots only while a bed fits there', () => {
    const sim = shop()
    sim.tapTile({ x: 6, y: 3 })
    expect(sim.drainEvents()).toEqual([{ type: 'bedSlot', slot: { x: 6, y: 2 } }])
    expect(sim.buy('bed', 6, 2, false)).toBeNull()
    sim.drainEvents()
    sim.tapTile({ x: 6, y: 3 })
    expect(sim.drainEvents()).toEqual([])
    expect(sim.owner.path).toEqual([])
  })
})
