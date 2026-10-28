import { describe, expect, it } from 'vitest'
import { GENEROUS_TIP } from '../../src/config'
import { createRng, type Rng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import type { SimEvent } from '../../src/sim/types'
import { hireStaff, ownerServes, startService } from './helpers'

const shop = (rng: Rng = createRng(3)) => new SpaSim({ rng, autoSpawn: false })

/** Serves `n` office workers with shampoo, by the owner, `stars` each; returns each one's tip, what a generous one added, and whether they were. */
function serveMany(sim: SpaSim, n: number, stars: 1 | 2 | 3): { tip: number; extra: number; generous: boolean }[] {
  const out: { tip: number; extra: number; generous: boolean }[] = []
  for (let i = 0; i < n; i++) {
    const r = ownerServes(sim, stars)
    const g = r.events.find(e => e.type === 'generous')
    out.push({ tip: r.tip, extra: g?.type === 'generous' ? g.amount : 0, generous: g !== undefined })
  }
  return out
}

describe('a generous customer', () => {
  it('now and then tips five times over after the owner’s three stars, the extra after the bill and into the day’s tips', () => {
    const sim = shop()
    const served = serveMany(sim, 64, 3)
    const generous = served.filter(s => s.generous)
    expect(generous.length).toBeGreaterThan(0)
    expect(generous.length).toBeLessThan(served.length / 3)
    for (const g of generous) expect(g.tip + g.extra).toBe(g.tip * GENEROUS_TIP)
    expect(sim.stats.tips).toBe(served.reduce((sum, s) => sum + s.tip + s.extra, 0))
  })

  it('never comes after fewer stars, or after a technician’s work', () => {
    expect(serveMany(shop(), 64, 2).some(s => s.generous)).toBe(false)
    const sim = shop()
    sim.money = 1_000_000
    hireStaff(sim, 'technician')
    const events: SimEvent[] = []
    for (let i = 0; i < 32; i++) {
      const c = sim.spawnCustomer({ kind: 'office', service: 'shampoo' })
      for (let t = 0; t < 120_000 && sim.customers.includes(c); t += 100) {
        sim.advance(100)
        events.push(...sim.drainEvents())
      }
    }
    expect(events.some(e => e.type === 'paid')).toBe(true)
    expect(events.some(e => e.type === 'generous')).toBe(false)
  })

  it('never comes from a VIP or Mi Mi', () => {
    for (const opts of [{ vip: 'singer' as const }, { kol: true }]) {
      const sim = shop()
      for (let i = 0; i < 24; i++) expect(ownerServes(sim, 3, { kind: 'office', service: 'shampoo', ...opts }).events.some(e => e.type === 'generous')).toBe(false)
    }
  })

  it('draws on a stream of its own, so the shop’s draws stay as they were', () => {
    let draws = 0
    const base = createRng(3)
    const sim = shop(() => {
      draws++
      return base()
    })
    for (let i = 0; i < 16; i++) {
      const c = startService(sim)
      const before = draws
      sim.completeService(c.id, 3)
      expect(draws).toBe(before)
    }
  })
})
