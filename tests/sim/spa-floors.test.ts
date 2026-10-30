import { describe, expect, it } from 'vitest'
import { FLOOR_PRICE, OWNER_START, STAIRS_MS } from '../../src/config'
import { homeOf, staffCap, type CrewHost } from '../../src/sim/crew'
import { floorOf } from '../../src/sim/floors'
import { tileEq, tileOf } from '../../src/sim/grid'
import { SPA_LAYOUT_1A, widen } from '../../src/sim/layout'
import { createRng } from '../../src/sim/rng'
import { parseSave } from '../../src/sim/save'
import { SpaSim } from '../../src/sim/spa'
import type { SimEvent } from '../../src/sim/types'
import { advanceUntil, hireStaff, seatAndWait } from './helpers'

const newSim = () => new SpaSim({ rng: createRng(5), autoSpawn: false })

/** Day 6, rich enough for floor 2 and a bed or two. */
const upstairs = () => {
  const sim = newSim()
  sim.day = 6
  sim.money = 8_000_000
  expect(sim.openFloor(2)).toBeNull()
  sim.drainEvents()
  return sim
}

describe('opening a floor', () => {
  it('waits for day 6, the floors in order and the price', () => {
    const sim = newSim()
    sim.money = FLOOR_PRICE[2]
    sim.day = 5
    expect(sim.openFloor(2)).toBe('day')
    sim.day = 6
    expect(sim.openFloor(3)).toBe('order')
    sim.money = FLOOR_PRICE[2] - 1
    expect(sim.openFloor(2)).toBe('money')
    expect(sim.floors).toBe(1)
  })

  it('takes the price, opens the floor and says so', () => {
    const sim = newSim()
    sim.day = 6
    sim.money = FLOOR_PRICE[2]
    expect(sim.openFloor(2)).toBeNull()
    expect([sim.floors, sim.money]).toEqual([2, 0])
    expect(sim.drainEvents()).toContainEqual({ type: 'floorOpened', floor: 2 })
    expect(sim.openFloor(2)).toBe('max')
  })

  it('stays one floor in a shop without stairs', () => {
    const sim = new SpaSim({ rng: createRng(5), autoSpawn: false, layout: widen(SPA_LAYOUT_1A.map(r => r.replace(/U/g, '.'))) })
    sim.day = 6
    sim.money = FLOOR_PRICE[2]
    expect(sim.maxFloors()).toBe(1)
    expect(sim.openFloor(2)).toBe('max')
  })

  it('is blocked when the door cannot reach the foot of the stairs', () => {
    const data = newSim().toSave()
    data.items.push({ id: 90, kind: 'plant', x: 22, y: 10, flip: false })
    const sim = SpaSim.fromSave(data, { rng: createRng(5), autoSpawn: false })
    sim.day = 6
    sim.money = FLOOR_PRICE[2]
    expect(sim.floorProblem(2)).toBe('blocked')
  })

  it('still lets an old shop with its foot shut in build everywhere else', () => {
    const raw: any = JSON.parse(JSON.stringify(newSim().toSave()))
    delete raw.floors
    raw.v = 13
    for (const i of raw.items) i.x -= 12 // a v13 shop is still 13 columns wide
    raw.owner.pos.x -= 12
    raw.items.push({ id: 90, kind: 'plant', x: 10, y: 10, flip: false })
    raw.nextItemId = 91
    const sim = SpaSim.fromSave(parseSave(raw), { rng: createRng(5), autoSpawn: false })
    sim.day = 6
    sim.money = FLOOR_PRICE[2]
    expect(sim.floorProblem(2)).toBe('blocked')
    expect(sim.canPlace('bed', 18, 2, false)).toBeNull()
    expect(sim.buy('plant', 14, 10, false)).toBeNull()
    expect(sim.buy('plant', 18, 9, false)).toBeNull()
    expect(sim.floorProblem(2)).toBe('blocked')
  })
})

describe('the stairs', () => {
  const foot = { x: 23, y: 10 }

  it('takes STAIRS_MS to climb, standing on the foot meanwhile', () => {
    const sim = upstairs()
    Object.assign(sim.owner, { pos: { ...foot }, path: [{ x: 23, y: 28 }, { x: 23, y: 29 }] })
    sim.advance(STAIRS_MS - 50)
    expect(sim.owner.pos).toEqual(foot)
    expect(sim.owner.facing).toBe('up')
    expect(sim.owner.climbMs).toBeGreaterThan(STAIRS_MS - 150)
    sim.advance(100)
    expect(sim.owner.pos.x).toBe(23)
    expect(sim.owner.pos.y).toBeGreaterThanOrEqual(28)
    expect(sim.owner.climbMs ?? 0).toBe(0)
  })

  it('keeps the climb when the room changes, and drops it when the owner turns back', () => {
    const sim = upstairs()
    Object.assign(sim.owner, { pos: { ...foot }, path: [{ x: 23, y: 28 }, { x: 23, y: 29 }], climbMs: 500 })
    expect(sim.buy('plant', 16, 10, false)).toBeNull()
    expect(sim.owner.climbMs).toBe(500)
    expect(floorOf(sim.owner.path[0].y)).toBe(2)
    sim.tapTile({ x: 22, y: 13 })
    expect(floorOf(sim.owner.path[0].y)).toBe(1)
    sim.advance(100)
    expect(sim.owner.climbMs ?? 0).toBe(0)
  })
})

