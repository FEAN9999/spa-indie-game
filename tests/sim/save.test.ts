import { describe, expect, it } from 'vitest'
import { CHAT_MS_MAX, DAY_START_MIN, LATE_MIN, PATIENCE_MS, RATING_WINDOW, SERVICE_PRICE } from '../../src/config'
import { tipFor } from '../../src/sim/economy'
import { placeProblem } from '../../src/sim/build'
import { FLOOR_PRICE } from '../../src/config'
import { beautyOf, DEFAULT_ITEMS, itemsFromLayout, type Item } from '../../src/sim/items'
import { parseLayout } from '../../src/sim/grid'
import { createRng } from '../../src/sim/rng'
import { emptyBook, REGULAR_IDS } from '../../src/sim/regulars'
import { DEFAULT_OWNER_LOOK } from '../../src/sim/profile'
import { emptyRecipes } from '../../src/sim/recipes'
import { oldShopKinds, parseSave, repairBadges, repairEvents, repairFestival, repairOutfits, repairRank, SAVE_VERSION, SaveError, SaveTooNewError } from '../../src/sim/save'
import { emptyAwayBook } from '../../src/sim/away'
import { addPost, emptyFeed, openFeed, seededFeed } from '../../src/sim/feed'
import type { PostDraft } from '../../src/sim/feed'
import { emptyEventBook, makeHot } from '../../src/sim/events'
import { emptyRankBook } from '../../src/sim/rank'
import { BASIC_SERVICES } from '../../src/sim/services'
import { floorOf, towerOf } from '../../src/sim/floors'
import { shellOf } from '../../src/sim/items'
import { SHOP_LAYOUT, SPA_LAYOUT_1A } from '../../src/sim/layout'
import { SpaSim } from '../../src/sim/spa'
import { isPast, pastStarter, STARTER_GOAL_IDS } from '../../src/sim/starter'
import { noTiers, RECEPTIONIST_TRAITS, TRAIT_IDS } from '../../src/sim/staff'
import { emptyVipBook } from '../../src/sim/vips'
import { TUTORIAL_HINTS, type SimEvent } from '../../src/sim/types'
import v1 from '../fixtures/save-v1.json'
import v2 from '../fixtures/save-v2.json'
import v3 from '../fixtures/save-v3.json'
import v4 from '../fixtures/save-v4.json'
import v5 from '../fixtures/save-v5.json'
import v6 from '../fixtures/save-v6.json'
import v7 from '../fixtures/save-v7.json'
import v8 from '../fixtures/save-v8.json'
import v9 from '../fixtures/save-v9.json'
import v10 from '../fixtures/save-v10.json'
import v11 from '../fixtures/save-v11.json'
import v12 from '../fixtures/save-v12.json'
import v13 from '../fixtures/save-v13.json'
import v14 from '../fixtures/save-v14.json'
import v15 from '../fixtures/save-v15.json'
import v16 from '../fixtures/save-v16.json'
import v17 from '../fixtures/save-v17.json'
import v18 from '../fixtures/save-v18.json'
import v19 from '../fixtures/save-v19.json'
import v20 from '../fixtures/save-v20.json'
import v21 from '../fixtures/save-v21.json'
import v22 from '../fixtures/save-v22.json'
import v23 from '../fixtures/save-v23.json'
import v24 from '../fixtures/save-v24.json'
import v25 from '../fixtures/save-v25.json'
import v26 from '../fixtures/save-v26.json'
import v27 from '../fixtures/save-v27.json'
import v28 from '../fixtures/save-v28.json'
import v29 from '../fixtures/save-v29.json'
import v30 from '../fixtures/save-v30.json'
import v31 from '../fixtures/save-v31.json'
import v32 from '../fixtures/save-v32.json'
import v35 from '../fixtures/save-v35.json'
import { Chain } from '../../src/sim/chain'
import { emptyIdolBook, IDOL_IDS, IDOLS } from '../../src/sim/idols'
import { HOT_DAYS, IDOL_PRICE_FACTOR, STEP_MS } from '../../src/config'
import { advanceUntil, busyShop, hireStaff, ownerServes, seatAndWait, starShop, startService } from './helpers'

const opts = () => ({ rng: createRng(2), autoSpawn: false })
const viaJson = (sim: SpaSim) => SpaSim.fromSave(parseSave(JSON.parse(JSON.stringify(sim.toSave()))), opts())
const open = (raw: unknown) => SpaSim.fromSave(parseSave(structuredClone(raw)), opts())

type Shop = { v?: number; day: number; reviews: number[]; reviewIds?: unknown; feed?: unknown; rank?: { stars: number; wins: number }; idol?: { idols: Record<string, { visits: number }> }; place?: unknown; pets?: unknown; houses?: unknown; items: object[]; nextItemId: number; lessonsPaid: unknown; stock: Record<string, number>; staff: { tiers: Record<string, number> }[]; candidates: { tiers: Record<string, number> }[]; progress: { total: { services: Record<string, number> }; dayStart: unknown } }
/** The old shop's furniture on the 13-column grid, as saves from before version 33 have it. */
const LEGACY_ITEMS = itemsFromLayout(SPA_LAYOUT_1A)
/** The items of a shop saved before the screens and desk were furniture, with them added as the newest, on the old grid. */
const withFurniture = (items: object[], nextItemId: number) => [...items, ...LEGACY_ITEMS.slice(-3).map((item, i) => ({ ...item, id: nextItemId + i }))] as { x: number }[]
type Walker = { pos: { x: number }; path: { x: number }[]; seat?: { x: number } | null }
/** A raw shop saved before version 33 as the wide grid has it: every saved tile 12 columns right (or `dx`), and the version raised. */
function onWideGrid(shop: Shop & { owner: Walker; customers: Walker[]; staff: Walker[] }, dx = 12): void {
  const tile = <T extends { x: number }>(t: T): T => ({ ...t, x: t.x + dx })
  const walker = <W extends Walker>(m: W): W => ({ ...m, pos: tile(m.pos), path: m.path.map(tile), ...(m.seat !== undefined && { seat: m.seat && tile(m.seat) }) })
  shop.items = (shop.items as { x: number }[]).map(tile)
  shop.owner = walker(shop.owner)
  shop.customers = shop.customers.map(walker)
  shop.staff = shop.staff.map(walker) as typeof shop.staff
  shop.v = SAVE_VERSION
}
/** A tile or item 12 columns right, where the wide grid has it. */
const right12 = <T extends { x: number }>(t: T): T => ({ ...t, x: t.x + 12 })
/** A copy of a raw shop saved before version 33 with every saved tile where the wide grid has it. */
const wideCopy = <T extends object>(raw: T): T => {
  const out = structuredClone(raw)
  onWideGrid(out as unknown as Parameters<typeof onWideGrid>[0])
  return out
}
/** A raw save as today's code reads it: the new keys of the Chà muối biển, Ngâm chân and Sơn móng records (salt and polish in the stock, scrub, foot and nails in the tiers and the counts) filled in, the screens and desk of a shop saved before them added as its newest items, and an empty pet book (a branch's with the litter taken), in the main shop and each branch. */
const withNewKeys = <T extends object>(raw: T): T => {
  const out = structuredClone(raw) as T & Shop & { chain?: { branches: Shop[] } }
  for (const shop of [out, ...(out.chain?.branches ?? [])]) {
    shop.stock.salt ??= 20
    shop.stock.polish ??= 20
    shop.lessonsPaid ??= []
    shop.houses ??= { left: 0, right: 0 }
    shop.reviewIds ??= shop.reviews.map(() => 0)
    shop.feed ??= (shop.place ?? null) !== null ? emptyFeed() : seededFeed({ day: shop.day, rankStars: shop.rank?.stars ?? 1, idolsMet: Object.values(shop.idol?.idols ?? {}).filter(i => i.visits > 0).length, wins: shop.rank?.wins ?? 0 })
    shop.pets ??= { owned: [], nextId: 1, litter: (shop.place ?? null) !== null }
    const v = shop.v ?? (out as { v?: number }).v ?? 0
    if (v >= 3 && v < 30) {
      shop.items.push(...LEGACY_ITEMS.slice(-3).map((item, i) => ({ ...item, id: shop.nextItemId + i })))
      shop.nextItemId += 3
    }
    if (v < 33) onWideGrid(shop as Parameters<typeof onWideGrid>[0])
    for (const p of [...shop.staff, ...shop.candidates]) {
      p.tiers.scrub ??= 0
      p.tiers.foot ??= 0
      p.tiers.nails ??= 0
    }
    shop.progress.total.services.scrub ??= 0
    shop.progress.total.services.foot ??= 0
    shop.progress.total.services.nails ??= 0
    const start = shop.progress.dayStart as { services: Record<string, number> } | null
    if (start && typeof start === 'object') {
      start.services.scrub ??= 0
      start.services.foot ??= 0
      start.services.nails ??= 0
    }
  }
  return out
}

describe('the wide grid in an older shop', () => {
  it('is version 36', () => {
    expect(SAVE_VERSION).toBe(36)
  })

  it('moves every tile of the main shop and each branch 12 columns right', () => {
    const data = parseSave(structuredClone(v32))
    expect(data.v).toBe(SAVE_VERSION)
    expect(data.items.map(i => i.x)).toEqual(v32.items.map(i => i.x + 12))
    expect(data.owner.pos).toEqual({ ...v32.owner.pos, x: v32.owner.pos.x + 12 })
    expect(data.owner.path).toEqual(v32.owner.path.map(t => ({ ...t, x: t.x + 12 })))
    expect(data.customers.map(c => [c.pos.x, c.seat?.x ?? null, c.path.map(t => t.x)])).toEqual(v32.customers.map(c => [c.pos.x + 12, c.seat ? c.seat.x + 12 : null, c.path.map(t => t.x + 12)]))
    expect(data.staff.map(s => [s.pos.x, s.path.map(t => t.x)])).toEqual(v32.staff.map(s => [s.pos.x + 12, s.path.map(t => t.x + 12)]))
    const branch = data.chain!.branches[0]
    expect(branch.items.map(i => i.x)).toEqual(v32.chain.branches[0].items.map(i => i.x + 12))
    expect(branch.customers.map(c => c.path.map(t => t.x))).toEqual(v32.chain.branches[0].customers.map(c => c.path.map(t => t.x + 12)))
  })

  it('moves a parsed save only once', () => {
    const once = parseSave(structuredClone(v32))
    expect(parseSave(structuredClone(once))).toEqual(once)
  })

  it('opens mid-day with the same beauty, the owner behind the desk and everyone walking on', () => {
    const sim = open(v32)
    expect(sim.beauty()).toBe(beautyOf(v32.items as Item[]))
    expect(sim.ownerStart()).toEqual({ x: 21, y: 13 })
    const owner = { ...sim.owner.pos }
    sim.advance(1000)
    // nobody is stuck on a wall: the owner walks on toward the bed
    expect(sim.owner.pos).not.toEqual(owner)
  })

  it('furnishes a v1 shop on the old grid, then moves it once', () => {
    expect(parseSave(structuredClone(v1)).items.find(i => i.kind === 'desk')).toMatchObject({ x: 20, y: 14 })
  })
})

describe('the houses bought', () => {
  /** Today's fresh main shop as saved, with a bed in the inner left house and the houses given. */
  const withBedNextDoor = (houses: unknown) => {
    const raw = JSON.parse(JSON.stringify(new SpaSim(opts()).toSave()))
    raw.items.push({ id: raw.nextItemId, kind: 'bed', x: 8, y: 2, flip: false })
    raw.nextItemId++
    raw.houses = houses
    return raw
  }

  it('opens a shop with a bed in a bought house', () => {
    const sim = open(withBedNextDoor({ left: 1, right: 0 }))
    expect(sim.houses).toEqual({ left: 1, right: 0 })
    expect(sim.items.at(-1)).toMatchObject({ kind: 'bed', x: 8, y: 2 })
  })

  it('refuses a bed in a house not bought', () => {
    expect(() => open(withBedNextDoor({ left: 0, right: 0 }))).toThrow(SaveError)
  })

  it('reads a damaged count as no houses', () => {
    const raw = JSON.parse(JSON.stringify(new SpaSim(opts()).toSave()))
    raw.houses = { left: 5, right: -1 }
    expect(parseSave(raw).houses).toEqual({ left: 0, right: 0 })
    raw.houses = 'two'
    expect(parseSave(raw).houses).toEqual({ left: 0, right: 0 })
  })

  it("keeps a branch's houses from version 34", () => {
    const raw = structuredClone(parseSave(structuredClone(v32))) as unknown as { v: number; chain: { branches: { v: number; houses: unknown }[] } }
    raw.v = 34
    raw.chain.branches[0].v = 34
    raw.chain.branches[0].houses = { left: 1, right: 1 }
    expect(parseSave(raw).chain!.branches[0].houses).toEqual({ left: 1, right: 1 })
  })

  it('gives a branch saved before version 34 no house', () => {
    const raw = structuredClone(parseSave(structuredClone(v32))) as unknown as { v: number; chain: { branches: { v: number; houses: unknown }[] } }
    raw.v = 33
    raw.chain.branches[0].v = 33
    raw.chain.branches[0].houses = { left: 1, right: 1 }
    expect(parseSave(raw).chain!.branches[0].houses).toEqual({ left: 0, right: 0 })
  })

  it('keeps the houses through a save', () => {
    const sim = open(withBedNextDoor({ left: 1, right: 2 }))
    expect(viaJson(sim).houses).toEqual({ left: 1, right: 2 })
    expect(sim.toSave().houses).toEqual({ left: 1, right: 2 })
  })
})

describe('saving the shop', () => {
  it('restores a busy shop exactly and keeps playing it the same way', () => {
    const sim = busyShop()
    const copy = viaJson(sim)
    expect(copy.toSave()).toEqual(sim.toSave())
    expect(copy.stations).toEqual(sim.stations)
    expect(copy.seats).toEqual(sim.seats)
    sim.advance(5000)
    copy.advance(5000)
    expect(copy.toSave()).toEqual(sim.toSave())
  })

  it('reopens the mini-game for a customer who was being served', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    const c = startService(sim)
    const copy = viaJson(sim)
    expect(copy.drainEvents()).toContainEqual({ type: 'serviceReady', customerId: c.id, stationId: c.stationId })
    const before = copy.money
    copy.completeService(c.id, 3)
    expect(copy.money).toBe(before + SERVICE_PRICE.shampoo + tipFor(SERVICE_PRICE.shampoo, 3))
  })

  it('shows the summary again for a day that had ended', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    advanceUntil(sim, () => sim.dayOver, 8 * 60_000)
    const copy = viaJson(sim)
    expect(copy.drainEvents()).toEqual([{ type: 'dayEnded', stats: sim.stats }])
    copy.startDay()
    expect([copy.day, copy.dayOver, copy.clock.minutes]).toEqual([2, false, DAY_START_MIN])
  })

  it('does not reopen anything for a shop between customers', () => {
    const sim = busyShop()
    expect(viaJson(sim).drainEvents()).toEqual([])
  })

  it('saves only the reviews the rating uses', () => {
    const sim = busyShop()
    sim.reviews = Array.from({ length: 30 }, (_, i) => (i % 5) + 1)
    expect(sim.toSave().reviews).toHaveLength(RATING_WINDOW)
    expect(viaJson(sim).rating()).toBe(sim.rating())
  })

  it('rejects data that is not a saved shop', () => {
    const good = busyShop().toSave()
    for (const raw of [null, 'x', [], {}, { ...good, v: 99 }, { ...good, money: 'lots' }, { ...good, customers: null }, { ...good, owner: {} }])
      expect(() => parseSave(raw)).toThrow(SaveError)
    // item 3 is the cabinet, not a bed
    expect(() => SpaSim.fromSave({ ...good, customers: good.customers.map(c => ({ ...c, stationId: 3 })) }, opts())).toThrow(SaveError)
  })
})

