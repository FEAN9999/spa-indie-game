import { describe, expect, it } from 'vitest'
import { LOOK_COUNTS } from '../../src/config'
import { createRng } from '../../src/sim/rng'
import {
  REGULARS, REGULAR_IDS, SCHEDULED, addVisit, bookOpen, dueRegular, emptyBook, heartsFor, isMember, loseVisit,
  noteServed, planDay,
} from '../../src/sim/regulars'
import { STAFF_NAMES } from '../../src/strings/vi'

const never = () => {
  throw new Error('rng drawn')
}

describe('heartsFor', () => {
  it('counts the thresholds reached', () => {
    expect([0, 3, 4, 11, 12, 20, 99].map(heartsFor)).toEqual([0, 0, 1, 2, 3, 5, 5])
  })
})

describe('planDay', () => {
  it('does nothing and draws nothing before day 7', () => {
    const book = emptyBook()
    planDay(book, 6, never)
    expect(book).toEqual(emptyBook())
  })

  it('schedules the six on the first planned day, two days apart', () => {
    const book = emptyBook()
    planDay(book, 7, createRng(1))
    expect(SCHEDULED.map(id => book.regulars[id].meetDay)).toEqual([7, 9, 11, 13, 15, 17])
    expect(book.regulars.thao.meetDay).toBeNull()
    expect(book.regulars.lan.meetDay).toBeNull()
  })

  it("starts an old shop's schedule at the day it is first planned", () => {
    const book = emptyBook()
    planDay(book, 12, createRng(1))
    expect(SCHEDULED.map(id => book.regulars[id].meetDay)).toEqual([12, 14, 16, 18, 20, 22])
  })

  it('leaves a met Chú Sáu out of the day-7 schedule', () => {
    const book = emptyBook()
    book.regulars.sau.met = true
    planDay(book, 7, createRng(1))
    expect(SCHEDULED.map(id => book.regulars[id].meetDay)).toEqual([7, 9, null, 11, 13, 15])
  })

  it('forces an unmet regular whose day has come', () => {
    const book = emptyBook()
    planDay(book, 7, createRng(1))
    const at = book.regulars.hanh.visitAt!
    expect(at).toBeGreaterThanOrEqual(540)
    expect(at).toBeLessThan(1020)
    expect(book.regulars.vy.visitAt).toBeNull()
  })

  it('keeps a missed meeting for the next day', () => {
    const book = emptyBook()
    planDay(book, 7, createRng(1))
    planDay(book, 8, createRng(2))
    expect(book.regulars.hanh.visitAt).not.toBeNull()
  })

  it('caps a day at three, forced first', () => {
    const book = emptyBook()
    planDay(book, 7, createRng(1))
    for (const id of ['vy', 'sau', 'khoa', 'tu', 'ba'] as const) book.regulars[id].met = true
    planDay(book, 8, () => 0)
    const planned = REGULAR_IDS.filter(id => book.regulars[id].visitAt !== null)
    expect(planned).toEqual(['hanh', 'vy', 'sau'])
  })

  it('uses the member chance', () => {
    const book = emptyBook()
    planDay(book, 7, createRng(1))
    book.regulars.hanh.met = true
    book.regulars.vy.met = true
    book.regulars.vy.hearts = 3
    // day 8 forces nobody: the others are not due yet, so only the optional draws decide
    planDay(book, 8, () => 0.4)
    expect(book.regulars.hanh.visitAt).toBeNull()
    expect(book.regulars.vy.visitAt).not.toBeNull()
  })

  it("plans chú Sáu's extra customer", () => {
    const book = emptyBook()
    book.extraCustomer = true
    planDay(book, 7, createRng(3))
    expect(book.extraAt).toBeGreaterThanOrEqual(540)
    expect(book.extraAt).toBeLessThan(1020)
    const plain = emptyBook()
    planDay(plain, 7, createRng(3))
    expect(plain.extraAt).toBeNull()
  })
})

describe('dueRegular', () => {
  it('picks the earliest due', () => {
    const book = emptyBook()
    book.regulars.hanh.visitAt = 600
    book.regulars.vy.visitAt = 560
    expect(dueRegular(book, 650)).toBe('vy')
    expect(dueRegular(book, 500)).toBeNull()
  })
})

