import { describe, expect, it } from 'vitest'
import { VIP_FROM_MIN, VIP_TO_MIN } from '../../src/config'
import { clearIdolStale, dueIdol, emptyIdolBook, IDOL_IDS, IDOLS, idolEligible, planIdol, scoreIdol } from '../../src/sim/idols'
import type { ItemKind } from '../../src/sim/items'
import { createRng } from '../../src/sim/rng'
import type { ServiceId } from '../../src/sim/services'

const ALL: ServiceId[] = ['shampoo', 'massage', 'mask']
const boom = () => {
  throw new Error('rng must not be called')
}

describe('booking a star', () => {
  it('returns null and draws nothing without the board, with 1 technician, with no open service, while pending, before nextDay', () => {
    const fresh = emptyIdolBook()
    expect(idolEligible(false, 2, ALL)).toBe(false)
    expect(idolEligible(true, 1, ALL)).toBe(false)
    expect(idolEligible(true, 2, [] as ServiceId[])).toBe(false)
    expect(idolEligible(true, 2, ['mask'])).toBe(true)
    expect(planIdol(fresh, 5, false, 2, ALL, null, boom)).toBeNull()
    expect(planIdol(fresh, 5, true, 1, ALL, null, boom)).toBeNull()
    expect(planIdol(fresh, 5, true, 2, [], null, boom)).toBeNull()
    expect(fresh).toEqual(emptyIdolBook())

    const pending = emptyIdolBook()
    pending.booking = { idol: 'gd', day: 6, minute: 720 }
    const before = structuredClone(pending)
    expect(planIdol(pending, 5, true, 2, ALL, null, boom)).toBeNull()
    expect(pending).toEqual(before)

    const early = emptyIdolBook()
    early.nextDay = 10
    expect(planIdol(early, 8, true, 2, ALL, null, boom)).toBeNull()
    expect(early).toEqual({ ...emptyIdolBook(), nextDay: 10 })
  })

  it('books Sơn Tùng first, then down the list, skipping stars whose service is closed', () => {
    expect(planIdol(emptyIdolBook(), 5, true, 2, ALL, null, createRng(1))!.idol).toBe('sontung')
    expect(planIdol(emptyIdolBook(), 5, true, 2, ['shampoo'], null, createRng(1))!.idol).toBe('gd')
    const book = emptyIdolBook()
    for (const id of ['sontung', 'taylor', 'gd'] as const) book.idols[id].visits = 1
    expect(planIdol(book, 5, true, 2, ALL, null, createRng(1))!.idol).toBe('jennie')
  })

  it('picks at random among open stars once all nine have visited', () => {
    const pick = (v: number, available: ServiceId[]) => {
      const book = emptyIdolBook()
      for (const id of IDOL_IDS) book.idols[id].visits = 1
      return planIdol(book, 5, true, 2, available, null, () => v)!.idol
    }
    expect(pick(0, ALL)).toBe('sontung')
    expect(pick(0.5, ALL)).toBe('hieuthuhai')
    expect(pick(0.99, ALL)).toBe('daesung')
    expect(pick(0.99, ['shampoo'])).toBe('weeknd')
  })

  it('draws who, then the minute, then the gap', () => {
    const calls: number[] = []
    const seq = [0.99, 0, 0.99]
    const book = emptyIdolBook()
    for (const id of IDOL_IDS) book.idols[id].visits = 1
    const b = planIdol(book, 5, true, 2, ALL, null, () => (calls.push(1), seq[calls.length - 1]))!
    expect(calls.length).toBe(3)
    expect(b).toEqual({ idol: 'daesung', day: 6, minute: 600 })
    expect(book.nextDay).toBe(6 + 5)
    const first = emptyIdolBook()
    calls.length = 0
    planIdol(first, 5, true, 2, ALL, null, () => (calls.push(1), 0))
    expect(calls.length).toBe(2)
  })

  it('books a half hour from 10:00 to 17:00 for tomorrow', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const book = emptyIdolBook()
      const b = planIdol(book, 5, true, 2, ALL, null, createRng(seed))!
      expect(b.minute % 30).toBe(0)
      expect(b.minute).toBeGreaterThanOrEqual(VIP_FROM_MIN)
      expect(b.minute).toBeLessThanOrEqual(VIP_TO_MIN)
      expect(b.day).toBe(6)
      expect(book.booking).toBe(b)
      expect(book.everBooked).toBe(true)
    }
  })

  it("keeps at least 3 hours from tomorrow's VIP", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const a = planIdol(emptyIdolBook(), 5, true, 2, ALL, { vip: 'singer', day: 6, minute: 600 }, createRng(seed))!
      expect(a.minute).toBeGreaterThanOrEqual(780)
      const b = planIdol(emptyIdolBook(), 5, true, 2, ALL, { vip: 'singer', day: 6, minute: 780 }, createRng(seed))!
      expect(b.minute <= 600 || b.minute >= 960).toBe(true)
    }
    const minutes = new Set<number>()
    for (let seed = 1; seed <= 200; seed++) {
      minutes.add(planIdol(emptyIdolBook(), 5, true, 2, ALL, { vip: 'singer', day: 7, minute: 600 }, createRng(seed))!.minute)
    }
    expect(minutes.has(600)).toBe(true)
    expect(minutes.has(630)).toBe(true)
  })

  it('waits 3 to 5 days before the next booking', () => {
    const gaps = new Set<number>()
    for (let seed = 1; seed <= 50; seed++) {
      const book = emptyIdolBook()
      planIdol(book, 5, true, 2, ALL, null, createRng(seed))
      const gap = book.nextDay - 6
      expect(gap).toBeGreaterThanOrEqual(3)
      expect(gap).toBeLessThanOrEqual(5)
      gaps.add(gap)
    }
    expect([...gaps].sort()).toEqual([3, 4, 5])
  })
})

