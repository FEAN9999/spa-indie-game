import { describe, expect, it } from 'vitest'
import { MASSAGE_GAP_MS, MASSAGE_GAP_MS_HARD, MASSAGE_POINTS, RING_MS, RING_MS_HARD } from '../../src/config'
import { MassageGame, type Judgement } from '../../src/sim/massage'

/** Waits out the gap after a judgement; the next point shows at its very start. */
const next = (g: MassageGame, gapMs = MASSAGE_GAP_MS) => {
  expect(g.current()).toBeNull()
  g.tick(gapMs)
  expect(g.current()).not.toBeNull()
}

/** Plays the point showing: a tap pressed on the point `offMs` from its close (negative is early), a hold held until full. */
const play = (g: MassageGame, offMs = 0, ringMs = RING_MS) => {
  const p = g.current()!
  if (p.kind === 'tap') {
    g.tick(ringMs + offMs)
    g.press(p.x, p.y)
  } else {
    g.press(p.x, p.y)
    g.tick(1500)
    g.release()
  }
}

/** Plays a whole round, judging point i as `want(i)`: a good is a tap 300 ms early, a miss a tap far too early or a hold left alone. */
const round = (want: (i: number) => Judgement) => {
  const g = new MassageGame()
  for (let i = 0; i < 10; i++) {
    const p = g.current()!
    expect([p.index, p.kind]).toEqual([i, i === 3 || i === 7 ? 'hold' : 'tap'])
    const w = want(i)
    if (w === 'perfect') play(g)
    else if (w === 'good') play(g, -300)
    else if (p.kind === 'tap') g.press(p.x, p.y)
    else g.tick(4000)
    expect(g.results).toHaveLength(i + 1)
    if (i === 9) break
    expect([g.phase, g.stars()]).toEqual(['play', null])
    next(g)
  }
  return g
}

