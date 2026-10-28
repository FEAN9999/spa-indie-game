import { describe, expect, it } from 'vitest'
import { averageDay, countOf, dailyQuest, fullTarget, zeroCounts, type Quest, type QuestKind } from '../../src/sim/quests'
import { REGULAR_IDS } from '../../src/sim/regulars'
import { createRng } from '../../src/sim/rng'
import { parseSave } from '../../src/sim/save'
import { SpaSim } from '../../src/sim/spa'
import type { SimEvent } from '../../src/sim/types'
import v14 from '../fixtures/save-v14.json'
import { advanceUntil, hireStaff, ownerServes, seatAndWait } from './helpers'

const opts = () => ({ rng: createRng(1), autoSpawn: false })
const fresh = () => new SpaSim(opts())
const viaJson = (sim: SpaSim) => SpaSim.fromSave(parseSave(JSON.parse(JSON.stringify(sim.toSave()))), opts())
const open = (raw: unknown) => SpaSim.fromSave(parseSave(structuredClone(raw)), opts())

/** A shop that has just started day 8, the day quests open. */
function day8(): SpaSim {
  const sim = fresh()
  sim.day = 7
  sim.startDay()
  sim.drainEvents()
  return sim
}

/** A quest of `kind` given now in `sim`. */
function give(sim: SpaSim, kind: QuestKind, target: number, over: Partial<Quest> = {}): Quest {
  const q: Quest = { kind, period: 'day', service: null, target, reward: 30_000, base: 0, state: 'open', festival: null, ...over }
  q.base = countOf(q, sim.progress.total)
  return q
}

const questEvents = (events: SimEvent[]) => events.filter(e => e.type === 'questDone' || e.type === 'monthStarted')

describe('giving quests', () => {
  it('gives none before day 8, then three a day and one for the month', () => {
    const sim = fresh()
    sim.day = 6
    sim.startDay()
    expect(sim.progress.daily).toEqual([])
    expect(sim.progress.monthly).toBeNull()
    sim.startDay()
    const ev = sim.drainEvents()
    expect(sim.day).toBe(8)
    expect(sim.progress).toMatchObject({ questDay: 8, swaps: 1, monthFrom: 7 })
    expect(sim.progress.daily).toHaveLength(3)
    // two days of a three-day month: 5 × 30 000 × 2/3
    expect(sim.progress.monthly?.reward).toBe(100_000)
    expect(ev.some(e => e.type === 'monthStarted')).toBe(false)
  })

  it('gives a new monthly quest on the first day of a month, of another kind, and says so', () => {
    const sim = day8()
    sim.startDay()
    expect(sim.progress.monthFrom).toBe(7)
    const before = sim.progress.monthly!.kind
    sim.drainEvents()
    sim.startDay()
    expect(sim.day).toBe(10)
    // the month before was 8/3, whose festival quest was left unfinished
    expect(sim.drainEvents()).toContainEqual({ type: 'monthStarted', month: 4, ended: 'march8' })
    expect(sim.progress.monthFrom).toBe(10)
    expect(sim.progress.monthly!.kind).not.toBe(before)
  })

  it('does not count a technician who is leaving', () => {
    const sim = fresh()
    const tech = hireStaff(sim, 'technician')
    expect(sim.questShop().technicians).toBe(1)
    tech.leaving = true
    expect(sim.questShop().technicians).toBe(0)
  })

  it('never asks for a heart on the last day of a month when no such regular is due', () => {
    const kinds = (due: boolean) => {
      const seen = new Set<QuestKind>()
      for (let n = 1; n <= 100; n++) {
        const sim = fresh()
        // the last day of month 4, which has no festival
        sim.day = 12
        for (const id of REGULAR_IDS) sim.book.regulars[id].visitAt = null
        sim.book.regulars.hanh = { meetDay: 7, met: true, points: 8, hearts: 2, visitAt: due ? 600 : null }
        sim.progress.monthFrom = 0
        ;(sim as any).nextId = n
        seen.add(viaJson(sim).progress.monthly!.kind)
      }
      return seen
    }
    expect(kinds(false).has('heart')).toBe(false)
    expect(kinds(true).has('heart')).toBe(true)
  })
})

