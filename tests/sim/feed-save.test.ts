import { describe, expect, it } from 'vitest'
import { RATING_WINDOW } from '../../src/config'
import { Chain } from '../../src/sim/chain'
import { emptyFeed, seededFeed } from '../../src/sim/feed'
import { createRng } from '../../src/sim/rng'
import { parseSave } from '../../src/sim/save'
import { SpaSim } from '../../src/sim/spa'
import type { Customer } from '../../src/sim/types'
import v35 from '../fixtures/save-v35.json'
import { advanceUntil, seatAndWait, starShop } from './helpers'

const opts = () => ({ rng: createRng(2), autoSpawn: false })
const viaJson = (sim: SpaSim) => SpaSim.fromSave(parseSave(JSON.parse(JSON.stringify(sim.toSave()))), opts())
const open = (raw: unknown) => SpaSim.fromSave(parseSave(structuredClone(raw)), opts())

/** A VIP seated, then walked out: three angry reviews with her id. */
const vipWalksOut = (sim: SpaSim): number => {
  const c = seatAndWait(sim, { vip: 'chef' })
  c.patienceMs = 1
  advanceUntil(sim, () => c.mood === 'angry')
  return c.id
}

/** `n` more reviews of `score`, each from a customer numbered from `first`. */
const reviewsFrom = (sim: SpaSim, first: number, n: number, score: number) => {
  const review = (sim as unknown as { addReview(c: Customer, score: number): void }).addReview.bind(sim)
  for (let i = 0; i < n; i++) review({ id: first + i, kol: false, vip: null, idol: null, kind: 'office' } as Customer, score)
}

describe('the feed in an old save', () => {
  it('is closed and empty for a save from before day 8', () => {
    const sim = open({ ...structuredClone(v35), day: 5 })
    expect([sim.feed.open, sim.feed.followers, sim.feed.posts]).toEqual([false, 0, []])
  })

  it('is seeded without cheer cards for a save past day 8', () => {
    const sim = open({ ...structuredClone(v35), day: 30 })
    expect(sim.feed.open).toBe(true)
    expect(sim.feed.followers).toBeGreaterThan(0)
    expect(sim.feed.cheer).toEqual([])
    expect(sim.feed).toEqual(seededFeed({ day: 30, rankStars: sim.rank.stars, idolsMet: 0, wins: sim.rank.wins }))
  })
})

describe('an id beside each review', () => {
  it('stays in step with the reviews past the window, and a VIP walking out adds her id three times', () => {
    const sim = new SpaSim(opts())
    const vip = vipWalksOut(sim)
    expect(sim.reviewIds).toEqual([vip, vip, vip])
    reviewsFrom(sim, 100, 25, 5)
    expect(sim.reviewIds).toHaveLength(sim.reviews.length)
    const saved = sim.toSave()
    expect([saved.reviews.length, saved.reviewIds.length]).toEqual([RATING_WINDOW, RATING_WINDOW])
    const back = viaJson(sim)
    expect([back.reviews.length, back.reviewIds.length]).toEqual([RATING_WINDOW, RATING_WINDOW])
    expect(back.reviewIds.at(-1)).toBe(124)
  })

  it('lines the VIP ids up with her scores while they are inside the window', () => {
    const sim = new SpaSim(opts())
    reviewsFrom(sim, 100, 20, 5)
    const vip = vipWalksOut(sim)
    reviewsFrom(sim, 200, 2, 4)
    const back = viaJson(sim)
    expect(back.reviews.slice(-5)).toEqual([1, 1, 1, 4, 4])
    expect(back.reviewIds.slice(-5)).toEqual([vip, vip, vip, 200, 201])
    expect(back.reviewIds).toHaveLength(back.reviews.length)
  })
})

describe('a branch and the feed', () => {
  it('shares the main feed, before and after a save, and saves an empty one of its own', () => {
    const chain = new Chain(starShop(), 7)
    expect(chain.open('beach')).toBeNull()
    expect(chain.shop('beach')!.feed).toBe(chain.main.feed)
    chain.main.feed.followers = 1234
    const saved = chain.toSave()
    expect(saved.chain!.branches[0].feed).toEqual(emptyFeed())
    const back = Chain.fromSave(parseSave(JSON.parse(JSON.stringify(saved))), 7)
    expect(back.main.feed.followers).toBe(1234)
    expect(back.shop('beach')!.feed).toBe(back.main.feed)
  })
})
