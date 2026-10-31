import { describe, expect, it } from 'vitest'
import { BOOST, FESTIVAL_ARRIVAL, FESTIVAL_PATIENCE } from '../../src/config'
import { Chain } from '../../src/sim/chain'
import { addPost, boostedToday, boostPrice, emptyFeed, openFeed, repairFeed } from '../../src/sim/feed'
import type { BoostTier, Post, PostDraft } from '../../src/sim/feed'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import { ownerServes, starShop } from './helpers'

const OLD = { day: 1, rankStars: 0, idolsMet: 0, wins: 0 }
const TIERS: BoostTier[] = ['small', 'medium', 'large']

/** A shop on day 10 with its Phây open, rich enough to boost. */
function on(day = 10): SpaSim {
  const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
  sim.profileDone = true
  sim.day = day - 1
  sim.startDay()
  sim.drainEvents()
  openFeed(sim.feed)
  sim.money = 20_000_000
  return sim
}

const draft = (boostable: boolean): PostDraft => ({
  kind: 'shop',
  name: 'Spa',
  face: null,
  tick: false,
  stars: null,
  text: 'x',
  pic: null,
  comments: [],
  complaint: null,
  boostable,
  notify: false,
})

const post = (sim: SpaSim, boostable = true): Post => addPost(sim.feed, draft(boostable), sim.day, 600, createRng(5))

/** The shop with one post, ready to boost. */
function ready(day = 10): { sim: SpaSim; p: Post } {
  const sim = on(day)
  return { sim, p: post(sim) }
}

describe('boostPrice', () => {
  it('is a share of the mean, rounded up to 10.000', () => {
    expect(boostPrice('small', 1_000_000)).toBe(230_000)
    expect(boostPrice('medium', 1_000_000)).toBe(600_000)
    expect(boostPrice('large', 1_000_000)).toBe(1_200_000)
  })

  it('never goes under the minimum, whatever the mean', () => {
    for (const mean of [100_000, 0, -500_000]) {
      expect(TIERS.map(t => boostPrice(t, mean))).toEqual(TIERS.map(t => BOOST[t].min))
    }
  })

  it("the shop prices from the away book's mean", () => {
    const { sim } = ready()
    expect(sim.boostPrice('large')).toBe(900_000)
    sim.away.profits = [2_000_000, 1_000_000]
    expect(sim.boostPrice('small')).toBe(boostPrice('small', 1_500_000))
  })
})

describe('boostPost', () => {
  it('reports each problem', () => {
    const { sim, p } = ready()
    expect(sim.boostPost(999, 'small')).toBe('missing')
    expect(sim.boostPost(post(sim, false).id, 'small')).toBe('notBoostable')
    p.boosted = 'small'
    expect(sim.boostPost(p.id, 'small')).toBe('boosted')
    p.boosted = null
    sim.money = BOOST.small.min - 1
    expect(sim.boostPost(p.id, 'small')).toBe('money')
    sim.money = BOOST.small.min
    expect(sim.boostPost(p.id, 'small')).toBeNull()
    expect(sim.boostPost(post(sim).id, 'small')).toBe('today')
  })

  it('pays from the purse and marks the post', () => {
    for (const tier of TIERS) {
      const { sim, p } = ready()
      const [money, likes, followers, profit] = [sim.money, p.likes, sim.feed.followers, sim.stats.income]
      const price = sim.boostPrice(tier)
      expect(sim.boostPost(p.id, tier)).toBeNull()
      expect(sim.money).toBe(money - price)
      expect(sim.stats.income).toBe(profit)
      expect(p.boosted).toBe(tier)
      expect(p.likes).toBe(likes + BOOST[tier].followers * 4)
      expect(sim.feed.followers).toBe(followers + BOOST[tier].followers)
      expect(sim.feed.boosts).toEqual([{ day: 11, tier, post: p.id }])
      expect(boostedToday(sim.feed, 10)).toBe(true)
    }
  })

  it('one boost a day, and the next day another', () => {
    const { sim, p } = ready()
    expect(sim.boostPost(p.id, 'small')).toBeNull()
    expect(sim.boostPost(post(sim).id, 'small')).toBe('today')
    sim.startDay()
    expect(sim.boostPost(post(sim).id, 'small')).toBeNull()
  })

  it('followers grow and never fall', () => {
    const { sim, p } = ready()
    const before = sim.feed.followers
    sim.boostPost(p.id, 'large')
    expect(sim.feed.followers).toBe(before + BOOST.large.followers)
    sim.startDay()
    sim.startDay()
    expect(sim.feed.followers).toBeGreaterThanOrEqual(before + BOOST.large.followers)
  })
})