describe('finishing quests', () => {
  it('pays a finished quest once, into the till and the day', () => {
    const sim = day8()
    sim.progress.daily = [give(sim, 'serve', 1)]
    sim.progress.monthly = null
    const before = sim.money
    const paid = ownerServes(sim, 2)
    expect(sim.money).toBe(before + paid.amount + paid.tip + 30_000)
    expect(sim.stats.quests).toBe(30_000)
    expect(sim.progress.life.dailies).toBe(1)
    expect(questEvents(paid.events)).toEqual([{ type: 'questDone', quest: { ...sim.progress.daily[0] } }])
    expect(sim.progress.daily[0].state).toBe('done')
    ownerServes(sim, 2)
    expect(sim.stats.quests).toBe(30_000)
  })

  it('pays two quests finished by one payment, in order, and never counts the rewards as earnings', () => {
    const sim = day8()
    sim.progress.daily = [give(sim, 'serve', 1), give(sim, 'earn', 10_000, { reward: 40_000 })]
    sim.progress.monthly = null
    const before = sim.money
    const paid = ownerServes(sim, 2)
    expect(questEvents(paid.events).map(e => e.type === 'questDone' && e.quest.kind)).toEqual(['serve', 'earn'])
    expect(sim.money).toBe(before + paid.amount + paid.tip + 70_000)
    expect(sim.stats.quests).toBe(70_000)
    expect(sim.progress.total.earned).toBe(paid.amount + paid.tip)
  })

  it('finishes a course quest the moment the course is paid', () => {
    const sim = day8()
    sim.money = 1_000_000
    sim.services = ['shampoo', 'mask']
    const tech = hireStaff(sim, 'technician', undefined, { mask: 1 })
    sim.progress.monthly = give(sim, 'study', 1, { period: 'month', reward: 100_000 })
    sim.drainEvents()
    const before = sim.money
    expect(sim.study(tech.id, 'mask')).toBeNull()
    expect(sim.money).toBe(before - tech.study!.paid + 100_000)
    expect(questEvents(sim.drainEvents())).toHaveLength(1)
  })
})

describe('"Không để khách nào bỏ về"', () => {
  it('is done at closing when nobody walked out', () => {
    const sim = day8()
    sim.progress.daily = [give(sim, 'noWalk', 1, { reward: 50_000 })]
    sim.progress.monthly = null
    const ev: SimEvent[] = []
    advanceUntil(sim, () => sim.dayOver, 400_000, ev)
    expect(questEvents(ev)).toHaveLength(1)
    expect(sim.stats.quests).toBe(50_000)
    expect(ev.findIndex(e => e.type === 'questDone')).toBeLessThan(ev.findIndex(e => e.type === 'dayEnded'))
  })

  it('fails when a customer runs out of patience, and pays nothing at closing', () => {
    const sim = day8()
    sim.progress.daily = [give(sim, 'noWalk', 1)]
    sim.progress.monthly = null
    const c = seatAndWait(sim)
    advanceUntil(sim, () => !sim.customers.includes(c), 200_000)
    expect(sim.progress.daily[0].state).toBe('failed')
    const ev: SimEvent[] = []
    advanceUntil(sim, () => sim.dayOver, 400_000, ev)
    expect(questEvents(ev)).toEqual([])
    expect(sim.stats.quests).toBe(0)
  })

  it('fails when someone walks out after closing time while the shop is still emptying', () => {
    const sim = day8()
    sim.progress.daily = [give(sim, 'noWalk', 1)]
    sim.progress.monthly = null
    sim.clock.minutes = 1190
    const c = seatAndWait(sim)
    advanceUntil(sim, () => !sim.customers.includes(c), 200_000)
    expect(sim.clock.isClosed).toBe(true)
    const ev: SimEvent[] = []
    advanceUntil(sim, () => sim.dayOver, 400_000, ev)
    expect(sim.progress.daily[0].state).toBe('failed')
    expect(questEvents(ev)).toEqual([])
  })
})

