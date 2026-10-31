import { FEED_DAY_CAP, FEED_EXTRA_COMMENTS, FEED_FANS, FEED_GAIN, FEED_MAX_POSTS, FEED_MILESTONES, FEED_REACH, FEED_REACH_CAP, FEED_SEED, FEED_START_FOLLOWERS, UNLOCK_DAY } from '../config'
import { CUSTOMER_KINDS } from './customers'
import type { CustomerKind } from './customers'
import { IDOL_IDS } from './idols'
import type { IdolId } from './idols'
import { REGULAR_IDS } from './regulars'
import type { RegularId } from './regulars'
import type { Rng } from './rng'
import type { Look } from './types'
import { VIP_IDS } from './vips'
import type { VipId } from './vips'

export const POST_KINDS = ['praise', 'complaint', 'idol', 'vip', 'kol', 'rival', 'shop', 'ward'] as const
export type PostKind = (typeof POST_KINDS)[number]
export const POST_PICS = ['idol', 'video', 'plaque', 'cup', 'cert'] as const
export type PostPic = (typeof POST_PICS)[number]
export const COMPLAINT_REASONS = ['wait', 'stock', 'power', 'sloppy', 'tech', 'owner'] as const
export type ComplaintReason = (typeof COMPLAINT_REASONS)[number]
export const REPLY_KINDS = ['right', 'plain', 'rude'] as const
export type ReplyKind = (typeof REPLY_KINDS)[number]
export const BOOST_TIERS = ['small', 'medium', 'large'] as const
export type BoostTier = (typeof BOOST_TIERS)[number]

/** Who a post shows: a look, and the guest, regular, VIP or idol behind it when there is one. */
export interface PostFace {
  look: Look
  kind: CustomerKind | null
  regular: RegularId | null
  vip: VipId | null
  idol: IdolId | null
}

/** A complaint that can be answered: why, whose guest, the three replies in their shuffled order, the one chosen, and whether a manager posted it. */
export interface Complaint {
  reason: ComplaintReason
  customerId: number
  replies: ReplyKind[]
  answered: ReplyKind | null
  manager: boolean
}

/** A post before the feed numbers it. */
export interface PostDraft {
  kind: PostKind
  name: string
  face: PostFace | null
  tick: boolean
  stars: number | null
  text: string
  pic: PostPic | null
  comments: [string, string][]
  complaint: Complaint | null
  boostable: boolean
  notify: boolean
}

export interface Post extends PostDraft {
  id: number
  day: number
  minute: number
  likes: number
  /** The comments not shown. */
  extra: number
  boosted: BoostTier | null
}

/** The shop's feed: its posts oldest first, the next id, the last id read, the followers, the milestones passed and those still waiting for their card, today's post count, and the paid boosts. */
export interface FeedBook {
  open: boolean
  posts: Post[]
  nextId: number
  lastSeen: number
  followers: number
  milestones: number[]
  cheer: number[]
  today: { day: number; praise: number; complaint: number }
  boosts: { day: number; tier: BoostTier }[]
}

/** What an old save knows, to count the followers it would have had. */
export interface FeedSeedInfo {
  day: number
  rankStars: number
  idolsMet: number
  wins: number
}

const MAX_BOOSTS = 2

export function emptyFeed(): FeedBook {
  return { open: false, posts: [], nextId: 1, lastSeen: 0, followers: 0, milestones: [], cheer: [], today: { day: 0, praise: 0, complaint: 0 }, boosts: [] }
}

/** Opens the feed with its starting friends; nothing happens when it is open. */
export function openFeed(feed: FeedBook): void {
  if (feed.open) return
  feed.open = true
  feed.followers = Math.max(feed.followers, FEED_START_FOLLOWERS)
}

/** Adds `n` followers (never takes any away) and queues each milestone this crosses for the first time. */
export function growFollowers(feed: FeedBook, n: number): void {
  const before = feed.followers
  feed.followers = before + n
  for (const m of FEED_MILESTONES) {
    if (before < m && feed.followers >= m && !feed.milestones.includes(m)) {
      feed.milestones.push(m)
      feed.cheer.push(m)
    }
  }
}

