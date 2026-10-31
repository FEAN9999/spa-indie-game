import { describe, expect, it } from 'vitest'
import { FEED_GAIN, FEED_MAX_POSTS, FEED_REACH, FEED_REACH_CAP } from '../../src/config'
import { addPost, dayRoom, emptyFeed, markRead, openFeed, repairFeed, seededFeed, takeCheer, unreadCount } from '../../src/sim/feed'
import type { FeedBook, PostDraft, PostKind } from '../../src/sim/feed'

const draft = (kind: PostKind = 'praise'): PostDraft => ({
  kind, name: 'Tiệm', face: null, tick: false, stars: null, text: 'Xin chào', pic: null, comments: [], complaint: null, boostable: false, notify: false,
})
const half = () => 0.5
const old = { day: 1, rankStars: 0, idolsMet: 0, wins: 0 }
const book = (followers: number): FeedBook => ({ ...emptyFeed(), open: true, followers })

describe('feed book', () => {
  it('opens with 50 followers and never lowers a bigger count', () => {
    const f = emptyFeed()
    expect([f.open, f.followers]).toEqual([false, 0])
    openFeed(f)
    expect([f.open, f.followers]).toEqual([true, 50])
    f.followers = 300
    openFeed(f)
    expect(f.followers).toBe(300)
  })

  it('addPost gives ids from 1 and keeps the newest FEED_MAX_POSTS', () => {
    const f = book(50)
    for (let i = 0; i < FEED_MAX_POSTS + 1; i++) addPost(f, draft(), 9, i, half)
    expect(f.posts.length).toBe(50)
    expect(f.posts[0].id).toBe(2)
    expect(f.nextId).toBe(52)
  })

  it('likes follow the kind', () => {
    const f = book(5_000)
    expect(addPost(f, draft('praise'), 9, 0, half).likes).toBe(FEED_REACH.praise[0] + FEED_REACH.praise[1] * 5_000)
    expect(addPost(f, draft('idol'), 9, 0, half).likes).toBe(40_000)
    expect(addPost(f, draft('kol'), 9, 0, half).likes).toBe(10_000)
  })

  it('followers past the reach cap bring no more likes, so the count grows by a steady amount a day', () => {
    for (const kind of ['praise', 'complaint', 'shop', 'vip', 'rival', 'ward'] as const) {
      const [fixed, share] = FEED_REACH[kind]
      expect(addPost(book(FEED_REACH_CAP), draft(kind), 9, 0, half).likes).toBe(Math.round(fixed + share * FEED_REACH_CAP))
      expect(addPost(book(500_000), draft(kind), 9, 0, half).likes).toBe(Math.round(fixed + share * FEED_REACH_CAP))
    }
  })

  it('draws exactly one random value and fills in the post', () => {
    let draws = 0
    const f = book(10_000)
    const post = addPost(f, draft(), 4, 123, () => (draws++, 0.5))
    expect(draws).toBe(1)
    expect([post.id, post.day, post.minute, post.boosted]).toEqual([1, 4, 123, null])
    expect(post.extra).toBe(Math.round(post.likes * 0.03))
  })

  it('followers grow by likes x gain and never fall', () => {
    const f = book(4_850)
    const post = addPost(f, draft('praise'), 9, 0, half)
    const likes = FEED_REACH.praise[0] + FEED_REACH.praise[1] * 4_850
    expect(post.likes).toBe(likes)
    expect(f.followers).toBe(4_850 + Math.round(likes * FEED_GAIN.praise))
    const grown = f.followers
    addPost(f, draft('complaint'), 9, 0, half)
    expect(f.followers).toBe(grown)
  })

  it('crossing a milestone queues one cheer', () => {
    const f = book(990)
    addPost(f, draft('idol'), 9, 0, half)
    expect(f.cheer).toEqual([1000])
    expect(f.milestones).toContain(1000)
    addPost(f, draft('idol'), 9, 0, half)
    expect(f.cheer).toEqual([1000])
    expect(takeCheer(f)).toBe(1000)
    expect(takeCheer(f)).toBeNull()
  })

  it('dayRoom counts per day', () => {
    const f = book(50)
    for (let i = 0; i < 3; i++) addPost(f, draft('praise'), 9, i, half)
    expect(dayRoom(f, 9, 'praise')).toBe(false)
    expect(dayRoom(f, 9, 'complaint')).toBe(true)
    expect(dayRoom(f, 10, 'praise')).toBe(true)
    expect(f.today.day).toBe(9)
    addPost(f, draft('praise'), 10, 0, half)
    expect(f.today).toEqual({ day: 10, praise: 1, complaint: 0 })
  })

  it('unread and markRead', () => {
    const f = book(50)
    for (let i = 0; i < 3; i++) addPost(f, draft(), 9, i, half)
    expect(unreadCount(f)).toBe(3)
    markRead(f)
    expect(unreadCount(f)).toBe(0)
    addPost(f, draft(), 9, 9, half)
    expect(unreadCount(f)).toBe(1)
  })
})