describe('addVisit', () => {
  it('scores visits by who served and the stars', () => {
    const book = emptyBook()
    addVisit(book, 'hanh', 3, true, 7)
    expect(book.regulars.hanh.points).toBe(4)
    addVisit(book, 'vy', 2, false, 7)
    expect(book.regulars.vy.points).toBe(1)
    addVisit(book, 'sau', 1, true, 7)
    expect(book.regulars.sau.points).toBe(0)
    for (let i = 0; i < 10; i++) addVisit(book, 'khoa', 3, true, 7)
    expect(book.regulars.khoa.points).toBe(20)
  })

  it('reports a new heart and the member card once', () => {
    const book = emptyBook()
    book.regulars.vy.points = 8
    book.regulars.vy.hearts = 2
    expect(addVisit(book, 'vy', 3, true, 7)).toMatchObject({ hearts: 3, member: true })
    expect(addVisit(book, 'vy', 1, true, 7)).toMatchObject({ hearts: 0, member: false })
    expect(isMember(book.regulars.vy)).toBe(true)
  })

  it('gives each gift once at five hearts', () => {
    const book = emptyBook()
    book.regulars.hanh.points = 16
    book.regulars.hanh.hearts = 4
    const first = addVisit(book, 'hanh', 3, true, 20)
    expect(first.gift).toEqual({ kind: 'regular', who: 'thao' })
    expect(book.regulars.thao.meetDay).toBe(21)
    expect(addVisit(book, 'hanh', 3, true, 21).gift).toBeNull()

    book.regulars.vy.points = 16
    book.regulars.vy.hearts = 4
    addVisit(book, 'vy', 3, true, 20)
    expect(book.gifts).toContain('vyPainting')

    book.regulars.sau.points = 16
    book.regulars.sau.hearts = 4
    addVisit(book, 'sau', 3, true, 20)
    expect(book.extraCustomer).toBe(true)

    book.regulars.khoa.points = 16
    book.regulars.khoa.hearts = 4
    const money = addVisit(book, 'khoa', 3, true, 20).gift
    expect(money).toEqual({ kind: 'money', amount: 300000 })
  })

  it('gives the board when the last regular reaches five hearts', () => {
    const book = emptyBook()
    for (const id of REGULAR_IDS) {
      book.regulars[id].points = 20
      book.regulars[id].hearts = 5
    }
    book.regulars.lan.points = 16
    book.regulars.lan.hearts = 4
    const result = addVisit(book, 'lan', 3, true, 30)
    expect(result.board).toBe(true)
    expect(book.gifts.at(-1)).toBe('regularsBoard')
    expect(addVisit(book, 'lan', 3, true, 31).board).toBe(false)
    expect(book.gifts.filter(g => g === 'regularsBoard')).toHaveLength(1)
  })
})

describe('loseVisit', () => {
  it('never loses a heart', () => {
    const book = emptyBook()
    book.regulars.hanh.points = 13
    book.regulars.hanh.hearts = 3
    loseVisit(book, 'hanh')
    expect(book.regulars.hanh.points).toBe(12)
    loseVisit(book, 'hanh')
    expect(book.regulars.hanh.points).toBe(12)
  })
})

describe('the book', () => {
  it('notes the kinds served', () => {
    const book = emptyBook()
    noteServed(book, 'elder')
    noteServed(book, 'elder')
    expect(book.served.elder).toBe(2)
    expect(book.kindsMet).toEqual(['elder'])
  })

  it('is open once someone is met', () => {
    const book = emptyBook()
    expect(bookOpen(book)).toBe(false)
    book.regulars.hanh.met = true
    expect(bookOpen(book)).toBe(true)
  })
})

describe('REGULARS', () => {
  it('looks are in range and differ from each other', () => {
    const seen = new Set<string>()
    for (const id of REGULAR_IDS) {
      const { skin, hair, hairStyle, shirt } = REGULARS[id].look
      expect(skin).toBeLessThan(LOOK_COUNTS.skin)
      expect(hair).toBeLessThan(LOOK_COUNTS.hair)
      expect(hairStyle).toBeLessThan(LOOK_COUNTS.hairStyle)
      expect(shirt).toBeLessThan(LOOK_COUNTS.shirt)
      seen.add(JSON.stringify(REGULARS[id].look))
    }
    expect(seen.size).toBe(REGULAR_IDS.length)
  })

  it("staff names never clash with a regular's name", () => {
    for (const name of ['Lan', 'Thảo', 'Vy', 'Hạnh']) expect(STAFF_NAMES as readonly string[]).not.toContain(name)
  })
})