/** Numbers and files a post, works its likes from the kind and the followers, grows the followers, queues the milestones crossed, and keeps the newest FEED_MAX_POSTS. */
export function addPost(feed: FeedBook, draft: PostDraft, day: number, minute: number, rng: Rng): Post {
  const r = rng()
  let likes: number
  if (draft.kind === 'idol' || draft.kind === 'kol') {
    const [lo, hi] = FEED_FANS[draft.kind]
    likes = lo + (hi - lo) * r
  } else {
    const [fixed, share] = FEED_REACH[draft.kind]
    likes = fixed + share * Math.min(feed.followers, FEED_REACH_CAP) * (0.6 + 0.8 * r)
  }
  likes = Math.round(likes)
  const post: Post = { ...draft, id: feed.nextId++, day, minute, likes, extra: Math.round(likes * FEED_EXTRA_COMMENTS), boosted: null }
  feed.posts.push(post)
  if (feed.posts.length > FEED_MAX_POSTS) feed.posts.splice(0, feed.posts.length - FEED_MAX_POSTS)

  growFollowers(feed, Math.round(likes * FEED_GAIN[draft.kind]))

  if (feed.today.day !== day) feed.today = { day, praise: 0, complaint: 0 }
  if (draft.kind === 'praise' || draft.kind === 'complaint') feed.today[draft.kind]++
  return post
}

/** Whether today still has room for another post of this kind. */
export function dayRoom(feed: FeedBook, day: number, kind: 'praise' | 'complaint'): boolean {
  return feed.today.day !== day || feed.today[kind] < FEED_DAY_CAP[kind]
}

export function unreadCount(feed: FeedBook): number {
  return feed.posts.filter(p => p.id > feed.lastSeen).length
}

export function markRead(feed: FeedBook): void {
  feed.lastSeen = feed.nextId - 1
}

/** The oldest milestone waiting for its card, taken off the queue. */
export function takeCheer(feed: FeedBook): number | null {
  return feed.cheer.shift() ?? null
}

/** An old save's feed: shut and empty before the feed opens, then the followers it would have earned, its passed milestones done without a cheer. */
export function seededFeed(old: FeedSeedInfo): FeedBook {
  const feed = emptyFeed()
  if (old.day < UNLOCK_DAY.quests) return feed
  const { base, star, idol, win, max } = FEED_SEED
  feed.open = true
  feed.followers = Math.min(base + star * Math.max(0, old.rankStars - 1) + idol * old.idolsMet + win * old.wins, max)
  feed.milestones = FEED_MILESTONES.filter(m => feed.followers >= m)
  return feed
}

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)
const isOneOf = <T extends string>(list: readonly T[], x: unknown): x is T => (list as readonly unknown[]).includes(x)
const isNonNegInt = (x: unknown): x is number => Number.isInteger(x) && (x as number) >= 0
const isNonNegNumber = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x >= 0

function repairComplaint(x: unknown): Complaint | null {
  if (!isObject(x) || !isOneOf(COMPLAINT_REASONS, x.reason) || !Number.isInteger(x.customerId)) return null
  const replies = Array.isArray(x.replies) ? x.replies : []
  // exactly the three kinds, each once, or the post keeps its text and offers no reply
  if (replies.length !== REPLY_KINDS.length || !REPLY_KINDS.every(k => replies.includes(k))) return null
  return {
    reason: x.reason,
    customerId: x.customerId as number,
    replies: replies as ReplyKind[],
    answered: isOneOf(REPLY_KINDS, x.answered) ? x.answered : null,
    manager: x.manager === true,
  }
}

