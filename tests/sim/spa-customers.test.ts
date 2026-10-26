import { describe, expect, it } from 'vitest'
import { REAL_MS_PER_GAME_MIN } from '../../src/config'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import type { SimEvent } from '../../src/sim/types'
import { advanceUntil } from './helpers'

describe('SpaSim customers and day', () => {
  it('first customer arrives and sits on a free seat', () => {
    const sim = new SpaSim({ rng: createRng(1) })
    advanceUntil(sim, () => sim.customers[0]?.state === 'waiting')
    const c = sim.customers[0]
    expect(sim.grid.seats).toContainEqual(c.seat)
    expect(sim.seats.find(s => s.customerId === c.id)).toBeDefined()
  })

  it('a waiting customer runs out of patience and leaves angry with a 1-star review', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    const c = sim.spawnCustomer()
    const ev: SimEvent[] = []
    advanceUntil(sim, () => !sim.customers.includes(c), 120_000, ev)
    expect(ev).toContainEqual({ type: 'review', customerId: c.id, score: 1 })
    expect(ev).toContainEqual({ type: 'customerLeft', id: c.id, angry: true })
    expect(sim.stats.angry).toBe(1)
    expect(sim.seats.every(s => s.customerId === null)).toBe(true)
  })

  it('walks away without a review when every seat is taken', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    sim.seats.forEach(s => (s.customerId = 999))
    const c = sim.spawnCustomer()
    const ev: SimEvent[] = []
    advanceUntil(sim, () => !sim.customers.includes(c), 30_000, ev)
    expect(ev).toContainEqual({ type: 'noSeat', id: c.id })
    expect(ev).toContainEqual({ type: 'customerLeft', id: c.id, angry: false })
    expect(ev.some(e => e.type === 'review')).toBe(false)
    expect(sim.stats.walkedAway).toBe(1)
  })

  it('stops spawning after closing time and ends the day once the shop is empty', () => {
    const sim = new SpaSim({ rng: createRng(3) })
    const ev: SimEvent[] = []
    advanceUntil(sim, () => sim.dayOver, 900_000, ev)
    expect(sim.clock.isClosed).toBe(true)
    expect(sim.customers).toHaveLength(0)
    sim.advance(60_000)
    ev.push(...sim.drainEvents())
    expect(sim.customers).toHaveLength(0)
    expect(ev.filter(e => e.type === 'dayEnded')).toHaveLength(1)
  })

  it('does nothing while paused', () => {
    const sim = new SpaSim({ rng: createRng(1) })
    sim.paused = true
    sim.advance(10_000)
    expect(sim.clock.minutes).toBe(480)
    expect(sim.customers).toHaveLength(0)
  })

  it('update clamps a huge frame delta', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    sim.update(60_000)
    expect(sim.clock.minutes).toBeCloseTo(480 + 250 / REAL_MS_PER_GAME_MIN, 5)
  })

  it('startDay opens the next day with fresh stats and keeps the money', () => {
    const sim = new SpaSim({ rng: createRng(3) })
    advanceUntil(sim, () => sim.dayOver, 900_000)
    sim.money = 123_000
    sim.startDay()
    expect(sim.day).toBe(2)
    expect(sim.dayOver).toBe(false)
    expect(sim.clock.label()).toBe('08:00')
    expect(sim.stats).toEqual({ served: 0, angry: 0, walkedAway: 0, income: 0, tips: 0, wages: 0, restock: 0 })
    expect(sim.money).toBe(123_000)
  })
})
