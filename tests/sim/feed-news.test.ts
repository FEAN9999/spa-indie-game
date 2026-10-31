import { describe, expect, it } from 'vitest'
import { FEED_GAIN, INSPECT_BEAUTY } from '../../src/config'
import { Chain } from '../../src/sim/chain'
import { FESTIVALS, festivalOf } from '../../src/sim/festivals'
import { openFeed } from '../../src/sim/feed'
import type { Post } from '../../src/sim/feed'
import { STARTER_GOAL_IDS } from '../../src/sim/starter'
import { createRng } from '../../src/sim/rng'
import { parseSave } from '../../src/sim/save'
import { SpaSim } from '../../src/sim/spa'
import type { SimEvent } from '../../src/sim/types'
import { PHAY_WARD_NAME } from '../../src/strings/phay'
import { t } from '../../src/strings/vi'
import v35 from '../fixtures/save-v35.json'
import { advanceUntil, ownerServes, starShop } from './helpers'

const opts = () => ({ rng: createRng(1), autoSpawn: false })

/** A shop that has just started `day`, `prep` having run before the morning. */
function on(day: number, prep: (sim: SpaSim) => void = () => {}): SpaSim {
  const sim = new SpaSim(opts())
  sim.profileDone = true
  prep(sim)
  sim.day = day - 1
  sim.startDay()
  sim.drainEvents()
  return sim
}

/** Runs the shop to the end of its day. */
function close(sim: SpaSim): SimEvent[] {
  sim.clock.minutes = 1190
  const events: SimEvent[] = []
  advanceUntil(sim, () => sim.dayOver, 400_000, events)
  return [...events, ...sim.drainEvents()]
}

const monthPrep = (stars: 1 | 2 | 3 | 4 | 5) => (s: SpaSim) => {
  s.reviews = Array(20).fill(5)
  s.progress.total.served = 45
  s.rank.month = { from: 7, served: 0, lost: 0 }
  s.rank.stars = stars
}

const ofKind = (sim: SpaSim, kind: Post['kind']) => sim.feed.posts.filter(p => p.kind === kind)

describe('Phây opening', () => {
  it('opens on day 8 with 50 followers, and not on day 7', () => {
    expect(on(7).feed.open).toBe(false)
    // day 8 is also the first day of the 8/3 festival: its post is the only one, and the friends it brings are the only ones over 50
    const sim = on(8)
    expect(sim.feed.open).toBe(true)
    expect(sim.feed.posts.map(p => p.kind)).toEqual(['shop'])
    expect(sim.feed.followers).toBe(50 + Math.round(sim.feed.posts[0].likes * FEED_GAIN.shop))
  })

  it('opens early with the starter chain, the morning after its last goal', () => {
    const chain = (day: number) =>
      on(day, s => {
        s.starter.at = STARTER_GOAL_IDS.length
        s.starter.doneDay = 4
      })
    expect(chain(4).feed.open).toBe(false)
    const sim = chain(5)
    expect([sim.feed.open, sim.feed.followers]).toEqual([true, 50])
  })

  it('opens at 50 on day 8 for an old save from before day 8', () => {
    const sim = SpaSim.fromSave(parseSave({ ...structuredClone(v35), day: 5 }), opts())
    expect(sim.feed.open).toBe(false)
    sim.eventBook.plan = null
    sim.day = 7
    sim.startDay()
    expect(sim.feed.open).toBe(true)
    expect(sim.feed.followers).toBe(50 + Math.round(sim.feed.posts[0].likes * FEED_GAIN.shop))
  })

  it('posts nothing before Phây opens', () => {
    const sim = on(5)
    sim.money = 30_000_000
    sim.postNews({ kind: 'rank', stars: 2 })
    expect(sim.adoptPet('poodle', 'Kẹo')).toBeNull()
    expect(sim.feed.posts).toEqual([])
  })
})