describe('save version 2', () => {
  it('opens a shop saved before owners and names as the same shop, with the default owner and no tutorial', () => {
    const data = parseSave(structuredClone(v1))
    expect([data.v, data.shopName, data.ownerLook, data.profileDone]).toEqual([SAVE_VERSION, 'Tiệm Spa', DEFAULT_OWNER_LOOK, false])
    expect(data.hints).toEqual([...TUTORIAL_HINTS])
    expect(data.customers.map(c => c.patienceMaxMs)).toEqual(v1.customers.map(() => PATIENCE_MS))
    const sim = SpaSim.fromSave(data, opts())
    expect([sim.day, sim.money, sim.customers.length]).toEqual([v1.day, v1.money, v1.customers.length])
    expect(sim.toSave().v).toBe(SAVE_VERSION)
  })

  it('still reopens the mini-game of an upgraded shop', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    const c = startService(sim)
    const save = sim.toSave()
    // batch 1 numbered the beds from 0
    save.customers[0].stationId = 0
    save.owner.task = { kind: 'serve', customerId: c.id, stationId: 0 }
    const old = { ...save, v: 1 } as Record<string, unknown>
    for (const k of ['shopName', 'ownerLook', 'profileDone', 'hints', 'items', 'nextItemId']) delete old[k]
    const copy = SpaSim.fromSave(parseSave(old), opts())
    expect(copy.drainEvents()).toContainEqual({ type: 'serviceReady', customerId: c.id, stationId: c.stationId })
  })

  it('keeps the owner, the shop name and the hints already shown', () => {
    const sim = busyShop()
    sim.setProfile({ skin: 3, hair: 4, hairStyle: 3, shirt: 2 }, '  Spa Hoa Sen ')
    sim.markHint('money')
    sim.markHint('money')
    const copy = viaJson(sim)
    expect([copy.shopName, copy.ownerLook, copy.profileDone, copy.hints]).toEqual(['Spa Hoa Sen', { skin: 3, hair: 4, hairStyle: 3, shirt: 2 }, true, ['tapCustomer', 'money']])
  })

  it('rejects an owner look outside the choices', () => {
    const good = busyShop().toSave()
    const look = (o: object) => ({ skin: 0, hair: 0, hairStyle: 0, shirt: 0, ...o })
    for (const ownerLook of [look({ skin: 4 }), look({ shirt: 7 }), look({ skin: -1 }), look({ hair: 1.5 }), null])
      expect(() => parseSave({ ...good, ownerLook })).toThrow(SaveError)
  })

  it('cleans the saved shop name and drops hints it does not know', () => {
    const good = busyShop().toSave()
    const d = parseSave({ ...good, shopName: '  Spa   Sen  ', hints: ['money', 'fly'] })
    expect([d.shopName, d.hints]).toEqual(['Spa Sen', ['money']])
    expect(parseSave({ ...good, shopName: '   ' }).shopName).toBe('Tiệm Spa')
    expect(() => parseSave({ ...good, shopName: 5 })).toThrow(SaveError)
  })

  it('keeps the hint of the chain button', () => {
    expect(parseSave({ ...busyShop().toSave(), hints: ['openChain'] }).hints).toEqual(['openChain'])
  })

  it('tells a save from a newer version apart from other unknown versions', () => {
    const good = JSON.parse(JSON.stringify(busyShop().toSave()))
    expect(() => parseSave({ ...good, v: 99 })).toThrow(SaveTooNewError)
    for (const v of ['x', 0, null]) {
      let err: unknown
      try {
        parseSave({ ...good, v })
      } catch (e) {
        err = e
      }
      expect(err).toBeInstanceOf(SaveError)
      expect(err).not.toBeInstanceOf(SaveTooNewError)
    }
  })
})

describe('save version 3', () => {
  it('opens a batch-2 shop with its customers on the same bed and seat', () => {
    const sim = open(v2)
    const served = sim.customers.find(c => c.id === v2.servingCustomerId)!
    expect(served.stationId).toBe(2)
    expect(sim.stations.find(s => s.id === 2)?.bed).toEqual({ x: 16, y: 3 })
    expect(sim.owner.task).toEqual({ kind: 'serve', customerId: served.id, stationId: 2 })
    const waiting = sim.customers.find(c => c.id === v2.seatCustomers[2])!
    expect(waiting.seat).toEqual({ x: 16, y: 13 })
    expect(sim.seats[2].customerId).toBe(waiting.id)
    expect(sim.stations.map(s => s.customerId)).toEqual(v2.stationCustomers)
    expect(sim.seats.map(s => s.customerId)).toEqual(v2.seatCustomers)
    expect(sim.items).toEqual(DEFAULT_ITEMS)
    expect(sim.drainEvents()).toEqual([{ type: 'serviceReady', customerId: served.id, stationId: 2 }])
    const before = sim.money
    sim.completeService(served.id, 3)
    expect(sim.money).toBe(before + SERVICE_PRICE.shampoo + tipFor(SERVICE_PRICE.shampoo, 3))
    expect(sim.drainEvents()).toContainEqual(expect.objectContaining({ type: 'paid', tile: { x: 16, y: 3 } }))
  })

  it('opens a batch-1 shop the same way', () => {
    const sim = open(v1)
    expect(sim.stations.map(s => s.customerId)).toEqual(v1.stationCustomers)
    expect(sim.seats.map(s => s.customerId)).toEqual(v1.seatCustomers)
    expect(sim.customers.map(c => c.seat)).toEqual(v1.customers.map(c => c.seat && right12(c.seat)))
    expect(sim.items).toEqual(DEFAULT_ITEMS)
    // played on: the owner was fetching the first customer, who goes to the first bed and pays as before
    const c = sim.customers.find(x => x.id === v1.owner.task.customerId)!
    advanceUntil(sim, () => c.state === 'inService')
    expect(c.stationId).toBe(1)
    expect(sim.stations.find(s => s.id === 1)?.bed).toEqual({ x: 14, y: 3 })
    const before = sim.money
    sim.completeService(c.id, 3)
    expect(sim.money).toBe(before + SERVICE_PRICE.shampoo + tipFor(SERVICE_PRICE.shampoo, 3))
  })

  it('keeps bought furniture across a save', () => {
    const sim = busyShop()
    sim.items.push({ id: 17, kind: 'plant', x: 18, y: 9, flip: false })
    const copy = viaJson(sim)
    expect(copy.items).toContainEqual({ id: 17, kind: 'plant', x: 18, y: 9, flip: false })
    expect(copy.grid.cells[9][18]).toBe('plant')
  })

  it('rejects furniture that is not furniture', () => {
    const good = JSON.parse(JSON.stringify(busyShop().toSave()))
    const plant = { id: 17, kind: 'plant', x: 6, y: 9, flip: false }
    for (const items of [[{ id: 1, kind: 'sofa', x: 1, y: 1, flip: false }], [plant, plant], [{ ...plant, x: 6.5 }], [{ ...plant, flip: 1 }], null])
      expect(() => parseSave({ ...good, items })).toThrow('items are not furniture')
  })

  it('rejects furniture off the floor, so the shop is set aside instead of crashing', () => {
    const good = JSON.parse(JSON.stringify(busyShop().toSave()))
    const plant = (x: number, y: number) => ({ id: 17, kind: 'plant', x, y, flip: false })
    // a wall, the door, off each edge, and a flipped bed whose work tile is in the wall
    const strays = [plant(12, 5), plant(18, 17), plant(-1, 9), plant(37, 9), plant(18, -1), plant(18, 18), { id: 17, kind: 'bed', x: 13, y: 2, flip: true }]
    for (const stray of strays) expect(() => SpaSim.fromSave(parseSave({ ...good, items: [...good.items, stray] }), opts())).toThrow(SaveError)
    // overlapping furniture is not checked on load
    expect(() => SpaSim.fromSave(parseSave({ ...good, items: [...good.items, plant(15, 13)] }), opts())).not.toThrow()
  })

  it('never hands out an id a saved item already has', () => {
    const good = JSON.parse(JSON.stringify(busyShop().toSave()))
    const sim = SpaSim.fromSave(parseSave({ ...good, nextItemId: 5, items: [...good.items, { id: 20, kind: 'plant', x: 19, y: 9, flip: false }] }), opts())
    expect(sim.toSave().nextItemId).toBe(21)
    sim.money = 1_000_000
    expect(sim.buy('plant', 19, 10, false)).toBeNull()
    expect(sim.items.map(i => i.id).slice(-2)).toEqual([20, 21])
  })

  it('keeps the tap hint done but the build badge new for an old shop', () => {
    const sim = open(v1)
    expect(sim.hintDone('tapCustomer')).toBe(true)
    expect(sim.hintDone('openBuild')).toBe(false)
  })

  it('still leaves alone only saves newer than the current version', () => {
    const good = JSON.parse(JSON.stringify(busyShop().toSave()))
    expect(parseSave({ ...good, v: 15 }).v).toBe(SAVE_VERSION)
    expect(parseSave({ ...good, v: 16 }).v).toBe(SAVE_VERSION)
    expect(parseSave({ ...good, v: 17 }).v).toBe(SAVE_VERSION)
    expect(parseSave({ ...good, v: 18 }).v).toBe(SAVE_VERSION)
    expect(parseSave({ ...good, v: 19 }).v).toBe(SAVE_VERSION)
    expect(parseSave({ ...good, v: 20 }).v).toBe(SAVE_VERSION)
    expect(parseSave({ ...good, v: 21 }).v).toBe(SAVE_VERSION)
    expect(parseSave({ ...good, v: 22 }).v).toBe(SAVE_VERSION)
    expect(parseSave({ ...good, v: 23 }).v).toBe(SAVE_VERSION)
    expect(parseSave({ ...good, v: 24 }).v).toBe(SAVE_VERSION)
    expect(parseSave({ ...good, v: 25 }).v).toBe(SAVE_VERSION)
    expect(parseSave({ ...good, v: 26 }).v).toBe(SAVE_VERSION)
    expect(parseSave({ ...good, v: SAVE_VERSION }).v).toBe(SAVE_VERSION)
    expect(() => parseSave({ ...good, v: SAVE_VERSION + 1 })).toThrow(SaveTooNewError)
  })
})

describe('save version 3 as saved by batch 3', () => {
  it('opens a batch-3 shop as it was saved', () => {
    const sim = open(v3)
    expect([sim.day, sim.money]).toEqual([v3.day, v3.money])
    expect(sim.items).toEqual(withFurniture(v3.items, v3.nextItemId).map(right12))
    expect(sim.items.map(i => i.kind)).toEqual(expect.arrayContaining(['bed', 'teaChest']))
    expect(sim.customers.map(c => [c.id, c.stationId, c.seat])).toEqual(v3.customers.map(c => [c.id, c.stationId, c.seat && right12(c.seat)]))
    expect(sim.servingCustomerId).toBe(v3.servingCustomerId)
    expect(sim.stations.map(s => s.customerId)).toEqual(sim.stations.map(s => v3.customers.find(c => c.stationId === s.id)?.id ?? null))
    const served = sim.customers.find(c => c.id === v3.servingCustomerId)!
    expect(sim.drainEvents()).toEqual([{ type: 'serviceReady', customerId: served.id, stationId: served.stationId }])
  })
})

/** Day 3 with its candidates drawn. */
const dayThree = () => {
  const sim = new SpaSim({ rng: createRng(5), autoSpawn: false })
  sim.startDay()
  sim.startDay()
  return sim
}

describe('save version 4', () => {
  it('opens batch-1, 2 and 3 shops with no staff', () => {
    for (const raw of [v1, v2, v3]) {
      const sim = open(raw)
      expect(sim.staff).toEqual([])
      expect(sim.stats.wages).toBe(0)
      expect(sim.customers.every(c => c.greet === 0)).toBe(true)
    }
    const sim = open(v3)
    expect([sim.candidates.length, sim.candidatesDay]).toEqual([3, 4])
  })

  it('opens an old shop to day end with the money unchanged', () => {
    for (const raw of [v1, v2, v3]) {
      const sim = open(raw)
      sim.customers = []
      sim.servingCustomerId = null
      sim.owner.task = null
      const before = sim.money
      advanceUntil(sim, () => sim.dayOver, 8 * 60_000)
      expect(Number.isFinite(sim.money)).toBe(true)
      expect(sim.money).toBe(before)
    }
  })

  it('keeps a technician in the middle of a service', () => {
    const sim = dayThree()
    const c = seatAndWait(sim)
    const tech = hireStaff(sim, 'technician')
    advanceUntil(sim, () => c.state === 'inService')
    const copy = viaJson(sim)
    const t = copy.staff[0]
    expect([t.id, t.name, t.stats, t.level, t.xp, t.wage, t.pos, t.task]).toEqual([tech.id, tech.name, tech.stats, tech.level, tech.xp, tech.wage, tech.pos, tech.task])
    expect(t.task).toMatchObject({ kind: 'serve', customerId: c.id })
    const bed = copy.stations.find(s => s.id === c.stationId)!
    expect([copy.customers[0].stationId, bed.customerId]).toEqual([c.stationId, c.id])
    expect(copy.candidates.map(x => x.name)).toEqual(sim.candidates.map(x => x.name))
    const before = copy.money
    advanceUntil(copy, () => copy.stats.served === 1)
    expect(copy.money).toBeGreaterThan(before)
  })

  it('keeps a resting receptionist and a technician walking out', () => {
    const sim = dayThree()
    const rec = hireStaff(sim, 'receptionist')
    const tech = hireStaff(sim, 'technician')
    sim.advance(100)
    Object.assign(rec, { task: { kind: 'rest', leftMs: 20_000 }, path: [], sinceRest: 4 })
    sim.fire(tech.id)
    const copy = viaJson(sim)
    expect(copy.staff).toEqual(sim.staff)
    expect(copy.staff[0].task).toEqual({ kind: 'rest', leftMs: 20_000 })
    expect(copy.staff[1]).toMatchObject({ leaving: true, task: { kind: 'exit' } })
    advanceUntil(copy, () => copy.staff.length === 1)
    advanceUntil(copy, () => copy.staff[0].task === null, 25_000)
    expect(copy.staff[0].sinceRest).toBe(0)
    expect(copy.toSave().nextStaffId).toBe(3)
  })

  it('drops a saved task whose customer is gone', () => {
    const sim = dayThree()
    hireStaff(sim, 'technician')
    hireStaff(sim, 'technician')
    const save = JSON.parse(JSON.stringify(sim.toSave()))
    save.staff[0].task = { kind: 'fetch', customerId: 999 }
    save.staff[1].task = { kind: 'serve', customerId: 999, stationId: save.items.find((i: { kind: string }) => i.kind === 'bed').id, leftMs: 5000, totalMs: 9000 }
    const copy = SpaSim.fromSave(parseSave(save), opts())
    expect(copy.staff.map(s => s.task)).toEqual([null, null])
  })

  it('lets a let-go technician whose customer is gone walk out', () => {
    const sim = dayThree()
    hireStaff(sim, 'technician')
    sim.advance(100)
    const save = JSON.parse(JSON.stringify(sim.toSave()))
    save.staff[0].leaving = true
    save.staff[0].task = { kind: 'serve', customerId: 999, stationId: save.items.find((i: { kind: string }) => i.kind === 'bed').id, leftMs: 5000, totalMs: 9000 }
    const copy = SpaSim.fromSave(parseSave(save), opts())
    expect(copy.staff[0].task).toBeNull()
    advanceUntil(copy, () => copy.staff.length === 0)
  })

  it('repairs damaged staff instead of losing the shop', () => {
    const sim = dayThree()
    hireStaff(sim, 'technician')
    const save = JSON.parse(JSON.stringify(sim.toSave()))
    const look = save.staff[0].look
    Object.assign(save.staff[0], { task: 5, path: null, facing: 'sideways', look: { ...look, hairStyle: 99 } })
    const copy = SpaSim.fromSave(parseSave(save), opts())
    const s = copy.staff[0]
    expect([s.task, s.path, s.facing, s.look.hairStyle]).toEqual([null, [], 'down', 0])
    expect(() => copy.advance(5000)).not.toThrow()
  })

  it('repairs a candidate with a damaged look', () => {
    const sim = dayThree()
    const save = JSON.parse(JSON.stringify(sim.toSave()))
    save.candidates[0].look = { ...save.candidates[0].look, skin: -1, shirt: 1.5 }
    save.candidates[1].look = null
    const copy = SpaSim.fromSave(parseSave(save), opts())
    expect(copy.candidates[0].look).toMatchObject({ skin: 0, shirt: 0 })
    expect(copy.candidates[1].look).toEqual({ skin: 0, hair: 0, hairStyle: 0, shirt: 0 })
  })

  it('still lets go of a technician whose task is damaged', () => {
    const sim = dayThree()
    hireStaff(sim, 'technician')
    sim.advance(100)
    const save = JSON.parse(JSON.stringify(sim.toSave()))
    Object.assign(save.staff[0], { leaving: true, task: { kind: 'serve', customerId: 'x' }, path: 'up' })
    const copy = SpaSim.fromSave(parseSave(save), opts())
    advanceUntil(copy, () => copy.staff.length === 0)
  })

  it('reads a customer with a damaged greeting as not greeted', () => {
    const sim = busyShop()
    const save = JSON.parse(JSON.stringify(sim.toSave()))
    save.customers[0].greet = 'x'
    expect(SpaSim.fromSave(parseSave(save), opts()).customers[0].greet).toBe(0)
  })

  it('rejects staff that are not staff', () => {
    const sim = dayThree()
    hireStaff(sim, 'technician')
    hireStaff(sim, 'technician')
    const good = JSON.parse(JSON.stringify(sim.toSave()))
    const bad = (i: number, o: object) => ({ ...good, staff: good.staff.map((s: object, j: number) => (j === i ? { ...s, ...o } : s)) })
    for (const raw of [
      bad(0, { role: 'boss' }),
      bad(0, { stats: { ...good.staff[0].stats, skill: 7 } }),
      bad(0, { level: 6 }),
      bad(0, { leaving: 'no' }),
      bad(0, { pos: { x: 1 } }),
      bad(1, { id: good.staff[0].id }),
      { ...good, staff: 'many' },
      { ...good, candidates: [{ ...good.candidates[0], role: 'boss' }] },
      { ...good, candidatesDay: 'x' },
      { ...good, nextStaffId: null },
    ])
      expect(() => parseSave(raw)).toThrow(SaveError)
  })
})