describe('a star booking in time', () => {
  it('is due only on its day from its minute', () => {
    const book = emptyIdolBook()
    book.booking = { idol: 'sontung', day: 6, minute: 720 }
    expect(dueIdol(book, 6, 719)).toBeNull()
    expect(dueIdol(book, 6, 720)).toBe(book.booking)
    expect(dueIdol(book, 7, 900)).toBeNull()
    expect(dueIdol(book, 5, 900)).toBeNull()
  })

  it('drops a booking for a day gone by', () => {
    const book = emptyIdolBook()
    book.booking = { idol: 'sontung', day: 6, minute: 720 }
    clearIdolStale(book, 6)
    expect(book.booking).not.toBeNull()
    clearIdolStale(book, 7)
    expect(book.booking).toBeNull()
  })
})

describe('scoring a star visit', () => {
  it('gives the photo and thanks on the first 3 stars only, once', () => {
    const book = emptyIdolBook()
    const gifts: ItemKind[] = []
    expect(scoreIdol(book, gifts, 'sontung', 3)).toEqual({ photo: true, wall: false })
    expect(book.idols.sontung).toMatchObject({ best: 3, photo: true, thanked: true })
    expect(scoreIdol(book, gifts, 'sontung', 3)).toEqual({ photo: false, wall: false })
    expect(gifts).toEqual([IDOLS.sontung.photo])
  })

  it('keeps the best stars and gives nothing for 2 stars', () => {
    const book = emptyIdolBook()
    const gifts: ItemKind[] = []
    expect(scoreIdol(book, gifts, 'taylor', 2)).toEqual({ photo: false, wall: false })
    expect(book.idols.taylor).toMatchObject({ best: 2, photo: false, thanked: false })
    scoreIdol(book, gifts, 'taylor', 1)
    expect(book.idols.taylor.best).toBe(2)
    expect(gifts).toEqual([])
  })

  it('gives the wall once, with the ninth photo', () => {
    const book = emptyIdolBook()
    const gifts: ItemKind[] = []
    for (const id of IDOL_IDS.slice(0, 8)) expect(scoreIdol(book, gifts, id, 3).wall).toBe(false)
    expect(scoreIdol(book, gifts, 'daesung', 3)).toEqual({ photo: true, wall: true })
    expect(book.wallGiven).toBe(true)
    expect(scoreIdol(book, gifts, 'daesung', 3).wall).toBe(false)
    expect(gifts.filter(g => g === 'starWall')).toHaveLength(1)
    expect(gifts).toHaveLength(10)
  })
})
