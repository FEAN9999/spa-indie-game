import { describe, expect, it } from 'vitest'
import { ACNE_AT, ACNE_LIFT_MS, ACNE_LIFT_MS_HARD, ACNE_LIMIT_MS, ACNE_POP_MS, ACNE_SPOTS, ACNE_SPOTS_HARD, ACNE_TAP_R } from '../../src/config'
import { AcneGame, acneStars } from '../../src/sim/acne'
import { createRng } from '../../src/sim/rng'

const at = (g: AcneGame, i: number) => ACNE_AT[g.spots[i].at]
const whites = (g: AcneGame) => g.spots.map((s, i) => (s.kind === 'white' ? i : -1)).filter(i => i >= 0)
const reds = (g: AcneGame) => g.spots.map((s, i) => (s.kind === 'red' ? i : -1)).filter(i => i >= 0)
/** Holds spot `i` for `ms`, ticking in frames, then lifts. */
const holdFor = (g: AcneGame, i: number, ms: number) => {
  g.press(at(g, i).x, at(g, i).y)
  for (let t = 0; t < ms && g.held !== null; t += 10) g.tick(10)
  return g.release()
}

describe('the Lấy nhân mụn game', () => {
  it('lays out whiteheads and red ones at different places, more for a picky customer', () => {
    const g = new AcneGame(createRng(2))
    expect(g.spots).toHaveLength(ACNE_SPOTS.total)
    expect(whites(g)).toHaveLength(ACNE_SPOTS.white)
    expect(new Set(g.spots.map(s => s.at)).size).toBe(ACNE_SPOTS.total)
    const hard = new AcneGame(createRng(2), true)
    expect(hard.spots).toHaveLength(ACNE_SPOTS_HARD.total)
    expect(whites(hard)).toHaveLength(ACNE_SPOTS_HARD.white)
  })

  it('pops a held whitehead and clears it when the finger lifts in time', () => {
    const g = new AcneGame(createRng(2))
    const w = whites(g)[0]
    expect(g.press(at(g, w).x + 10, at(g, w).y)).toBe('hold')
    let told = null
    for (let t = 0; t < ACNE_POP_MS; t += 10) told = g.tick(10) ?? told
    expect(told).toBe('pop')
    expect(g.release()).toBe('cleared')
    expect(g.spots[w].state).toBe('cleared')
    expect(g.mistakes).toBe(0)
  })

  it('leaves a whitehead whole when the finger lifts before the pop', () => {
    const g = new AcneGame(createRng(2))
    const w = whites(g)[0]
    expect(holdFor(g, w, ACNE_POP_MS - 100)).toBe('early')
    expect(g.spots[w].state).toBe('whole')
    expect(g.press(at(g, w).x, at(g, w).y)).toBe('hold')
  })

  it('bruises the skin when the finger stays on past the grace, sooner for a picky customer', () => {
    const g = new AcneGame(createRng(2))
    const w = whites(g)[0]
    g.press(at(g, w).x, at(g, w).y)
    let told = null
    for (let t = 0; t < ACNE_POP_MS + ACNE_LIFT_MS && g.held !== null; t += 10) told = g.tick(10) ?? told
    expect(told).toBe('bruise')
    expect(g.spots[w].state).toBe('bruised')
    expect(g.mistakes).toBe(1)
    expect(g.release()).toBeNull()
    const hard = new AcneGame(createRng(2), true)
    const hw = whites(hard)[0]
    hard.press(at(hard, hw).x, at(hard, hw).y)
    for (let t = 0; t < ACNE_POP_MS + ACNE_LIFT_MS_HARD + 10; t += 10) hard.tick(10)
    expect(hard.spots[hw].state).toBe('bruised')
  })

  it('angers a red one pressed, once, and ignores touches far from any blemish', () => {
    const g = new AcneGame(createRng(2))
    const r = reds(g)[0]
    expect(g.press(at(g, r).x, at(g, r).y)).toBe('red')
    expect(g.press(at(g, r).x, at(g, r).y)).toBeNull()
    expect(g.mistakes).toBe(1)
    expect(g.press(0, 0)).toBeNull()
    expect(g.spotAt(at(g, r).x + ACNE_TAP_R + 1, at(g, r).y)).not.toBe(r)
  })

  it('turns to dabbing once every whitehead is cleared, and ends when each is dabbed', () => {
    const g = new AcneGame(createRng(5))
    for (const w of whites(g)) {
      expect(g.phase).toBe('pop')
      holdFor(g, w, ACNE_POP_MS + 50)
    }
    expect(g.phase).toBe('dab')
    const r = reds(g)[0]
    expect(g.press(at(g, r).x, at(g, r).y)).toBeNull()
    for (const w of whites(g)) {
      expect(g.stars()).toBeNull()
      expect(g.press(at(g, w).x, at(g, w).y)).toBe('dab')
      expect(g.press(at(g, w).x, at(g, w).y)).toBeNull()
    }
    expect(g.phase).toBe('done')
    expect(g.stars()).toBe(3)
    expect(g.progress()).toBe(1)
  })

  it('ends at the time limit with what is left counted', () => {
    const g = new AcneGame(createRng(5))
    holdFor(g, whites(g)[0], ACNE_POP_MS + 50)
    g.tick(ACNE_LIMIT_MS)
    expect(g.phase).toBe('done')
    expect(g.left()).toBe(ACNE_SPOTS.white)
    expect(g.stars()).toBe(1)
  })

  it('gives 3 stars for everything done without a mistake, 2 for one step left or two mistakes', () => {
    expect([acneStars({ left: 0, mistakes: 0 }), acneStars({ left: 0, mistakes: 1 }), acneStars({ left: 1, mistakes: 2 }), acneStars({ left: 2, mistakes: 0 }), acneStars({ left: 0, mistakes: 3 })]).toEqual([3, 2, 2, 1, 1])
  })

  it('gives a player who lifts 250 ms after the pop (200 ms picky) 3 stars on every seed', () => {
    for (const hard of [false, true])
      for (let seed = 1; seed <= 30; seed++) {
        const g = new AcneGame(createRng(seed), hard)
        for (const w of whites(g)) holdFor(g, w, ACNE_POP_MS + (hard ? 200 : 250))
        for (const w of whites(g)) g.press(at(g, w).x, at(g, w).y)
        expect(g.stars(), `seed ${seed} hard ${hard}`).toBe(3)
      }
  })
})