describe('beds on two floors', () => {
  it('gives a customer the lowest free bed', () => {
    const sim = upstairs()
    expect(sim.buy('bed', 14, 20, false)).toBeNull()
    expect(sim.buy('bed', 18, 2, false)).toBeNull()
    expect(sim.stations.map(s => floorOf(s.bed.y))).toEqual([1, 1, 1, 2])
    const first = seatAndWait(sim)
    sim.tapTile(first.seat!)
    advanceUntil(sim, () => first.stationId !== null)
    expect(floorOf(sim.stations.find(s => s.id === first.stationId)!.bed.y)).toBe(1)
    for (const s of sim.stations) if (floorOf(s.bed.y) === 1) s.customerId = 999
    const next = seatAndWait(sim)
    sim.owner.task = null
    sim.tapTile(next.seat!)
    advanceUntil(sim, () => next.stationId !== null)
    const bed = sim.stations.find(s => s.id === next.stationId)!.bed
    expect([bed.x, floorOf(bed.y)]).toEqual([14, 2])
  })

  it('lets the owner serve a massage upstairs, and the customer walks back down and out', () => {
    const sim = upstairs()
    expect(sim.openService('mask')).toBeNull()
    expect(sim.openService('massage')).toBeNull()
    expect(sim.buy('massageBed', 14, 20, false)).toBeNull()
    const c = seatAndWait(sim, { kind: 'office', service: 'massage' })
    sim.tapTile(c.seat!)
    advanceUntil(sim, () => c.state === 'inService')
    expect(floorOf(c.pos.y)).toBe(2)
    expect(floorOf(sim.owner.pos.y)).toBe(2)
    sim.completeService(c.id, 3)
    const seen: string[] = []
    advanceUntil(sim, () => {
      const t = tileOf(c.pos)
      seen.push(`${t.x},${t.y}`)
      return !sim.customers.includes(c)
    })
    expect(seen).toContain('23,28')
    expect(seen).toContain('23,10')
    expect(seen).toContain('18,17')
  })

  it('sends a technician upstairs to a bed there', () => {
    const sim = upstairs()
    expect(sim.openService('mask')).toBeNull()
    expect(sim.openService('massage')).toBeNull()
    expect(sim.buy('massageBed', 14, 20, false)).toBeNull()
    const tech = hireStaff(sim, 'technician', undefined, { massage: 1 })
    const c = seatAndWait(sim, { kind: 'office', service: 'massage' })
    const ev: SimEvent[] = []
    advanceUntil(sim, () => tech.task?.kind === 'serve', 60_000, ev)
    const station = sim.stations.find(s => floorOf(s.bed.y) === 2)!
    expect(tech.task).toMatchObject({ kind: 'serve', customerId: c.id, stationId: station.id })
    advanceUntil(sim, () => tileEq(tileOf(tech.pos), station.work), 60_000)
  })
})

describe('seats', () => {
  it('stay on floor 1', () => {
    const sim = upstairs()
    expect(sim.buy('bench', 14, 25, false)).toBe('seatFloor')
    expect(sim.seats.every(s => floorOf(s.tile.y) === 1)).toBe(true)
  })
})

describe('staff per floor', () => {
  it('lets two more technicians in for each floor', () => {
    expect([1, 2, 3].map(f => staffCap('technician', f, 0))).toEqual([3, 5, 7])
    expect(staffCap('receptionist', 3, 0)).toBe(1)
    const sim = upstairs()
    for (let i = 0; i < 5; i++) hireStaff(sim, 'technician')
    sim.candidates.push({ ...sim.staff[0], name: 'Extra' })
    expect(sim.hire(sim.candidates.length - 1)).toBe('full')
  })

  it('keeps every home on floor 1, off the stairs foot', () => {
    const sim = upstairs()
    for (let i = 0; i < 5; i++) hireStaff(sim, 'technician')
    for (const s of sim.staff) {
      const home = homeOf({ sim } as CrewHost, s)
      expect(floorOf(home.y)).toBe(1)
      expect(tileEq(home, { x: 23, y: 10 })).toBe(false)
      expect(tileEq(home, OWNER_START)).toBe(false)
    }
  })

  it('gives everyone the same home with floor 2 open as with it closed', () => {
    const sim = newSim()
    sim.day = 6
    sim.money = 8_000_000
    hireStaff(sim, 'receptionist')
    for (let i = 0; i < 3; i++) hireStaff(sim, 'technician')
    const homes = () => sim.staff.map(s => homeOf({ sim } as CrewHost, s))
    const closed = homes()
    expect(sim.openFloor(2)).toBeNull()
    expect(homes()).toEqual(closed)
  })
})

