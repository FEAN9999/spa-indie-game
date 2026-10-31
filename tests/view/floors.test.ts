import { describe, expect, it } from 'vitest'
import { createRng } from '../../src/sim/rng'
import { SHOP_LAYOUT, SPA_LAYOUT_1A, widen } from '../../src/sim/layout'
import { SpaSim } from '../../src/sim/spa'
import type { Item } from '../../src/sim/items'
import type { Customer } from '../../src/sim/types'
import { formatMoney } from '../../src/strings/format'
import { t } from '../../src/strings/vi'
import { carryTo, retagFloors, followFloor, climbPose, clampToFloor, deskCandle, pills, showPills, stairsToasts } from '../../src/view/floors'

const simWith = (owner: { y: number; task?: { kind: string }; climbMs?: number }) =>
  ({ owner: { pos: { x: 11, y: owner.y }, task: owner.task ?? null, climbMs: owner.climbMs } }) as unknown as SpaSim

describe('deskCandle', () => {
  it('stands the desk candle on the middle of the desk', () => {
    expect(deskCandle({ id: 1, kind: 'desk', x: 8, y: 14, flip: false })).toEqual({ x: 9.5, y: 13.9 })
    expect(deskCandle({ id: 1, kind: 'desk', x: 4, y: 9, flip: false, turned: true })).toEqual({ x: 4.5, y: 9.9 })
  })
})

describe('followFloor', () => {
  it('goes to the owner floor on the frame a walk to a bed reaches it', () => {
    expect(followFloor(simWith({ y: 20, task: { kind: 'serve' } }), 1, 1)).toBe(2)
  })

  it('stays put while the owner is mid-climb, still on the floor below', () => {
    expect(followFloor(simWith({ y: 10, task: { kind: 'serve' }, climbMs: 400 }), 1, 1)).toBe(1)
  })

  it('keeps a floor picked with a pill on the frames after', () => {
    expect(followFloor(simWith({ y: 20, task: { kind: 'serve' } }), 1, 2)).toBe(1)
  })

  it('does not follow outside a walk to a bed', () => {
    expect(followFloor(simWith({ y: 20 }), 1, 1)).toBe(1)
    expect(followFloor(simWith({ y: 20, task: { kind: 'fetch' } }), 1, 1)).toBe(1)
  })
})

describe('climbPose', () => {
  it('lifts and fades with the time left on the stairs', () => {
    expect(climbPose({ pos: { x: 11, y: 10 }, climbMs: 500 })).toEqual({ lift: 1.25, alpha: 0.5 })
  })

  it('is null when not climbing', () => {
    expect(climbPose({ pos: { x: 11, y: 10 } })).toBeNull()
    expect(climbPose({ pos: { x: 11, y: 10 }, climbMs: 0 })).toBeNull()
  })
})

const newSim = (layout = SHOP_LAYOUT) => new SpaSim({ rng: createRng(5), autoSpawn: false, layout })

describe('showPills', () => {
  it('waits for the floors day', () => {
    const sim = newSim()
    sim.day = 5
    expect(showPills(sim)).toBe(false)
    sim.day = 6
    expect(showPills(sim)).toBe(true)
  })

  it('is false for a layout without stairs', () => {
    const sim = newSim(widen(SPA_LAYOUT_1A.map(r => r.replace(/U/g, '.'))))
    sim.day = 6
    expect(showPills(sim)).toBe(false)
  })
})