describe('MassageGame', () => {
  it('spreads ten points over the back, at least 0.5 apart', () => {
    expect(MASSAGE_POINTS).toHaveLength(10)
    for (const p of MASSAGE_POINTS) {
      expect(Math.abs(p.x)).toBeLessThanOrEqual(0.7)
      expect(Math.abs(p.y)).toBeLessThanOrEqual(0.7)
    }
    MASSAGE_POINTS.forEach((a, i) => MASSAGE_POINTS.slice(i + 1).forEach(b => expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(0.5)))
  })

  it('judges a tap by how close to the ring closing it lands', () => {
    const g = new MassageGame()
    expect(g.current()).toEqual({ index: 0, kind: 'tap', x: MASSAGE_POINTS[0].x, y: MASSAGE_POINTS[0].y, ring: 1 })
    g.tick(RING_MS / 2)
    expect(g.current()!.ring).toBeCloseTo(0.5)
    g.tick(RING_MS / 2 - 100)
    const first = g.current()!
    g.press(first.x, first.y)
    expect(g.results).toEqual(['perfect'])
    expect(g.lastJudgement()).toBe('perfect')

    // the next point shows a gap after the last is judged
    g.tick(MASSAGE_GAP_MS - 1)
    expect(g.current()).toBeNull()
    g.tick(1)
    expect(g.current()).toMatchObject({ index: 1, ring: 1 })
    play(g, -300)
    expect(g.lastJudgement()).toBe('good')

    next(g)
    play(g, 150)
    // index 3 is a hold point
    next(g)
    play(g)
    next(g)
    play(g, 350)
    expect(g.results).toEqual(['perfect', 'good', 'perfect', 'perfect', 'good'])
    // index 5: pressed on the point long before its ring closes
    next(g)
    play(g, -351)
    expect(g.lastJudgement()).toBe('miss')
    expect(g.elapsedMs).toBe(RING_MS - 100 + 5 * MASSAGE_GAP_MS + (RING_MS - 300) + (RING_MS + 150) + 1500 + (RING_MS + 350) + (RING_MS - 351))
  })

  it('ignores a press away from the point and misses a point nobody touched', () => {
    const g = new MassageGame()
    const p = g.current()!
    g.tick(RING_MS)
    g.press(p.x + 0.26, p.y)
    expect(g.results).toEqual([])
    // still pressable at close + the good window, missed just after
    g.tick(350)
    expect(g.current()!.ring).toBe(0)
    expect(g.results).toEqual([])
    g.tick(1)
    expect(g.results).toEqual(['miss'])
    // a press in the gap does nothing
    g.press(MASSAGE_POINTS[1].x, MASSAGE_POINTS[1].y)
    expect(g.results).toEqual(['miss'])

    // within 0.25 of the point counts
    g.tick(MASSAGE_GAP_MS - 1)
    const q = g.current()!
    g.tick(RING_MS)
    g.press(q.x, q.y + 0.24)
    expect(g.results).toEqual(['miss', 'perfect'])

    // a long tick misses the point and carries on through the gap into the next one
    g.tick(MASSAGE_GAP_MS + RING_MS + 350 + 1 + MASSAGE_GAP_MS + 10)
    expect(g.results).toEqual(['miss', 'perfect', 'miss'])
    expect(g.current()).toMatchObject({ index: 3, kind: 'hold', ring: 0 })
  })

  it('fills a hold point only while held, and misses it after 4 s', () => {
    const g = new MassageGame()
    for (let i = 0; i < 3; i++) {
      play(g)
      next(g)
    }
    const hold = g.current()!
    expect(hold).toMatchObject({ index: 3, kind: 'hold', ring: 0, x: MASSAGE_POINTS[3].x, y: MASSAGE_POINTS[3].y })
    g.tick(500)
    expect(g.current()!.ring).toBe(0)
    g.press(hold.x + 0.3, hold.y)
    g.tick(500)
    expect(g.current()!.ring).toBe(0)

    g.press(hold.x, hold.y)
    g.tick(1000)
    expect(g.current()!.ring).toBeCloseTo(1000 / 1500)
    g.release()
    expect(g.current()!.ring).toBe(0)
    g.press(hold.x, hold.y)
    g.tick(1499)
    expect(g.results).toHaveLength(3)
    g.tick(1)
    expect(g.lastJudgement()).toBe('perfect')

    for (let i = 4; i < 7; i++) {
      next(g)
      play(g)
    }
    next(g)
    const second = g.current()!
    expect(second).toMatchObject({ index: 7, kind: 'hold' })
    g.press(second.x, second.y)
    g.tick(1000)
    g.release()
    g.tick(2999)
    expect(g.results).toHaveLength(7)
    g.tick(1)
    expect(g.results).toHaveLength(8)
    expect(g.lastJudgement()).toBe('miss')
  })

  it('plays faster with tighter windows for a picky customer', () => {
    const normal = new MassageGame()
    const hard = new MassageGame(true)
    expect(hard.ringMs).toBe(RING_MS_HARD)
    hard.tick(RING_MS_HARD / 2)
    expect(hard.current()!.ring).toBeCloseTo(0.5)
    hard.tick(RING_MS_HARD / 2 - 120)
    hard.press(MASSAGE_POINTS[0].x, MASSAGE_POINTS[0].y)
    normal.tick(RING_MS - 120)
    normal.press(MASSAGE_POINTS[0].x, MASSAGE_POINTS[0].y)
    expect([normal.lastJudgement(), hard.lastJudgement()]).toEqual(['perfect', 'good'])

    next(hard, MASSAGE_GAP_MS_HARD)
    play(hard, -100, RING_MS_HARD)
    next(hard, MASSAGE_GAP_MS_HARD)
    play(hard, 220, RING_MS_HARD)
    // the hold point is the same for everyone
    next(hard, MASSAGE_GAP_MS_HARD)
    play(hard)
    next(hard, MASSAGE_GAP_MS_HARD)
    play(hard, -221, RING_MS_HARD)
    expect(hard.results).toEqual(['good', 'perfect', 'good', 'perfect', 'miss'])
    // unpressed: missed just after close + 220 ms
    next(hard, MASSAGE_GAP_MS_HARD)
    hard.tick(RING_MS_HARD + 220)
    expect(hard.results).toHaveLength(5)
    hard.tick(1)
    expect(hard.lastJudgement()).toBe('miss')
  })

  it('stars by score after the tenth point', () => {
    const perfect = round(() => 'perfect')
    expect([perfect.phase, perfect.score(), perfect.stars(), perfect.current()]).toEqual(['done', 20, 3, null])
    const marks: [(i: number) => Judgement, number, number][] = [
      [i => (i < 2 ? 'miss' : 'perfect'), 16, 3],
      [i => (i < 2 ? 'miss' : i === 2 ? 'good' : 'perfect'), 15, 2],
      [i => (i % 2 ? 'miss' : 'perfect'), 10, 2],
      [i => (i % 2 ? 'miss' : i === 0 ? 'good' : 'perfect'), 9, 1],
      [() => 'miss', 0, 1],
    ]
    for (const [want, score, stars] of marks) {
      const g = round(want)
      expect([g.phase, g.score(), g.stars()]).toEqual(['done', score, stars])
    }

    // nothing more happens once done
    const elapsed = perfect.elapsedMs
    perfect.tick(5000)
    perfect.press(MASSAGE_POINTS[0].x, MASSAGE_POINTS[0].y)
    expect([perfect.elapsedMs, perfect.results.length, perfect.current()]).toEqual([elapsed, 10, null])
  })
})
