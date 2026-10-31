import { describe, expect, it } from 'vitest'
import { Chain } from '../../src/sim/chain'
import { FEED_DAY_CAP, POWER_FROM_MIN, UNLOCK_DAY } from '../../src/config'
import { openFeed } from '../../src/sim/feed'
import type { Post } from '../../src/sim/feed'
import { createRng, type Rng } from '../../src/sim/rng'
import { SERVICES } from '../../src/sim/services'
import { SpaSim } from '../../src/sim/spa'
import type { Customer } from '../../src/sim/types'
import { IDOL_TEXT } from '../../src/strings/idols'
import { managerName, PHAY_KOL_NAME } from '../../src/strings/phay'
import { REGULAR_TEXT } from '../../src/strings/regulars'
import { t } from '../../src/strings/vi'
import { VIP_TEXT } from '../../src/strings/vips'
import { advanceUntil, hireStaff, ownerServes, seatAndWait, starShop } from './helpers'

/** A shop that has just started `day`, its Phây open unless told otherwise. */
function on(day: number, open = true, rng: Rng = createRng(1)): SpaSim {
  const sim = new SpaSim({ rng, autoSpawn: false })
  sim.profileDone = true
  sim.day = day - 1
  sim.startDay()
  sim.drainEvents()
  if (open) openFeed(sim.feed)
  return sim
}

/** Opens massage with a bed, for a star or a VIP who asks for it. */
function withMassage(sim: SpaSim): SpaSim {
  sim.services = ['shampoo', 'mask', 'massage']
  sim.money = 20_000_000
  expect(sim.buy('massageBed', 18, 2, false)).toBeNull()
  return sim
}

/** Sends a customer out angry, as if their patience ran out. */
const walkOut = (sim: SpaSim, opts: Parameters<SpaSim['spawnCustomer']>[0] = { kind: 'office', service: 'shampoo' }): Customer => {
  const c = seatAndWait(sim, opts)
  ;(sim as unknown as { loseCustomer(c: Customer): void }).loseCustomer(c)
  return c
}

const ofKind = (sim: SpaSim, kind: Post['kind']) => sim.feed.posts.filter(p => p.kind === kind)