describe('the shop posts its news', () => {
  it('a star up posts the plaque, and no star up posts nothing', () => {
    const sim = on(9, monthPrep(1))
    close(sim)
    expect(sim.rank.stars).toBe(2)
    const [post, ...rest] = sim.feed.posts
    expect(rest).toEqual([])
    expect(post).toMatchObject({ kind: 'shop', name: sim.shopName, face: null, pic: 'plaque', boostable: true, notify: false, tick: false })
    expect(post.text).toContain('2')
    expect(post.text.length).toBeLessThanOrEqual(120)
    const top = on(9, monthPrep(5))
    close(top)
    expect(top.feed.posts).toEqual([])
  })

  it('Spa của năm in 2nd posts the cup, and losing the year posts nothing', () => {
    const year = (scores: number[]) =>
      on(36, s => {
        monthPrep(5)(s)
        s.rank.month = { from: 34, served: 0, lost: 0 }
        s.rank.scores = scores
      })
    const won = year([72, 72, 72])
    close(won)
    expect(won.rank.lastYear?.place).toBe(2)
    const [cup, ...rest] = won.feed.posts
    expect(rest).toEqual([])
    expect(cup).toMatchObject({ kind: 'shop', pic: 'cup', boostable: true, notify: false })
    expect(cup.text).toContain('2')
    const lost = year([0, 0, 0])
    close(lost)
    expect(lost.rank.lastYear!.place).toBeGreaterThan(3)
    expect(lost.feed.posts).toEqual([])
  })

  it("posts a festival's first day only", () => {
    const first = on(37)
    const [post, ...rest] = first.feed.posts
    expect(rest).toEqual([])
    expect(post).toMatchObject({ kind: 'shop', name: first.shopName, boostable: true })
    expect(post.text).toContain(t(FESTIVALS[festivalOf(37)!].name))
    expect(on(38).feed.posts).toEqual([])
  })

  it('posts a floor and a pet', () => {
    const sim = on(10)
    sim.money = 30_000_000
    expect(sim.openFloor(2)).toBeNull()
    expect(sim.adoptPet('poodle', 'Kẹo')).toBeNull()
    const [floor, pet, ...rest] = sim.feed.posts
    expect(rest).toEqual([])
    expect(floor.text).toContain(t('floorName2').toLocaleLowerCase('vi'))
    expect(pet.text).toContain('Kẹo')
    for (const p of [floor, pet]) expect(p).toMatchObject({ kind: 'shop', face: null, boostable: true, notify: false })
  })

  it('posts a pet taken from the litter', () => {
    const sim = on(10)
    expect(sim.takeLitter('muop', 'Miu')).not.toBeNull()
    expect(ofKind(sim, 'shop')[0].text).toContain('Miu')
  })

  it('posts a house bought at the main shop', () => {
    const sim = on(10)
    sim.money = 30_000_000
    expect(sim.buyHouse('right')).toBeNull()
    expect(ofKind(sim, 'shop')).toHaveLength(1)
  })
})

describe('a branch and the main feed', () => {
  const chainWithFeed = () => {
    const main = starShop()
    openFeed(main.feed)
    return new Chain(main, 7)
  }

  it('a branch opening posts into the main feed', () => {
    const chain = chainWithFeed()
    expect(chain.open('beach')).toBeNull()
    const [post, ...rest] = chain.main.feed.posts
    expect(rest).toEqual([])
    expect(post).toMatchObject({ kind: 'shop', name: chain.main.shopName, boostable: true })
    expect(post.text).toContain(t('placeBeach'))
  })

  it('a house bought at a branch posts naming the branch', () => {
    const chain = chainWithFeed()
    chain.open('beach')
    chain.main.feed.posts.length = 0
    const beach = chain.shop('beach')!
    expect(beach.buyHouse('right')).toBeNull()
    const [post, ...rest] = chain.main.feed.posts
    expect(rest).toEqual([])
    expect(post.text).toContain(t('placeBeach'))
  })
})

describe("the ward's certificate and SPA MỚI", () => {
  const inspectDay = (certGiven: boolean) => {
    const sim = on(12, s => {
      s.eventBook.plan = { kind: 'inspect', day: 12, minute: 900 }
      s.eventBook.certGiven = certGiven
    })
    let id = 900
    while (sim.beauty() < INSPECT_BEAUTY) sim.items.push({ id: id++, kind: 'goldBoard', x: 12, y: 0, flip: false })
    sim.clock.minutes = 899
    advanceUntil(sim, () => sim.clock.minutes >= 905, 400_000)
    return sim
  }

  it("posts the inspector's certificate from Phường, once", () => {
    const sim = inspectDay(false)
    const [post, ...rest] = sim.feed.posts
    expect(rest).toEqual([])
    expect(post).toMatchObject({ kind: 'ward', name: PHAY_WARD_NAME, tick: true, pic: 'cert', boostable: false, notify: false, face: null })
    expect(inspectDay(true).feed.posts).toEqual([])
  })

  it('posts SPA MỚI in the morning and again when beaten, with 2 comments each', () => {
    const sim = on(13, s => (s.eventBook.plan = { kind: 'rival', day: 13, minute: 0 }))
    expect(ofKind(sim, 'rival')).toHaveLength(1)
    sim.eventBook.count = sim.rivalTarget() - 1
    ownerServes(sim, 3, { kind: 'office', service: 'shampoo' })
    const rivals = ofKind(sim, 'rival')
    expect(rivals).toHaveLength(2)
    expect(rivals[0].text).not.toBe(rivals[1].text)
    for (const p of rivals) {
      expect(p).toMatchObject({ name: t('rivalSignName'), boostable: false, notify: false, face: null })
      expect(p.comments).toHaveLength(2)
    }
  })
})
