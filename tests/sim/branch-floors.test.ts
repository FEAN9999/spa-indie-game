import { describe, expect, it } from 'vitest'
import { FLOOR_PRICE, PLACES } from '../../src/config'
import { Chain } from '../../src/sim/chain'
import { floorOf } from '../../src/sim/floors'
import { tileOf } from '../../src/sim/grid'
import { ITEMS } from '../../src/sim/items'
import { parseSave, type SaveData } from '../../src/sim/save'
import type { SpaSim } from '../../src/sim/spa'
import v32 from '../fixtures/save-v32.json'
import { advanceUntil, hireStaff, seatAndWait, starShop } from './helpers'

/** A main shop of three stars with 20.000.000 đ and the beach open; the owner stays at the main shop. */
function beachChain(): { chain: Chain; branch: SpaSim } {
  const chain = new Chain(starShop(3, 20_000_000, 5), 8)
  expect(chain.open('beach')).toBeNull()
  return { chain, branch: chain.shop('beach')! }
}

/** The chain saved and read back as plain JSON, as a reload does. */
const reload = (saved: SaveData): Chain => Chain.fromSave(parseSave(JSON.parse(JSON.stringify(saved))), 8)

describe("a branch's floors", () => {
  it('opens floor 2, then the rooftop, at the main shop prices, from the one purse', () => {
    const { chain, branch } = beachChain()
    const money = chain.main.money
    expect(branch.maxFloors()).toBe(3)
    expect(branch.floorProblem(3)).toBe('order')
    expect(branch.openFloor(2)).toBeNull()
    expect(branch.drainEvents()).toContainEqual({ type: 'floorOpened', floor: 2 })
    expect(branch.openFloor(3)).toBeNull()
    expect([branch.floors, chain.main.money]).toEqual([3, money - FLOOR_PRICE[2] - FLOOR_PRICE[3]])
    expect(branch.floorProblem(4)).toBe('max')
    // each shop opens its own
    expect(chain.main.floors).toBe(1)
    chain.main.rank.stars = 5
    chain.main.money += PLACES.oldTown.price
    expect(chain.open('oldTown')).toBeNull()
    expect(chain.shop('oldTown')!.floors).toBe(1)
  })

  it('waits for day 6 and the money, like the main shop', () => {
    const { chain, branch } = beachChain()
    branch.day = 5
    expect(branch.openFloor(2)).toBe('day')
    branch.day = chain.main.day
    chain.main.money = FLOOR_PRICE[2] - 1
    expect(branch.openFloor(2)).toBe('money')
    expect(branch.floors).toBe(1)
  })

  it('takes two more technicians for each floor', () => {
    const { branch } = beachChain()
    for (let i = 0; i < 3; i++) hireStaff(branch, 'technician')
    expect(() => hireStaff(branch, 'technician')).toThrow('full')
    expect(branch.openFloor(2)).toBeNull()
    for (let i = 0; i < 2; i++) hireStaff(branch, 'technician')
    expect(() => hireStaff(branch, 'technician')).toThrow('full')
  })

  it('leads a customer up the stairs to a bed on floor 2', () => {
    const { chain, branch } = beachChain()
    expect(chain.goTo('beach')).toBeNull()
    expect(branch.openFloor(2)).toBeNull()
    expect(branch.buy('bed', 14, 20, false)).toBeNull()
    for (const s of branch.stations) if (floorOf(s.bed.y) === 1) s.customerId = 999
    const c = seatAndWait(branch)
    branch.tapTile(c.seat!)
    const seen: string[] = []
    advanceUntil(branch, () => {
      const t = tileOf(c.pos)
      seen.push(`${t.x},${t.y}`)
      return c.state === 'inService'
    })
    expect(floorOf(c.pos.y)).toBe(2)
    expect(seen).toContain('23,10')
  })

  it('keeps its floors and the furniture upstairs through a save', () => {
    const { chain, branch } = beachChain()
    expect(branch.openFloor(2)).toBeNull()
    expect(branch.buy('bed', 14, 20, false)).toBeNull()
    const back = reload(chain.toSave()).shop('beach')!
    expect(back.floors).toBe(2)
    expect(back.items.some(i => i.kind === 'bed' && i.x === 14 && i.y === 20)).toBe(true)
  })
})

describe('a branch saved before its stairs', () => {
  /** The beach saved as version 40 had it: its surfboard on what is now the foot of the stairs, and `extra` in the room. */
  function oldSave(extra: SaveData['items'] = []): SaveData {
    const { chain } = beachChain()
    const saved = JSON.parse(JSON.stringify(chain.toSave())) as SaveData
    const beach = saved.chain!.branches[0]
    beach.v = 40
    const board = beach.items.find(i => i.kind === 'surfboard')!
    Object.assign(board, { x: 23, y: 10 })
    for (const item of extra) beach.items.push({ ...item, id: beach.nextItemId++ })
    return saved
  }

  it('moves its own piece off the foot of the stairs, to the left wall', () => {
    const beach = reload(oldSave()).shop('beach')!
    expect(beach.items.filter(i => i.kind === 'surfboard').map(i => [i.x, i.y])).toEqual([[13, 10]])
    expect(beach.maxFloors()).toBe(3)
    expect(beach.floorProblem(2)).toBeNull()
  })

  it('sends its piece back to the guest book when its new tile is taken', () => {
    const beach = reload(oldSave([{ id: 0, kind: 'plant', x: 13, y: 10, flip: false }])).shop('beach')!
    expect(beach.items.some(i => i.kind === 'surfboard')).toBe(false)
    expect(beach.book.gifts).toContain('surfboard')
  })

  it('clears the stairs of anything else, refunding it into the one purse', () => {
    const saved = oldSave([{ id: 0, kind: 'plant', x: 23, y: 8, flip: false }])
    const chain = reload(saved)
    const beach = chain.shop('beach')!
    expect(beach.items.some(i => i.kind === 'plant' && i.x === 23 && i.y === 8)).toBe(false)
    expect(chain.main.money).toBe(saved.money + ITEMS.plant.price)
    expect(beach.money).toBe(chain.main.money)
  })

  it('reads the v32 fixture with the beach on the stairs layout and its surfboard moved', () => {
    const chain = Chain.fromSave(parseSave(structuredClone(v32)), 8)
    const beach = chain.shop('beach')!
    expect(beach.maxFloors()).toBe(3)
    expect(beach.items.filter(i => i.kind === 'surfboard').map(i => [i.x, i.y])).toEqual([[13, 10]])
    expect(chain.main.money).toBe(v32.money)
  })
})
