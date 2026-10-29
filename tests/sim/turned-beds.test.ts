import { describe, expect, it } from 'vitest'
import { onBed, tileOf } from '../../src/sim/grid'
import { bedTile, ITEM_KINDS, ITEMS, type ItemKind } from '../../src/sim/items'
import { createRng } from '../../src/sim/rng'
import { parseSave } from '../../src/sim/save'
import { serviceOfBed } from '../../src/sim/services'
import { SpaSim } from '../../src/sim/spa'
import type { SimEvent } from '../../src/sim/types'
import { advanceUntil, hireStaff } from './helpers'

const BEDS = ITEM_KINDS.filter(k => ITEMS[k].group === 'bed')

/** Runs one office customer through `bedId` served by the owner or by `tech`: onto the bed with the server on its work tile, paid, gone. */
function serveOn(sim: SpaSim, bedId: number, service: NonNullable<ReturnType<typeof serviceOfBed>>, tech?: ReturnType<typeof hireStaff>): void {
  for (const s of sim.stations) if (s.id !== bedId) s.customerId = 999
  const st = sim.stations.find(s => s.id === bedId)!
  const c = sim.spawnCustomer({ kind: 'office', service })
  const events: SimEvent[] = []
  advanceUntil(sim, () => c.state === 'waiting', 300_000)
  if (!tech) sim.tapTile(c.seat!)
  advanceUntil(sim, () => c.state === 'inService', 300_000)
  expect(c.pos).toEqual(st.bed)
  expect(onBed(sim.grid, c.pos)).toBe(true)
  expect(tileOf(tech ? tech.pos : sim.ownerTile())).toEqual(st.work)
  if (!tech) sim.completeService(c.id, 3)
  advanceUntil(sim, () => !sim.customers.includes(c), 300_000, events)
  expect(events.some(e => e.type === 'paid')).toBe(true)
}

describe('every bed kind in every facing, on floor 1', () => {
  for (const kind of BEDS)
    for (const [turned, flip] of [[false, false], [false, true], [true, false], [true, true]] as const)
      for (const who of ['owner', 'technician'] as const)
        it(`serves a customer on a ${turned ? 'turned ' : ''}${flip ? 'flipped ' : ''}${kind}, by the ${who}`, () => {
          const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
          sim.money = 20_000_000
          const service = serviceOfBed(kind as ItemKind)!
          if (!sim.services.includes(service)) sim.services.push(service)
          const spot = kind === 'bed' && !turned ? { x: flip ? 8 : 6, y: 2 } : { x: 4, y: 9 }
          expect(sim.buy(kind as ItemKind, spot.x, spot.y, flip, turned)).toBeNull()
          const item = sim.items[sim.items.length - 1]
          expect(sim.stations.find(s => s.id === item.id)!.bed).toEqual(bedTile(item))
          if (who === 'technician') sim.day = 3
          serveOn(sim, item.id, service, who === 'technician' ? hireStaff(sim, 'technician') : undefined)
        })
})

describe('every bed kind turned, on floor 2', () => {
  for (const kind of BEDS)
    for (const flip of [false, true])
      it(`keeps a turned ${flip ? 'flipped ' : ''}${kind} through a save and serves a customer on it`, () => {
        const sim = new SpaSim({ rng: createRng(5), autoSpawn: false })
        sim.day = 6
        sim.money = 20_000_000
        expect(sim.openFloor(2)).toBeNull()
        const service = serviceOfBed(kind as ItemKind)!
        if (!sim.services.includes(service)) sim.services.push(service)
        expect(sim.buy(kind as ItemKind, 4, 24, flip, true)).toBeNull()
        const item = sim.items[sim.items.length - 1]
        const again = SpaSim.fromSave(parseSave(JSON.parse(JSON.stringify(sim.toSave()))), { rng: createRng(5), autoSpawn: false })
        expect(again.items.find(i => i.id === item.id)).toEqual(item)
        serveOn(again, item.id, service)
      })
})
