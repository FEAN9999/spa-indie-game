import { describe, expect, it } from 'vitest'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import { todayLine } from '../../src/view/festivals'

/** A shop that has just started `day`. */
function on(day: number): SpaSim {
  const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
  sim.day = day - 1
  sim.startDay()
  return sim
}

describe("today's line", () => {
  it('shows how far the festival quest has got', () => {
    const sim = on(37)
    const q = sim.progress.monthly!
    sim.progress.total.services.shampoo += 3
    expect(todayLine(sim)).toEqual({ festival: 'tet', text: `Dịp Tết · Gội đầu 3/${q.target}` })
  })

  it('says when the festival quest is done', () => {
    const sim = on(37)
    sim.progress.monthly!.state = 'done'
    expect(todayLine(sim)?.text).toBe('Dịp Tết · đã xong nhiệm vụ lễ')
  })

  it('names only the festival service when the month has no festival quest', () => {
    const sim = on(37)
    sim.progress.monthly = { ...sim.progress.monthly!, kind: 'earn', service: null, festival: null }
    expect(todayLine(sim)?.text).toBe('Dịp Tết · món lễ Gội đầu')
  })

  it('has nothing to say outside a festival', () => {
    expect(todayLine(on(46))).toBeNull()
  })
})
