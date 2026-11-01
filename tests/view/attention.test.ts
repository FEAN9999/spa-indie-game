import { describe, expect, it } from 'vitest'
import type { AwayResult } from '../../src/sim/away'
import { Attention, type Held, type Inspected, type ShopState, type StairsCleared } from '../../src/view/attention'

const quiet = (): ShopState => ({ paused: false, dayOver: false, playing: false, lesson: false, topBusy: false })
const back = (paid: number): AwayResult => ({ paid, places: [null], ms: 60_000, profit: paid, days: 0, capped: false, tip: false })
const inspected = (reward: number): Inspected => ({ type: 'inspected', checks: { stock: true, calm: true, tidy: true }, low: null, lost: 0, beauty: 40, reward, cert: false })
const stairs = (count: number): StairsCleared => ({ type: 'stairsCleared', count, refund: 0, gifts: 0, rebuy: null })

/** An attention over a shop the test changes as it goes. */
function setup(atMain = true, carried: readonly Held[] = []) {
  const shop = quiet()
  return { shop, a: new Attention(atMain, carried, () => shop) }
}

/** Everything let out now, in order. */
function drain(a: Attention): Held[] {
  const out: Held[] = []
  for (let h = a.next(); h; h = a.next()) out.push(h)
  return out
}

describe('the covers over the shop', () => {
  it('leaves a fresh shop free to tap and to show cards', () => {
    const { a } = setup()
    expect(a.covered()).toBe(false)
    expect(a.mapFree()).toBe(true)
    expect(a.shopFree()).toBe(true)
  })

  it('holds the map under any cover until it is released', () => {
    const { a } = setup()
    for (const c of ['panel', 'shutter', 'away', 'update'] as const) {
      const release = a.cover(c)
      expect(a.covered()).toBe(true)
      expect(a.covered(c)).toBe(true)
      expect(a.mapFree()).toBe(false)
      release()
      expect(a.mapFree()).toBe(true)
    }
  })

  it('says whether any of the covers asked about is over the shop', () => {
    const { a } = setup()
    a.cover('update')
    expect(a.covered('panel', 'shutter', 'away')).toBe(false)
    expect(a.covered('away', 'update')).toBe(true)
  })

  it('keeps the shop covered until every cover over it is gone, however they nest', () => {
    const { a } = setup()
    const panel = a.cover('panel')
    const away = a.cover('away')
    away()
    expect(a.covered('away')).toBe(false)
    expect(a.covered('panel')).toBe(true)
    // a second release of the same cover lifts nothing else
    away()
    expect(a.covered()).toBe(true)
    panel()
    expect(a.covered()).toBe(false)
  })

  it('holds the map under the pause card, the day summary and a game too', () => {
    const { shop, a } = setup()
    for (const k of ['paused', 'dayOver', 'playing'] as const) {
      shop[k] = true
      expect(a.mapFree()).toBe(false)
      shop[k] = false
    }
    expect(a.mapFree()).toBe(true)
  })

  it('leaves the map free while the top spot is busy, but not the shop', () => {
    const { shop, a } = setup()
    shop.topBusy = true
    expect(a.mapFree()).toBe(true)
    expect(a.shopFree()).toBe(false)
  })
})

