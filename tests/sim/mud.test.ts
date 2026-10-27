import { describe, expect, it } from 'vitest'
import { MUD_LIMIT_MS } from '../../src/config'
import { MudGame, mudStars } from '../../src/sim/mud'
import { createRng } from '../../src/sim/rng'

const seeds = [1, 2, 3, 4, 5]

/** Plays a whole game holding while mark + 0.35 × speed is under the band, re-decided before every 50 ms tick. */
const play = (seed: number, hard: boolean) => {
  const g = new MudGame(createRng(seed), hard)
  while (g.phase === 'play') {
    g.hold(g.mark + 0.35 * g.speed < g.band)
    g.tick(50)
  }
  return g
}

describe('MudGame', () => {
  it('starts cold at the bottom of the column with the band in the middle', () => {
    const g = new MudGame(createRng(1))
    expect(g.mark).toBe(0.25)
    expect(g.speed).toBe(0)
    expect(g.band).toBe(0.5)
    expect(g.feel()).toBe('cold')
    expect(g.half).toBe(0.11)
    expect(new MudGame(createRng(1), true).half).toBe(0.08)
  })

  it('cools to the bottom and stops there when released', () => {
    const g = new MudGame(createRng(1))
    g.tick(3000)
    expect(g.mark).toBe(0)
    expect(g.speed).toBe(0)
  })

  it('heats no faster than the top speed, reaches the top and stops, then drops when released', () => {
    const g = new MudGame(createRng(1))
    g.hold(true)
    g.tick(1000)
    expect(g.mark - 0.25).toBeLessThanOrEqual(0.55)
    g.tick(4000)
    expect(g.mark).toBe(1)
    expect(g.speed).toBe(0)
    g.hold(false)
    g.tick(200)
    expect(g.mark).toBeLessThan(1)
  })

  it('keeps the band in range, drifting slowly, and still until the first retarget', () => {
    for (const seed of seeds) {
      const g = new MudGame(createRng(seed))
      let prev = g.band
      while (g.phase === 'play') {
        g.tick(50)
        expect(g.band).toBeGreaterThanOrEqual(0.18)
        expect(g.band).toBeLessThanOrEqual(0.82)
        expect(Math.abs(g.band - prev)).toBeLessThanOrEqual(0.16 * 0.05 + 1e-9)
        if (g.elapsedMs < 1000) expect(g.band).toBe(0.5)
        prev = g.band
      }
    }
  })

  it('plays one long tick the same as many short ones', () => {
    const a = new MudGame(createRng(3))
    const b = new MudGame(createRng(3))
    a.hold(true)
    b.hold(true)
    a.tick(1000)
    for (let i = 0; i < 20; i++) b.tick(50)
    const state = (g: MudGame) => [g.phase, g.elapsedMs, g.insideMs, g.mark, g.speed, g.band]
    expect(state(a)).toEqual(state(b))
  })

  it('counts no inside time while the mark sinks under the band, and never more than elapsed', () => {
    const g = new MudGame(createRng(1))
    g.tick(2000)
    expect(g.insideMs).toBe(0)
    for (const seed of seeds) {
      const p = new MudGame(createRng(seed))
      while (p.phase === 'play') {
        p.hold(p.mark < p.band)
        p.tick(50)
        expect(p.insideMs).toBeLessThanOrEqual(p.elapsedMs)
      }
    }
  })

  it('ends at the limit and never counts past it', () => {
    const g = new MudGame(createRng(1))
    g.tick(MUD_LIMIT_MS - 1)
    expect(g.phase).toBe('play')
    g.tick(5000)
    expect(g.phase).toBe('done')
    expect(g.elapsedMs).toBe(MUD_LIMIT_MS)
    g.tick(1000)
    expect(g.elapsedMs).toBe(MUD_LIMIT_MS)
  })

  it('can be won: a player who anticipates the band stays inside at least 90% of the time', () => {
    for (const hard of [false, true]) {
      for (const seed of seeds) {
        const g = play(seed, hard)
        expect(g.insideMs / MUD_LIMIT_MS).toBeGreaterThanOrEqual(0.9)
        expect(g.stars()).toBe(3)
      }
    }
  })

  it('has no stars before it is done', () => {
    const g = new MudGame(createRng(1))
    g.tick(5000)
    expect(g.stars()).toBeNull()
  })
})

describe('mudStars', () => {
  it('gives 3 stars from 0.7 and 2 from 0.45', () => {
    expect(mudStars(0.7)).toBe(3)
    expect(mudStars(0.69)).toBe(2)
    expect(mudStars(0.45)).toBe(2)
    expect(mudStars(0.44)).toBe(1)
  })
})
