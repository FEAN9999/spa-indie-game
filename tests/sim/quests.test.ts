import { describe, expect, it } from 'vitest'
import {
  averageDay,
  baseReward,
  closeNoWalk,
  countOf,
  dailyPool,
  dailyQuest,
  emptyProgress,
  festivalQuest,
  fullTarget,
  monthlyPool,
  monthlyQuest,
  progressOf,
  recordDay,
  rollDay,
  rollMonth,
  roundMoney,
  settle,
  swap,
  zeroCounts,
  type Quest,
  type QuestKind,
  type QuestShop,
} from '../../src/sim/quests'
import { createRng } from '../../src/sim/rng'

const shop = (over: Partial<QuestShop> = {}): QuestShop => ({ available: ['shampoo'], technicians: 0, heartable: false, heartDue: false, canStudy: false, ...over })
const DEFAULTS = averageDay([])
const ONE_DAY = averageDay([{ served: 20, earned: 1_000_000, tips: 100_000, owner3: 5, staff: 12 }])
const quest = (kind: QuestKind, target: number, over: Partial<Quest> = {}): Quest => ({ kind, period: 'day', service: null, target, reward: 30_000, base: 0, state: 'open', festival: null, ...over })

describe('what the shop can be asked to do', () => {
  it('asks a shampoo-only shop with no technicians for the five plain kinds', () => {
    expect(dailyPool(shop())).toEqual(['serve', 'owner3', 'earn', 'tips', 'noWalk'])
  })

  it('adds a service quest once a second service is there, and a staff quest with a technician', () => {
    expect(dailyPool(shop({ available: ['shampoo', 'mask'] }))).toContain('service')
    expect(dailyPool(shop({ technicians: 1 }))).toContain('staff')
  })

  it('never asks for shampoo in a service quest', () => {
    const seen = new Set<string | null>()
    for (let seed = 1; seed <= 200; seed++) seen.add(dailyQuest('service', DEFAULTS, shop({ available: ['shampoo', 'mask', 'massage'] }), 1, zeroCounts(), createRng(seed)).service)
    expect([...seen].sort()).toEqual(['mask', 'massage'])
  })

  it('asks for a heart only when one can come in time', () => {
    expect(monthlyPool(shop({ heartable: true }), 1)).not.toContain('heart')
    expect(monthlyPool(shop({ heartable: true, heartDue: true }), 1)).toContain('heart')
    expect(monthlyPool(shop({ heartable: true }), 2)).toContain('heart')
    expect(monthlyPool(shop(), 3)).not.toContain('heart')
  })

  it('asks for a course only when someone has one to take', () => {
    expect(monthlyPool(shop(), 3)).toEqual(['serve', 'earn', 'owner3'])
    expect(monthlyPool(shop({ canStudy: true }), 3)).toContain('study')
  })
})