describe('pills', () => {
  it('gives a viewed pill and a locked one with the price', () => {
    const sim = newSim()
    const ps = pills(sim, 1)
    expect(ps.map(p => [p.floor, p.state])).toEqual([[1, 'viewed'], [2, 'locked'], [3, 'locked']])
    expect(ps[1].price).toBe(2_000_000)
  })

  it('shows a third, locked pill for the rooftop at 4.000.000 đ', () => {
    const sim = newSim()
    sim.day = 6
    sim.floors = 1
    const ps = pills(sim, 1)
    expect(ps.map(p => p.floor)).toEqual([1, 2, 3])
    expect(ps.map(p => p.state)).toEqual(['viewed', 'locked', 'locked'])
    expect(ps.map(p => p.price)).toEqual([0, 2_000_000, 4_000_000])
  })

  it('opens the rooftop pill once the rooftop is open', () => {
    const sim = newSim()
    sim.floors = 3
    expect(pills(sim, 3).map(p => p.state)).toEqual(['open', 'open', 'viewed'])
  })

  it('puts the dot on Tầng 1 only, also when viewing the rooftop', () => {
    const sim = newSim()
    sim.floors = 3
    sim.customers.push({ state: 'waiting' } as Customer)
    expect(pills(sim, 3).map(p => p.dot)).toEqual([true, false, false])
  })

  it('puts the owner face on the owner floor', () => {
    const ps = pills(newSim(), 1)
    expect(ps.map(p => p.face)).toEqual([true, false, false])
  })

  it('marks an opened floor that is not viewed as open', () => {
    const sim = newSim()
    sim.floors = 2
    expect(pills(sim, 2).map(p => p.state)).toEqual(['open', 'viewed', 'locked'])
  })

  it('shows the dot on floor 1 only while viewing another floor with someone waiting', () => {
    const sim = newSim()
    sim.floors = 2
    sim.customers.push({ state: 'waiting' } as Customer)
    expect(pills(sim, 2).map(p => p.dot)).toEqual([true, false, false])
    expect(pills(sim, 1).map(p => p.dot)).toEqual([false, false, false])
  })
})

describe('carryTo', () => {
  const plant: Item = { id: 3, kind: 'plant', x: 4, y: 12, flip: false, gift: false }

  it('moves a piece up by whole floors, keeping its row in the floor', () => {
    expect(carryTo(plant, 2)).toEqual({ ...plant, y: 30 })
  })

  it('brings it back down', () => {
    expect(carryTo(carryTo(plant, 2), 1).y).toBe(12)
  })

  it('leaves the original untouched', () => {
    carryTo(plant, 3)
    expect(plant.y).toBe(12)
  })
})

describe('retagFloors', () => {
  it('moves a sprite to the floor its item was carried to, and leaves unknown items alone', () => {
    const tags = new Map([[3, { floor: 1 }]])
    const at = (id: number, y: number): Item => ({ id, kind: 'plant', x: 4, y, flip: false, gift: false })
    retagFloors(tags, [at(3, 30), at(9, 30)])
    expect(tags.get(3)!.floor).toBe(2)
    expect(tags.has(9)).toBe(false)
  })
})

describe('stairsToasts', () => {
  const refund = (count: number, money: number) => t('stairsRefund', { count, money: formatMoney(money) })

  it('tells of the refund, then of the gifts back in the guest book', () => {
    expect(stairsToasts({ count: 2, refund: 450_000, gifts: 1, rebuy: null })).toEqual([refund(2, 450_000), t('stairsGifts')])
  })

  it('tells of the gifts alone when nothing was refunded', () => {
    expect(stairsToasts({ count: 1, refund: 0, gifts: 1, rebuy: null })).toEqual([t('stairsGifts')])
  })

  it('ends with what to buy again', () => {
    expect(stairsToasts({ count: 1, refund: 150_000, gifts: 0, rebuy: 'bench' })).toEqual([refund(1, 150_000), t('stairsRebuy', { item: t('itemBench').toLocaleLowerCase('vi') })])
  })
})

describe('clampToFloor', () => {
  it('keeps a turned piece wholly on the floor in view', () => {
    const screen: Item = { id: 1, kind: 'screen', x: 3, y: 16, flip: false, turned: true }
    expect(clampToFloor(screen, 2, 13)).toEqual({ ...screen, y: 18 })
    expect(clampToFloor({ ...screen, y: 33 }, 2, 13)).toEqual({ ...screen, y: 31 })
    expect(clampToFloor({ id: 2, kind: 'screen', x: 10, y: 8, flip: false }, 1, 13)).toEqual({ id: 2, kind: 'screen', x: 8, y: 8, flip: false })
  })
  it("hangs a wall piece on its floor's lower wall row wherever it is carried", () => {
    const mirror: Item = { id: 3, kind: 'inkBamboo', x: 30, y: 9, flip: false }
    expect(clampToFloor(mirror, 1, 37)).toEqual({ ...mirror, x: 30, y: 1 })
    expect(clampToFloor({ ...mirror, x: 36, y: 0 }, 2, 37)).toEqual({ ...mirror, x: 35, y: 19 })
  })
})