describe('seededFeed', () => {
  it('stays shut and empty before the feed opens', () => {
    const f = seededFeed({ ...old, day: 7 })
    expect([f.open, f.followers]).toEqual([false, 0])
  })

  it('counts an old save, marking passed milestones without a cheer', () => {
    const f = seededFeed({ day: 40, rankStars: 4, idolsMet: 2, wins: 0 })
    expect([f.open, f.followers, f.milestones, f.cheer]).toEqual([true, 13_050, [1000, 10_000], []])
  })

  it('counts rank stars past the first, so a one-star shop still has its 1.000 card to earn', () => {
    const f = seededFeed({ day: 30, rankStars: 1, idolsMet: 0, wins: 0 })
    expect([f.open, f.followers, f.milestones]).toEqual([true, 50, []])
    expect(seededFeed({ day: 30, rankStars: 2, idolsMet: 0, wins: 0 }).followers).toBe(1_050)
  })

  it('caps a huge history', () => {
    expect(seededFeed({ day: 400, rankStars: 5, idolsMet: 9, wins: 9 }).followers).toBe(99_000)
  })
})

describe('repairFeed', () => {
  const post = (id: number, extra: object = {}) => ({ ...draft(), id, day: 9, minute: 0, likes: 5, extra: 0, boosted: null, ...extra })

  it('reads a missing book as the seeded one', () => {
    const o = { day: 40, rankStars: 4, idolsMet: 2, wins: 0 }
    expect(repairFeed(undefined, o)).toEqual(seededFeed(o))
  })

  it('drops posts that are not objects or have no text', () => {
    const f = repairFeed({ open: true, followers: 80, posts: [post(1), 'x', null, post(2, { text: 7 }), post(3)] }, old)
    expect(f.posts.map(p => p.id)).toEqual([1, 3])
  })

  it('keeps the 50 newest, drops a repeated id and keeps nextId above every id', () => {
    const posts = Array.from({ length: 60 }, (_, i) => post(i + 1))
    const f = repairFeed({ open: true, followers: 80, posts: [...posts, post(5)], nextId: 3 }, old)
    expect(f.posts.length).toBe(50)
    expect(f.posts[0].id).toBe(11)
    expect(f.nextId).toBe(61)
  })

  it('reads an unknown complaint reason as no complaint', () => {
    const bad = { reason: 'bored', customerId: 1, replies: ['right', 'plain', 'rude'], answered: null, manager: false }
    const good = { ...bad, reason: 'wait' }
    const f = repairFeed({ open: true, followers: 80, posts: [post(1, { complaint: bad }), post(2, { complaint: good })] }, old)
    expect(f.posts[0].complaint).toBeNull()
    expect(f.posts[1].complaint).toEqual(good)
  })

  it('takes seeded followers when the saved count is negative or not a number', () => {
    const o = { day: 40, rankStars: 4, idolsMet: 2, wins: 0 }
    expect(repairFeed({ open: true, followers: -5, posts: [] }, o).followers).toBe(13_050)
    expect(repairFeed({ open: true, followers: 'many', posts: [] }, o).followers).toBe(13_050)
    expect(repairFeed({ open: true, followers: 777, posts: [] }, o).followers).toBe(777)
  })

  it('keeps only well-formed boosts, at most 2', () => {
    const boosts = [{ day: 3, tier: 'small' }, { day: 'x', tier: 'small' }, { day: 4, tier: 'huge' }, { day: 5, tier: 'large' }, { day: 6, tier: 'medium' }]
    const f = repairFeed({ open: true, followers: 80, posts: [], boosts }, old)
    expect(f.boosts).toEqual([{ day: 3, tier: 'small' }, { day: 5, tier: 'large' }])
  })

  it('keeps a sound book as it is', () => {
    const f = book(50)
    addPost(f, draft('praise'), 9, 1, half)
    expect(repairFeed(JSON.parse(JSON.stringify(f)), old)).toEqual(f)
  })
})
