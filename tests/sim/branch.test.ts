import { describe, expect, it } from 'vitest'
import { CANDIDATES_PER_DAY, HOT_DAYS, OWNER_START, PLACE_KINDS, STOCK_START } from '../../src/config'
import { placeProblem } from '../../src/sim/build'
import { drawKind, MAIN_KINDS } from '../../src/sim/customers'
import { festivalOf } from '../../src/sim/festivals'
import { isWalkable } from '../../src/sim/grid'
import { beautyOf, itemsFromLayout } from '../../src/sim/items'
import { BRANCH_LAYOUT, placePrice } from '../../src/sim/places'
import { isJudgeDay } from '../../src/sim/rank'
import { emptyBook } from '../../src/sim/regulars'
import { createRng } from '../../src/sim/rng'
import { SERVICES } from '../../src/sim/services'
import { SpaSim } from '../../src/sim/spa'
import { isPast, newStarter } from '../../src/sim/starter'
import type { SimEvent } from '../../src/sim/types'
import { STOCK_ITEMS } from '../../src/sim/stock'
import { kindRows } from '../../src/view/guestBook'
import { advanceUntil, hireStaff, ownerServes, starShop } from './helpers'

const beachOf = (main = starShop(), seed = 9) => SpaSim.newBranch('beach', main, createRng(seed))

describe('places', () => {
  it('prices a service by the place, to the nearest thousand', () => {
    expect(placePrice(40_000, 'beach')).toBe(40_000)
    expect(placePrice(45_000, 'oldTown')).toBe(54_000)
    expect(placePrice(150_000, 'uptown')).toBe(240_000)
    expect(placePrice(41_700, 'oldTown')).toBe(50_000)
  })
})

describe('the tourist and the kind lists', () => {
  it('never draws a tourist at the main shop', () => {
    for (const picky of [1, 2]) {
      const rng = createRng(3)
      const kinds = new Set(Array.from({ length: 3000 }, () => drawKind(40, rng, picky)))
      expect(kinds.has('tourist')).toBe(false)
    }
  })

  it("draws a beach's own kinds by weight, with no celebrity", () => {
    const rng = createRng(4)
    const kinds = Array.from({ length: 9000 }, () => drawKind(40, rng, 1, PLACE_KINDS.beach))
    expect(new Set(kinds)).toEqual(new Set(['tourist', 'student', 'office', 'picky']))
    expect(Math.abs(kinds.filter(k => k === 'tourist').length / 9000 - 5 / 9)).toBeLessThan(0.03)
  })

  it('counts the five main kinds in the guest book and no tourist', () => {
    expect(MAIN_KINDS).toEqual(['student', 'office', 'picky', 'elder', 'celeb'])
    expect(kindRows(emptyBook()).map(r => r.kind)).toEqual(MAIN_KINDS)
    expect(Object.keys(emptyBook().served)).toEqual([...MAIN_KINDS])
    const branch = beachOf()
    ownerServes(branch, 3, { kind: 'tourist', service: 'shampoo' })
    expect(Object.keys(branch.book.served)).toEqual([...MAIN_KINDS])
    expect(branch.book.kindsMet).toEqual([])
  })
})

describe('opening a branch', () => {
  it('copies the main shop and starts fresh', () => {
    const main = starShop()
    const branch = beachOf(main)
    expect(branch.place).toBe('beach')
    expect(branch.day).toBe(main.day)
    expect(branch.clock.minutes).toBe(main.clock.minutes)
    expect(branch.services).toEqual(main.services)
    expect(branch.services).not.toBe(main.services)
    for (const item of STOCK_ITEMS) expect(branch.stock[item]).toBe(STOCK_START)
    expect(branch.staff).toEqual([])
    expect(branch.candidates.length).toBe(CANDIDATES_PER_DAY)
    expect(branch.maxFloors()).toBe(1)
    expect(branch.grid.stairs).toEqual([])
    const laid = itemsFromLayout(BRANCH_LAYOUT)
    expect(branch.items).toEqual([...laid, { id: laid.length + 1, kind: 'surfboard', x: 11, y: 10, flip: false, gift: true }])
  })

  it('shares one purse', () => {
    const main = starShop()
    const branch = beachOf(main)
    branch.money -= 1000
    expect(main.money).toBe(20_000_000 - 1000)
    main.money -= 500
    expect(branch.money).toBe(20_000_000 - 1500)
  })

  it("draws nothing from the main shop's stream", () => {
    const a = starShop(3, 20_000_000, 5, true)
    const b = starShop(3, 20_000_000, 5, true)
    const branch = beachOf(a)
    branch.advance(1000)
    a.advance(60_000)
    b.advance(60_000)
    expect(a.toSave()).toEqual(b.toSave())
  })
})