describe('save version 5', () => {
  it('opens a batch-4 shop with shampoo only and every customer wanting it', () => {
    const sim = open(v4)
    expect(sim.services).toEqual(['shampoo'])
    expect(sim.customers.length).toBeGreaterThan(0)
    expect(sim.customers.every(c => c.service === 'shampoo')).toBe(true)
    const paid: number[] = []
    const ev: SimEvent[] = []
    advanceUntil(sim, () => {
      paid.push(...ev.flatMap(e => (e.type === 'paid' ? [e.amount] : [])))
      ev.length = 0
      return paid.length >= 2
    }, 120_000, ev)
    expect(paid.slice(0, 2)).toEqual([20_000, 20_000])
  })

  it('keeps the services and what each customer wants through a round trip', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    sim.money = 1_000_000
    sim.openService('mask')
    sim.buy('maskBed', 18, 2, false)
    const c = sim.spawnCustomer({ service: 'mask' })
    const copy = viaJson(sim)
    expect(copy.services).toEqual(['shampoo', 'mask'])
    expect(copy.customers.find(x => x.id === c.id)!.service).toBe('mask')
    expect(copy.stations.map(s => s.service)).toEqual(['shampoo', 'shampoo', 'mask'])
  })

  it('repairs unknown services instead of rejecting the shop', () => {
    const good = JSON.parse(JSON.stringify(busyShop().toSave()))
    expect(parseSave({ ...good, services: ['massage', 'x'] }).services).toEqual(['shampoo', 'massage'])
    expect(parseSave({ ...good, services: 7 }).services).toEqual(['shampoo'])
    const d = parseSave({ ...good, customers: good.customers.map((c: object) => ({ ...c, service: 'x' })) })
    expect(d.customers.every(c => c.service === 'shampoo')).toBe(true)
  })
})

describe('customer kinds in saves', () => {
  it('keeps the kind of each customer through a round trip', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    const c = sim.spawnCustomer({ kind: 'celeb', service: 'shampoo' })
    expect(viaJson(sim).customers.find(x => x.id === c.id)!.kind).toBe('celeb')
  })

  it('turns a missing or unknown kind into an office worker', () => {
    const good = JSON.parse(JSON.stringify(busyShop().toSave()))
    expect(good.customers.length).toBeGreaterThan(0)
    for (const kind of [undefined, 'x', 7, null]) {
      const d = parseSave({ ...good, customers: good.customers.map((c: object) => ({ ...c, kind })) })
      expect(d.customers.every(c => c.kind === 'office')).toBe(true)
    }
  })

  it('opens every customer of versions 1 to 4 as an office worker', () => {
    for (const raw of [v1, v2, v3, v4]) {
      const customers = parseSave(structuredClone(raw)).customers
      expect(customers.length).toBeGreaterThan(0)
      expect(customers.every(c => c.kind === 'office')).toBe(true)
    }
  })
})

describe('save version 6', () => {
  it('keeps the stock and the money spent restocking through a round trip', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    sim.day = 5
    sim.stock = { shampoo: 3, towel: 7, mask: 40, oil: 0, herbs: 11, mud: 20, salt: 20, polish: 20 }
    sim.stats.restock = 123_000
    const copy = viaJson(sim)
    expect(copy.stock).toEqual({ shampoo: 3, towel: 7, mask: 40, oil: 0, herbs: 11, mud: 20, salt: 20, polish: 20 })
    expect(copy.stats.restock).toBe(123_000)
    expect(copy.toSave().v).toBe(SAVE_VERSION)
  })

  it('opens saves of versions 1 to 5 with 20 of each item and nothing spent restocking', () => {
    for (const raw of [v1, v2, v3, v4, v5]) {
      const sim = open(raw)
      expect(sim.stock).toEqual({ shampoo: 20, towel: 20, mask: 20, oil: 20, herbs: 20, mud: 20, salt: 20, polish: 20 })
      expect(sim.stats.restock).toBe(0)
    }
  })

  it('opens the batch-5 shop on day 6 with its customers and tracked stock', () => {
    const sim = open(v5)
    expect(sim.day).toBe(6)
    expect(sim.stockTracked()).toBe(true)
    expect(sim.customers.filter(c => c.state === 'inService')).toHaveLength(3)
    expect(sim.customers.some(c => c.state === 'waiting' && c.kind === 'picky')).toBe(true)
    expect(sim.drainEvents().some(e => e.type === 'serviceReady')).toBe(true)
  })

  it('repairs a missing, negative, fractional or non-number count to 20, and a bad restock total to 0', () => {
    const good = JSON.parse(JSON.stringify(busyShop().toSave()))
    for (const bad of [undefined, -1, 2.5, 'x', null, NaN]) {
      const d = parseSave({ ...good, stock: { shampoo: bad, towel: 4, mask: bad, oil: 0 } })
      expect(d.stock).toEqual({ shampoo: 20, towel: 4, mask: 20, oil: 0, herbs: 20, mud: 20, salt: 20, polish: 20 })
    }
    for (const bad of [undefined, 'x', null, NaN]) expect(parseSave({ ...good, stats: { ...good.stats, restock: bad } }).stats.restock).toBe(0)
    expect(parseSave({ ...good, stock: 'lots' }).stock).toEqual({ shampoo: 20, towel: 20, mask: 20, oil: 20, herbs: 20, mud: 20, salt: 20, polish: 20 })
  })
})

describe('save version 7', () => {
  it('opens shops saved with staff on half the wages, now that the day is half as long', () => {
    for (const raw of [v4, v5, v6] as { staff: { wage: number }[] }[]) expect(open(raw).staff.map(s => s.wage)).toEqual(raw.staff.map(s => s.wage / 2))
    expect(open(v4).candidates.map(c => c.wage)).toEqual([30000, 27500, 27500])
    expect(open(v6).candidates.map(c => c.wage)).toEqual([55000, 55000, 40000])
  })

  it('opens the batch-6 shop as it was saved, apart from the wages', () => {
    const sim = open(v6)
    expect([sim.day, sim.money, sim.stock, sim.stats.restock]).toEqual([v6.day, v6.money, { ...v6.stock, herbs: 20, mud: 20, salt: 20, polish: 20 }, v6.stats.restock])
    expect(sim.staff.map(s => [s.name, s.role, s.level, s.xp])).toEqual(v6.staff.map(s => [s.name, s.role, s.level, s.xp]))
    expect(sim.customers.map(c => [c.id, c.state, c.service])).toEqual(v6.customers.map(c => [c.id, c.state, c.service]))
    expect(sim.servingCustomerId).toBe(v6.servingCustomerId)
  })
})

describe('save version 8', () => {
  const good = () => JSON.parse(JSON.stringify(busyShop().toSave()))

  it('keeps a regular customer and the book through a round trip', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    const c = sim.spawnCustomer()
    c.regular = 'hanh'
    c.heldMs = 1234
    sim.book.regulars.hanh = { meetDay: 7, met: true, points: 9, hearts: 2, visitAt: null }
    sim.book.gifts = ['vase']
    sim.stats.gifts = 5000
    expect(viaJson(sim).toSave()).toEqual(sim.toSave())
    expect(viaJson(sim).customers[0].regular).toBe('hanh')
  })

  it('opens saves of versions 1 to 7 with an empty book', () => {
    for (const raw of [v1, v2, v3, v4, v5, v6, v7] as { day: number }[]) {
      const sim = open(raw)
      for (const id of REGULAR_IDS) expect(sim.book.regulars[id]).toEqual({ meetDay: null, met: false, points: 0, hearts: 0, visitAt: null })
      expect(sim.book.kindsMet).toEqual(oldShopKinds(raw.day))
      expect(sim.customers.every(c => c.regular === null && c.heldMs === 0)).toBe(true)
      expect(sim.stats.gifts).toBe(0)
    }
    expect(open(v6).book.kindsMet).toEqual(['student', 'office', 'picky', 'elder'])
    expect(open(v7).book.kindsMet).toEqual(['student', 'office', 'picky', 'elder'])
    expect(open(v1).book.kindsMet).toEqual(['student', 'office'])
  })

  it('opens the version-7 shop as it was saved', () => {
    const sim = open(v7)
    expect([sim.day, sim.money, sim.stock, sim.stats.restock]).toEqual([v7.day, v7.money, { ...v7.stock, herbs: 20, mud: 20, salt: 20, polish: 20 }, v7.stats.restock])
    expect(sim.staff.map(s => [s.name, s.wage])).toEqual(v7.staff.map(s => [s.name, s.wage]))
    expect(sim.customers.map(c => [c.id, c.state, c.service])).toEqual(v7.customers.map(c => [c.id, c.state, c.service]))
  })

  it('repairs a damaged book instead of losing the shop', () => {
    expect(parseSave({ ...good(), book: 'x' }).book).toEqual({ ...emptyBook(), kindsMet: oldShopKinds(good().day) })
    const book = emptyBook()
    const damaged = (over: object) => parseSave({ ...good(), book: { ...JSON.parse(JSON.stringify(book)), ...over } }).book
    expect(damaged({ regulars: { ...book.regulars, hanh: { ...book.regulars.hanh, points: 'a' } } }).regulars.hanh.points).toBe(0)
    expect(damaged({ regulars: { ...book.regulars, hanh: { ...book.regulars.hanh, points: 13, hearts: 1 } } }).regulars.hanh.hearts).toBe(3)
    const hanh = (over: object) => damaged({ regulars: { ...book.regulars, hanh: { ...book.regulars.hanh, ...over } } }).regulars.hanh
    expect(hanh({ hearts: 2.5, points: 0 })).toMatchObject({ hearts: 2, points: 8 })
    expect(hanh({ hearts: 3, points: 0 })).toMatchObject({ hearts: 3, points: 12 })
    expect(Object.keys(damaged({ regulars: { ...book.regulars, nobody: book.regulars.hanh } }).regulars)).toEqual(REGULAR_IDS)
    expect(damaged({ gifts: ['nope', 'vase'] }).gifts).toEqual(['vase'])
    expect(damaged({ served: { ...book.served, student: -1 } }).served.student).toBe(0)
    expect(damaged({ kindsMet: ['student', 'ghost'] }).kindsMet).toEqual(['student'])
    expect(damaged({ boardGiven: 'yes', extraAt: 'x' })).toMatchObject({ boardGiven: false, extraAt: null })
  })

  it('reads an unknown regular on a customer as an ordinary customer', () => {
    const raw = good()
    raw.customers = raw.customers.map((c: object) => ({ ...c, regular: 'nobody', heldMs: 'x' }))
    expect(raw.customers.length).toBeGreaterThan(0)
    const d = parseSave(raw)
    expect(d.customers.every(c => c.regular === null && c.heldMs === 0)).toBe(true)
  })

  it('drops a gift flag that is not a boolean and keeps old items valid', () => {
    const raw = good()
    raw.items[0].gift = 'yes'
    raw.items[1].gift = true
    const d = parseSave(raw)
    expect('gift' in d.items[0]).toBe(false)
    expect(d.items[1].gift).toBe(true)
  })
})

describe('save version 9', () => {
  it('opens a v8 shop with an empty VIP book', () => {
    const sim = open(v8)
    expect([sim.day, sim.money, sim.book, sim.items]).toEqual([v8.day, v8.money, parseSave(structuredClone(v8)).book, withFurniture(v8.items, v8.nextItemId).map(right12)])
    expect(sim.vip).toEqual(emptyVipBook())
    expect(sim.customers.length).toBeGreaterThan(0)
    expect(sim.customers.every(c => c.vip === null)).toBe(true)
  })

  it('opens every older save with an empty VIP book', () => {
    for (const raw of [v1, v2, v3, v4, v5, v6, v7, v8]) {
      const sim = open(raw)
      expect(sim.vip).toEqual(emptyVipBook())
      expect(sim.vip.booking).toBeNull()
      expect(sim.customers.every(c => c.vip === null)).toBe(true)
    }
  })

  it('keeps the VIP book and a VIP customer through a round trip', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    const c = sim.spawnCustomer()
    c.vip = 'chef'
    sim.vip.vips.chef = { visits: 2, best: 3, photo: true }
    sim.vip.vips.miss = { visits: 1, best: 2, photo: false }
    sim.vip.booking = { vip: 'star', day: 2, minute: 600 }
    sim.vip.nextDay = 7
    sim.vip.everBooked = true
    expect(viaJson(sim).toSave()).toEqual(sim.toSave())
    expect(viaJson(sim).customers[0].vip).toBe('chef')
    expect(viaJson(sim).vip).toEqual(sim.vip)
  })

  it('repairs a damaged VIP book field by field', () => {
    const raw = JSON.parse(JSON.stringify(new SpaSim({ rng: createRng(1), autoSpawn: false }).toSave()))
    raw.day = 2
    raw.vip = {
      vips: { singer: { visits: -1, best: 9, photo: 'yes' }, miss: { visits: 2, best: 2, photo: true }, nobody: { visits: 5, best: 1, photo: true } },
      booking: { vip: 'miss', day: 3, minute: 540 },
      nextDay: 'x',
      boardGiven: 1,
    }
    const v = parseSave(raw).vip
    expect(v.vips.singer).toEqual({ visits: 0, best: 3, photo: false })
    expect(v.vips.miss).toEqual({ visits: 2, best: 2, photo: true })
    expect(v.vips.star).toEqual({ visits: 0, best: 0, photo: false })
    expect(Object.keys(v.vips)).toEqual(Object.keys(emptyVipBook().vips))
    expect(v.booking).toEqual({ vip: 'miss', day: 3, minute: 540 })
    expect(v.everBooked).toBe(true)
    expect(v.nextDay).toBe(0)
    expect(v.boardGiven).toBe(false)
    for (const booking of [{ vip: 'nobody' }, { vip: 'miss', day: 1.5, minute: 600 }, { vip: 'miss', day: 1, minute: 'x' }, 'x'])
      expect(parseSave({ ...raw, vip: { ...raw.vip, booking } }).vip.booking).toBeNull()
    expect(parseSave({ ...raw, vip: 'junk' }).vip).toEqual(emptyVipBook())
  })

  it('keeps a VIP booking for tomorrow, drops one further ahead, and shows the tab of a VIP who visited', () => {
    const raw = JSON.parse(JSON.stringify(new SpaSim({ rng: createRng(1), autoSpawn: false }).toSave()))
    raw.day = 4
    const vip = (booking: object | null, visits = 0, everBooked = true) => ({ ...emptyVipBook(), booking, everBooked, vips: { ...emptyVipBook().vips, miss: { visits, best: 1, photo: false } } })
    expect(parseSave({ ...raw, vip: vip({ vip: 'miss', day: 9, minute: 600 }) }).vip.booking).toBeNull()
    expect(parseSave({ ...raw, vip: vip({ vip: 'miss', day: 5, minute: 600 }) }).vip.booking).toEqual({ vip: 'miss', day: 5, minute: 600 })
    expect(parseSave({ ...raw, vip: vip(null, 2, false) }).vip.everBooked).toBe(true)
    expect(parseSave({ ...raw, vip: vip(null, 0, false) }).vip.everBooked).toBe(false)
  })

  it('drops an unknown VIP id from a customer', () => {
    const raw = JSON.parse(JSON.stringify(busyShop().toSave()))
    raw.customers = raw.customers.map((c: object) => ({ ...c, vip: 'nobody' }))
    expect(parseSave(raw).customers.every(c => c.vip === null)).toBe(true)
  })
})