function repairFace(x: unknown): PostFace | null {
  if (!isObject(x) || !isObject(x.look)) return null
  const { skin, hair, hairStyle, shirt } = x.look
  if (![skin, hair, hairStyle, shirt].every(isNonNegInt)) return null
  return {
    look: { skin: skin as number, hair: hair as number, hairStyle: hairStyle as number, shirt: shirt as number },
    kind: isOneOf(CUSTOMER_KINDS, x.kind) ? x.kind : null,
    regular: isOneOf(REGULAR_IDS, x.regular) ? x.regular : null,
    vip: isOneOf(VIP_IDS, x.vip) ? x.vip : null,
    idol: isOneOf(IDOL_IDS, x.idol) ? x.idol : null,
  }
}

function repairPost(x: unknown): Post | null {
  if (!isObject(x) || typeof x.text !== 'string' || !isOneOf(POST_KINDS, x.kind) || !isNonNegInt(x.id) || x.id < 1) return null
  const comments: [string, string][] = []
  for (const c of Array.isArray(x.comments) ? x.comments : []) {
    if (Array.isArray(c) && typeof c[0] === 'string' && typeof c[1] === 'string') comments.push([c[0], c[1]])
  }
  return {
    id: x.id,
    kind: x.kind,
    name: typeof x.name === 'string' ? x.name : '',
    face: repairFace(x.face),
    tick: x.tick === true,
    stars: isNonNegNumber(x.stars) ? x.stars : null,
    text: x.text,
    pic: isOneOf(POST_PICS, x.pic) ? x.pic : null,
    comments,
    complaint: repairComplaint(x.complaint),
    boostable: x.boostable === true,
    notify: x.notify === true,
    day: isNonNegInt(x.day) ? x.day : 0,
    minute: isNonNegNumber(x.minute) ? x.minute : 0,
    likes: isNonNegNumber(x.likes) ? x.likes : 0,
    extra: isNonNegNumber(x.extra) ? x.extra : 0,
    boosted: isOneOf(BOOST_TIERS, x.boosted) ? x.boosted : null,
  }
}

/** A saved feed made sound: bad posts and repeated ids dropped, the newest FEED_MAX_POSTS kept, bad followers and boosts replaced; the seeded feed when missing. */
export function repairFeed(x: unknown, old: FeedSeedInfo): FeedBook {
  const seeded = seededFeed(old)
  if (!isObject(x)) return seeded
  const posts: Post[] = []
  for (const raw of Array.isArray(x.posts) ? x.posts : []) {
    const p = repairPost(raw)
    if (p && !posts.some(o => o.id === p.id)) posts.push(p)
  }
  posts.splice(0, Math.max(posts.length - FEED_MAX_POSTS, 0))
  const nextId = Math.max(isNonNegInt(x.nextId) ? x.nextId : 1, 1, ...posts.map(p => p.id + 1))
  const followers = isNonNegNumber(x.followers) ? x.followers : seeded.followers
  const marks = (list: unknown): number[] => (Array.isArray(list) ? FEED_MILESTONES.filter(m => list.includes(m)) : [])
  const today = isObject(x.today) && isNonNegInt(x.today.day) && isNonNegInt(x.today.praise) && isNonNegInt(x.today.complaint)
    ? { day: x.today.day, praise: x.today.praise, complaint: x.today.complaint }
    : { day: 0, praise: 0, complaint: 0 }
  const boosts: FeedBook['boosts'] = []
  for (const b of Array.isArray(x.boosts) ? x.boosts : []) {
    if (isObject(b) && isNonNegInt(b.day) && isOneOf(BOOST_TIERS, b.tier)) boosts.push({ day: b.day, tier: b.tier })
  }
  boosts.length = Math.min(boosts.length, MAX_BOOSTS)
  return {
    open: x.open === true,
    posts,
    nextId,
    lastSeen: Math.min(isNonNegInt(x.lastSeen) ? x.lastSeen : nextId - 1, nextId - 1),
    followers,
    milestones: Array.isArray(x.milestones) ? marks(x.milestones) : FEED_MILESTONES.filter(m => followers >= m),
    cheer: marks(x.cheer),
    today,
    boosts,
  }
}
