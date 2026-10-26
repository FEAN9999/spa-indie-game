import { describe, expect, it } from 'vitest'
import { createRng } from '../../src/sim/rng'
import { parseSave } from '../../src/sim/save'
import { SpaSim } from '../../src/sim/spa'
import { pickHint } from '../../src/sim/tutorial'
import v1 from '../fixtures/save-v1.json'
import { seatAndWait, startService } from './helpers'

const fresh = () => new SpaSim({ rng: createRng(1), autoSpawn: false })

describe('first-day hints', () => {
  it('points at the first customer to sit down until the player taps one', () => {
    const sim = fresh()
    expect(pickHint(sim)).toBeNull()
    const a = seatAndWait(sim)
    const b = seatAndWait(sim)
    expect(pickHint(sim)).toEqual({ hint: 'tapCustomer', customerId: a.id })
    sim.tapTile(b.seat!)
    expect(sim.hintDone('tapCustomer')).toBe(true)
    expect(pickHint(sim)).toBeNull()
  })

  it('then points once at a customer whose patience fell below half', () => {
    const sim = fresh()
    sim.markHint('tapCustomer')
    const c = seatAndWait(sim)
    expect(pickHint(sim)).toBeNull()
    c.patienceMs = c.patienceMaxMs / 2 - 1
    expect(pickHint(sim)).toEqual({ hint: 'patience', customerId: c.id })
    sim.markHint('patience')
    expect(pickHint(sim)).toBeNull()
  })

  it('shows one hint at a time, the tap hint first', () => {
    const sim = fresh()
    const c = seatAndWait(sim)
    c.patienceMs = 1
    expect(pickHint(sim)).toEqual({ hint: 'tapCustomer', customerId: c.id })
  })

  it('stays quiet while paused, during a service and after closing', () => {
    const sim = fresh()
    seatAndWait(sim)
    sim.paused = true
    expect(pickHint(sim)).toBeNull()
    sim.paused = false
    sim.dayOver = true
    expect(pickHint(sim)).toBeNull()
    sim.dayOver = false
    startService(sim)
    expect(pickHint(sim)).toBeNull()
  })

  it('never guides a shop from before the tutorial', () => {
    const sim = SpaSim.fromSave(parseSave(structuredClone(v1)), { rng: createRng(1), autoSpawn: false })
    seatAndWait(sim)
    expect(pickHint(sim)).toBeNull()
  })

  it('remembers which hints were shown across a save', () => {
    const sim = fresh()
    const c = seatAndWait(sim)
    sim.tapTile(c.seat!)
    const copy = SpaSim.fromSave(parseSave(JSON.parse(JSON.stringify(sim.toSave()))), { rng: createRng(1), autoSpawn: false })
    expect([copy.hintDone('tapCustomer'), copy.hintDone('demoShampoo')]).toEqual([true, false])
  })
})
