import { describe, expect, it } from 'vitest'
import { VIP_FROM_MIN, VIP_TO_MIN } from '../../src/config'
import type { ItemKind } from '../../src/sim/items'
import { createRng } from '../../src/sim/rng'
import type { ServiceId } from '../../src/sim/services'
import { clearStale, dueVip, emptyVipBook, planBooking, scoreVip, VIP_IDS, vipEligible } from '../../src/sim/vips'

/** A seeded rng that counts its draws. */
function counting(seed: number) {
  const rng = createRng(seed)
  const counter = { draws: 0, rng: () => (counter.draws++, rng()) }
  return counter
}

describe('booking a VIP', () => {
  it('books nothing with fewer than two technicians or no VIP\'s service, and draws nothing', () => {
    const book = emptyVipBook()
    const c = counting(1)
    expect(vipEligible(1, ['shampoo', 'mask'])).toBe(false)
    expect(vipEligible(2, ['shampoo'])).toBe(true)
    expect(vipEligible(2, [] as ServiceId[])).toBe(false)
    expect(planBooking(book, 5, 1, ['shampoo', 'mask'], c.rng)).toBeNull()
    expect(planBooking(book, 5, 2, [], c.rng)).toBeNull()
    expect(c.draws).toBe(0)
    expect(book).toEqual(emptyVipBook())
  })

  it('books the first VIP not yet met whose service is open, for tomorrow on a half hour from 10:00 to 17:00', () => {
    const book = emptyVipBook()
    const b = planBooking(book, 5, 2, ['shampoo', 'mask'], createRng(3))!
    expect(b.vip).toBe('miss')
    expect(b.day).toBe(6)
    expect(b.minute).toBeGreaterThanOrEqual(VIP_FROM_MIN)
    expect(b.minute).toBeLessThanOrEqual(VIP_TO_MIN)
    expect(b.minute % 30).toBe(0)
    expect(book.booking).toBe(b)
    expect(book.everBooked).toBe(true)
  })

  it('books one at a time', () => {
    const book = emptyVipBook()
    planBooking(book, 5, 2, ['massage'], createRng(1))
    const c = counting(2)
    const before = { ...book }
    expect(planBooking(book, 5, 2, ['massage'], c.rng)).toBeNull()
    expect(c.draws).toBe(0)
    expect(book).toEqual(before)
  })

  it('waits 2 to 4 days from a visit to the next', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const book = emptyVipBook()
      planBooking(book, 5, 2, ['massage'], createRng(seed))
      expect(book.nextDay).toBeGreaterThanOrEqual(8)
      expect(book.nextDay).toBeLessThanOrEqual(10)
    }
    const book = emptyVipBook()
    planBooking(book, 5, 2, ['massage'], createRng(1))
    book.booking = null
    expect(planBooking(book, 6, 2, ['massage'], createRng(1))).toBeNull()
  })

  it('picks among every VIP with an open service once all have visited', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const book = emptyVipBook()
      for (const id of VIP_IDS) book.vips[id].visits = 1
      expect(planBooking(book, 5, 2, ['shampoo'], createRng(seed))!.vip).toBe('chef')
    }
    const seen = new Set<string>()
    for (let seed = 1; seed <= 40; seed++) {
      const book = emptyVipBook()
      for (const id of VIP_IDS) book.vips[id].visits = 1
      seen.add(planBooking(book, 5, 2, ['massage', 'mask'], createRng(seed))!.vip)
    }
    expect([...seen].sort()).toEqual(['miss', 'singer', 'star'])
  })
})

describe('booking details', () => {
  it('moves down the book as each VIP is met', () => {
    const all: ServiceId[] = ['shampoo', 'massage', 'mask']
    const book = emptyVipBook()
    book.vips.singer.visits = 1
    expect(planBooking(book, 5, 2, all, createRng(1))!.vip).toBe('miss')
    book.booking = null
    book.nextDay = 0
    book.vips.miss.visits = 1
    expect(planBooking(book, 5, 2, all, createRng(1))!.vip).toBe('star')
  })

  it('draws two numbers for a first meeting and three once everyone has visited', () => {
    const first = counting(1)
    planBooking(emptyVipBook(), 5, 2, ['massage'], first.rng)
    expect(first.draws).toBe(2)
    const book = emptyVipBook()
    for (const id of VIP_IDS) book.vips[id].visits = 1
    const again = counting(1)
    planBooking(book, 5, 2, ['massage'], again.rng)
    expect(again.draws).toBe(3)
  })

  it('opens the next booking exactly the day before nextDay', () => {
    const book = emptyVipBook()
    planBooking(book, 5, 2, ['massage'], createRng(1))
    const n = book.nextDay
    book.booking = null
    expect(planBooking(book, n - 2, 2, ['massage'], createRng(1))).toBeNull()
    expect(planBooking(book, n - 1, 2, ['massage'], createRng(1))!.day).toBe(n)
  })
})

describe('a booking in time', () => {
  it('is due only on its day from its minute', () => {
    const book = emptyVipBook()
    book.booking = { vip: 'singer', day: 6, minute: 720 }
    expect(dueVip(book, 6, 719)).toBeNull()
    expect(dueVip(book, 6, 720)).toBe(book.booking)
    expect(dueVip(book, 7, 900)).toBeNull()
    expect(dueVip(book, 5, 900)).toBeNull()
  })

  it('drops a booking for a day gone by', () => {
    const book = emptyVipBook()
    book.booking = { vip: 'singer', day: 6, minute: 720 }
    clearStale(book, 6)
    expect(book.booking).not.toBeNull()
    clearStale(book, 7)
    expect(book.booking).toBeNull()
  })
})

describe('scoring a visit', () => {
  it('keeps the best stars and gives each photo once', () => {
    const book = emptyVipBook()
    const gifts: ItemKind[] = []
    expect(scoreVip(book, gifts, 'singer', 3)).toEqual({ photo: true, board: false })
    expect(scoreVip(book, gifts, 'singer', 3)).toEqual({ photo: false, board: false })
    expect(scoreVip(book, gifts, 'singer', 2)).toEqual({ photo: false, board: false })
    expect(book.vips.singer).toMatchObject({ best: 3, photo: true })
    expect(gifts).toEqual(['photoSinger'])
    expect(scoreVip(book, gifts, 'miss', 2)).toEqual({ photo: false, board: false })
    expect(book.vips.miss).toMatchObject({ best: 2, photo: false })
  })

  it('gives the gold board once, when all four photos are in', () => {
    const book = emptyVipBook()
    const gifts: ItemKind[] = []
    expect(scoreVip(book, gifts, 'singer', 3).board).toBe(false)
    expect(scoreVip(book, gifts, 'miss', 3).board).toBe(false)
    expect(scoreVip(book, gifts, 'star', 3).board).toBe(false)
    expect(scoreVip(book, gifts, 'chef', 3)).toEqual({ photo: true, board: true })
    expect(book.boardGiven).toBe(true)
    expect(scoreVip(book, gifts, 'chef', 3).board).toBe(false)
    expect(gifts).toEqual(['photoSinger', 'photoMiss', 'photoStar', 'photoChef', 'goldBoard'])
  })
})
