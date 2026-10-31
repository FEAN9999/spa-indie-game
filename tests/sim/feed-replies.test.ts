import { describe, expect, it } from 'vitest'
import { FEED_EXTRA_COMMENTS, FEED_MILESTONES, FEED_REPLY, VIP_REVIEWS } from '../../src/config'
import { Chain } from '../../src/sim/chain'
import { openFeed } from '../../src/sim/feed'
import type { Post } from '../../src/sim/feed'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import type { Customer } from '../../src/sim/types'
import { seatAndWait, starShop } from './helpers'

/** A shop on day 10 with its Phây open. */
function on(): SpaSim {
  const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
  sim.profileDone = true
  sim.day = 9
  sim.startDay()
  sim.drainEvents()
  openFeed(sim.feed)
  return sim
}

const walkOut = (sim: SpaSim, opts: Parameters<SpaSim['spawnCustomer']>[0] = { kind: 'office', service: 'shampoo' }): Customer => {
  const c = seatAndWait(sim, opts)
  ;(sim as unknown as { loseCustomer(c: Customer): void }).loseCustomer(c)
  return c
}

const complaints = (sim: SpaSim) => sim.feed.posts.filter(p => p.kind === 'complaint')
const complaintOf = (sim: SpaSim, c: Customer): Post => complaints(sim).find(p => p.complaint!.customerId === c.id)!
const scoresOf = (sim: SpaSim, c: Customer) => sim.reviews.filter((_, i) => sim.reviewIds[i] === c.id)

/** A shop where one guest walked out: the shop, the guest and their complaint post. */
function angry(opts?: Parameters<SpaSim['spawnCustomer']>[0]): { sim: SpaSim; c: Customer; post: Post } {
  const sim = on()
  const c = walkOut(sim, opts)
  return { sim, c, post: complaintOf(sim, c) }
}