describe('save version 10', () => {
  const nonZero = (t: Record<string, number>) => Object.entries(t).filter(([, n]) => n !== 0)

  it('opens a v9 shop: every technician gets tier 1 in one open service, nothing else changes', () => {
    const raw = structuredClone(v9)
    raw.staff.forEach((p, i) => Object.assign(p, { level: 2 + (i % 3), xp: 7 + i, wage: 123_000 + i * 1000 }))
    const sim = open(raw)
    expect(sim.staff.length).toBe(raw.staff.length)
    sim.staff.forEach((s, i) => {
      const old = raw.staff[i]
      expect([s.name, s.role, s.stats, s.level, s.xp, s.wage, s.rare]).toEqual([old.name, old.role, old.stats, old.level, old.xp, old.wage, old.rare])
      if (s.role === 'technician') {
        const set = nonZero(s.tiers)
        expect(set.length).toBe(1)
        expect(set[0][1]).toBe(1)
        expect(v9.services).toContain(set[0][0])
      } else expect(s.tiers).toEqual(noTiers())
      expect(s.study).toBeNull()
    })
    expect(sim.staff.some(s => s.role === 'technician')).toBe(true)
  })

  it('gives v9 candidates a specialty by the new-candidate rule', () => {
    const sim = open(v9)
    expect(sim.candidates.map(c => c.stats)).toEqual(v9.candidates.map(c => c.stats))
    for (const c of sim.candidates) {
      if (c.role === 'technician') {
        const set = nonZero(c.tiers)
        expect(set.length).toBe(1)
        expect(set[0][1]).toBe(c.rare ? 2 : 1)
        expect(BASIC_SERVICES).toContain(set[0][0])
      } else expect(c.tiers).toEqual(noTiers())
    }
  })

  it('draws the same specialties every time the same save is opened', () => {
    const a = open(v9)
    const b = open(v9)
    expect(a.staff.map(s => s.tiers)).toEqual(b.staff.map(s => s.tiers))
    expect(a.candidates.map(c => c.tiers)).toEqual(b.candidates.map(c => c.tiers))
    a.advance(30_000)
    b.advance(30_000)
    expect(a.toSave()).toEqual(b.toSave())
  })

  it('opens every older save with a specialty on each technician', () => {
    for (const raw of [v1, v2, v3, v4, v5, v6, v7, v8, v9]) {
      const sim = open(raw)
      for (const s of sim.staff.filter(s => s.role === 'technician')) {
        const set = nonZero(s.tiers)
        expect(set.length).toBe(1)
        expect(set[0][1]).toBe(1)
        expect(sim.services).toContain(set[0][0])
      }
    }
  })

  it('keeps tiers and a pending course through a round trip', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    const tech = hireStaff(sim, 'technician', undefined, { shampoo: 2, mask: 1, massage: 0 })
    tech.study = { course: 'mask', paid: 200000 }
    const rec = hireStaff(sim, 'receptionist')
    rec.study = { course: 'greet', paid: 50000 }
    expect(viaJson(sim).toSave()).toEqual(sim.toSave())
    expect(sim.toSave().staff[0].tiers).toEqual({ shampoo: 2, mask: 1, massage: 0, steam: 0, stone: 0, mud: 0, scrub: 0, foot: 0, nails: 0 })
  })

  it('repairs damaged tiers and courses field by field', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    for (let i = 0; i < 3; i++) hireStaff(sim, 'technician')
    hireStaff(sim, 'receptionist')
    const raw = JSON.parse(JSON.stringify(sim.toSave()))
    const [t1, t2, t3, r1] = raw.staff
    t1.tiers = { shampoo: 7, mask: -1, massage: 'x' }
    t1.study = { course: 'mask', paid: -3 }
    t2.study = { course: 'waxing', paid: 5 }
    t3.study = { course: 'greet', paid: 50000 }
    r1.tiers = { shampoo: 2 }
    r1.study = { course: 'greet', paid: 50000 }
    const out = parseSave(raw).staff
    expect(out[0].tiers).toEqual({ shampoo: 3, mask: 0, massage: 0, steam: 0, stone: 0, mud: 0, scrub: 0, foot: 0, nails: 0 })
    expect(out[3].tiers).toEqual(noTiers())
    expect(out.slice(0, 3).map(s => s.study)).toEqual([null, null, null])
    expect(out[3].study).toEqual({ course: 'greet', paid: 50000 })
  })
})

describe('save version 11', () => {
  const fits = (p: { role: string; trait: string }) => (p.role === 'receptionist' ? RECEPTIONIST_TRAITS : TRAIT_IDS).includes(p.trait as never)

  it('opens a v10 shop with a trait for everyone and nothing else changed', () => {
    const sim = open(v10)
    expect(sim.staff.length).toBe(v10.staff.length)
    sim.staff.forEach((s, i) => {
      const old = v10.staff[i]
      expect([s.name, s.role, s.stats, s.level, s.xp, s.wage, s.tiers, s.study]).toEqual([old.name, old.role, old.stats, old.level, old.xp, old.wage, { ...old.tiers, steam: 0, stone: 0, mud: 0, scrub: 0, foot: 0, nails: 0 }, old.study])
      expect(fits(s)).toBe(true)
    })
    expect(sim.candidates.length).toBe(v10.candidates.length)
    sim.candidates.forEach((c, i) => {
      expect([c.stats, c.tiers]).toEqual([v10.candidates[i].stats, { ...v10.candidates[i].tiers, steam: 0, stone: 0, mud: 0, scrub: 0, foot: 0, nails: 0 }])
      expect(fits(c)).toBe(true)
    })
  })

  it('draws the same traits every time the same save is opened', () => {
    const a = open(v10)
    const b = open(v10)
    expect(a.staff.map(s => s.trait)).toEqual(b.staff.map(s => s.trait))
    expect(a.candidates.map(c => c.trait)).toEqual(b.candidates.map(c => c.trait))
    a.advance(30_000)
    b.advance(30_000)
    expect(a.toSave()).toEqual(b.toSave())
  })

  it('opens every older save with a fitting trait on everyone', () => {
    for (const raw of [v1, v2, v3, v4, v5, v6, v7, v8, v9, v10]) {
      const sim = open(raw)
      expect([...sim.staff, ...sim.candidates].every(fits)).toBe(true)
    }
  })

  it('keeps traits through a round trip', () => {
    const sim = open(v10)
    const tech = sim.staff.find(s => s.role === 'technician')!
    tech.trait = 'calm'
    const copy = viaJson(sim)
    expect(copy.staff.find(s => s.id === tech.id)!.trait).toBe('calm')
    expect(copy.staff.map(s => s.trait)).toEqual(sim.staff.map(s => s.trait))
    expect(copy.candidates.map(c => c.trait)).toEqual(sim.candidates.map(c => c.trait))
  })

  it('redraws a damaged trait', () => {
    const raw = structuredClone(v10) as any
    const tech = raw.staff.find((s: any) => s.role === 'technician')
    const desk = raw.staff.find((s: any) => s.role === 'receptionist')
    tech.trait = 'grumpy'
    desk.trait = 'deft'
    delete raw.candidates[0].trait
    const sim = open(raw)
    expect(TRAIT_IDS).toContain(sim.staff.find(s => s.id === tech.id)!.trait)
    expect(RECEPTIONIST_TRAITS).toContain(sim.staff.find(s => s.id === desk.id)!.trait)
    expect(TRAIT_IDS).toContain(sim.candidates[0].trait)
  })
})

describe('late and chatting tasks', () => {
  const withTask = (task: unknown) => {
    const raw = structuredClone(v10) as any
    raw.staff.find((s: any) => s.role === 'technician').task = task
    return open(raw).staff.find(s => s.role === 'technician')!.task
  }

  it('keeps a late or chatting task through a round trip', () => {
    expect(withTask({ kind: 'late', untilMinute: 510 })).toEqual({ kind: 'late', untilMinute: 510 })
    expect(withTask({ kind: 'chat', leftMs: 1234 })).toEqual({ kind: 'chat', leftMs: 1234 })
  })

  it('drops a damaged late or chat task', () => {
    expect(withTask({ kind: 'late', untilMinute: 'soon' })).toBeNull()
    expect(withTask({ kind: 'chat' })).toBeNull()
  })

  it('caps a huge late or chat number and drops a negative or infinite one', () => {
    expect(withTask({ kind: 'late', untilMinute: 1e9 })).toEqual({ kind: 'late', untilMinute: DAY_START_MIN + LATE_MIN })
    expect(withTask({ kind: 'chat', leftMs: 1e9 })).toEqual({ kind: 'chat', leftMs: CHAT_MS_MAX })
    expect(withTask({ kind: 'late', untilMinute: -5 })).toBeNull()
    expect(withTask({ kind: 'chat', leftMs: -1 })).toBeNull()
    expect(withTask({ kind: 'late', untilMinute: null })).toBeNull() // Infinity becomes null in JSON
    expect(withTask({ kind: 'chat', leftMs: Infinity })).toBeNull()
  })
})

describe('the recipe book', () => {
  const withRecipes = (recipes: unknown) => {
    const raw = structuredClone(v11) as any
    raw.recipes = recipes
    return open(raw).recipes
  }

  it('keeps solved, tries and heard through a round trip', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    sim.recipes.steam = { solved: false, tries: [{ mix: ['pomelo', 'salt', 'honey'], right: 1 }], heard: ['lemongrass'] }
    expect(viaJson(sim).recipes).toEqual(sim.recipes)
    sim.recipes.steam.solved = true
    expect(viaJson(sim).recipes).toEqual(sim.recipes)
  })

  it('opens a v11 shop with an empty book, fresh herbs and no steam tier, and nothing else changed', () => {
    const raw = v11 as any
    const wide = wideCopy(raw)
    const sim = open(raw)
    const saved = sim.toSave() as any
    for (const key of Object.keys(raw)) {
      // candidates are redrawn on load, so their day moves with them
      if (['v', 'stock', 'staff', 'candidates', 'candidatesDay', 'recipes'].includes(key)) continue
      // a customer saved before version 18 is not Mi Mi, and one saved before the idols is not an idol
      const kept = key === 'stats' ? { ...raw.stats, quests: 0, ownerServed: 0 } : key === 'customers' ? wide.customers.map((c: object) => ({ ...c, kol: false, idol: null })) : key === 'items' ? withFurniture(raw.items, raw.nextItemId).map(right12) : key === 'nextItemId' ? raw.nextItemId + 3 : wide[key]
      expect([key, saved[key]]).toEqual([key, kept])
    }
    expect(saved.v).toBe(SAVE_VERSION)
    expect(sim.recipes).toEqual(emptyRecipes())
    expect(saved.stock).toEqual({ ...raw.stock, herbs: 20, mud: 20, salt: 20, polish: 20 })
    const parsed = parseSave(structuredClone(raw))
    expect(parsed.staff.length).toBe(raw.staff.length)
    for (const p of [...parsed.staff, ...parsed.candidates]) expect(p.tiers.steam).toBe(0)
    expect(sim.staff.find(s => s.study)!.study).toEqual(raw.staff.find((s: any) => s.study).study)
  })

  it('opens a v12 shop with Đá nóng and Tắm bùn unsolved, fresh mineral mud and no new tiers, and nothing else changed', () => {
    const raw = v12 as any
    const wide = wideCopy(raw)
    const sim = open(raw)
    const saved = sim.toSave() as any
    for (const key of Object.keys(raw)) {
      // candidates are redrawn on load, so their day moves with them
      if (['v', 'stock', 'staff', 'candidates', 'candidatesDay', 'recipes'].includes(key)) continue
      // a customer saved before version 18 is not Mi Mi, and one saved before the idols is not an idol
      const kept = key === 'stats' ? { ...raw.stats, quests: 0, ownerServed: 0 } : key === 'customers' ? wide.customers.map((c: object) => ({ ...c, kol: false, idol: null })) : key === 'items' ? withFurniture(raw.items, raw.nextItemId).map(right12) : key === 'nextItemId' ? raw.nextItemId + 3 : wide[key]
      expect([key, saved[key]]).toEqual([key, kept])
    }
    expect(saved.v).toBe(SAVE_VERSION)
    expect(saved.recipes.steam).toEqual(raw.recipes.steam)
    expect(saved.recipes.stone).toEqual(emptyRecipes().stone)
    expect(saved.recipes.mud).toEqual(emptyRecipes().mud)
    expect(saved.stock).toEqual({ ...raw.stock, mud: 20, salt: 20, polish: 20 })
    expect(saved.staff).toEqual(wide.staff.map((s: any) => ({ ...s, tiers: { ...s.tiers, stone: 0, mud: 0, scrub: 0, foot: 0, nails: 0 }, moveTo: null })))
    const parsed = parseSave(structuredClone(raw))
    expect(parsed.staff.length).toBe(raw.staff.length)
    for (const p of [...parsed.staff, ...parsed.candidates]) expect([p.tiers.stone, p.tiers.mud]).toEqual([0, 0])
    expect(parsed.staff.find(s => s.tiers.steam === 2)).toBeDefined()
    expect(sim.staff.find(s => s.study)!.study).toEqual(raw.staff.find((s: any) => s.study).study)
    expect(sim.items.some(i => i.kind === 'steamTent')).toBe(true)
    expect(sim.customers.some(c => c.service === 'steam')).toBe(true)
  })

  it('opens every older save with empty recipes', () => {
    for (const raw of [v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11]) expect(open(raw).recipes).toEqual(emptyRecipes())
  })

  it('drops a try with two items, an unknown ingredient or a repeat', () => {
    const tries = [
      { mix: ['pomelo', 'salt'], right: 1 },
      { mix: ['pomelo', 'salt', 'pepper'], right: 1 },
      { mix: ['pomelo', 'pomelo', 'salt'], right: 1 },
      { mix: ['pomelo', 'salt', 'honey'], right: 1 },
    ]
    expect(withRecipes({ steam: { solved: false, tries, heard: [] } }).steam.tries).toEqual([{ mix: ['pomelo', 'salt', 'honey'], right: 1 }])
  })

  it('recomputes a right count that disagrees', () => {
    expect(withRecipes({ steam: { solved: false, tries: [{ mix: ['pomelo', 'salt', 'honey'], right: 3 }], heard: [] } }).steam.tries[0].right).toBe(1)
  })

  it('drops a heard ingredient that is not one of the hints', () => {
    expect(withRecipes({ steam: { solved: false, tries: [], heard: ['lemongrass', 'ginger', 'salt', 'lemongrass', 'x'] } }).steam.heard).toEqual(['lemongrass'])
  })

  it('marks a recipe solved by a try with all three right, or by an open service', () => {
    expect(withRecipes({ steam: { solved: false, tries: [{ mix: ['ginger', 'pomelo', 'lemongrass'], right: 0 }], heard: [] } }).steam.solved).toBe(true)
    const raw = structuredClone(v11) as any
    raw.services = [...raw.services, 'steam']
    expect(open(raw).recipes.steam.solved).toBe(true)
  })

  it('recomputes a stone try, marks mud solved by an open service and drops a heard ingredient that is no hint', () => {
    const stone = withRecipes({ stone: { solved: false, tries: [{ mix: ['coconut', 'cajeput', 'ginger'], right: 1 }], heard: ['ginger', 'coconut'] } }).stone
    expect(stone.tries[0].right).toBe(3)
    expect(stone.solved).toBe(true)
    expect(stone.heard).toEqual(['coconut'])
    const raw = structuredClone(v12) as any
    raw.services = [...raw.services, 'mud']
    expect(open(raw).recipes.mud.solved).toBe(true)
  })

  it('turns a non-object recipes into an empty book', () => {
    for (const bad of [undefined, null, 5, 'steam', [1]]) expect(withRecipes(bad)).toEqual(emptyRecipes())
    expect(withRecipes({ steam: 7 })).toEqual(emptyRecipes())
  })
})