describe("a branch's own decor", () => {
  it('lays one surfboard at the beach: a gift that blocks nothing, on the rebuilt room, with its beauty', () => {
    const branch = beachOf()
    const boards = branch.items.filter(i => i.kind === 'surfboard')
    expect(boards).toEqual([{ id: expect.any(Number), kind: 'surfboard', x: 11, y: 10, flip: false, gift: true }])
    const others = branch.items.filter(i => i.kind !== 'surfboard')
    expect(placeProblem(branch.shellGrid(), others, boards[0], { door: branch.grid.door, ownerStart: OWNER_START, floors: 1 })).toBeNull()
    expect(isWalkable(branch.grid, { x: 11, y: 10 })).toBe(false)
    expect(branch.beauty()).toBe(beautyOf(others) + 3)
  })
})

describe('a branch at its place', () => {
  it('charges the place price, with no rank uplift', () => {
    const main = starShop(5)
    main.rank.stars = 5
    const branch = beachOf(main)
    expect(ownerServes(branch, 3).amount).toBe(SERVICES.shampoo.price)
    const town = SpaSim.newBranch('oldTown', main, createRng(2))
    expect(ownerServes(town, 3).amount).toBe(48_000)
  })

  it('shuts the main-only features and asks for its arrivals', () => {
    const branch = beachOf()
    expect(branch.questsOpen()).toBe(false)
    expect(branch.hintDone('tapCustomer')).toBe(true)
    expect(branch.benchOpen()).toBe(false)
    expect(branch.serviceProblem('steam')).toBe('main')
    const money = branch.money
    expect(branch.openService('steam')).toBe('main')
    expect(branch.money).toBe(money)
    expect(branch.arrivalFactor()).toBe(1 / 1.2)
  })

  it('has no festival on a festival eve', () => {
    let day = 9
    while (!(festivalOf(day) && !festivalOf(day - 1))) day++
    const main = starShop()
    main.day = day - 1
    const branch = beachOf(main)
    branch.eventBook.plan = { kind: 'inspect', day, minute: 600 }
    branch.eventBook.hotUntil = day - 1 + HOT_DAYS
    branch.drainEvents()
    branch.startDay()
    expect(branch.day).toBe(day)
    expect(branch.drainEvents().filter(e => ['festivalStarted', 'eventToday', 'hotStarted'].includes(e.type))).toEqual([])
    expect(branch.festivalServiceToday()).toBeNull()
  })

  it('ends a judge day with no judging and only its wages', () => {
    let day = 12
    while (!isJudgeDay(day)) day++
    const main = starShop()
    main.day = day
    const branch = beachOf(main)
    branch.startDay()
    branch.day = day
    const tech = hireStaff(branch, 'technician')
    const rank = structuredClone(branch.rank)
    const money = branch.money
    advanceUntil(branch, () => branch.dayOver, 600_000)
    expect(branch.rank).toEqual(rank)
    expect(branch.money).toBe(money - tech.wage)
    expect(branch.vip.booking).toBeNull()
    expect(branch.eventBook.plan).toBeNull()
  })

  it("serves only its place's kinds, and no regular, VIP or Mi Mi, through a day", () => {
    const main = starShop(3, 20_000_000, 1, true)
    const branch = beachOf(main)
    branch.startDay()
    const seen: string[] = []
    const odd: string[] = []
    for (let t = 0; !branch.dayOver && t < 600_000; t += 100) {
      branch.advance(100)
      for (const e of branch.drainEvents()) {
        if (e.type !== 'customerArrived') continue
        const c = branch.customers.find(x => x.id === e.id)!
        seen.push(c.kind)
        if (c.regular || c.vip || c.kol) odd.push(String(c.id))
      }
    }
    expect(branch.dayOver).toBe(true)
    expect(seen.length).toBeGreaterThan(0)
    for (const k of seen) expect(Object.keys(PLACE_KINDS.beach)).toContain(k)
    expect(odd).toEqual([])
  })
})

describe('the starter chain at a branch', () => {
  /** A main shop still on the starter chain, as a new shop is; nobody walks in unless `autoSpawn`. */
  const starterMain = (autoSpawn = false) => {
    const main = starShop(3, 20_000_000, 1, autoSpawn)
    main.starter = newStarter()
    return main
  }

  it('opens a branch with the chain past, from a main shop still on it', () => {
    const branch = beachOf(starterMain())
    expect(isPast(branch.starter)).toBe(true)
    expect(branch.questsButtonOpen()).toBe(false)
  })

  it('never runs a goal, a gift or chú Sáu at a branch', () => {
    const branch = beachOf(starterMain())
    const events: SimEvent[] = []
    for (let i = 0; i < 17; i++) events.push(...ownerServes(branch, 3).events)
    hireStaff(branch, 'technician')
    events.push(...branch.drainEvents())
    expect(events.some(e => e.type === 'goalDone')).toBe(false)
    expect(isPast(branch.starter)).toBe(true)
    expect(branch.book.gifts).toEqual([])
    expect(branch.book.regulars.sau.met).toBe(false)
  })

  it("opens a branch's day with a stranger, never chú Sáu", () => {
    const branch = beachOf(starterMain(true))
    advanceUntil(branch, () => branch.customers.length > 0)
    expect(branch.customers[0].regular).toBeNull()
  })
})