describe('what a boost does the next day', () => {
  it('runs tomorrow only', () => {
    const { sim, p } = ready()
    expect(sim.boostPost(p.id, 'large')).toBeNull()
    expect(sim.boostTier()).toBeNull()
    expect(sim.eventArrivalFactor()).toBe(1)
    sim.startDay()
    expect(sim.boostTier()).toBe('large')
    expect(sim.eventArrivalFactor()).toBeCloseTo(1 / BOOST.large.arrival, 10)
    sim.startDay()
    expect(sim.boostTier()).toBeNull()
    expect(sim.eventArrivalFactor()).toBe(1)
    expect(sim.feed.boosts).toEqual([])
  })

  it('multiplies on top of a festival', () => {
    // day 37 is a festival day, day 36 the day before it
    const { sim, p } = ready(36)
    sim.boostPost(p.id, 'medium')
    sim.startDay()
    expect(sim.day).toBe(37)
    expect(sim.eventArrivalFactor()).toBeCloseTo(FESTIVAL_ARRIVAL / BOOST.medium.arrival, 10)
  })

  it('works at the main shop only', () => {
    const main = starShop()
    openFeed(main.feed)
    const chain = new Chain(main, 7)
    expect(chain.open('beach')).toBeNull()
    const branch = chain.shop('beach')!
    const before = branch.arrivalFactor()
    main.feed.boosts.push({ day: branch.day, tier: 'large', post: 0 })
    expect(branch.feed).toBe(main.feed)
    expect(branch.boostTier()).toBeNull()
    expect(branch.arrivalFactor()).toBe(before)
  })

  it('a branch cannot boost: it says branch and changes nothing', () => {
    const main = starShop()
    openFeed(main.feed)
    const p = post(main)
    const chain = new Chain(main, 7)
    expect(chain.open('beach')).toBeNull()
    const branch = chain.shop('beach')!
    const money = branch.money, followers = branch.feed.followers, likes = p.likes
    expect(branch.boostPost(p.id, 'small')).toBe('branch')
    expect(p.boosted).toBeNull()
    expect(p.likes).toBe(likes)
    expect(branch.feed.boosts).toEqual([])
    expect(branch.feed.followers).toBe(followers)
    expect(branch.money).toBe(money)
  })

  it('gives a new customer the festival patience', () => {
    const plain = on()
    const plainPatience = plain.spawnCustomer({ kind: 'office', service: 'shampoo' }).patienceMaxMs
    const { sim, p } = ready()
    sim.boostPost(p.id, 'small')
    expect(sim.spawnCustomer({ kind: 'office', service: 'shampoo' }).patienceMaxMs).toBe(plainPatience)
    sim.startDay()
    plain.startDay()
    const boosted = sim.spawnCustomer({ kind: 'office', service: 'shampoo' }).patienceMaxMs
    expect(boosted).toBe(Math.round(plain.spawnCustomer({ kind: 'office', service: 'shampoo' }).patienceMaxMs * FESTIVAL_PATIENCE))
  })

  it('counts as a busy day, so next month targets are not pushed up', () => {
    const run = (boost: boolean) => {
      const { sim, p } = ready()
      if (boost) sim.boostPost(p.id, 'small')
      sim.startDay()
      sim.progress.dayStart = structuredClone(sim.progress.total)
      sim.progress.total.served += 5
      sim.progress.total.earned += 500_000
      sim.clock.minutes = 1190
      for (let i = 0; i < 4000 && !sim.dayOver; i++) sim.advance(100)
      expect(sim.dayOver).toBe(true)
      return sim.progress.recent.length
    }
    const base = run(false)
    expect(run(true)).toBe(base - 1)
  })

  it('tips more on the boosted day', () => {
    const tipOn = (tier: BoostTier | null): number => {
      const { sim, p } = ready()
      if (tier) sim.boostPost(p.id, tier)
      sim.startDay()
      sim.drainEvents()
      return ownerServes(sim, 3).tip
    }
    const plain = tipOn(null)
    expect(plain).toBeGreaterThan(0)
    expect(tipOn('large')).toBe(Math.round(plain * BOOST.large.tip))
  })

  it('two days running: each day runs its own tier, at most two kept', () => {
    const { sim, p } = ready()
    expect(sim.boostPost(p.id, 'large')).toBeNull()
    sim.startDay()
    expect(sim.boostPost(post(sim).id, 'small')).toBeNull()
    expect(sim.boostTier()).toBe('large')
    expect(sim.feed.boosts.map(b => b.day)).toEqual([11, 12])
    sim.startDay()
    expect(sim.boostTier()).toBe('small')
    expect(sim.feed.boosts.length).toBeLessThanOrEqual(2)
    sim.startDay()
    expect(sim.boostTier()).toBeNull()
    expect(sim.feed.boosts).toEqual([])
  })
})

describe('boosts in a save', () => {
  it('reads an entry without a post as post 0', () => {
    const feed = repairFeed({ ...emptyFeed(), open: true, boosts: [{ day: 4, tier: 'small' }, { day: 5, tier: 'large', post: 7 }, { day: 6, tier: 'bad', post: 1 }] }, OLD)
    expect(feed.boosts).toEqual([
      { day: 4, tier: 'small', post: 0 },
      { day: 5, tier: 'large', post: 7 },
    ])
  })

  it('a bad post reads as 0', () => {
    const feed = repairFeed({ ...emptyFeed(), open: true, boosts: [{ day: 4, tier: 'small', post: -2 }, { day: 5, tier: 'small', post: 'x' }] }, OLD)
    expect(feed.boosts.map(b => b.post)).toEqual([0, 0])
  })
})