describe('save version 14', () => {
  const upstairs = () => {
    const sim = new SpaSim({ rng: createRng(5), autoSpawn: false })
    sim.day = 6
    sim.money = FLOOR_PRICE[2] + 1_000_000
    expect(sim.openFloor(2)).toBeNull()
    sim.drainEvents()
    return sim
  }
  /** A v13-shaped save of a fresh shop: no floors, and the stairs spot still to clear. */
  const old = (): any => {
    const raw: any = JSON.parse(JSON.stringify(new SpaSim(opts()).toSave()))
    // back on the old grid, as a v13 shop was saved
    onWideGrid(raw, -12)
    delete raw.floors
    raw.v = 13
    return raw
  }
  const stairsEvents = (sim: SpaSim) => sim.drainEvents().filter(e => e.type === 'stairsCleared')

  it('keeps the floors and a bed on floor 2 through a round trip', () => {
    const sim = upstairs()
    expect(sim.buy('bed', 14, 20, false)).toBeNull()
    const copy = viaJson(sim)
    expect(copy.floors).toBe(2)
    expect(copy.items).toEqual(sim.items)
  })

  it('keeps a climb in progress and finishes it on time', () => {
    const sim = upstairs()
    Object.assign(sim.owner, { pos: { x: 23, y: 10 }, path: [{ x: 23, y: 28 }, { x: 23, y: 29 }], climbMs: 400 })
    const copy = viaJson(sim)
    expect(copy.owner.climbMs).toBe(400)
    sim.advance(700)
    copy.advance(700)
    expect(floorOf(copy.owner.pos.y)).toBe(2)
    expect(copy.owner).toEqual(sim.owner)
  })

  it('writes no climbMs for someone who is not climbing', () => {
    const saved = busyShop().toSave()
    for (const m of [saved.owner, ...saved.customers, ...saved.staff]) expect('climbMs' in m).toBe(false)
  })

  it('drops a climbMs that is not a number from zero up', () => {
    const raw = JSON.parse(JSON.stringify(busyShop().toSave()))
    raw.owner.climbMs = -5
    raw.customers[0].climbMs = 'x'
    raw.customers[1].climbMs = 300
    const parsed = parseSave(raw)
    expect('climbMs' in parsed.owner).toBe(false)
    expect('climbMs' in parsed.customers[0]).toBe(false)
    expect(parsed.customers[1].climbMs).toBe(300)
  })

  it('opens a floors count out of range with one floor, and then a floor-2 item is an error', () => {
    const raw = JSON.parse(JSON.stringify(new SpaSim(opts()).toSave()))
    expect(open({ ...raw, floors: 7 }).floors).toBe(1)
    const item = { id: 90, kind: 'plant', x: 16, y: 20, flip: false }
    expect(() => open({ ...raw, floors: 7, items: [...raw.items, item], nextItemId: 91 })).toThrow(SaveError)
  })

  it('refuses a v14 item on the stairs or on a foot', () => {
    const raw = JSON.parse(JSON.stringify(new SpaSim(opts()).toSave()))
    for (const [x, y] of [[23, 8], [23, 10]]) expect(() => open({ ...raw, items: [...raw.items, { id: 90, kind: 'plant', x, y, flip: false }], nextItemId: 91 })).toThrow(SaveError)
  })

  it('clears the stairs spot of a v13 shop and refunds it', () => {
    const sim = open(v13)
    expect(sim.items.some(i => i.id === 14 || i.id === 15)).toBe(false)
    expect(sim.money).toBe(v13.money + 675_000)
    expect(sim.book.gifts).toEqual(['vyPainting'])
    const c = sim.customers.find(x => x.id === 1)!
    expect(c.state).toBe('leaving')
    expect([c.stationId, c.seat, sim.servingCustomerId]).toEqual([null, null, null])
    expect(sim.owner.task).toBeNull()
    expect([sim.stats.walkedAway, sim.stats.angry]).toEqual([v13.stats.walkedAway, v13.stats.angry])
    expect(sim.reviews).toEqual(v13.reviews)
    expect(sim.grid.cells[sim.owner.pos.y][sim.owner.pos.x]).toBe('floor')
    const events = sim.drainEvents()
    expect(events.some(e => e.type === 'serviceReady')).toBe(false)
    expect(events.filter(e => e.type === 'stairsCleared')).toEqual([{ type: 'stairsCleared', count: 2, refund: 675_000, gifts: 1, rebuy: null }])
    const saved = sim.toSave()
    expect(saved.v).toBe(SAVE_VERSION)
    expect('clearStairs' in saved).toBe(false)
    expect(saved.floors).toBe(1)
  })

  it('opens every older fixture with one floor and the same items', () => {
    for (const raw of [v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12]) {
      const sim = open(raw)
      expect(sim.floors).toBe(1)
      expect(sim.items).toEqual(parseSave(structuredClone(raw)).items)
      expect(stairsEvents(sim)).toEqual([])
    }
  })

  it('clears a bed by its work tile alone', () => {
    const raw = old()
    raw.items.push({ id: 100, kind: 'massageBed', x: 7, y: 8, flip: false }, { id: 101, kind: 'massageBed', x: 10, y: 9, flip: false })
    raw.nextItemId = 102
    const sim = open(raw)
    expect(sim.items.map(i => i.id)).toContain(100)
    expect(sim.items.map(i => i.id)).not.toContain(101)
    expect(sim.money).toBe(raw.money + 675_000)
    expect(stairsEvents(sim)).toEqual([{ type: 'stairsCleared', count: 1, refund: 675_000, gifts: 0, rebuy: null }])
  })

  it('moves the last shampoo bed instead of selling it, and sends its customer home quietly', () => {
    const raw = old()
    raw.items = raw.items.filter((i: any) => i.kind !== 'bed')
    raw.items.push({ id: 100, kind: 'bed', x: 11, y: 7, flip: true })
    raw.nextItemId = 101
    const c = { ...(v13.customers[0] as any), id: 1, stationId: 100, service: 'shampoo' }
    Object.assign(raw, { customers: [c], servingCustomerId: 1, nextId: 2 })
    raw.owner.task = { kind: 'serve', customerId: 1, stationId: 100 }
    const sim = open(raw)
    const bed = sim.items.find(i => i.kind === 'bed')!
    expect(bed.id).toBe(100)
    const others = sim.items.filter(i => i !== bed)
    expect(placeProblem(parseLayout(towerOf(shellOf(SHOP_LAYOUT))), others, bed, { door: sim.grid.door, floors: 1 })).toBeNull()
    expect(sim.money).toBe(raw.money)
    expect(stairsEvents(sim)).toEqual([])
    expect(sim.customers[0].state).toBe('leaving')
    expect(sim.customers[0].stationId).toBeNull()
    expect(sim.stats.walkedAway).toBe(raw.stats.walkedAway)
    expect(sim.reviews).toEqual(raw.reviews)
    expect(sim.owner.task).toBeNull()
  })

  it('moves the last bench off the stairs even when something already shuts the foot in', () => {
    const raw = old()
    raw.items = raw.items.filter((i: any) => i.kind !== 'bench')
    raw.items.push({ id: 100, kind: 'bench', x: 9, y: 8, flip: false }, { id: 101, kind: 'plant', x: 10, y: 10, flip: false })
    raw.nextItemId = 102
    const sim = open(raw)
    const bench = sim.items.find(i => i.kind === 'bench')!
    expect(bench.id).toBe(100)
    expect(bench.x === 21 && bench.y === 8).toBe(false)
    expect(sim.items.some(i => i.id === 101)).toBe(true)
    expect(sim.money).toBe(raw.money)
    expect(stairsEvents(sim)).toEqual([])
    sim.day = 6
    expect(sim.floorProblem(2)).toBe('blocked')
  })

  it('still clears the stairs spot when an older save was stored already parsed, with its version rewritten', () => {
    const raw = old()
    raw.items.push({ id: 100, kind: 'massageBed', x: 11, y: 7, flip: true })
    raw.nextItemId = 101
    // the oldest saves' helpers rewrite the version to the current one, never to an older one
    const stored = JSON.parse(JSON.stringify({ ...parseSave(raw), v: SAVE_VERSION }))
    expect(stored.clearStairs).toBe(true)
    const sim = open(stored)
    expect(sim.items.some(i => i.id === 100)).toBe(false)
    expect(stairsEvents(sim)).toEqual([{ type: 'stairsCleared', count: 1, refund: 675_000, gifts: 0, rebuy: null }])
    const saved = sim.toSave()
    expect('clearStairs' in saved).toBe(false)
    expect(stairsEvents(open(saved))).toEqual([])
  })
})

describe('save version 15', () => {
  it('opens the v14 shop with its floors, no stairs clearing, and an uncounted day', () => {
    const parsed = parseSave(structuredClone(v14))
    expect(parsed.floors).toBe(2)
    expect('clearStairs' in parsed).toBe(false)
    expect(parsed.progress).toMatchObject({ dayStart: null, daily: [], questDay: 0, monthly: null })
    const sim = open(v14)
    expect(sim.floors).toBe(2)
    expect(sim.toSave().v).toBe(SAVE_VERSION)
  })

  it('still opens every older save, and still clears the stairs spot of a v13 one', () => {
    for (const raw of [v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14]) expect(() => open(raw)).not.toThrow()
    expect(parseSave(structuredClone(v13)).clearStairs).toBe(true)
  })

  it('keeps the counts, the recent days and the quests through a round trip', () => {
    const sim = new SpaSim(opts())
    const p = sim.progress
    Object.assign(p.total, { served: 12, earned: 900_000, tips: 80_000, owner3: 4, lost: 2 })
    p.total.services.mask = 3
    p.recent = [
      { served: 10, earned: 500_000, tips: 40_000, owner3: 2, staff: 0 },
      { served: 12, earned: 600_000, tips: 50_000, owner3: 3, staff: 1 },
    ]
    p.life = { dailies: 5, bestServed: 14, bestProfit: 420_000, cleanDay: false, record: { day: 1, kind: 'served' } }
    p.questDay = 1
    p.daily = [
      { kind: 'serve', period: 'day', service: null, target: 8, reward: 30_000, base: 4, state: 'done', festival: null },
      { kind: 'noWalk', period: 'day', service: null, target: 1, reward: 50_000, base: 1, state: 'failed', festival: null },
      { kind: 'service', period: 'day', service: 'mask', target: 3, reward: 30_000, base: 1, state: 'open', festival: null },
    ]
    p.yesterday = ['tips', 'earn', 'owner3']
    p.swaps = 1
    p.monthFrom = 1
    p.monthly = { kind: 'earn', period: 'month', service: null, target: 1_200_000, reward: 150_000, base: 300_000, state: 'open', festival: null }
    p.lastMonthKind = 'serve'
    p.seenDay = 1
    expect(viaJson(sim).progress).toEqual(p)
  })

  it('repairs a damaged progress block instead of losing the shop', () => {
    const raw: any = JSON.parse(JSON.stringify(new SpaSim(opts()).toSave()))
    const quest = { kind: 'serve', period: 'day', service: null, target: 8, reward: 30_000, base: 0, state: 'open' }
    raw.progress.daily = [quest, { ...quest, kind: 'fly' }, { ...quest, kind: 'service', service: 'waxing' }]
    raw.progress.swaps = 7
    raw.progress.total.served = -3
    const parsed = parseSave(raw)
    // a quest saved before festivals has none
    expect(parsed.progress.daily).toEqual([{ ...quest, festival: null }])
    expect(parsed.progress.swaps).toBe(1)
    expect(parsed.progress.total.served).toBe(0)
    const empty = parseSave({ ...raw, progress: 'x' }).progress
    expect(empty).toMatchObject({ dayStart: null, daily: [], monthly: null, recent: [], questDay: 0 })
    expect(empty.total.served).toBe(0)
  })
})

describe('save version 16', () => {
  it('opens the v15 shop with no badge list, so its first load judges it as an old shop', () => {
    expect(parseSave(structuredClone(v15)).badges).toBeNull()
    expect(parseSave(structuredClone(v14)).badges).toBeNull()
    expect(open(v15).toSave().v).toBe(SAVE_VERSION)
  })

  it('still opens every older save', () => {
    for (const raw of [v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15]) expect(() => open(raw)).not.toThrow()
  })

  it('keeps only known badges with a whole day from zero up', () => {
    expect(repairBadges({ served100: 9, nope: 3, million: -1, floor2: 2.5, vipPhoto: 0 })).toEqual({ served100: 9, vipPhoto: 0 })
    expect(repairBadges(undefined)).toBeNull()
    expect(repairBadges('x')).toBeNull()
    expect(repairBadges([1, 2])).toBeNull()
  })

  it('keeps the badges through a round trip', () => {
    const sim = new SpaSim(opts())
    sim.badges = { served100: 9, vipPhoto: 0 }
    expect(viaJson(sim).badges).toEqual({ served100: 9, vipPhoto: 0 })
    expect(sim.toSave().badges).toEqual({ served100: 9, vipPhoto: 0 })
  })
})

describe('save version 17', () => {
  it('opens the v16 shop with no keepsakes and no festival quests', () => {
    const sim = open(v16)
    expect(sim.festival).toEqual({ keepsakes: [] })
    for (const q of [...sim.progress.daily, sim.progress.monthly!]) expect(q.festival).toBeNull()
    expect(sim.toSave().v).toBe(SAVE_VERSION)
  })

  it('keeps an old month quest through a festival month', () => {
    const sim = open(v16)
    expect(sim.day).toBe(38)
    expect(sim.progress.monthly).toMatchObject({ kind: 'earn', target: 800_000, festival: null })
    expect(sim.festivalServiceToday()).toBe('shampoo')
    sim.drainEvents()
    sim.progress.monthly!.target = 1
    const events = ownerServes(sim, 3, { kind: 'office', service: 'shampoo' }).events
    expect(events.some(e => e.type === 'questDone' && e.quest.period === 'month')).toBe(true)
    expect(events.some(e => e.type === 'festivalQuestDone')).toBe(false)
  })

  it('keeps only known festivals, once each', () => {
    expect(repairFestival({ keepsakes: ['tet', 'nope', 'tet', 'noel'] })).toEqual({ keepsakes: ['tet', 'noel'] })
    expect(repairFestival(undefined)).toEqual({ keepsakes: [] })
    expect(repairFestival({ keepsakes: 'tet' })).toEqual({ keepsakes: [] })
  })

  it('keeps the keepsakes through a round trip', () => {
    const sim = new SpaSim(opts())
    sim.festival.keepsakes = ['noel', 'tet']
    expect(viaJson(sim).festival).toEqual({ keepsakes: ['noel', 'tet'] })
  })

  it('still opens every older save', () => {
    for (const raw of [v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16]) expect(() => open(raw)).not.toThrow()
  })

  it('keeps a festival quest through a round trip', () => {
    const sim = new SpaSim(opts())
    sim.day = 36
    sim.startDay()
    expect(sim.progress.monthly?.festival).toBe('tet')
    expect(viaJson(sim).progress.monthly).toEqual(sim.progress.monthly)
  })
})

describe('save version 18', () => {
  it('gives the v17 shop an empty event book from tomorrow, and nobody in it is Mi Mi', () => {
    const sim = open(v17)
    expect(sim.day).toBe(13)
    expect(sim.eventBook).toEqual(emptyEventBook(14))
    expect(sim.customers).toHaveLength(1)
    expect(sim.customers.every(c => c.kol === false)).toBe(true)
    expect(sim.toSave().v).toBe(SAVE_VERSION)
  })

  it('still opens every older save', () => {
    for (const raw of [v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16, v17]) expect(() => open(raw)).not.toThrow()
  })

  it('lets an early old shop wait for day 10', () => {
    expect(repairEvents(undefined, 3)).toEqual(emptyEventBook(10))
  })

  it('repairs a damaged event book field by field', () => {
    const good = { nextDay: 16, last: 'kol', plan: { kind: 'inspect', day: 14, minute: 900 }, hotUntil: 15, hotDays: 3, hotBy: 'taylor', hotCardDay: 14, count: 2, inspected: true, certGiven: true }
    expect(repairEvents(structuredClone(good), 13)).toEqual(good)
    expect(repairEvents({ ...good, last: 'party', nextDay: -2, hotUntil: 1.5, hotDays: 0, hotBy: 'x', hotCardDay: -1, count: 'x', inspected: 1, certGiven: 'yes' }, 13)).toEqual({
      ...good,
      last: null,
      nextDay: 0,
      hotUntil: 0,
      hotDays: 2,
      hotBy: 'kol',
      hotCardDay: 0,
      count: 0,
      inspected: false,
      certGiven: false,
    })
    for (const plan of [{ kind: 'party', day: 14, minute: 900 }, { kind: 'kol', day: 14.5, minute: 900 }, { kind: 'kol', day: 15, minute: 900 }, { kind: 'kol', day: 14, minute: 'x' }, 'kol']) {
      expect(repairEvents({ ...good, plan }, 13).plan).toBeNull()
    }
    // lô C's two kinds need no new save
    for (const plan of [{ kind: 'rival', day: 14, minute: 0 }, { kind: 'power', day: 14, minute: 840 }]) expect(repairEvents({ ...good, plan }, 13).plan).toEqual(plan)
  })

  it('keeps Mi Mi through a reload', () => {
    const sim = new SpaSim(opts())
    sim.day = 12
    seatAndWait(sim, { kol: true, service: 'shampoo' })
    const copy = viaJson(sim)
    const mimi = copy.customers.find(c => c.kol)!
    expect(mimi).toBeDefined()
    copy.tapTile(mimi.seat!)
    advanceUntil(copy, () => mimi.state === 'inService')
    copy.completeService(mimi.id, 3)
    expect(copy.reviews).toEqual(sim.reviews)
    expect(copy.eventBook.hotUntil).toBe(12 + 2)
  })

  it("keeps tomorrow's plan through a reload on the summary and plans nothing again", () => {
    const sim = new SpaSim(opts())
    sim.day = 12
    sim.clock.minutes = 1190
    advanceUntil(sim, () => sim.dayOver, 400_000)
    expect(sim.eventBook.plan?.day).toBe(13)
    const copy = viaJson(sim)
    expect(copy.dayOver).toBe(true)
    expect(copy.eventBook).toEqual(sim.eventBook)
  })
})

