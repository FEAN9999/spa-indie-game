import { describe, expect, it } from 'vitest'
import { EVENT_FROM_DAY, INSPECT_MIN } from '../../src/config'
import { dueKol, emptyEventBook, hotDaysLeft, hotOn, planEvent, type EventBook } from '../../src/sim/events'
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
      expect(planEvent(book, day, vipDay, rng)).toBeNull()
      expect(book).toEqual(before)
      expect(rng.calls).toBe(0)
    }
  })

  it('plans tomorrow on day 9', () => {
    const book = emptyEventBook()
    const plan = planEvent(book, 9, null, createRng(3))
    expect(plan?.day).toBe(EVENT_FROM_DAY)
    expect(book.plan).toEqual(plan)
    expect(book.last).toBe(plan?.kind)
  })

  it('never repeats the last event, and spaces the next one 2 to 4 days', () => {
    const gaps = new Set<number>()
    for (let seed = 1; seed <= 200; seed++) {
      const book: EventBook = { ...emptyEventBook(), last: 'kol' }
      const plan = planEvent(book, 12, null, createRng(seed))!
      expect(plan.kind).toBe('inspect')
      gaps.add(book.nextDay - plan.day)
    }
    expect([...gaps].sort()).toEqual([2, 3, 4])
  })

  it('books Mi Mi on a half hour from 10:00 to 17:00 and the inspector at 15:00', () => {
    const kol = new Set<number>()
    for (let seed = 1; seed <= 400; seed++) {
      const plan = planEvent(emptyEventBook(), 12, null, createRng(seed))!
      if (plan.kind === 'inspect') expect(plan.minute).toBe(INSPECT_MIN)
      else kol.add(plan.minute)
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
      for (let day = 9; day <= 35; day++) if (planEvent(book, day, null, rng)) total++
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
})
