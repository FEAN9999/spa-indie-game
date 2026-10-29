import { describe, expect, it } from 'vitest'
import { ScrubGame, scrubStars } from '../../src/sim/scrub'

const TURN = 2 * Math.PI
const angles = new WeakMap<ScrubGame, number>()

/** Circles the finger round the current patch at `tps` turns a second, in 16 ms frames: one move, then one tick. */
const spin = (g: ScrubGame, tps: number, ms: number, r = 110, dir = 1, until?: () => boolean) => {
  let a = angles.get(g) ?? 0
  const at = () => {
    const s = g.spot()
    return s ? { x: s.x + r * Math.cos(a), y: s.y + r * Math.sin(a) } : null
  }
  const first = at()
  if (first) g.down(first.x, first.y)
  for (let t = 0; t < ms && g.phase === 'play'; t += 16) {
    a += dir * tps * TURN * 0.016
    const p = at()
    if (p) g.move(p.x, p.y)
    g.tick(16)
    if (until?.()) break
  }
  angles.set(g, a)
}

const wait = (g: ScrubGame, ms: number) => {
  for (let t = 0; t < ms && g.phase === 'play'; t += 16) g.tick(16)
}

describe('ScrubGame', () => {
  it('starts with four patches and the normal cap, five and a lower cap when hard', () => {
    const g = new ScrubGame()
    expect(g.spots).toHaveLength(4)
    expect(g.cap).toBe(2.5)
    expect(g.progress()).toBe(0)
    expect(g.stars()).toBeNull()
    const h = new ScrubGame(true)
    expect(h.spots).toHaveLength(5)
    expect(h.cap).toBe(1.8)
  })

  it('gives 3 stars to a steady hand within the speed band, either way round', () => {
    for (const [tps, dir] of [[1.5, 1], [0.7, 1], [2.4, 1], [1.5, -1]] as const) {
      const g = new ScrubGame()
      spin(g, tps, 20_000, 110, dir)
      expect(g.phase, `${tps} ${dir}`).toBe('done')
      expect(g.cleaned).toBe(4)
      expect(g.burns).toBe(0)
      expect(g.stars()).toBe(3)
      expect(g.progress()).toBe(1)
      if (tps === 1.5) expect(g.elapsedMs).toBeLessThan(9000)
    }
  })

  it('gives 2 stars for three clean patches, or for a second burn', () => {
    const a = new ScrubGame()
    spin(a, 1.5, 20_000, 110, 1, () => a.cleaned === 3)
    wait(a, 20_000)
    expect(a.stars()).toBe(2)

    const b = new ScrubGame()
    spin(b, 3.2, 600)
    spin(b, 1, 1000)
    spin(b, 3.2, 600)
    spin(b, 1.5, 20_000)
    expect(b.cleaned).toBe(4)
    expect(b.burns).toBe(2)
    expect(b.stars()).toBe(2)
  })

  it('gives 1 star for two patches, or for going fast forever', () => {
    const a = new ScrubGame()
    spin(a, 1.5, 20_000, 110, 1, () => a.cleaned === 2)
    wait(a, 20_000)
    expect(a.stars()).toBe(1)

    const b = new ScrubGame()
    spin(b, 3, 20_000)
    expect(b.burns).toBe(1)
    expect(b.cleaned).toBe(0)
    expect(b.stars()).toBe(1)
    expect(b.elapsedMs).toBe(20_000)
  })

  it('plays the hard game with five patches and a lower cap', () => {
    const a = new ScrubGame(true)
    spin(a, 1.5, 20_000)
    expect(a.cleaned).toBe(5)
    expect(a.stars()).toBe(3)

    const b = new ScrubGame(true)
    spin(b, 2.4, 20_000)
    expect(b.burns).toBe(1)
    expect(b.stars()).toBe(1)

    const c = new ScrubGame(true)
    spin(c, 1.5, 20_000, 110, 1, () => c.cleaned === 3)
    wait(c, 20_000)
    expect(c.stars()).toBe(2)
  })

  it('cries Rát quá! over the cap and counts again only once the speed falls under 80% of it', () => {
    const g = new ScrubGame()
    spin(g, 3, 700)
    expect(g.burns).toBe(1)
    expect(g.armed).toBe(false)
    const turns = g.turns
    spin(g, 2.2, 3000)
    expect(g.burns).toBe(1)
    expect(g.turns).toBe(turns)
    expect(g.armed).toBe(false)
    spin(g, 1.5, 500)
    expect(g.armed).toBe(true)
    spin(g, 1.5, 1500)
    expect(g.turns).toBeGreaterThan(turns)
  })

  it('drops the turn under way when it burns, keeping the turns already counted', () => {
    const g = new ScrubGame()
    spin(g, 1.5, 20_000, 110, 1, () => g.steps === 1 && Math.abs(g.acc) >= Math.PI)
    expect(g.steps).toBe(1)
    spin(g, 8, 20_000, 110, 1, () => g.burns === 1)
    expect(g.burns).toBe(1)
    expect(g.steps).toBe(1)
    expect(g.acc).toBe(0)
  })

  it('burns once when the speed wobbles between 2.2 and 2.8 turns a second', () => {
    const g = new ScrubGame()
    for (let t = 0; t < 6000; t += 300) spin(g, (t / 300) % 2 === 0 ? 2.2 : 2.8, 300)
    expect(g.burns).toBe(1)
  })

  it('pauses counting in the dead zone and past the far limit', () => {
    for (const r of [30, 280]) {
      const g = new ScrubGame()
      spin(g, 1, 3000, r)
      expect(g.turns, `r ${r}`).toBe(0)
      expect(g.burns).toBe(0)
    }
    for (const r of [50, 250]) {
      const g = new ScrubGame()
      spin(g, 1, 3000, r)
      expect(g.turns, `r ${r}`).toBeGreaterThanOrEqual(2)
    }
  })

  it('does not count the gap when the finger is lifted and put down elsewhere', () => {
    const g = new ScrubGame()
    const s = g.spot()!
    const at = (a: number) => [s.x + 110 * Math.cos(a), s.y + 110 * Math.sin(a)] as const
    g.down(...at(0))
    g.move(...at(Math.PI / 2))
    g.up()
    g.down(...at(Math.PI))
    g.move(...at((3 * Math.PI) / 2))
    expect(g.acc).toBeCloseTo(Math.PI, 5)
  })

  it('ends at the time limit with 1 star, and nothing changes after', () => {
    const g = new ScrubGame()
    wait(g, 20_000)
    expect(g.phase).toBe('done')
    expect(g.elapsedMs).toBe(20_000)
    expect(g.stars()).toBe(1)
    g.tick(500)
    g.move(0, 0)
    g.move(-150, -90)
    expect(g.elapsedMs).toBe(20_000)
    expect(g.acc).toBe(0)
  })

  it('works out the stars from patches cleaned and burns', () => {
    expect(scrubStars(4, 4, 1)).toBe(3)
    expect(scrubStars(4, 4, 2)).toBe(2)
    expect(scrubStars(3, 5, 0)).toBe(2)
    expect(scrubStars(2, 4, 0)).toBe(1)
  })
})
