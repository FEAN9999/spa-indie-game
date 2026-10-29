import { describe, expect, it } from 'vitest'
import { EVENT_FROM_DAY, INSPECT_MIN, POWER_FROM_MIN } from '../../src/config'
import { dueKol, emptyEventBook, hotCardToday, hotDaysLeft, hotOn, makeHot, planEvent, type EventBook } from '../../src/sim/events'
import { createRng, type Rng } from '../../src/sim/rng'

/** An rng that counts its draws. */
function counting(seed = 1): Rng & { calls: number } {
  const rng = createRng(seed)
  const f = (() => {
    f.calls++
    return rng()
  }) as Rng & { calls: number }
  f.calls = 0
  return f
}

describe('planning tomorrow', () => {
  it("plans nothing before day 10, in a festival month, before nextDay or on a VIP's day, and draws nothing then", () => {
    const cases: [EventBook, number, number | null][] = [
      [emptyEventBook(), 8, null],
      [emptyEventBook(), 21, null],
      [{ ...emptyEventBook(), nextDay: 15 }, 12, null],
      [emptyEventBook(), 12, 13],
    ]
    for (const [book, day, vipDay] of cases) {
      const before = structuredClone(book)
      const rng = counting()
      expect(planEvent(book, day, vipDay, true, rng)).toBeNull()
      expect(book).toEqual(before)
      expect(rng.calls).toBe(0)
    }
  })

  it('plans tomorrow on day 9', () => {
    const book = emptyEventBook()
    const plan = planEvent(book, 9, null, true, createRng(3))
    expect(plan?.day).toBe(EVENT_FROM_DAY)
    expect(book.plan).toEqual(plan)
    expect(book.last).toBe(plan?.kind)
  })

  it('never repeats the last event, and spaces the next one 2 to 4 days', () => {
    const gaps = new Set<number>()
    const kinds = new Set<string>()
    for (let seed = 1; seed <= 200; seed++) {
      const book: EventBook = { ...emptyEventBook(), last: 'kol' }
      const plan = planEvent(book, 12, null, true, createRng(seed))!
      kinds.add(plan.kind)
      gaps.add(book.nextDay - plan.day)
    }
    expect([...kinds].sort()).toEqual(['inspect', 'power', 'rival'])
    expect([...gaps].sort()).toEqual([2, 3, 4])
  })

  it('plans a power cut only in a shop with a machine service', () => {
    const drawn = (machines: boolean) => {
      const kinds = new Set<string>()
      for (let seed = 1; seed <= 400; seed++) kinds.add(planEvent(emptyEventBook(), 12, null, machines, createRng(seed))!.kind)
      return [...kinds].sort()
    }
    expect(drawn(false)).toEqual(['inspect', 'kol', 'rival'])
    expect(drawn(true)).toEqual(['inspect', 'kol', 'power', 'rival'])
  })

  it('books Mi Mi on a half hour from 10:00 to 17:00, the inspector at 15:00 and the power cut at 14:00', () => {
    const kol = new Set<number>()
    for (let seed = 1; seed <= 400; seed++) {
      const plan = planEvent(emptyEventBook(), 12, null, true, createRng(seed))!
      if (plan.kind === 'inspect') expect(plan.minute).toBe(INSPECT_MIN)
      else if (plan.kind === 'power') expect(plan.minute).toBe(POWER_FROM_MIN)
      else if (plan.kind === 'kol') kol.add(plan.minute)
    }
    for (const m of kol) expect(m % 30 === 0 && m >= 600 && m <= 1020).toBe(true)
    expect(kol.has(600)).toBe(true)
    expect(kol.has(1020)).toBe(true)
  })

  // spec 7.4 guesses about five; with its 2–4 day gaps the 18 days without a festival from day 10 hold about seven, fewer with VIPs
  it('brings five to eight events in the first year', () => {
    let total = 0
    for (let seed = 1; seed <= 100; seed++) {
      const book = emptyEventBook()
      const rng = createRng(seed)
      for (let day = 9; day <= 35; day++) if (planEvent(book, day, null, true, rng)) total++
    }
    expect(total / 100).toBeGreaterThanOrEqual(5)
    expect(total / 100).toBeLessThanOrEqual(8)
  })
})

describe('Mi Mi and the hot days', () => {
  it("is due at her minute on her day only", () => {
    const book: EventBook = { ...emptyEventBook(), plan: { kind: 'kol', day: 13, minute: 870 } }
    expect(dueKol(book, 13, 869)).toBe(false)
    expect(dueKol(book, 13, 870)).toBe(true)
    expect(dueKol(book, 14, 900)).toBe(false)
    expect(dueKol({ ...book, plan: { kind: 'inspect', day: 13, minute: 900 } }, 13, 900)).toBe(false)
  })

  it("is hot the two days after Mi Mi's 3 stars", () => {
    const book: EventBook = { ...emptyEventBook(), hotUntil: 14 }
    expect([12, 13, 14, 15].map(d => hotOn(book, d))).toEqual([false, true, true, false])
    expect([13, 14, 15].map(d => hotDaysLeft(book, d))).toEqual([2, 1, 0])
    expect(hotOn(emptyEventBook(), 1)).toBe(false)
  })

  it('makeHot starts a run from tomorrow', () => {
    const book = emptyEventBook()
    makeHot(book, 10, 'kol')
    expect(book).toMatchObject({ hotUntil: 12, hotDays: 2, hotCardDay: 11, hotBy: 'kol' })
    expect([10, 11, 12, 13].map(d => hotOn(book, d))).toEqual([false, true, true, false])
  })

  it('makeHot extends a running spell without a gap', () => {
    const a = emptyEventBook()
    makeHot(a, 10, 'kol')
    makeHot(a, 12, 'taylor')
    expect(a).toMatchObject({ hotUntil: 14, hotCardDay: 13, hotBy: 'taylor' })
    expect([11, 12, 13, 14].map(d => hotOn(a, d))).toEqual([true, true, true, true])
    const b = emptyEventBook()
    makeHot(b, 10, 'kol')
    makeHot(b, 11, 'gd')
    expect(b.hotUntil).toBe(13)
    expect([11, 12, 13].map(d => hotOn(b, d))).toEqual([true, true, true])
    expect(hotOn(b, 14)).toBe(false)
  })

  it('makeHot after a run has ended starts a new one', () => {
    const book = emptyEventBook()
    makeHot(book, 10, 'kol')
    makeHot(book, 14, 'taylor')
    expect([13, 14, 15, 16, 17].map(d => hotOn(book, d))).toEqual([false, false, true, true, false])
  })

  it('hotCardToday is true on a runs first day and on hotCardDay', () => {
    const book = emptyEventBook()
    makeHot(book, 10, 'kol')
    makeHot(book, 12, 'taylor')
    expect([10, 11, 12, 13, 14].map(d => hotCardToday(book, d))).toEqual([false, true, false, true, false])
    expect([12, 13, 14].map(d => hotCardToday({ ...emptyEventBook(), hotUntil: 14 }, d))).toEqual([false, true, false])
  })
})