describe('targets and rewards', () => {
  it('rounds money to ten thousand, never below it', () => {
    expect([roundMoney(44_999), roundMoney(45_000), roundMoney(2_000)]).toEqual([40_000, 50_000, 10_000])
  })

  it('sizes from the defaults before any day is finished', () => {
    const targets = (['serve', 'owner3', 'earn', 'tips', 'service', 'staff'] as const).map(k => fullTarget(k, DEFAULTS, 2))
    expect(targets).toEqual([8, 2, 400_000, 40_000, 4, 3])
    expect(baseReward(DEFAULTS)).toBe(30_000)
    expect(dailyQuest('owner3', DEFAULTS, shop(), 1, zeroCounts(), createRng(1)).reward).toBe(50_000)
  })

  it('sizes from the last finished days', () => {
    const targets = (['serve', 'owner3', 'earn', 'tips', 'staff'] as const).map(k => fullTarget(k, ONE_DAY, 1))
    expect(targets).toEqual([16, 4, 800_000, 80_000, 10])
    expect(baseReward(ONE_DAY)).toBe(50_000)
    expect(dailyQuest('noWalk', ONE_DAY, shop(), 1, zeroCounts(), createRng(1))).toMatchObject({ target: 1, reward: 80_000 })
  })

  it('caps the three-star target at six', () => {
    expect(fullTarget('owner3', { ...ONE_DAY, owner3: 10 }, 1)).toBe(6)
  })

  it('averages the recent days', () => {
    const day = (served: number) => ({ served, earned: 0, tips: 0, owner3: 0, staff: 0 })
    expect(averageDay([day(10), day(20), day(30)]).served).toBe(20)
  })

  it('scales a quest given late in the day, never below one', () => {
    expect(dailyQuest('serve', DEFAULTS, shop(), 0.75, zeroCounts(), createRng(1))).toMatchObject({ target: 6, reward: 20_000 })
    for (const kind of dailyPool(shop({ available: ['shampoo', 'mask'], technicians: 1 }))) {
      expect(dailyQuest(kind, DEFAULTS, shop({ available: ['shampoo', 'mask'], technicians: 1 }), 1 / 6, zeroCounts(), createRng(1)).target).toBeGreaterThanOrEqual(1)
    }
  })

  it('sizes a monthly quest by the days left in the month', () => {
    expect(monthlyQuest('serve', DEFAULTS, shop(), 2, zeroCounts())).toMatchObject({ period: 'month', target: 16, reward: 100_000 })
    expect(monthlyQuest('owner3', DEFAULTS, shop(), 3, zeroCounts()).target).toBe(6)
    expect(monthlyQuest('owner3', DEFAULTS, shop(), 1, zeroCounts()).target).toBe(4)
  })
})

describe('rolling and swapping', () => {
  it("avoids yesterday's kinds while there are others, and never gives a kind twice", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const p = emptyProgress()
      p.questDay = 8
      p.daily = [quest('serve', 8), quest('owner3', 2), quest('earn', 400_000)]
      rollDay(p, 9, shop(), 1, createRng(seed))
      const kinds = p.daily.map(q => q.kind)
      expect(new Set(kinds).size).toBe(3)
      expect(kinds).toContain('tips')
      expect(kinds).toContain('noWalk')
      expect(p).toMatchObject({ questDay: 9, swaps: 1, yesterday: ['serve', 'owner3', 'earn'] })

      const q = emptyProgress()
      q.questDay = 8
      q.daily = [quest('serve', 8), quest('owner3', 2), quest('earn', 400_000)]
      rollDay(q, 9, shop({ available: ['shampoo', 'mask'], technicians: 1 }), 1, createRng(seed))
      expect(q.daily.map(x => x.kind).filter(k => ['serve', 'owner3', 'earn'].includes(k))).toEqual([])
    }
  })

  it('swaps a failed quest for a new kind that counts from now, once a day', () => {
    const p = emptyProgress()
    p.total.served = 5
    p.total.tips = 70_000
    p.swaps = 1
    p.daily = [quest('serve', 8), quest('owner3', 2), quest('noWalk', 1, { state: 'failed' })]
    expect(swap(p, 2, shop(), 1, createRng(3))).toBeNull()
    const fresh = p.daily[2]
    expect(['earn', 'tips']).toContain(fresh.kind)
    expect(fresh.state).toBe('open')
    expect(fresh.base).toBe(countOf(fresh, p.total))
    expect(p.swaps).toBe(0)
    expect(swap(p, 0, shop(), 1, createRng(4))).toBe('swaps')
    p.swaps = 1
    p.daily[0].state = 'done'
    expect(swap(p, 0, shop(), 1, createRng(4))).toBe('done')
  })
})