describe('save version 19', () => {
  const closeDay = (sim: SpaSim) => {
    sim.clock.minutes = 1190
    advanceUntil(sim, () => sim.dayOver, 400_000)
    sim.drainEvents()
  }

  it('gives the v18 shop one star and starts its month today', () => {
    const sim = open(v18)
    expect(sim.day).toBe(29)
    expect(sim.rank.stars).toBe(1)
    expect(sim.rank.month).toEqual({ from: 29, served: 190, lost: 11 })
    expect(sim.rank.scores).toEqual([])
    expect(sim.rank.last).toBeNull()
    expect(sim.toSave().v).toBe(SAVE_VERSION)
  })

  it('judges an old shop at the end of its month', () => {
    const sim = open(v18)
    closeDay(sim)
    expect(sim.rank.last).toBeNull()
    sim.startDay()
    closeDay(sim)
    expect(sim.rank.last?.day).toBe(30)
    expect(sim.rank.last?.input.servedPerDay).toBe((sim.progress.total.served - 190) / 2)
  })

  it("gives an old shop's year award from the months since", () => {
    const sim = open(v18)
    sim.day = 35
    sim.startDay()
    closeDay(sim)
    expect(sim.rank.lastYear?.day).toBe(36)
    expect(sim.rank.lastYear?.score).toBe(sim.rank.last?.total)
  })

  it('still opens every older save', () => {
    for (const raw of [v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16, v17, v18, v19, v20, v21]) expect(() => open(raw)).not.toThrow()
  })

  it('repairs a damaged rank book field by field', () => {
    const last = { day: 30, input: { rating: null, beauty: 4, services: 2, servedPerDay: 3.5, lostShare: 0.1 }, parts: [1, 2, 3, 4, 5], total: 15, before: 1, after: 1, reward: 0 }
    const lastYear = { day: 36, year: 1, score: 15, table: [{ rival: 'coBa', pts: 40 }, { rival: 'ngocLan', pts: 50 }, { rival: 'hoaSen', pts: 60 }, { rival: 'spaMoi', pts: 70 }, { rival: null, pts: 15 }], place: 5, reward: 0, gifts: [] }
    const good = { stars: 3, month: { from: 31, served: 7, lost: 2 }, scores: [10, 20, 100, 0], last, lastYear, wins: 2, meritGiven: true }
    const start = { served: 190, lost: 11 }
    expect(repairRank(structuredClone(good), 33, start)).toEqual(good)
    for (const stars of [0, 6, 2.5, 'x']) expect(repairRank({ ...good, stars }, 33, start).stars).toBe(1)
    for (const month of [null, 'x', { from: 1.5, served: 7, lost: 2 }, { from: 31, served: -1, lost: 2 }, { from: 31, served: 7 }, { from: 34, served: 7, lost: 2 }]) {
      expect(repairRank({ ...good, month }, 33, start).month).toEqual({ from: 33, ...start })
    }
    expect(repairRank({ ...good, scores: [5, -1, 101, 2.5, 'x', 50] }, 33, start).scores).toEqual([5, 50])
    expect(repairRank({ ...good, scores: 'x' }, 33, start).scores).toEqual([])
    for (const bad of [null, 'x', 4, [], { day: 1.5 }, { day: 30 }, { day: 36 }]) {
      const r = repairRank({ ...good, last: bad, lastYear: bad }, 33, start)
      expect(r.last).toBeNull()
      expect(r.lastYear).toBeNull()
    }
    expect(repairRank({ ...good, last: { ...last, parts: [1, 2] } }, 33, start).last).toBeNull()
    expect(repairRank({ ...good, last: { ...last, after: 6 } }, 33, start).last).toBeNull()
    expect(repairRank({ ...good, lastYear: { ...lastYear, table: [{ rival: 'x', pts: 1 }] } }, 33, start).lastYear).toBeNull()
    expect(repairRank({ ...good, lastYear: { ...lastYear, table: [...lastYear.table, { rival: null, pts: 1 }] } }, 33, start).lastYear).toBeNull()
    for (const place of [0, 6, 2.5]) expect(repairRank({ ...good, lastYear: { ...lastYear, place } }, 33, start).lastYear).toBeNull()
    expect(repairRank({ ...good, lastYear: { ...lastYear, gifts: ['merit', 'x'] } }, 33, start).lastYear?.gifts).toEqual(['merit'])
    const r = repairRank({ ...good, wins: -1, meritGiven: 1 }, 33, start)
    expect(r.wins).toBe(0)
    expect(r.meritGiven).toBe(false)
    expect(repairRank(undefined, 33, start)).toEqual(emptyRankBook(33, 190, 11))
  })

  it('round-trips a judged shop', () => {
    const sim = new SpaSim(opts())
    sim.profileDone = true
    sim.day = 8
    sim.startDay()
    sim.reviews = Array(20).fill(5)
    sim.progress.total.served = 45
    closeDay(sim)
    expect(sim.rank.last).not.toBeNull()
    expect(viaJson(sim).rank).toEqual(sim.rank)
  })

  it("reloads day 9's evening without judging or paying again", () => {
    const sim = new SpaSim(opts())
    sim.profileDone = true
    sim.reviews = Array(20).fill(5)
    sim.progress.total.served = 45
    sim.rank.month = { from: 7, served: 0, lost: 0 }
    sim.day = 8
    sim.startDay()
    closeDay(sim)
    expect(sim.rank.last?.day).toBe(9)
    const copy = viaJson(sim)
    expect(copy.dayOver).toBe(true)
    expect(copy.money).toBe(sim.money)
    expect(copy.rank).toEqual(sim.rank)
    copy.drainEvents()
    copy.advance(5000)
    expect(copy.money).toBe(sim.money)
    expect(copy.rank).toEqual(sim.rank)
  })

  it('reloads day 36 without a second cup or certificate', () => {
    const sim = new SpaSim(opts())
    sim.profileDone = true
    sim.reviews = Array(20).fill(5)
    sim.progress.total.served = 45
    sim.rank.stars = 5
    sim.rank.month = { from: 34, served: 0, lost: 0 }
    sim.rank.scores = [72, 72, 72]
    sim.day = 35
    sim.startDay()
    closeDay(sim)
    expect(sim.rank.lastYear?.place).toBe(2)
    const copy = viaJson(sim)
    expect(copy.money).toBe(sim.money)
    expect(copy.rank).toEqual(sim.rank)
    expect(copy.book.gifts).toEqual(sim.book.gifts)
    expect(copy.book.gifts.filter(g => g === 'merit')).toHaveLength(1)
    copy.advance(5000)
    expect(copy.money).toBe(sim.money)
  })
})

describe('save version 20', () => {
  const worn = (ownerOutfit: unknown, outfitsSeen: unknown, badges = 0, wins = 0) => repairOutfits(ownerOutfit, outfitsSeen, badges, wins)

  it('puts the v19 shop in the bà ba, with its grade intact', () => {
    const sim = open(v19)
    expect(sim.ownerOutfit).toBe('baba')
    expect(sim.outfitsSeen).toEqual(['baba'])
    expect(sim.rank.stars).toBe(2)
    expect(sim.rank.last?.day).toBe(28)
    expect(sim.toSave().v).toBe(SAVE_VERSION)
  })

  it('puts a locked or unknown outfit back to the bà ba', () => {
    expect(worn('gam', ['baba'], 3).ownerOutfit).toBe('baba')
    expect(worn('gam', ['baba'], 20).ownerOutfit).toBe('gam')
    expect(worn('year', ['baba'], 25, 0).ownerOutfit).toBe('baba')
    expect(worn('cape', ['baba']).ownerOutfit).toBe('baba')
    expect(worn(42, ['baba']).ownerOutfit).toBe('baba')
  })

  it('keeps the known outfits seen, in order, with the bà ba always there', () => {
    expect(worn('baba', 'x').outfitsSeen).toEqual(['baba'])
    expect(worn('baba', undefined).outfitsSeen).toEqual(['baba'])
    expect(worn('baba', ['teal', 'cape', 7]).outfitsSeen).toEqual(['baba', 'teal'])
    expect(worn('baba', ['lotus', 'uniform']).outfitsSeen).toEqual(['baba', 'uniform', 'lotus'])
  })

  it('repairs a damaged outfit field when parsing', () => {
    const raw = { ...structuredClone(v19), v: 20, ownerOutfit: 'gam', outfitsSeen: ['teal', 'cape', 7] }
    const data = parseSave(raw)
    expect(data.ownerOutfit).toBe('baba')
    expect(data.outfitsSeen).toEqual(['baba', 'teal'])
  })

  it('round-trips the outfit worn and the outfits seen', () => {
    const sim = open(v19)
    sim.badges = { served100: 0, firstCard: 0 }
    sim.wearOutfit('uniform')
    sim.markOutfitsSeen(['uniform'])
    const copy = open(sim.toSave())
    expect(copy.ownerOutfit).toBe('uniform')
    expect(copy.outfitsSeen).toEqual(['baba', 'uniform'])
  })
})

describe('save version 21', () => {
  it('opens the v20 shop with an empty away book, no save time and no owner count, still in the teal', () => {
    const data = parseSave(structuredClone(v20))
    expect(data.away).toEqual(emptyAwayBook())
    expect(data.savedAt).toBeNull()
    expect(data.stats.ownerServed).toBe(0)
    expect(data.ownerOutfit).toBe('teal')
    expect(open(v20).toSave().v).toBe(SAVE_VERSION)
  })

  it('reads a save time that is not a number as none', () => {
    expect(parseSave({ ...structuredClone(v20), v: 21, savedAt: 'x' }).savedAt).toBeNull()
  })

  it('round-trips the away book and the save time', () => {
    const sim = open(v20)
    sim.away = { profits: [1, 2, 3], ok: true, tipSeen: true }
    const copy = parseSave(JSON.parse(JSON.stringify({ ...sim.toSave(), savedAt: 1_700_000_000_000 })))
    expect(copy.away).toEqual({ profits: [1, 2, 3], ok: true, tipSeen: true })
    expect(copy.savedAt).toBe(1_700_000_000_000)
  })
})

describe('save version 22', () => {
  const chainShop = () => new SpaSim({ rng: createRng(2), autoSpawn: false, starter: true })

  it('opens the v21 shop with the starter chain past and no record, paying and telling nothing', () => {
    const data = parseSave(structuredClone(v21))
    expect(data.starter).toEqual(pastStarter())
    expect(data.progress.life.record).toBeNull()
    const sim = open(v21)
    expect(isPast(sim.starter)).toBe(true)
    expect(sim.money).toBe(v21.money)
    expect(sim.drainEvents().some(e => e.type === 'goalDone')).toBe(false)
    expect(sim.questsButtonOpen()).toBe(true)
    expect(sim.toSave().v).toBe(SAVE_VERSION)
  })

  it('round-trips a shop mid-chain exactly, and pays no goal again on reload', () => {
    const sim = chainShop()
    for (let i = 0; i < 4; i++) ownerServes(sim, 3)
    expect(sim.starter.at).toBe(STARTER_GOAL_IDS.indexOf('buyDecor'))
    sim.drainEvents()
    const copy = viaJson(sim)
    expect(copy.starter).toEqual(sim.starter)
    expect(copy.featureOpen('build')).toBe(true)
    expect(copy.money).toBe(sim.money)
    expect(copy.drainEvents().some(e => e.type === 'goalDone')).toBe(false)
    expect(copy.toSave()).toEqual(sim.toSave())
  })

  it('reads a damaged starter book as past, and a damaged record as none', () => {
    expect(parseSave({ ...structuredClone(v21), v: 22, starter: { at: 99 } }).starter).toEqual(pastStarter())
    const life = (record: unknown) => {
      const raw = structuredClone(v21) as { progress: { life: Record<string, unknown> } }
      raw.progress.life.record = record
      return parseSave({ ...raw, v: 22 }).progress.life.record
    }
    expect(life({ day: 5, kind: 'served' })).toEqual({ day: 5, kind: 'served' })
    expect(life({ day: 0, kind: 'served' })).toBeNull()
    expect(life({ day: 5, kind: 'tips' })).toBeNull()
    expect(life('x')).toBeNull()
  })
})

/** An old save's event books (the main shop's and each branch's) with the hot-run fields a read gives them, and an empty idol book on every shop. */
function withHotFields<T extends object>(raw: T): T {
  const hot = { hotDays: 2, hotBy: 'kol', hotCardDay: 0 }
  const r = raw as { events?: object; chain?: { branches: { events?: object }[] } }
  const out: typeof r & { idol?: object } = { ...r }
  if (r.events) out.events = { ...r.events, ...hot }
  if (r.chain) out.chain = { ...r.chain, branches: r.chain.branches.map(b => (({ ...b, ...(b.events ? { events: { ...b.events, ...hot } } : {}), idol: emptyIdolBook() }))) }
  out.idol = emptyIdolBook()
  return out as T
}

describe('save version 23', () => {
  /** A main shop with the beach open, saved and read back as plain JSON. */
  const chainJson = () => {
    const main = starShop(3, 20_000_000, 5)
    const chain = new Chain(main, 8)
    expect(chain.open('beach')).toBeNull()
    return JSON.parse(JSON.stringify(chain.toSave()))
  }

  it('opens the v21 shop with no place and an empty chain, keeping its day, stars and save time', () => {
    const data = parseSave(structuredClone(v21))
    expect(data.place).toBeNull()
    expect(data.chain).toEqual({ at: null, told: false, branches: [] })
    expect([data.day, data.rank.stars, data.savedAt]).toEqual([29, 2, 1_793_000_000_000])
    expect(open(v21).toSave().v).toBe(SAVE_VERSION)
  })

  it('opens the v22 shop with no place and an empty chain, changing nothing else', () => {
    const data = parseSave(structuredClone(v22))
    const { place, chain, ...rest } = data
    expect(place).toBeNull()
    expect(chain).toEqual({ at: null, told: false, branches: [] })
    // a customer saved before the idols is not an idol
    const expected = withHotFields(withNewKeys(v22))
    expect(rest).toEqual({ ...expected, customers: expected.customers.map(c => ({ ...c, idol: null })) })
    const saved = Chain.fromSave(data, 8).toSave()
    expect([saved.v, saved.place, saved.chain]).toEqual([SAVE_VERSION, null, { at: null, told: false, branches: [] }])
    expect(saved.starter).toEqual(v22.starter)
    expect(saved.progress.life.record).toBeNull()
  })

  it('keeps the starter book mid-chain and the record day of a v22 shop', () => {
    const raw = structuredClone(v22) as unknown as { starter: unknown; progress: { life: Record<string, unknown> } }
    const starter = { at: STARTER_GOAL_IDS.indexOf('serveMore'), doneDay: null, bought: 1, opened: { build: 1 }, maskNext: false }
    raw.starter = starter
    raw.progress.life.record = { day: 28, kind: 'profit' }
    const sim = open(raw)
    expect(sim.starter).toEqual(starter)
    expect(sim.progress.life.record).toEqual({ day: 28, kind: 'profit' })
    expect(sim.drainEvents().some(e => e.type === 'goalDone')).toBe(false)
    const saved = new Chain(sim, 8).toSave()
    expect([saved.v, saved.place, saved.chain]).toEqual([SAVE_VERSION, null, { at: null, told: false, branches: [] }])
    expect(saved.starter).toEqual(starter)
    expect(saved.progress.life.record).toEqual({ day: 28, kind: 'profit' })
  })

  it('still opens every older save', () => {
    for (const raw of [v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16, v17, v18, v19, v20, v21, v22]) {
      const data = parseSave(structuredClone(raw))
      expect(data.chain).toEqual({ at: null, told: false, branches: [] })
      expect(() => open(raw)).not.toThrow()
    }
  })

  it('keeps one branch per place, the first', () => {
    const raw = chainJson()
    const second = structuredClone(raw.chain.branches[0])
    second.shopName = 'second'
    raw.chain.branches.push(second)
    const data = parseSave(raw)
    expect(data.chain!.branches).toHaveLength(1)
    expect(data.chain!.branches[0].shopName).not.toBe('second')
  })

  it('puts a branch on the main shop day and minute', () => {
    const raw = chainJson()
    raw.chain.branches[0].day = 3
    raw.chain.branches[0].minutes = 600
    const data = parseSave(raw)
    expect([data.chain!.branches[0].day, data.chain!.branches[0].minutes]).toEqual([data.day, data.minutes])
  })

  it('puts the owner back at the main shop when the place she is at has no branch', () => {
    const raw = chainJson()
    raw.chain.at = 'oldTown'
    expect(parseSave(raw).chain!.at).toBeNull()
    raw.chain.at = 'beach'
    expect(parseSave(raw).chain!.at).toBe('beach')
  })

  it('repairs a branch with no place or an unknown one to the first free place the main shop has the stars for', () => {
    for (const place of [null, 'moon']) {
      const raw = chainJson()
      raw.chain.branches[0].place = place
      expect(parseSave(raw).chain!.branches.map(b => b.place)).toEqual(['beach'])
    }
  })

  it('gives a place-less second branch beside the beach in a 4-star main shop the old town', () => {
    const main = starShop(4, 20_000_000, 5)
    const chain = new Chain(main, 8)
    expect(chain.open('beach')).toBeNull()
    const raw = JSON.parse(JSON.stringify(chain.toSave()))
    raw.chain.branches.push({ ...structuredClone(raw.chain.branches[0]), place: null })
    expect(parseSave(raw).chain!.branches.map(b => b.place)).toEqual(['beach', 'oldTown'])
  })

  it('drops a branch that is not a shop, and one with no place the stars allow', () => {
    const raw = chainJson()
    raw.chain.branches = [5, 'x', null]
    expect(parseSave(raw).chain!.branches).toEqual([])
    const full = chainJson()
    full.chain.branches.push({ ...structuredClone(full.chain.branches[0]), place: null })
    expect(parseSave(full).chain!.branches.map(b => b.place)).toEqual(['beach'])
  })

  it('drops a second branch at a taken place, never moving it to another place', () => {
    const raw = chainJson()
    // a branch with no place comes first and takes the free ready place; the duplicate beach is the first to keep it
    const lost = structuredClone(raw.chain.branches[0])
    lost.place = null
    lost.shopName = 'lost'
    const dup = structuredClone(raw.chain.branches[0])
    dup.shopName = 'dup'
    raw.chain.branches = [lost, raw.chain.branches[0], dup]
    const out = parseSave(raw).chain!.branches
    expect(out.map(b => b.place)).toEqual(['beach'])
    expect(out[0].shopName).not.toBe('dup')
    expect(out[0].shopName).not.toBe('lost')
  })

  it('drops a branch whose data is damaged', () => {
    const raw = chainJson()
    raw.chain.branches[0].customers = 'x'
    expect(parseSave(raw).chain!.branches).toEqual([])
  })

  it('gives a branch no chain of its own', () => {
    const raw = chainJson()
    raw.chain.branches[0].chain = chainJson().chain
    expect(parseSave(raw).chain!.branches[0].chain).toBeNull()
  })

  it('puts a branch on the main shop purse', () => {
    const raw = chainJson()
    raw.chain.branches[0].money = 999
    const data = parseSave(raw)
    expect(data.chain!.branches[0].money).toBe(data.money)
  })

  it('gives the main shop no place', () => {
    const raw = chainJson()
    raw.place = 'beach'
    expect(parseSave(raw).place).toBeNull()
  })

  it('reads told as true only when it is true', () => {
    const raw = chainJson()
    raw.chain.told = 'yes'
    expect(parseSave(raw).chain!.told).toBe(false)
    raw.chain.told = true
    expect(parseSave(raw).chain!.told).toBe(true)
  })

  it('reads a chain that is not an object as an empty one', () => {
    const raw = chainJson()
    raw.chain = 7
    expect(parseSave(raw).chain).toEqual({ at: null, told: false, branches: [] })
  })
})

