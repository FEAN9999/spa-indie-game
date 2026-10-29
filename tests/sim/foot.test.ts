import { describe, expect, it } from 'vitest'
import { FOOT_LEAD_MS, FOOT_POINTS } from '../../src/config'
import { FootGame, footPointAt, footStars } from '../../src/sim/foot'
import { createRng } from '../../src/sim/rng'

const listRng = (values: number[]) => {
  let i = 0
  return () => values[i++] ?? 0
}

/** Plays in 16 ms frames: in 'input', after every `msPerTap` it taps the next point, or a wrong one for the first `fails[round]` taps of the round. */
const play = (g: FootGame, { msPerTap = 300, fails = {} as Record<number, number> } = {}) => {
  const wrongs: Record<number, number> = {}
  let since = 0
  for (let n = 0; n < 20000 && g.phase !== 'done'; n++) {
    if (g.phase === 'input') {
      since += 16
      if (since >= msPerTap) {
        since = 0
        const r = g.round
        const w = wrongs[r] ?? 0
        if (w < (fails[r] ?? 0)) {
          wrongs[r] = w + 1
          g.tap((g.seq[g.idx] + 1) % 6)
        } else g.tap(g.seq[g.idx])
      }
    } else since = 0
    g.tick(16)
  }
}

const seeded = (seed: number, hard = false) => new FootGame(createRng(seed), hard)

/** Ticks exactly to the start of round `r`'s input, tapping the earlier rounds right. */
const toInput = (g: FootGame, r: number) => {
  for (let n = 0; n < 5000 && !(g.round === r && g.phase === 'input'); n++) {
    if (g.phase === 'input') g.tap(g.seq[g.idx])
    g.tick(16)
  }
}

describe('FootGame sequence', () => {
  it('redraws a point that repeats the one before', () => {
    expect(new FootGame(listRng([0, 0, 0.2, 0.2, 0.5, 0.9])).seq).toEqual([0, 1, 3, 5, 0])
  })

  it('has the last round length, no equal neighbours, points 0-5', () => {
    for (let seed = 1; seed <= 50; seed++) {
      for (const [hard, len] of [[false, 5], [true, 6]] as const) {
        const { seq } = seeded(seed, hard)
        expect(seq).toHaveLength(len)
        seq.forEach((p, i) => {
          expect(p).toBeGreaterThanOrEqual(0)
          expect(p).toBeLessThanOrEqual(5)
          if (i > 0) expect(p).not.toBe(seq[i - 1])
        })
      }
    }
  })
})

describe('FootGame show', () => {
  it('lights one point at a time, then hands over to input', () => {
    const g = seeded(1)
    expect(g.phase).toBe('lead')
    g.tick(FOOT_LEAD_MS)
    expect(g.phase).toBe('show')
    expect(g.lit()).toEqual({ step: 0, point: g.seq[0] })
    g.tick(499)
    expect(g.lit()).toEqual({ step: 0, point: g.seq[0] })
    g.tick(1)
    expect(g.lit()).toBeNull()
    g.tick(199)
    expect(g.lit()).toBeNull()
    g.tick(1)
    expect(g.lit()).toEqual({ step: 1, point: g.seq[1] })
    g.tick(1400)
    expect(g.phase).toBe('input')
    expect(g.idx).toBe(0)
    expect(g.lit()).toBeNull()
  })

  it('grows the sequence: round 1 lights round 0 points first, then one more', () => {
    const g = seeded(3)
    toInput(g, 1)
    expect(g.phase).toBe('input')
    expect(g.length()).toBe(4)
    g.tap((g.seq[0] + 1) % 6)
    g.tick(800)
    g.tick(FOOT_LEAD_MS)
    expect(g.phase).toBe('show')
    const lit: number[] = []
    for (let t = 0; t < 4 * 700; t += 10) {
      const l = g.lit()
      if (l && lit[l.step] === undefined) lit[l.step] = l.point
      g.tick(10)
    }
    expect(lit).toEqual(g.seq.slice(0, 4))
  })

  it('lights for 340 ms with 140 ms gaps when hard', () => {
    const g = seeded(1, true)
    g.tick(FOOT_LEAD_MS)
    g.tick(339)
    expect(g.lit()?.step).toBe(0)
    g.tick(1)
    expect(g.lit()).toBeNull()
    g.tick(140)
    expect(g.lit()?.step).toBe(1)
  })
})