describe('what waits for the player', () => {
  it('lets a card out once nothing covers the shop, and only once', () => {
    const { a } = setup()
    const release = a.cover('panel')
    a.hold({ kind: 'gold', card: 'goldHands' })
    expect(a.next()).toBeNull()
    expect(a.shopFree()).toBe(false)
    release()
    expect(a.next()).toEqual({ kind: 'gold', card: 'goldHands' })
    expect(a.next()).toBeNull()
    expect(a.shopFree()).toBe(true)
  })

  it('keeps every card but the welcome-back one waiting under the pause card, the summary, a game and the update check', () => {
    const { shop, a } = setup()
    const states: (keyof ShopState)[] = ['paused', 'dayOver', 'playing']
    for (const k of states) {
      shop[k] = true
      a.hold({ kind: 'wear', text: 'Áo mới' })
      a.hold({ kind: 'stairs', note: stairs(1) })
      a.hold({ kind: 'inspection', note: inspected(0) })
      a.hold({ kind: 'found', text: 'Tìm thấy' })
      a.hold({ kind: 'gold', card: 'goldHands' })
      expect(a.next()).toBeNull()
      shop[k] = false
      expect(drain(a).map(h => h.kind)).toEqual(['wear', 'stairs', 'inspection', 'found', 'gold'])
    }
    const update = a.cover('update')
    a.hold({ kind: 'gold', card: 'goldHands' })
    expect(a.next()).toBeNull()
    update()
    expect(a.next()?.kind).toBe('gold')
  })

  it('lets things out in a fixed order, whatever order they came in', () => {
    const { a } = setup()
    a.hold({ kind: 'gold', card: 'goldHands' })
    a.hold({ kind: 'found', text: 'Tìm thấy' })
    a.hold({ kind: 'inspection', note: inspected(0) })
    a.hold({ kind: 'stairs', note: stairs(1) })
    a.hold({ kind: 'wear', text: 'Áo mới' })
    a.hold({ kind: 'away', back: back(500) })
    expect(drain(a).map(h => h.kind)).toEqual(['away', 'wear', 'stairs', 'inspection', 'found', 'gold'])
  })

  it('stops letting things out once one of them covers the shop', () => {
    const { a } = setup()
    a.hold({ kind: 'inspection', note: inspected(0) })
    a.hold({ kind: 'gold', card: 'goldHands' })
    expect(a.next()?.kind).toBe('inspection')
    const release = a.cover('panel')
    expect(a.next()).toBeNull()
    release()
    expect(a.next()?.kind).toBe('gold')
  })

  it('keeps gold cards back while the top spot is busy, but not the inspection or the toasts', () => {
    const { shop, a } = setup()
    shop.topBusy = true
    a.hold({ kind: 'gold', card: 'goldHands' })
    a.hold({ kind: 'inspection', note: inspected(0) })
    a.hold({ kind: 'found', text: 'Tìm thấy' })
    expect(drain(a).map(h => h.kind)).toEqual(['inspection', 'found'])
    shop.topBusy = false
    expect(a.next()?.kind).toBe('gold')
  })

  it('queues gold cards and welcome-back cards in the order they came', () => {
    const { a } = setup()
    a.hold({ kind: 'gold', card: 'goldHands' })
    a.hold({ kind: 'away', back: back(100) })
    a.hold({ kind: 'gold', card: 'busyDay' })
    a.hold({ kind: 'away', back: back(200) })
    expect(drain(a)).toEqual([
      { kind: 'away', back: back(100) },
      { kind: 'away', back: back(200) },
      { kind: 'gold', card: 'goldHands' },
      { kind: 'gold', card: 'busyDay' },
    ])
  })

  it('keeps only the latest toast, stairs note and inspection of each kind', () => {
    const { a } = setup()
    a.hold({ kind: 'wear', text: 'Áo cũ' })
    a.hold({ kind: 'wear', text: 'Áo mới' })
    a.hold({ kind: 'stairs', note: stairs(1) })
    a.hold({ kind: 'stairs', note: stairs(2) })
    a.hold({ kind: 'inspection', note: inspected(100) })
    a.hold({ kind: 'inspection', note: inspected(200) })
    a.hold({ kind: 'found', text: '1' })
    a.hold({ kind: 'found', text: '2' })
    expect(drain(a)).toEqual([
      { kind: 'wear', text: 'Áo mới' },
      { kind: 'stairs', note: stairs(2) },
      { kind: 'inspection', note: inspected(200) },
      { kind: 'found', text: '2' },
    ])
  })

  it('says whether a welcome-back card waits', () => {
    const { a } = setup()
    expect(a.holds('away')).toBe(false)
    a.hold({ kind: 'away', back: back(100) })
    expect(a.holds('away')).toBe(true)
    a.next()
    expect(a.holds('away')).toBe(false)
  })
})

describe('the welcome-back card', () => {
  it('shows over a panel, the pause card and the summary', () => {
    const { shop, a } = setup()
    a.cover('panel')
    shop.paused = true
    shop.dayOver = true
    shop.topBusy = true
    a.hold({ kind: 'away', back: back(100) })
    a.hold({ kind: 'gold', card: 'goldHands' })
    expect(drain(a)).toEqual([{ kind: 'away', back: back(100) }])
  })

  it('waits for a game, a lesson, the shutter, another welcome-back card and the update check', () => {
    const { shop, a } = setup()
    a.hold({ kind: 'away', back: back(100) })
    for (const k of ['playing', 'lesson'] as const) {
      shop[k] = true
      expect(a.next()).toBeNull()
      shop[k] = false
    }
    for (const c of ['shutter', 'away', 'update'] as const) {
      const release = a.cover(c)
      expect(a.next()).toBeNull()
      release()
    }
    expect(a.next()?.kind).toBe('away')
  })
})

describe('a switch of shops', () => {
  it("carries the main shop's welcome-back cards, gold cards and inspection, and leaves its toasts behind", () => {
    const { a } = setup(true)
    a.hold({ kind: 'away', back: back(100) })
    a.hold({ kind: 'gold', card: 'goldHands' })
    a.hold({ kind: 'inspection', note: inspected(50) })
    a.hold({ kind: 'wear', text: 'Áo mới' })
    a.hold({ kind: 'stairs', note: stairs(1) })
    a.hold({ kind: 'found', text: 'Tìm thấy' })
    expect(a.carry().map(h => h.kind)).toEqual(['away', 'gold', 'inspection'])
  })

  it("keeps the main shop's cards aside at a branch, where they neither show nor hold the shop", () => {
    const { a } = setup(true)
    a.hold({ kind: 'gold', card: 'goldHands' })
    a.hold({ kind: 'inspection', note: inspected(50) })
    const branch = setup(false, a.carry()).a
    expect(branch.next()).toBeNull()
    expect(branch.shopFree()).toBe(true)
    const home = setup(true, branch.carry()).a
    expect(drain(home).map(h => h.kind)).toEqual(['inspection', 'gold'])
  })

  it("shows the welcome-back cards wherever the owner arrives, and leaves a branch's own cards there", () => {
    const { a } = setup(false)
    a.hold({ kind: 'away', back: back(100) })
    a.hold({ kind: 'gold', card: 'busyDay' })
    const next = setup(false, a.carry()).a
    expect(drain(next)).toEqual([{ kind: 'away', back: back(100) }])
  })
})