describe('answering a Phây complaint', () => {
  it("right reply lifts the customer's scores to 4 and the post to 4 stars", () => {
    const { sim, c, post } = angry()
    expect(scoresOf(sim, c)).toEqual([1])
    const before = sim.rating()!
    expect(sim.answerPost(post.id, 'right')).toBeNull()
    expect(scoresOf(sim, c)).toEqual([FEED_REPLY.right.stars])
    expect(sim.rating()!).toBeGreaterThan(before)
    expect(post.stars).toBe(4)
    expect(post.complaint!.answered).toBe('right')
    expect(post.comments).toHaveLength(2)
    expect(post.comments[0][0]).toBe(sim.shopName)
    expect(post.comments[1][0]).toBe(post.name)
    expect(post.comments[1][1]).not.toBe('')
  })

  it('plain gives 3', () => {
    const { sim, c, post } = angry()
    expect(sim.answerPost(post.id, 'plain')).toBeNull()
    expect(scoresOf(sim, c)).toEqual([3])
    expect(post.stars).toBe(3)
    expect(post.comments.map(x => x[0])).toEqual([sim.shopName, post.name])
  })

  it('right and plain win followers', () => {
    const { sim, post } = angry()
    const f = sim.feed.followers
    sim.answerPost(post.id, 'right')
    expect(sim.feed.followers).toBe(f + FEED_REPLY.right.followers)
    const second = complaintOf(sim, walkOut(sim))
    sim.answerPost(second.id, 'plain')
    expect(sim.feed.followers).toBe(f + FEED_REPLY.right.followers + FEED_REPLY.plain.followers)
  })

  it('rude changes no score, adds likes and comments, loses no followers', () => {
    const { sim, c, post } = angry()
    const likes = post.likes
    const followers = sim.feed.followers
    const rating = sim.rating()
    expect(sim.answerPost(post.id, 'rude')).toBeNull()
    expect(scoresOf(sim, c)).toEqual([1])
    expect(sim.rating()).toBe(rating)
    expect(post.stars).toBe(1)
    expect(post.likes).toBe(Math.round(likes * FEED_REPLY.rude.likes))
    expect(post.extra).toBe(Math.round(post.likes * FEED_EXTRA_COMMENTS) + FEED_REPLY.rude.comments)
    expect(post.comments).toHaveLength(2)
    expect(post.comments[0][0]).toBe(sim.shopName)
    expect(post.comments[1][0]).not.toBe(post.name)
    expect(sim.feed.followers).toBe(followers)
    expect(post.complaint!.answered).toBe('rude')
  })

  it("a VIP's three scores all become 4", () => {
    const sim = on()
    const c = walkOut(sim, { vip: 'chef', service: 'shampoo' })
    expect(scoresOf(sim, c)).toEqual(Array(VIP_REVIEWS).fill(1))
    sim.answerPost(complaintOf(sim, c).id, 'right')
    expect(scoresOf(sim, c)).toEqual(Array(VIP_REVIEWS).fill(4))
  })

  it("a star's manager post lifts the star's three scores", () => {
    const sim = on()
    const c = walkOut(sim, { idol: 'taylor' })
    const post = complaintOf(sim, c)
    expect(post.complaint!.manager).toBe(true)
    sim.answerPost(post.id, 'plain')
    expect(scoresOf(sim, c)).toEqual(Array(VIP_REVIEWS).fill(3))
    expect(post.comments[1][0]).toBe(post.name)
  })

  it("only that customer's scores change", () => {
    const sim = on()
    const a = walkOut(sim)
    const b = walkOut(sim)
    sim.answerPost(complaintOf(sim, a).id, 'right')
    expect(scoresOf(sim, a)).toEqual([4])
    expect(scoresOf(sim, b)).toEqual([1])
  })

  it('scores already out of the window: the post still flips and followers grow', () => {
    const { sim, post } = angry()
    sim.reviews.length = 0
    sim.reviewIds.length = 0
    const f = sim.feed.followers
    expect(sim.answerPost(post.id, 'right')).toBeNull()
    expect(sim.reviews).toEqual([])
    expect(post.stars).toBe(4)
    expect(sim.feed.followers).toBe(f + FEED_REPLY.right.followers)
  })

  it('one answer per post', () => {
    const { sim, c, post } = angry()
    sim.answerPost(post.id, 'plain')
    const snapshot = JSON.stringify([post, sim.reviews, sim.feed.followers])
    expect(sim.answerPost(post.id, 'right')).toBe('answered')
    expect(sim.answerPost(post.id, 'rude')).toBe('answered')
    expect(JSON.stringify([post, sim.reviews, sim.feed.followers])).toBe(snapshot)
    expect(scoresOf(sim, c)).toEqual([3])
  })

  it('says missing for an unknown post and notComplaint for any other', () => {
    const sim = on()
    expect(sim.answerPost(99, 'right')).toBe('missing')
    sim.postNews({ kind: 'rank', stars: 2 })
    const news = sim.feed.posts.find(p => p.kind === 'shop')!
    expect(news).toBeDefined()
    const followers = sim.feed.followers
    expect(sim.answerPost(news.id, 'right')).toBe('notComplaint')
    expect(sim.feed.followers).toBe(followers)
  })

  it('answers on any day', () => {
    const { sim, post } = angry()
    for (let d = 0; d < 3; d++) sim.startDay()
    expect(sim.answerPost(post.id, 'right')).toBeNull()
  })

  it("answering from a branch changes the main shop's scores", () => {
    const main = starShop()
    openFeed(main.feed)
    const chain = new Chain(main, 7)
    expect(chain.open('beach')).toBeNull()
    const c = walkOut(main)
    const post = complaintOf(main, c)
    chain.at = 'beach'
    const branchReviews = [...chain.shop('beach')!.reviews]
    expect(chain.main.answerPost(post.id, 'right')).toBeNull()
    expect(scoresOf(main, c)).toEqual([4])
    expect(chain.shop('beach')!.reviews).toEqual(branchReviews)
  })

  it('followers never go down and a crossed milestone is queued once', () => {
    const { sim, post } = angry()
    const first = FEED_MILESTONES[0]
    sim.feed.followers = first - 20
    sim.feed.cheer = []
    sim.feed.milestones = []
    sim.answerPost(post.id, 'right')
    expect(sim.feed.followers).toBe(first - 20 + FEED_REPLY.right.followers)
    expect(sim.feed.cheer).toEqual([first])
    const second = complaintOf(sim, walkOut(sim))
    const afterFirst = sim.feed.followers
    sim.answerPost(second.id, 'rude')
    expect(sim.feed.followers).toBe(afterFirst)
    const third = complaintOf(sim, walkOut(sim))
    sim.answerPost(third.id, 'plain')
    expect(sim.feed.followers).toBe(afterFirst + FEED_REPLY.plain.followers)
    expect(sim.feed.cheer).toEqual([first])
    expect(sim.feed.milestones).toEqual([first])
  })

  it('replyLine is the shop comment answering will post', () => {
    for (const reply of ['right', 'plain', 'rude'] as const) {
      const { sim, post } = angry()
      const line = sim.replyLine(post.id, reply)
      expect(line).not.toBe('')
      sim.answerPost(post.id, reply)
      expect(post.comments[0]).toEqual([sim.shopName, line])
    }
  })

  it('draws the same words for the same day and post', () => {
    const a = angry()
    const b = angry()
    a.sim.answerPost(a.post.id, 'right')
    b.sim.answerPost(b.post.id, 'right')
    expect(a.post.comments).toEqual(b.post.comments)
  })
})