describe('FootGame stars', () => {
  it('3 stars for a clean game', () => {
    const g = seeded(2)
    play(g)
    expect(g.phase).toBe('done')
    expect(g.passed).toBe(3)
    expect(g.mistakes).toBe(0)
    expect(g.results).toEqual(['ok', 'ok', 'ok'])
    expect(g.stars()).toBe(3)
    expect(g.progress()).toBe(1)
  })

  it('replays a round after one wrong tap and still gives 3 stars', () => {
    const g = seeded(2)
    toInput(g, 1)
    const bad = (g.seq[0] + 1) % 6
    expect(g.tap(bad)).toBe('wrong')
    expect(g.phase).toBe('wrong')
    expect(g.wrongPoint).toBe(bad)
    g.tick(800)
    expect(g.phase).toBe('lead')
    g.tick(700)
    expect(g.phase).toBe('show')
    g.tick(4 * 700)
    expect(g.phase).toBe('input')
    play(g)
    expect(g.passed).toBe(3)
    expect(g.mistakes).toBe(1)
    expect(g.stars()).toBe(3)

    const h = seeded(2)
    play(h, { fails: { 1: 1 } })
    expect(h.passed).toBe(3)
    expect(h.mistakes).toBe(1)
    expect(h.stars()).toBe(3)
  })

  it('counts only the clock of the player turn', () => {
    const g = seeded(4)
    g.tick(FOOT_LEAD_MS)
    g.tick(2100)
    expect(g.phase).toBe('input')
    expect(g.elapsedMs).toBe(0)
    g.tick(100)
    expect(g.elapsedMs).toBe(100)
    g.tap((g.seq[0] + 1) % 6)
    g.tick(800)
    expect(g.elapsedMs).toBe(100)

    const n = seeded(4)
    n.tick(FOOT_LEAD_MS)
    n.tick(2100)
    for (let k = 0; k < 3; k++) n.tap(n.seq[k])
    expect(n.phase).toBe('next')
    n.tick(700)
    expect(n.elapsedMs).toBe(0)

    const h = seeded(4)
    play(h, { msPerTap: 1000 })
    expect(h.stars()).toBe(3)
    expect(h.elapsedMs).toBeGreaterThanOrEqual(11_500)
    expect(h.elapsedMs).toBeLessThanOrEqual(12_500)
  })

  it('2 stars when a round is skipped after a second wrong tap', () => {
    const g = seeded(5)
    play(g, { fails: { 1: 2 } })
    expect(g.results).toEqual(['ok', 'skip', 'ok'])
    expect(g.passed).toBe(2)
    expect(g.stars()).toBe(2)
  })

  it('goes through wrong2 to the next round', () => {
    const g = seeded(5)
    toInput(g, 1)
    g.tap((g.seq[0] + 1) % 6)
    g.tick(800)
    g.tick(FOOT_LEAD_MS)
    g.tick(4 * 700)
    expect(g.tap((g.seq[0] + 1) % 6)).toBe('wrong')
    expect(g.phase).toBe('wrong2')
    g.tick(800)
    expect(g.results).toEqual(['ok', 'skip'])
    expect(g.round).toBe(2)
    expect(g.phase).toBe('lead')
  })

  it('2 stars for 3 rounds with 2 mistakes', () => {
    const g = seeded(5)
    play(g, { fails: { 0: 1, 2: 1 } })
    expect(g.passed).toBe(3)
    expect(g.mistakes).toBe(2)
    expect(g.stars()).toBe(2)
  })

  it('1 star with one round passed, or with no taps at the limit', () => {
    const g = seeded(5)
    play(g, { fails: { 0: 2, 1: 2 } })
    expect(g.passed).toBe(1)
    expect(g.stars()).toBe(1)

    const h = seeded(5)
    h.tick(FOOT_LEAD_MS)
    h.tick(2100)
    h.tick(14_999)
    expect(h.phase).toBe('input')
    h.tick(1)
    expect(h.phase).toBe('done')
    expect(h.elapsedMs).toBe(15_000)
    expect(h.stars()).toBe(1)
  })

  it('hard plays rounds of 4, 5 and 6 for 3 stars', () => {
    const g = seeded(6, true)
    expect(g.rounds).toEqual([4, 5, 6])
    play(g)
    expect(g.passed).toBe(3)
    expect(g.stars()).toBe(3)
  })

  it('footStars', () => {
    expect(footStars(3, 1)).toBe(3)
    expect(footStars(3, 2)).toBe(2)
    expect(footStars(2, 0)).toBe(2)
    expect(footStars(1, 0)).toBe(1)
  })
})

describe('FootGame taps', () => {
  it('ignores taps outside the input phase', () => {
    const g = seeded(7)
    const ignored = () => {
      const { idx, mistakes } = g
      expect(g.tap(g.seq[0])).toBeNull()
      expect(g.idx).toBe(idx)
      expect(g.mistakes).toBe(mistakes)
    }
    ignored() // lead
    g.tick(FOOT_LEAD_MS)
    ignored() // show
    g.tick(2100)
    g.tap((g.seq[0] + 1) % 6)
    expect(g.phase).toBe('wrong')
    ignored()

    const h = seeded(7)
    h.tick(FOOT_LEAD_MS)
    h.tick(2100)
    for (let k = 0; k < 3; k++) h.tap(h.seq[k])
    expect(h.phase).toBe('next')
    expect(h.tap(h.seq[0])).toBeNull()
    expect(h.idx).toBe(3)
    expect(h.mistakes).toBe(0)
  })

  it('finds the nearest point within the tap radius', () => {
    FOOT_POINTS.forEach((p, i) => expect(footPointAt(p.x, p.y)).toBe(i))
    expect(footPointAt(FOOT_POINTS[5].x + 79, FOOT_POINTS[5].y)).toBe(5)
    expect(footPointAt(FOOT_POINTS[5].x + 81, FOOT_POINTS[5].y)).toBeNull()
    expect(footPointAt(540, 775)).toBe(0)
  })

  it('does nothing once done', () => {
    const g = seeded(8)
    play(g)
    const state = () => [g.phase, g.phaseMs, g.elapsedMs, g.mistakes, g.idx, g.round]
    const before = state()
    expect(g.tap(g.seq[0])).toBeNull()
    g.tick(1000)
    expect(state()).toEqual(before)
  })
})