describe('the rooftop', () => {
  /** Day 6, both floors opened through the sim, then a massage bed at the given tile. */
  const roofShop = (bed: { x: number; y: number }) => {
    const sim = newSim()
    sim.day = 6
    sim.money = 10_000_000
    expect(sim.openFloor(2)).toBeNull()
    expect(sim.openFloor(3)).toBeNull()
    expect(sim.openService('mask')).toBeNull()
    expect(sim.openService('massage')).toBeNull()
    expect(sim.buy('massageBed', bed.x, bed.y, false)).toBeNull()
    sim.drainEvents()
    return sim
  }

  /** Ms from the tap that sends someone to fetch the waiting massage customer until the customer lies on the bed. */
  const walkMs = (sim: SpaSim, sawFloor2: boolean[]) => {
    const c = seatAndWait(sim, { kind: 'office', service: 'massage' })
    sim.tapTile(c.seat!)
    let ms = 0
    advanceUntil(sim, () => {
      sawFloor2.push(floorOf(sim.owner.pos.y) === 2 || sim.staff.some(s => floorOf(s.pos.y) === 2) || floorOf(c.pos.y) === 2)
      if (c.state === 'inService') return true
      ms += 100
      return false
    })
    return ms
  }

  it('opens only after floor 2, for 4.000.000 đ', () => {
    const sim = newSim()
    sim.day = 6
    sim.money = 10_000_000
    expect(sim.floorProblem(3)).toBe('order')
    expect(sim.openFloor(2)).toBeNull()
    expect(sim.openFloor(3)).toBeNull()
    expect(sim.floors).toBe(3)
    expect(sim.money).toBe(10_000_000 - FLOOR_PRICE[2] - FLOOR_PRICE[3])
    expect(sim.floorProblem(3)).toBe('max')
  })

  it('takes up to seven technicians', () => {
    const sim = newSim()
    sim.day = 6
    sim.money = 10_000_000
    sim.openFloor(2)
    sim.openFloor(3)
    for (let i = 0; i < 7; i++) hireStaff(sim, 'technician')
    expect(sim.staff.filter(s => s.role === 'technician')).toHaveLength(7)
    sim.candidates.push({ ...sim.staff[0], name: 'Extra' })
    expect(sim.hire(sim.candidates.length - 1)).toBe('full')
  })

  it('gives seven technicians seven homes on floor 1', () => {
    const sim = newSim()
    sim.day = 6
    sim.money = 10_000_000
    sim.openFloor(2)
    sim.openFloor(3)
    for (let i = 0; i < 7; i++) hireStaff(sim, 'technician')
    const homes = sim.staff.map(s => homeOf({ sim } as CrewHost, s))
    expect(homes).toHaveLength(7)
    for (const h of homes) {
      expect(floorOf(h.y)).toBe(1)
      expect(tileEq(h, { x: 23, y: 10 })).toBe(false)
      expect(tileEq(h, OWNER_START)).toBe(false)
    }
    expect(new Set(homes.map(h => `${h.x},${h.y}`)).size).toBe(7)
  })

  it('leads a customer from floor 1 to a bed on the rooftop, through floor 2', () => {
    const roof: boolean[] = []
    const low: boolean[] = []
    const roofMs = walkMs(roofShop({ x: 18, y: 38 }), roof)
    const lowMs = walkMs(roofShop({ x: 18, y: 2 }), low)
    expect(roof).toContain(true)
    expect(low).not.toContain(true)
    expect(roofMs - lowMs).toBeGreaterThanOrEqual(2 * STAIRS_MS)
  })

  it('keeps the rooftop through a save', () => {
    const sim = roofShop({ x: 18, y: 38 })
    expect(sim.buy('mudTub', 14, 39, false)).toBeNull()
    const back = SpaSim.fromSave(parseSave(JSON.parse(JSON.stringify(sim.toSave()))), { rng: createRng(5), autoSpawn: false })
    expect(back.floors).toBe(3)
    expect(back.items.some(i => i.kind === 'mudTub' && i.x === 14 && i.y === 39)).toBe(true)
  })
})