describe('Phây posts from customers', () => {
  it('posts nothing before Phây opens', () => {
    const sim = on(UNLOCK_DAY.quests - 3, false)
    ownerServes(sim, 3)
    walkOut(sim)
    expect(sim.feed.posts).toEqual([])
  })

  it('makes one praise post naming the service after an owner 3 stars', () => {
    const sim = on(10)
    ownerServes(sim, 3, { kind: 'office', service: 'shampoo' })
    const [post, ...rest] = sim.feed.posts
    expect(rest).toEqual([])
    expect(post).toMatchObject({ kind: 'praise', stars: 5, boostable: true, notify: false, tick: false, complaint: null })
    expect(post.text.toLocaleLowerCase('vi')).toContain(t(SERVICES.shampoo.name).toLocaleLowerCase('vi'))
    expect(post.text.length).toBeLessThanOrEqual(120)
    expect(post.face).toMatchObject({ kind: 'office', regular: null, vip: null, idol: null })
  })

  it('posts a regular under their own name', () => {
    const sim = on(10)
    ownerServes(sim, 3, { regular: 'vy', service: 'shampoo' })
    expect(sim.feed.posts[0]).toMatchObject({ kind: 'praise', name: REGULAR_TEXT.vy.name })
    expect(sim.feed.posts[0].face?.regular).toBe('vy')
  })

  it('posts at most three praises a day, the first always', () => {
    const sim = on(10)
    for (let i = 0; i < 14; i++) ownerServes(sim, 3)
    const praise = ofKind(sim, 'praise')
    expect(praise.length).toBeGreaterThanOrEqual(1)
    expect(praise.length).toBeLessThanOrEqual(FEED_DAY_CAP.praise)
    const full = on(10)
    full.feed.today = { day: 10, praise: FEED_DAY_CAP.praise, complaint: 0 }
    ownerServes(full, 3)
    expect(full.feed.posts).toEqual([])
  })

  it('posts at most three complaints a day', () => {
    const sim = on(10)
    for (let i = 0; i < 6; i++) walkOut(sim)
    expect(ofKind(sim, 'complaint')).toHaveLength(FEED_DAY_CAP.complaint)
  })

  it('posts a complaint for a walk-out with reason wait, its three replies shuffled', () => {
    const sim = on(10)
    const c = seatAndWait(sim, { kind: 'office', service: 'shampoo' })
    advanceUntil(sim, () => !sim.customers.includes(c), 120_000)
    const [post] = ofKind(sim, 'complaint')
    expect(post).toMatchObject({ stars: 1, notify: true, boostable: false, tick: false })
    expect(post.complaint).toMatchObject({ reason: 'wait', customerId: c.id, answered: null, manager: false })
    expect([...post.complaint!.replies].sort()).toEqual(['plain', 'right', 'rude'])
  })

  it('names the reason stock when the service has run out', () => {
    const sim = on(UNLOCK_DAY.stock + 1)
    sim.stock.shampoo = 0
    walkOut(sim)
    expect(ofKind(sim, 'complaint')[0].complaint?.reason).toBe('stock')
  })

  it('names the reason power for a machine service on a power-cut day, but not for another', () => {
    const power = (service: 'steam' | 'shampoo') => {
      const sim = on(20, true)
      sim.services = ['shampoo', 'steam']
      sim.money = 5_000_000
      expect(sim.buy('steamTent', 20, 8, false)).toBeNull()
      sim.eventBook.plan = { kind: 'power', day: 20, minute: POWER_FROM_MIN }
      sim.clock.minutes = POWER_FROM_MIN + 5
      expect(sim.powerOut()).toBe(true)
      walkOut(sim, { kind: 'office', service })
      return ofKind(sim, 'complaint')[0].complaint?.reason
    }
    expect(power('steam')).toBe('power')
    expect(power('shampoo')).toBe('wait')
  })

  describe('who is to blame', () => {
    const picky = { kind: 'picky', service: 'shampoo' } as const
    /** A quick technician serves a picky customer, the sim's rng giving `rolls` to the work. */
    const techServes = (rolls: number[]) => {
      const queue: number[] = []
      const sim = on(10, true, () => queue.shift() ?? 0.5)
      hireStaff(sim, 'technician', { skill: 1, speed: 5, friendly: 3, stamina: 5 }, {}, 'quick')
      const c = seatAndWait(sim, picky)
      queue.push(...rolls)
      advanceUntil(sim, () => c.state === 'leaving' || c.state === 'exiting', 120_000)
      return ofKind(sim, 'complaint')
    }

    it('blames a technician who dropped a star for sloppiness', () => {
      const [post] = techServes([0.5, 0])
      expect(post.complaint?.reason).toBe('sloppy')
      expect(post.stars).toBe(2)
    })

    it('blames the technician when the work itself got 1 star', () => {
      expect(techServes([0.99, 0.99])[0].complaint?.reason).toBe('tech')
    })

    it('blames the owner when the owner did the work', () => {
      const sim = on(10)
      ownerServes(sim, 1, picky)
      expect(ofKind(sim, 'complaint')[0].complaint?.reason).toBe('owner')
    })
  })

  describe('stars and VIPs', () => {
    it('posts a star served with 3 stars as a ticked photo, boostable and with a notice', () => {
      const sim = withMassage(on(30))
      ownerServes(sim, 3, { idol: 'taylor' })
      const [post, ...rest] = sim.feed.posts
      expect(rest).toEqual([])
      expect(post).toMatchObject({ kind: 'idol', name: IDOL_TEXT.taylor.name, pic: 'idol', tick: true, notify: true, boostable: true })
      expect(post.face?.idol).toBe('taylor')
    })

    it('has a star at 1 star complain only through their manager', () => {
      const sim = withMassage(on(30))
      ownerServes(sim, 1, { idol: 'taylor' })
      expect(sim.feed.posts).toHaveLength(1)
      const [post] = sim.feed.posts
      expect(post).toMatchObject({ kind: 'complaint', name: managerName(IDOL_TEXT.taylor.name), notify: true })
      expect(post.complaint).toMatchObject({ manager: true, reason: 'owner' })
    })

    it('posts a VIP served with 2 stars or more, and a complaint under her own name at 1', () => {
      const pleased = on(30)
      ownerServes(pleased, 2, { vip: 'chef' })
      expect(pleased.feed.posts[0]).toMatchObject({ kind: 'vip', name: VIP_TEXT.chef.name, tick: false, boostable: true, pic: null })
      const upset = on(30)
      ownerServes(upset, 1, { vip: 'chef' })
      expect(upset.feed.posts[0]).toMatchObject({ kind: 'complaint', name: VIP_TEXT.chef.name })
      expect(upset.feed.posts[0].complaint?.manager).toBe(false)
    })
  })

  describe('stars and VIPs walking out', () => {
    it('has a star who walks out leave one manager complaint and no star post', () => {
      const sim = withMassage(on(30))
      walkOut(sim, { idol: 'taylor' })
      expect(sim.feed.posts).toHaveLength(1)
      const [post] = sim.feed.posts
      expect(post).toMatchObject({ kind: 'complaint', name: managerName(IDOL_TEXT.taylor.name), notify: true })
      expect(post.complaint).toMatchObject({ manager: true, reason: 'wait' })
      expect(ofKind(sim, 'idol')).toEqual([])
    })

    it('has a VIP who walks out complain under her own name', () => {
      const sim = withMassage(on(30))
      walkOut(sim, { vip: 'chef' })
      expect(sim.feed.posts).toHaveLength(1)
      expect(sim.feed.posts[0]).toMatchObject({ kind: 'complaint', name: VIP_TEXT.chef.name })
      expect(sim.feed.posts[0].complaint).toMatchObject({ manager: false, reason: 'wait' })
    })
  })

  it('draws a stream of its own for each guest, even when two pay between the same two arrivals', () => {
    const sim = on(10)
    const a = seatAndWait(sim, { kind: 'office', service: 'shampoo' })
    const b = seatAndWait(sim, { kind: 'office', service: 'shampoo' })
    const rngOf = (c: Customer, salt: number) => (sim as unknown as { guestRng(c: Customer, salt: number): () => number }).guestRng(c, salt)
    for (let salt = 1; salt <= 6; salt++) {
      expect([rngOf(a, salt)(), rngOf(a, salt)()]).toEqual([rngOf(a, salt)(), rngOf(a, salt)()])
      expect(rngOf(a, salt)()).not.toBe(rngOf(b, salt)())
      for (let other = salt + 1; other <= 6; other++) expect(rngOf(a, salt)()).not.toBe(rngOf(a, other)())
    }
  })

  describe('Mi Mi', () => {
    it('posts her video after 3 stars', () => {
      const sim = on(20)
      ownerServes(sim, 3, { kol: true, service: 'shampoo' })
      expect(sim.feed.posts).toHaveLength(1)
      expect(sim.feed.posts[0]).toMatchObject({ kind: 'kol', name: PHAY_KOL_NAME, pic: 'video', tick: true, notify: true, boostable: false })
    })

    it('never complains, and posts nothing below 3 stars', () => {
      const sim = on(20)
      ownerServes(sim, 1, { kol: true, service: 'shampoo' })
      ownerServes(sim, 2, { kol: true, service: 'shampoo' })
      walkOut(sim, { kol: true, service: 'shampoo' })
      expect(sim.feed.posts).toEqual([])
    })
  })

  describe('chains', () => {
    it('lands a main-shop post in the main feed while the owner is at a branch', () => {
      const main = starShop()
      const chain = new Chain(main, 7)
      expect(chain.open('beach')).toBeNull()
      openFeed(main.feed)
      hireStaff(main, 'technician')
      expect(chain.goTo('beach')).toBeNull()
      // nobody here can do a mask, so the guest waits until their patience is gone
      const c = main.spawnCustomer({ kind: 'office', service: 'mask' })
      for (let i = 0; i < 1500 && main.customers.includes(c); i++) chain.advance(100)
      expect(main.customers.includes(c)).toBe(false)
      const posts = ofKind(main, 'complaint')
      expect(posts).toHaveLength(1)
      expect(posts[0].complaint?.customerId).toBe(c.id)
    })

    it('posts nothing for a branch customer, and shares one feed', () => {
      const main = starShop()
      openFeed(main.feed)
      const beach = SpaSim.newBranch('beach', main, createRng(9))
      expect(beach.feed).toBe(main.feed)
      ownerServes(beach, 3)
      walkOut(beach)
      ownerServes(beach, 1, { kind: 'picky', service: 'shampoo' })
      expect(main.feed.posts).toEqual([])
    })
  })

  it('draws only from its own streams, so the shop draws the same with Phây open or shut', () => {
    const draws = (open: boolean) => {
      const sim = on(10, open, createRng(7))
      ownerServes(sim, 3)
      walkOut(sim)
      const c = sim.spawnCustomer()
      return [c.look, c.kind, c.service]
    }
    expect(draws(true)).toEqual(draws(false))
  })
})

describe('the follower curve', () => {
  it('reaches about a thousand followers in the first month of a plain shop, never falling, with at most 3 complaint posts a day', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: true })
    sim.profileDone = true
    sim.services = ['shampoo', 'mask', 'massage']
    hireStaff(sim, 'receptionist')
    hireStaff(sim, 'technician')
    let last = 0
    for (let day = 1; day <= 30; day++) {
      advanceUntil(sim, () => sim.dayOver, 600_000)
      sim.drainEvents()
      expect(sim.feed.followers).toBeGreaterThanOrEqual(last)
      expect(sim.feed.today.complaint).toBeLessThanOrEqual(FEED_DAY_CAP.complaint)
      last = sim.feed.followers
      sim.money = Math.max(sim.money, 5_000_000)
      for (const item of sim.lowStock()) sim.restock(item)
      if (day % 4 === 0 && sim.staff.length < 4) hireStaff(sim, 'technician')
      sim.startDay()
    }
    expect(last).toBeGreaterThanOrEqual(1_000)
    expect(last).toBeLessThanOrEqual(10_000)
  }, 60_000)
})