describe('settling', () => {
  it('finishes a quest once when its count reaches the target', () => {
    const p = emptyProgress()
    p.daily = [quest('serve', 2)]
    p.total.served = 1
    expect(progressOf(p.daily[0], p.total)).toBe(1)
    expect(settle(p)).toEqual([])
    p.total.served = 3
    expect(settle(p)).toEqual([p.daily[0]])
    expect(p.daily[0].state).toBe('done')
    expect(progressOf(p.daily[0], p.total)).toBe(2)
    expect(settle(p)).toEqual([])
  })

  it('fails "nobody walks out" when someone does, and finishes it at closing otherwise', () => {
    const p = emptyProgress()
    p.daily = [quest('noWalk', 1)]
    p.total.lost = 1
    expect(settle(p)).toEqual([])
    expect(p.daily[0].state).toBe('failed')
    expect(closeNoWalk(p)).toEqual([])

    const q = emptyProgress()
    q.total.lost = 4
    q.daily = [quest('noWalk', 1, { base: 4 })]
    expect(settle(q)).toEqual([])
    expect(closeNoWalk(q)).toEqual([q.daily[0]])
    expect(q.daily[0].state).toBe('done')
  })

  it('counts a service quest by its own service', () => {
    const t = zeroCounts()
    t.services.mask = 3
    expect(countOf(quest('service', 2, { service: 'mask' }), t)).toBe(3)
    expect(countOf(quest('service', 2, { service: 'massage' }), t)).toBe(0)
  })
})

describe('festival quests', () => {
  const t = zeroCounts()

  it('asks for half the month serve target in the festival service, for the same reward', () => {
    const q = festivalQuest('tet', ONE_DAY, shop(), 3, t)
    const serve = monthlyQuest('serve', ONE_DAY, shop(), 3, t)
    expect(q).toMatchObject({ kind: 'service', period: 'month', service: 'shampoo', festival: 'tet', state: 'open' })
    expect(q.target).toBe(Math.max(1, Math.round(0.5 * serve.target)))
    expect(q.reward).toBe(serve.reward)
  })

  it('asks for the nearest cheaper service the shop has', () => {
    expect(festivalQuest('noel', ONE_DAY, shop({ available: ['shampoo', 'mask'] }), 3, t).service).toBe('mask')
  })

  it('rolls a festival quest in a festival month and a plain one otherwise', () => {
    const p = emptyProgress()
    rollMonth(p, 37, shop(), 3, createRng(1))
    expect(p.monthly).toMatchObject({ kind: 'service', festival: 'tet' })
    rollMonth(p, 46, shop(), 3, createRng(1))
    expect(p.monthly?.festival).toBeNull()
    expect(p.monthly?.kind).not.toBe('service')
  })
})

describe('recording a day', () => {
  it('leaves a busy day out of the recent days, but not out of the bests', () => {
    const p = emptyProgress()
    p.total.served = 30
    const stats = { served: 30, angry: 0, walkedAway: 0, income: 900_000, tips: 0, wages: 0, restock: 0, gifts: 0, quests: 0, ownerServed: 0 }
    recordDay(p, stats, true, 1)
    expect(p.recent).toEqual([])
    expect(p.life.bestServed).toBe(30)
    recordDay(p, stats, false, 2)
    expect(p.recent).toHaveLength(1)
  })

  it('marks a served record over an old best, a profit record otherwise, and none on the first day', () => {
    const p = emptyProgress()
    const day = (served: number, income: number) => ({ served, angry: 0, walkedAway: 0, income, tips: 0, wages: 0, restock: 0, gifts: 0, quests: 0, ownerServed: 0 })
    recordDay(p, day(6, 200_000), false, 1)
    expect(p.life.record).toBeNull()
    recordDay(p, day(9, 300_000), false, 2)
    expect(p.life.record).toEqual({ day: 2, kind: 'served' })
    recordDay(p, day(9, 400_000), false, 3)
    expect(p.life.record).toEqual({ day: 3, kind: 'profit' })
    recordDay(p, day(5, 100_000), false, 4)
    expect(p.life.record).toEqual({ day: 3, kind: 'profit' })
  })
})