describe('save version 24', () => {
  const fixtures = { v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16, v17, v18, v19, v20, v21, v22, v23 }

  it('opens the v23 shop with its beach as it was', () => {
    const expected = withNewKeys(v23) as unknown as { chain: { branches: { staff: object[] }[] } }
    expected.chain.branches = expected.chain.branches.map(b => ({ ...b, staff: b.staff.map(s => ({ ...s, moveTo: null })) }))
    expect(parseSave(structuredClone(v23))).toEqual(withHotFields(expected))
    const chain = Chain.fromSave(parseSave(structuredClone(v23)), 8)
    expect(chain.at).toBe('beach')
    expect(chain.branches.length).toBe(1)
    expect(chain.shop('beach')!.staff.length).toBe(1)
    expect(chain.main.money).toBe(v23.money)
    expect(chain.toSave().v).toBe(SAVE_VERSION)
  })

  it('keeps the new kinds of a branch customer and reads an unknown one as office', () => {
    const kindsBack = (kind: string) => {
      const main = starShop(4, 14_000_000, 5)
      const chain = new Chain(main, 8)
      expect(chain.open('beach')).toBeNull()
      const beach = chain.shop('beach')!
      beach.spawnCustomer({ kind: 'tourist', service: 'shampoo' })
      const raw = JSON.parse(JSON.stringify(chain.toSave()))
      raw.chain.branches[0].customers[0].kind = kind
      return Chain.fromSave(parseSave(raw), 8).shop('beach')!.customers[0].kind
    }
    expect([kindsBack('lady'), kindsBack('backpacker'), kindsBack('moon')]).toEqual(['lady', 'backpacker', 'office'])
  })

  it('opens every older save and saves it as the current version', () => {
    for (const [name, raw] of Object.entries(fixtures)) {
      const saved = Chain.fromSave(parseSave(structuredClone(raw)), 8).toSave()
      expect([name, saved.v]).toEqual([name, SAVE_VERSION])
    }
  })
})

describe('save version 25', () => {
  const fixtures = { v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16, v17, v18, v19, v20, v21, v22, v23, v24 }
  type Raw = { staff: Record<string, unknown>[]; chain: { branches: { staff: Record<string, unknown>[] }[] } }

  it('opens the v24 chain as it was, every staff member moving nowhere', () => {
    const expected = withNewKeys(v24) as unknown as Raw
    expected.staff = expected.staff.map(s => ({ ...s, moveTo: null }))
    expected.chain.branches = expected.chain.branches.map(b => ({ ...b, staff: b.staff.map(s => ({ ...s, moveTo: null })) }))
    expect(parseSave(structuredClone(v24))).toEqual(withHotFields(expected))
    const chain = Chain.fromSave(parseSave(structuredClone(v24)), 8)
    expect(chain.at).toBe('beach')
    expect(chain.shop('beach')!.staff.length).toBe(1)
    expect(chain.toSave().v).toBe(SAVE_VERSION)
  })

  it('opens every older save and saves it as the current version', () => {
    for (const [name, raw] of Object.entries(fixtures)) {
      const saved = Chain.fromSave(parseSave(structuredClone(raw)), 8).toSave()
      expect([name, saved.v]).toEqual([name, SAVE_VERSION])
    }
  })

  it('keeps a moveTo of main or a place and reads anything else as null', () => {
    const read = (moveTo: unknown) => {
      const raw = structuredClone(v24) as unknown as Raw
      raw.staff[0].moveTo = moveTo
      return parseSave(raw as never).staff[0].moveTo
    }
    expect([read('beach'), read('main'), read('moon'), read(3)]).toEqual(['beach', 'main', null, null])
  })

  it('clears a moveTo that names its own shop, a place with no branch, or a leaving person', () => {
    const back = (edit: (raw: Raw) => void) => {
      const raw = structuredClone(v24) as unknown as Raw
      edit(raw)
      const chain = Chain.fromSave(parseSave(raw as never), 8)
      return [chain.main.staff[0].moveTo, chain.shop('beach')!.staff[0].moveTo]
    }
    expect(back(r => { r.staff[0].moveTo = 'main'; r.chain.branches[0].staff[0].moveTo = 'beach' })).toEqual([null, null])
    expect(back(r => { r.staff[0].moveTo = 'oldTown'; r.chain.branches[0].staff[0].moveTo = 'uptown' })).toEqual([null, null])
    expect(back(r => { r.staff[0].moveTo = 'beach'; r.staff[0].leaving = true })).toEqual([null, null])
    expect(back(r => { r.staff[0].moveTo = 'beach'; r.chain.branches[0].staff[0].moveTo = 'main' })).toEqual(['beach', 'main'])
  })
})

describe('save version 26', () => {
  const fixtures = { v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16, v17, v18, v19, v20, v21, v22, v23, v24, v25 }
  const paid = (lessonsPaid: unknown, services?: string[]) => {
    const raw = structuredClone(v25) as unknown as { lessonsPaid: unknown; services: string[] }
    raw.lessonsPaid = lessonsPaid
    if (services) raw.services = services
    return parseSave(raw as never).lessonsPaid
  }

  it('opens the v25 chain as it was, with nothing paid', () => {
    // a customer saved before the idols is not an idol
    const expected = withHotFields(withNewKeys(v25))
    expect(parseSave(structuredClone(v25))).toEqual({ ...expected, customers: expected.customers.map(c => ({ ...c, idol: null })) })
    const chain = Chain.fromSave(parseSave(structuredClone(v25)), 8)
    expect(chain.at).toBeNull()
    expect(chain.branches.length).toBe(1)
    expect(chain.shop('beach')!.staff.length).toBe(1)
    const tech = chain.main.staff.find(s => s.role === 'technician')!
    expect(tech.tiers.massage).toBe(2)
    expect(tech.study?.course).toBe('mask')
    expect(chain.main.money).toBe(v25.money)
    expect(chain.toSave().v).toBe(SAVE_VERSION)
  })

  it('opens every older save and saves it as the current version', () => {
    for (const [name, raw] of Object.entries(fixtures)) {
      const saved = Chain.fromSave(parseSave(structuredClone(raw)), 8).toSave()
      expect([name, saved.v]).toEqual([name, SAVE_VERSION])
    }
  })

  it('opens 25 and the current version and refuses a newer one', () => {
    expect(parseSave({ ...structuredClone(v25), v: 25 }).v).toBe(SAVE_VERSION)
    expect(parseSave({ ...structuredClone(v25), v: SAVE_VERSION }).v).toBe(SAVE_VERSION)
    expect(() => parseSave({ ...structuredClone(v25), v: SAVE_VERSION + 1 })).toThrow(SaveTooNewError)
  })

  it('repairs the lessons paid', () => {
    expect([paid(['scrub']), paid(['scrub', 'scrub']), paid(['moon', 3]), paid('scrub'), paid(['scrub'], ['shampoo', 'scrub'])]).toEqual([['scrub'], ['scrub'], [], [], []])
  })

  it('keeps the lessons paid through a round trip', () => {
    const sim = busyShop()
    sim.lessonsPaid = ['scrub']
    expect(viaJson(sim).lessonsPaid).toEqual(['scrub'])
  })
})

describe('save version 27', () => {
  const fixtures = { v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16, v17, v18, v19, v20, v21, v22, v23, v24, v25, v26 }
  type Raw = { customers: Record<string, unknown>[]; staff: Record<string, unknown>[]; chain: { branches: { customers: Record<string, unknown>[]; staff: Record<string, unknown>[] }[] } }
  const ownerOnly = (sim: SpaSim) => sim.customers.filter(c => c.vip !== null || c.idol !== null)
  /** A reload through JSON of a shop whose arrivals run, as the booked ones come only then. */
  const reload = (sim: SpaSim) => SpaSim.fromSave(parseSave(JSON.parse(JSON.stringify(sim.toSave()))), { rng: createRng(2), autoSpawn: true })

  /** A shop with the gold board, two technicians, and mask and massage open with a massage bed. */
  const boardShop = () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    sim.money = 20_000_000
    expect(sim.openService('mask')).toBeNull()
    expect(sim.openService('massage')).toBeNull()
    expect(sim.buy('massageBed', 18, 2, false)).toBeNull()
    sim.vip.boardGiven = true
    hireStaff(sim, 'technician')
    hireStaff(sim, 'technician')
    sim.drainEvents()
    return sim
  }

  it('opens the v26 chain as it was, with an empty idol book, no idol on anyone and the old hot run', () => {
    const expected = withNewKeys(v26) as unknown as Raw
    expected.customers = expected.customers.map(c => ({ ...c, idol: null }))
    expected.chain.branches = expected.chain.branches.map(b => ({ ...b, customers: b.customers.map(c => ({ ...c, idol: null })) }))
    const data = parseSave(structuredClone(v26))
    // the fixture's VIP book has a visit but no everBooked, which a read has always implied
    ;(expected as unknown as { vip: { everBooked: boolean } }).vip.everBooked = true
    expect(data).toEqual(withHotFields(expected))
    expect(data.idol).toEqual(emptyIdolBook())
    const chain = Chain.fromSave(data, 8)
    expect(chain.branches.length).toBe(1)
    expect(chain.toSave().v).toBe(SAVE_VERSION)
    const main = chain.main
    expect([main.eventBook.hotUntil, main.eventBook.hotDays, main.eventBook.hotBy]).toEqual([41, 2, 'kol'])
    expect(main.day).toBe(40)
    expect(main.hotToday()).toBe(true)
    main.day = 41
    expect(main.hotToday()).toBe(true)
    main.day = 42
    expect(main.hotToday()).toBe(false)
  })

  it('opens every older save and saves it as the current version', () => {
    for (const [name, raw] of Object.entries(fixtures)) {
      const saved = Chain.fromSave(parseSave(structuredClone(raw)), 8).toSave()
      expect([name, saved.v, saved.idol]).toEqual([name, SAVE_VERSION, emptyIdolBook()])
    }
  })

  it('opens the current version and refuses a newer one', () => {
    expect(parseSave({ ...structuredClone(v26), v: SAVE_VERSION }).v).toBe(SAVE_VERSION)
    expect(() => parseSave({ ...structuredClone(v26), v: SAVE_VERSION + 1 })).toThrow(SaveTooNewError)
  })

  it('repairs a damaged idol book field by field', () => {
    const read = (idol: unknown) => parseSave({ ...structuredClone(v26), v: SAVE_VERSION, idol } as never).idol
    expect(read(undefined)).toEqual(emptyIdolBook())
    expect(read('x')).toEqual(emptyIdolBook())
    const good = { ...emptyIdolBook(), nextDay: 44, wallGiven: true, booking: { idol: 'taylor' as const, day: 41, minute: 600 } }
    good.idols = { ...good.idols, jennie: { visits: 2, best: 3, photo: true, thanked: true } }
    expect(read(structuredClone(good))).toEqual({ ...good, everBooked: true })
    const bad = read({
      idols: { ...good.idols, jennie: { visits: 2, best: 9, photo: 'yes', thanked: 1 }, gd: { visits: -1, best: 1.5 }, nobody: { visits: 5, best: 3, photo: true, thanked: true } },
      booking: { idol: 'taylor', day: 42, minute: 600 },
      nextDay: -3,
      everBooked: false,
      wallGiven: 'yes',
    })
    expect(bad.idols.jennie).toEqual({ visits: 2, best: 3, photo: false, thanked: false })
    expect(bad.idols.gd).toEqual({ visits: 0, best: 0, photo: false, thanked: false })
    expect(Object.keys(bad.idols)).toEqual(IDOL_IDS)
    expect([bad.booking, bad.nextDay, bad.wallGiven]).toEqual([null, 0, false])
    // a visit implies everBooked
    expect(bad.everBooked).toBe(true)
    // a booking for an unknown star is dropped; a booking implies everBooked
    expect(read({ booking: { idol: 'moon', day: 40, minute: 600 } })).toEqual(emptyIdolBook())
    expect(read({ booking: { idol: 'gd', day: 41, minute: 600 } })).toMatchObject({ booking: { idol: 'gd', day: 41, minute: 600 }, everBooked: true })
  })

  it('reads an unknown idol on a customer as null', () => {
    const read = (idol: unknown) => {
      const raw = structuredClone(v26) as unknown as Raw
      raw.customers[0].idol = idol
      return parseSave(raw as never).customers[0].idol
    }
    expect([read('taylor'), read('moon'), read(3), read(undefined)]).toEqual(['taylor', null, null, null])
  })

  it('keeps a star waiting outside behind a VIP, and she still comes once after a reload', () => {
    const sim = boardShop()
    const vip = sim.spawnCustomer({ vip: 'chef' })
    advanceUntil(sim, () => vip.state === 'waiting')
    sim.idol.booking = { idol: 'sontung', day: sim.day, minute: Math.floor(sim.clock.minutes) }
    sim.advance(2_000)
    const copy = reload(sim)
    expect(copy.idol.booking).toEqual(sim.idol.booking)
    expect(ownerOnly(copy).map(c => c.vip)).toEqual(['chef'])
    const waiting = copy.customers.find(c => c.vip === 'chef')!
    copy.tapTile(waiting.seat!)
    advanceUntil(copy, () => waiting.state === 'inService')
    copy.completeService(waiting.id, 3)
    while (copy.customers.includes(waiting)) {
      expect(ownerOnly(copy).filter(c => c.idol !== null)).toEqual([])
      copy.advance(STEP_MS)
    }
    copy.advance(STEP_MS)
    expect(ownerOnly(copy).map(c => c.idol)).toEqual(['sontung'])
    expect(copy.idol.idols.sontung.visits).toBe(1)
    expect(copy.idol.booking).toBeNull()
    // reloaded with the star in, nothing is booked or counted again
    const again = reload(copy)
    expect(again.idol.idols.sontung.visits).toBe(1)
    expect(again.customers.filter(c => c.idol !== null).length).toBe(1)
  })

  it('keeps a waiting star through a reload, who pays five times with the photo once', () => {
    const sim = boardShop()
    const idol = sim.spawnCustomer({ idol: 'taylor' })
    advanceUntil(sim, () => idol.state === 'waiting')
    const copy = viaJson(sim)
    const back = copy.customers.find(c => c.idol === 'taylor')!
    expect(back).toEqual(idol)
    // the shop made the visit count without saying it was booked; a read implies it
    expect(copy.idol).toEqual({ ...sim.idol, everBooked: true })
    copy.tapTile(back.seat!)
    advanceUntil(copy, () => back.state === 'inService')
    copy.drainEvents()
    const before = copy.money
    copy.completeService(back.id, 3)
    const served = copy.drainEvents()
    expect(served).toContainEqual(expect.objectContaining({ type: 'idolServed', idol: 'taylor', stars: 3, photo: true }))
    expect(copy.money - before).toBeGreaterThanOrEqual(SERVICE_PRICE[back.service] * IDOL_PRICE_FACTOR)
    const photos = (s: SpaSim) => s.book.gifts.filter(g => g === IDOLS.taylor.photo).length
    expect(photos(copy)).toBe(1)
    expect(copy.idol.idols.taylor).toMatchObject({ visits: 1, best: 3, photo: true })
    advanceUntil(copy, () => !copy.customers.includes(back))
    // a reload after the visit gives nothing again, and a second one neither
    const second = viaJson(copy)
    second.advance(STEP_MS * 5)
    expect(second.drainEvents().filter(e => e.type === 'idolServed' || e.type === 'idolArrived')).toEqual([])
    expect(second.idol).toEqual(copy.idol)
    expect(photos(second)).toBe(1)
    expect(viaJson(second).idol).toEqual(copy.idol)
  })

  it('keeps a stretched hot run through a reload without stretching it again', () => {
    const sim = boardShop()
    // yesterday's run, which the star's visit stretches
    makeHot(sim.eventBook, sim.day - 1, 'kol')
    const idol = sim.spawnCustomer({ idol: 'gd' })
    advanceUntil(sim, () => idol.state === 'waiting')
    sim.tapTile(idol.seat!)
    advanceUntil(sim, () => idol.state === 'inService')
    sim.completeService(idol.id, 3)
    const run = { ...sim.eventBook }
    expect(run.hotBy).toBe('gd')
    expect(run.hotDays).toBeGreaterThan(HOT_DAYS)
    expect(run.hotUntil).toBeGreaterThan(0)
    const copy = viaJson(sim)
    expect(copy.eventBook).toEqual(run)
    const twice = viaJson(copy)
    expect(twice.eventBook).toEqual(run)
    expect(twice.hotToday()).toBe(copy.hotToday())
  })
})

