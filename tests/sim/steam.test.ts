import { describe, expect, it } from 'vitest'
import { STEAM_FALL_MS_HARD, STEAM_LANES, STEAM_LANE_JITTER, STEAM_LIMIT_MS, STEAM_NEED } from '../../src/config'
import { createRng } from '../../src/sim/rng'
import { RECIPES } from '../../src/sim/recipes'
import { DECOYS, SteamGame, type Falling } from '../../src/sim/steam'

const first = (g: SteamGame, good: boolean): Falling => {
  for (let i = 0; i < 400; i++) {
    const f = g.falling().find(x => x.good === good)
    if (f) return f
    g.tick(100)
  }
  throw new Error('none showed')
}

/** Catches `n` good things and `m` decoys, then reports the game. */
const play = (n: number, m: number) => {
  const g = new SteamGame(createRng(3))
  for (let i = 0; i < m; i++) g.tap(first(g, false).id)
  for (let i = 0; i < n; i++) g.tap(first(g, true).id)
  return g
}

describe('SteamGame', () => {
  it('shows the first thing at the first tick, then keeps a 550-800 ms gap', () => {
    const g = new SteamGame(createRng(1))
    expect(g.falling()).toEqual([])
    g.tick(1)
    expect(g.falling()).toHaveLength(1)
    const seen = new Set<number>()
    const at: number[] = []
    for (let t = 1; t < 9000; t++) {
      g.tick(1)
      for (const f of g.falling()) if (!seen.has(f.id)) { seen.add(f.id); at.push(t) }
    }
    expect(at.length).toBeGreaterThan(8)
    for (let i = 1; i < at.length; i++) {
      expect(at[i] - at[i - 1]).toBeGreaterThanOrEqual(549)
      expect(at[i] - at[i - 1]).toBeLessThanOrEqual(801)
    }
    for (const f of g.falling()) {
      expect(f.x).toBeGreaterThanOrEqual(0)
      expect(f.x).toBeLessThanOrEqual(1)
    }
  })

  it('marks good things as the recipe leaves and decoys as the decoys', () => {
    const g = new SteamGame(createRng(2))
    for (let i = 0; i < 30; i++) g.tick(700)
    for (const f of g.falling()) {
      const inRecipe = (RECIPES.steam.ingredients as readonly string[]).includes(f.thing)
      expect(f.good).toBe(inRecipe)
      expect(inRecipe || (DECOYS as readonly string[]).includes(f.thing)).toBe(true)
    }
  })

  it('counts a good tap and removes the thing', () => {
    const g = new SteamGame(createRng(4))
    const f = first(g, true)
    expect(g.tap(f.id)).toBe('good')
    expect(g.got).toBe(1)
    expect(g.falling().some(x => x.id === f.id)).toBe(false)
  })

  it('counts a decoy tap as a miss and removes it', () => {
    const g = new SteamGame(createRng(4))
    const f = first(g, false)
    expect(g.tap(f.id)).toBe('wrong')
    expect(g.misses).toBe(1)
    expect(g.got).toBe(0)
    expect(g.falling().some(x => x.id === f.id)).toBe(false)
  })

  it('ignores unknown ids, repeat taps and taps once done', () => {
    const g = new SteamGame(createRng(4))
    expect(g.tap(999)).toBeNull()
    const f = first(g, true)
    g.tap(f.id)
    expect(g.tap(f.id)).toBeNull()
    g.tick(STEAM_LIMIT_MS)
    expect(g.phase).toBe('done')
    const before = [g.got, g.misses]
    expect(g.tap(g.falling()[0]?.id ?? 1)).toBeNull()
    expect([g.got, g.misses]).toEqual(before)
  })

  it('drops a thing that falls out without a penalty', () => {
    const g = new SteamGame(createRng(5))
    g.tick(1)
    const f = g.falling()[0]
    expect(f.y).toBeLessThan(1)
    g.tick(6000)
    expect(g.falling().some(x => x.id === f.id)).toBe(false)
    expect(g.misses).toBe(0)
    expect(g.got).toBe(0)
  })

  it('ends the moment the sixth good thing is caught', () => {
    const g = play(STEAM_NEED - 1, 0)
    expect(g.phase).toBe('play')
    g.tap(first(g, true).id)
    expect(g.phase).toBe('done')
    expect(g.got).toBe(STEAM_NEED)
  })

  it('ends when the time limit is reached', () => {
    const g = new SteamGame(createRng(6))
    g.tick(STEAM_LIMIT_MS - 1)
    expect(g.phase).toBe('play')
    g.tick(1)
    expect(g.phase).toBe('done')
    expect(g.elapsedMs).toBe(STEAM_LIMIT_MS)
  })

  it('rates stars from catches and misses, and is null before done', () => {
    expect(new SteamGame(createRng(1)).stars()).toBeNull()
    expect(play(6, 0).stars()).toBe(3)
    expect(play(6, 2).stars()).toBe(2)
    const timedOut = (n: number, m: number) => {
      const g = play(n, m)
      expect(g.stars()).toBeNull()
      g.tick(STEAM_LIMIT_MS)
      return g.stars()
    }
    expect(timedOut(4, 3)).toBe(1)
    expect(timedOut(3, 0)).toBe(1)
    expect(timedOut(4, 2)).toBe(2)
  })

  it('in hard mode over 200 spawns, 60% decoys and every fall 3000-4500 ms', () => {
    let decoys = 0
    for (let seed = 1; seed <= 200; seed++) {
      const g = new SteamGame(createRng(seed), true)
      g.tick(1)
      const f = g.falling()[0]
      if (!f.good) decoys++
      let ms = 1
      while (g.falling().some(x => x.id === f.id)) { g.tick(1); ms++ }
      expect(ms).toBeGreaterThanOrEqual(STEAM_FALL_MS_HARD.min)
      expect(ms).toBeLessThanOrEqual(STEAM_FALL_MS_HARD.max + 1)
    }
    expect(Math.abs(decoys / 200 - 0.6)).toBeLessThanOrEqual(0.08)
  })

  it('over 200+ spawns, never reuses either of the last two lanes and stays near its lane centre', () => {
    let spawns = 0
    for (let seed = 1; seed <= 12; seed++) {
      const g = new SteamGame(createRng(seed))
      const xs: number[] = []
      const seen = new Set<number>()
      while (g.phase === 'play') {
        g.tick(50)
        for (const f of g.falling()) {
          if (seen.has(f.id)) continue
          seen.add(f.id)
          xs.push(f.x)
        }
      }
      const lanes = xs.map(x => Math.floor(x * STEAM_LANES))
      lanes.forEach((lane, i) => {
        if (i >= 1) expect(lane).not.toBe(lanes[i - 1])
        if (i >= 2) expect(lane).not.toBe(lanes[i - 2])
        expect(Math.abs(xs[i] - (lane + 0.5) / STEAM_LANES)).toBeLessThanOrEqual(STEAM_LANE_JITTER + 1e-9)
      })
      spawns += xs.length
    }
    expect(spawns).toBeGreaterThanOrEqual(200)
  })
})