describe('swapping', () => {
  it('swaps once a day for a quest sized to the day left, and not after closing', () => {
    const sim = day8()
    sim.clock.minutes = 840
    const others = sim.progress.daily.slice(1).map(q => q.kind)
    expect(sim.swapQuest(0)).toBeNull()
    const q = sim.progress.daily[0]
    expect(others).not.toContain(q.kind)
    expect(q.base).toBe(countOf(q, sim.progress.total))
    expect(q.target).toBe(dailyQuest(q.kind, averageDay(sim.progress.recent), sim.questShop(), 0.5, zeroCounts(), createRng(1)).target)
    expect(sim.swapQuest(1)).toBe('swaps')
    advanceUntil(sim, () => sim.dayOver, 400_000)
    sim.progress.swaps = 1
    expect(sim.swapQuest(1)).toBe('closed')
  })

  it('refuses a swap from 20:00, while the last guests are still leaving', () => {
    const sim = day8()
    sim.clock.minutes = 1200
    const before = structuredClone(sim.progress.daily)
    expect(sim.dayOver).toBe(false)
    expect(sim.swapQuest(0)).toBe('closed')
    expect(sim.progress.daily).toEqual(before)
    expect(sim.progress.swaps).toBe(1)
  })
})

describe('saving and loading', () => {
  it('pays nothing again when a shop saved on its summary is opened', () => {
    const sim = day8()
    sim.progress.daily = [give(sim, 'noWalk', 1, { reward: 50_000 })]
    advanceUntil(sim, () => sim.dayOver, 400_000)
    sim.drainEvents()
    const copy = viaJson(sim)
    const ev = copy.drainEvents()
    expect(ev.some(e => e.type === 'dayEnded')).toBe(true)
    expect(questEvents(ev)).toEqual([])
    expect([copy.money, copy.stats.quests]).toEqual([sim.money, sim.stats.quests])
    copy.startDay()
    expect(copy.drainEvents().some(e => e.type === 'questDone')).toBe(false)
    expect(copy.money).toBe(sim.money)
  })

  it("keeps today's quests and their counts when the shop is opened again mid-day", () => {
    const sim = day8()
    ownerServes(sim, 3)
    sim.advance(5_000)
    sim.drainEvents()
    const copy = viaJson(sim)
    expect(copy.progress).toEqual(sim.progress)
    expect(questEvents(copy.drainEvents())).toEqual([])
    expect(copy.progress.total.served).toBe(1)
  })

  it("gives an old shop opened mid-day quests sized to the day left, and this month's quest", () => {
    const sim = open(v14)
    const p = sim.progress
    expect(p.questDay).toBe(11)
    expect(p.daily).toHaveLength(3)
    const avg = averageDay([])
    for (const q of p.daily) {
      expect(q.target).toBeGreaterThanOrEqual(1)
      expect(q.target).toBeLessThanOrEqual(fullTarget(q.kind, avg, sim.availableServices().length))
    }
    const serve = p.daily.find(q => q.kind === 'serve')
    if (serve) expect(serve.target).toBe(6)
    expect(p.monthFrom).toBe(10)
    expect(p.monthly).not.toBeNull()
    expect(questEvents(sim.drainEvents())).toEqual([])
  })

  it('gives an old shop opened late only the monthly quest, and one opened on its summary nothing until morning', () => {
    const late = open({ ...v14, minutes: 1100 })
    expect(late.progress.daily).toEqual([])
    expect(late.progress.questDay).toBe(11)
    expect(late.progress.monthly).not.toBeNull()

    const summary = open({ ...v14, minutes: 1200, dayOver: true })
    expect(summary.progress).toMatchObject({ daily: [], monthly: null, questDay: 0 })
    summary.startDay()
    expect(summary.progress.daily).toHaveLength(3)
    expect(summary.progress.monthFrom).toBe(10)
  })
})

describe('the red dot', () => {
  it('shows each morning once the panel has been opened, until it is opened again', () => {
    const sim = day8()
    expect(sim.questsDot()).toBe(false)
    sim.markHint('openQuests')
    expect(sim.questsDot()).toBe(true)
    sim.markQuestsSeen()
    expect(sim.questsDot()).toBe(false)
    sim.startDay()
    expect(sim.questsDot()).toBe(true)
  })
})

describe('festival days and quest sizing', () => {
  /** Closes `day` with nobody served. */
  const close = (day: number): SpaSim => {
    const sim = fresh()
    sim.day = day - 1
    sim.startDay()
    sim.clock.minutes = 1190
    advanceUntil(sim, () => sim.dayOver, 400_000)
    return sim
  }

  it('leaves a festival day out of the recent days', () => {
    expect(close(37).progress.recent).toEqual([])
    expect(close(46).progress.recent).toHaveLength(1)
  })
})