describe('save version 28', () => {
  const fixtures = { v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16, v17, v18, v19, v20, v21, v22, v23, v24, v25, v26, v27 }
  const paid = (lessonsPaid: unknown, services?: string[]) => {
    const raw = structuredClone(v27) as unknown as { lessonsPaid: unknown; services: string[] }
    raw.lessonsPaid = lessonsPaid
    if (services) raw.services = services
    return parseSave(raw as never).lessonsPaid
  }

  it('opens the v27 chain as it was, with scrub kept and foot not learned', () => {
    expect(parseSave(structuredClone(v27))).toEqual(withNewKeys(v27))
    const chain = Chain.fromSave(parseSave(structuredClone(v27)), 8)
    expect(chain.main.services).toContain('scrub')
    expect(chain.main.services).not.toContain('foot')
    const tech = chain.main.staff.find(s => s.role === 'technician')!
    expect(tech.tiers.scrub).toBe(1)
    expect(tech.study?.course).toBe('scrub')
    expect(chain.main.items.filter(i => i.kind === 'scrubBed').length).toBe(1)
    expect(chain.shop('beach')!.staff.length).toBe(1)
    // the beach branch keeps scrub as a service it has, and has no foot
    expect(chain.shop('beach')!.services).toContain('scrub')
    expect(chain.shop('beach')!.services).not.toContain('foot')
    expect(chain.toSave().v).toBe(SAVE_VERSION)
  })

  it('opens every older save and saves it as the current version', () => {
    for (const [name, raw] of Object.entries(fixtures)) {
      const saved = Chain.fromSave(parseSave(structuredClone(raw)), 8).toSave()
      expect([name, saved.v]).toEqual([name, SAVE_VERSION])
    }
  })

  it('opens 27 and the current version and refuses a newer one', () => {
    expect(parseSave({ ...structuredClone(v27), v: 27 }).v).toBe(SAVE_VERSION)
    expect(parseSave({ ...structuredClone(v27), v: SAVE_VERSION }).v).toBe(SAVE_VERSION)
    expect(() => parseSave({ ...structuredClone(v27), v: SAVE_VERSION + 1 })).toThrow(SaveTooNewError)
  })

  it('repairs the foot lesson paid', () => {
    expect([paid(['foot']), paid(['foot', 'scrub'], ['shampoo']), paid(['foot'], ['shampoo', 'foot'])]).toEqual([['foot'], ['scrub', 'foot'], []])
  })
})

describe('save version 29', () => {
  const fixtures = { v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, v16, v17, v18, v19, v20, v21, v22, v23, v24, v25, v26, v27, v28 }
  const paid = (lessonsPaid: unknown, services?: string[]) => {
    const raw = structuredClone(v28) as unknown as { lessonsPaid: unknown; services: string[] }
    raw.lessonsPaid = lessonsPaid
    if (services) raw.services = services
    return parseSave(raw as never).lessonsPaid
  }
  const polish = (n: number) => {
    const raw = structuredClone(v28) as unknown as { stock: Record<string, number> }
    raw.stock.polish = n
    return parseSave(raw as never).stock.polish
  }

  it('opens the v28 chain as it was, with foot kept and nails not learned', () => {
    expect(parseSave(structuredClone(v28))).toEqual(withNewKeys(v28))
    const chain = Chain.fromSave(parseSave(structuredClone(v28)), 8)
    expect(chain.main.services).toContain('scrub')
    expect(chain.main.services).toContain('foot')
    expect(chain.main.services).not.toContain('nails')
    const tech = chain.main.staff.find(s => s.role === 'technician')!
    expect(tech.tiers.foot).toBe(1)
    expect(tech.tiers.nails).toBe(0)
    expect(tech.study?.course).toBe('foot')
    expect(chain.main.items.filter(i => i.kind === 'footChair').length).toBe(1)
    const town = chain.shop('oldTown')!
    expect(town.services).toContain('foot')
    expect(town.staff.length).toBe(1)
    expect(town.stock.polish).toBe(20)
    expect(chain.main.stock.polish).toBe(20)
    expect(chain.toSave().v).toBe(SAVE_VERSION)
  })

  it('opens every older save and saves it as the current version', () => {
    for (const [name, raw] of Object.entries(fixtures)) {
      const saved = Chain.fromSave(parseSave(structuredClone(raw)), 8).toSave()
      expect([name, saved.v]).toEqual([name, SAVE_VERSION])
    }
  })

  it('opens 28 and the current version and refuses a newer one', () => {
    expect(parseSave({ ...structuredClone(v28), v: 28 }).v).toBe(SAVE_VERSION)
    expect(parseSave({ ...structuredClone(v28), v: SAVE_VERSION }).v).toBe(SAVE_VERSION)
    expect(() => parseSave({ ...structuredClone(v28), v: SAVE_VERSION + 1 })).toThrow(SaveTooNewError)
  })

  it('repairs the nails lesson paid', () => {
    expect([paid(['nails']), paid(['nails', 'foot', 'scrub'], ['shampoo']), paid(['nails'], ['shampoo', 'nails'])]).toEqual([['nails'], ['scrub', 'foot', 'nails'], []])
  })

  it('reads the polish stock and repairs a bad one', () => {
    expect([polish(7), polish(-1)]).toEqual([7, 20])
  })

  it('keeps a turned piece and drops a turned flag that is not true', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    const bench = sim.items.find(i => i.kind === 'bench')!.id
    expect(sim.move(bench, 16, 9, false, true)).toBeNull()
    const raw = JSON.parse(JSON.stringify(sim.toSave()))
    expect(parseSave(raw).items.find(i => i.id === bench)!.turned).toBe(true)
    const other = raw.items.filter((i: { id: number }) => i.id !== bench)
    other[0].turned = false
    other[1].turned = 'yes'
    const d = parseSave(raw)
    expect('turned' in d.items.find(i => i.id === other[0].id)!).toBe(false)
    expect('turned' in d.items.find(i => i.id === other[1].id)!).toBe(false)
  })

  it('drops a turned flag from a square piece that is not a bed', () => {
    const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
    const raw = JSON.parse(JSON.stringify(sim.toSave()))
    const bed = raw.items.find((i: { kind: string }) => i.kind === 'bed')
    const decor = raw.items.find((i: { kind: string }) => i.kind === 'plant')
    const bench = raw.items.find((i: { kind: string }) => i.kind === 'bench')
    for (const i of [bed, decor, bench]) i.turned = true
    const d = parseSave(raw)
    const turned = (id: number) => 'turned' in d.items.find(i => i.id === id)!
    expect([turned(bed.id), turned(decor.id), turned(bench.id)]).toEqual([true, false, true])
  })
})

describe('the screens and the desk in an older shop', () => {
  it('stands them where they always stood, as the newest items, in the main shop and each branch', () => {
    const data = parseSave(structuredClone(v29))
    expect(data.items.slice(-3)).toEqual([
      { id: 15, kind: 'screen', x: 13, y: 6, flip: false },
      { id: 16, kind: 'screen', x: 19, y: 6, flip: false },
      { id: 17, kind: 'desk', x: 20, y: 14, flip: false },
    ])
    expect(data.items.slice(0, -3)).toEqual(v29.items.map(right12))
    expect(data.nextItemId).toBe(18)
    for (const b of data.chain!.branches) expect(b.items.slice(-3).map(i => [i.kind, i.x, i.y])).toEqual([['screen', 13, 6], ['screen', 19, 6], ['desk', 20, 14]])
  })
  it('opens with the same beauty and the owner behind the desk', () => {
    const sim = open(v29)
    expect(sim.beauty()).toBe(beautyOf(v29.items as Item[]))
    expect(sim.ownerStart()).toEqual({ x: 21, y: 13 })
  })
  it('opens a branch with the owner behind its desk too', () => {
    const chain = Chain.fromSave(parseSave(structuredClone(v29)), 8)
    expect(chain.shop('beach')!.ownerStart()).toEqual({ x: 21, y: 13 })
  })
  it('furnishes only once when a parsed save is parsed again before it saves', () => {
    const again = parseSave(parseSave(structuredClone(v29)))
    const count = (items: { kind: string }[], kind: string) => items.filter(i => i.kind === kind).length
    expect([count(again.items, 'desk'), count(again.items, 'screen'), again.nextItemId]).toEqual([1, 2, 18])
    expect(again.chain!.branches).toHaveLength(1)
    for (const b of again.chain!.branches) expect([count(b.items, 'desk'), count(b.items, 'screen')]).toEqual([1, 2])
  })
  it('numbers them past every existing id when nextItemId is stale', () => {
    const raw = structuredClone(v29) as { nextItemId: number }
    raw.nextItemId = 5
    const d = parseSave(raw)
    const ids = d.items.map(i => i.id)
    expect(new Set(ids).size).toBe(ids.length)
    const old = Math.max(...v29.items.map(i => i.id))
    const added = d.items.filter(i => i.kind === 'screen' || i.kind === 'desk')
    expect(added).toHaveLength(3)
    for (const i of added) expect(i.id).toBeGreaterThan(old)
    expect(d.nextItemId).toBeGreaterThan(Math.max(...ids))
  })
  it('adds them once to a shop rebuilt from the default furniture', () => {
    for (const raw of [v1, v2]) expect(parseSave(structuredClone(raw)).items.filter(i => i.kind === 'desk')).toHaveLength(1)
  })
  it('never adds them again to a shop saved with them', () => {
    const sim = open(v29)
    expect(sim.sell(sim.items.find(i => i.kind === 'screen')!.id)).toBeNull()
    expect(parseSave(JSON.parse(JSON.stringify(sim.toSave()))).items.filter(i => i.kind === 'screen')).toHaveLength(1)
  })
  it('still clears the stairs of a v13 shop, whose desk is at (8, 14), now (20, 14)', () => {
    const sim = open(v13)
    expect(sim.items.some(i => i.id === 14 || i.id === 15)).toBe(false)
    expect(sim.items.find(i => i.kind === 'desk')).toMatchObject({ x: 20, y: 14 })
  })
})

describe('save version 31', () => {
  it('opens a v30 chain with nothing changed but the version', () => {
    const data = parseSave(structuredClone(v30))
    expect(data).toEqual(withNewKeys(v30))
    expect(data.chain!.branches).toHaveLength(1)
    expect(open(v30).toSave().v).toBe(SAVE_VERSION)
  })
  it('keeps the cabinet turned, and a turned bed', () => {
    const raw = structuredClone(v30) as unknown as { items: { id: number; kind: string; x: number; y: number; flip: boolean; turned?: boolean }[] }
    expect(parseSave(structuredClone(raw)).items.find(i => i.id === 3)!.turned).toBe(true)
    raw.items.push({ id: 40, kind: 'massageBed', x: 4, y: 9, flip: false, turned: true })
    expect(parseSave(raw).items.find(i => i.id === 40)!.turned).toBe(true)
  })
})

describe('save version 32', () => {
  it('opens a v31 chain with no pets and the litter still to come', () => {
    const data = parseSave(structuredClone(v31))
    expect(data).toEqual(withNewKeys(v31))
    expect(data.pets).toEqual({ owned: [], nextId: 1, litter: false })
    expect(data.chain!.branches[0].pets).toEqual({ owned: [], nextId: 1, litter: true })
    const chain = Chain.fromSave(data, 8)
    expect(chain.main.litterDue()).toBe(true)
    expect(chain.toSave().v).toBe(SAVE_VERSION)
  })
  it('repairs a damaged pet book as it reads it', () => {
    const raw = structuredClone(v31) as unknown as { pets: unknown }
    raw.pets = { owned: [{ id: 2, breed: 'corgi', name: '  Bơ   nhỏ ' }, { id: 2, breed: 'mun', name: 'Mun' }, { id: 5, breed: 'hamster', name: 'X' }, { id: 7, breed: 'poodle', name: '   ' }], nextId: 1, litter: false }
    expect(parseSave(raw).pets).toEqual({ owned: [{ id: 2, breed: 'corgi', name: 'Bơ nhỏ' }, { id: 7, breed: 'poodle', name: 'Bông' }], nextId: 8, litter: false })
  })
  it('keeps the pets through a save, and a branch never has any', () => {
    const chain = Chain.fromSave(parseSave(structuredClone(v31)), 8)
    chain.main.takeLitter('chota', 'Ki')
    chain.main.adoptPet('xiem', 'Sữa')
    const back = Chain.fromSave(parseSave(JSON.parse(JSON.stringify(chain.toSave()))), 8)
    expect(back.main.pets).toEqual({ owned: [{ id: 1, breed: 'chota', name: 'Ki' }, { id: 2, breed: 'xiem', name: 'Sữa' }], nextId: 3, litter: true })
    expect(back.branches[0].pets).toEqual({ owned: [], nextId: 1, litter: true })
  })
})

describe('wall pieces and rugs in a saved shop', () => {
  it('opens a v35 shop with a mirror on the wall and a rug under a bed, the grid as without them', () => {
    const sim = open(v35)
    expect(sim.items.filter(i => i.kind === 'rattanMirror' || i.kind === 'brocadeRug').map(({ kind, x, y }) => ({ kind, x, y }))).toEqual([
      { kind: 'rattanMirror', x: 15, y: 1 },
      { kind: 'brocadeRug', x: 14, y: 2 },
    ])
    const bare = open({ ...v35, items: v35.items.filter(i => i.kind !== 'rattanMirror' && i.kind !== 'brocadeRug') })
    expect(sim.grid).toEqual(bare.grid)
  })
  it('keeps them through a save and a load', () => {
    const sim = open(v35)
    expect(viaJson(sim).items).toEqual(sim.items)
  })
})

describe('save version 36', () => {
  const draft: PostDraft = { kind: 'praise', name: 'Lan', face: null, tick: false, stars: 5, text: 'Spa xịn', pic: null, comments: [['A', 'Ngon']], complaint: null, boostable: true, notify: false }
  it('opens a v35 shop with every review id 0 and the feed an old shop would have', () => {
    const old = structuredClone(v35) as unknown as { reviews: number[]; day: number }
    old.reviews = [5, 4, 5]
    old.day = 20
    const sim = open(old)
    expect(sim.reviewIds).toEqual([0, 0, 0])
    expect(sim.feed).toEqual(seededFeed({ day: 20, rankStars: sim.rank.stars, idolsMet: IDOL_IDS.filter(id => sim.idol.idols[id].visits > 0).length, wins: sim.rank.wins }))
    expect(sim.feed.open).toBe(true)
  })
  it('writes the version and keeps the posts, the last read, the followers and the boosts through a save', () => {
    const sim = open(v35)
    openFeed(sim.feed)
    addPost(sim.feed, draft, 3, 100, createRng(1))
    addPost(sim.feed, draft, 3, 110, createRng(2))
    sim.feed.lastSeen = 1
    sim.feed.followers += 500
    sim.feed.boosts = [{ day: 3, tier: 'small', post: 2 }]
    expect(sim.toSave().v).toBe(SAVE_VERSION)
    const back = viaJson(sim)
    expect(back.feed).toEqual(sim.feed)
    expect(back.feed.posts).toHaveLength(2)
    expect([back.feed.lastSeen, back.feed.followers, back.feed.boosts]).toEqual([1, sim.feed.followers, [{ day: 3, tier: 'small', post: 2 }]])
  })
  it('repairs bad review ids by padding or trimming to the reviews', () => {
    const raw = (reviews: number[], reviewIds: unknown) => ({ ...structuredClone(v35), reviews, reviewIds })
    expect(parseSave(raw([5, 4, 3], [7, 8])).reviewIds).toEqual([0, 7, 8])
    expect(parseSave(raw([5, 4], [6, 7, 8])).reviewIds).toEqual([7, 8])
    expect(parseSave(raw([5, 4], 'x')).reviewIds).toEqual([0, 0])
    expect(parseSave(raw([5, 4], [1.5, 2])).reviewIds).toEqual([0, 0])
    expect(parseSave(raw([5, 4], [1, 2])).reviewIds).toEqual([1, 2])
  })
})
