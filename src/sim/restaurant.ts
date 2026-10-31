import { ARRIVE_MS, DINER_GAP_MIN, DINER_PEAK_FACTOR, DINER_PEAKS, DINER_TIP, DISH_PRICE, EAT_MS, EXIT_MS, FIRST_ARRIVAL_MS, OWNER_SPEED, PATIENCE_MS, REAL_MS_PER_GAME_MIN, STEP_MS, WALK_OVER_CHANCE, WALK_OVER_TILES } from '../config'
import { beautyOf, footprint, ITEMS, workTile, type Item, type ItemKind } from './items'
import { placementProblem, sellRefund, type BuildProblem } from './build'
import { drawKind, KINDS, type CustomerKind } from './customers'
import { DINING_START, diningSeats, diningShellGrid, type DiningSeat } from './dining'
import { arrivalGapMs, type Stars } from './economy'
import { besideSeat, buildGrid, isWalkable, manhattan, tileEq, tileOf, type Grid } from './grid'
import { NO_HOUSES, type Houses } from './layout'
import { findPath } from './path'
import { drawPhoTicket, type PhoTicket } from './pho'
import { randomLook, type Rng } from './rng'
import type { RestaurantSave } from './save'
import { moveAlong, type SpaSim } from './spa'
import type { Customer, Look, Mover, Tile } from './types'

/** What the restaurant takes from the spa: the purse, the clock, the day and the power cut. */
export type RestaurantHost = Pick<SpaSim, 'purse' | 'clock' | 'day' | 'powerOut'>

/** What the view hears from the restaurant; it grows with the diners and the cooking. */
export type RestaurantEvent =
  | { type: 'roomChanged' }
  /** A diner sat down with their ticket. */
  | { type: 'dinerArrived'; id: number }
  /** A walk-in found every chair taken and walked on. */
  | { type: 'dinerPassed' }
  | { type: 'dinerLeft'; id: number; angry: boolean }
  /** The owner stands at a stove with a diner's ticket: the Phở game opens. */
  | { type: 'cookReady'; dinerId: number; stoveId: number }
  | { type: 'dinerPaid'; dinerId: number; amount: number; tip: number; tile: Tile }
  | { type: 'toast'; key: 'stovesBusy' | 'powerWait' }

/** What the owner is doing for a diner: walking over to take the ticket, cooking at a stove, or carrying the bowl back. */
export type DiningTask = { kind: 'order'; dinerId: number } | { kind: 'cook'; dinerId: number; stoveId: number } | { kind: 'carry'; dinerId: number }

export type DinerState = 'street' | 'arriving' | 'toChair' | 'ordering' | 'waitingFood' | 'eating' | 'leaving' | 'exiting'
export type DishId = 'pho'

export interface Diner extends Mover {
  id: number
  look: Look
  kind: CustomerKind
  state: DinerState
  /** Time spent in the current state. */
  stateMs: number
  patienceMs: number
  patienceMaxMs: number
  /** The chair reserved for them, until they get up. */
  chair: Tile | null
  dish: DishId
  ticket: PhoTicket
  stars: Stars | null
  mood: 'happy' | 'ok' | 'angry' | null
  fromSpa: boolean
  /** The street leg's length; 0 for a walk-in. */
  legMs: number
}

export interface RestaurantStats {
  served: number
  income: number
  tips: number
  walkedAway: number
}

const emptyStats = (): RestaurantStats => ({ served: 0, income: 0, tips: 0, walkedAway: 0 })

/** The mean wait between walk-ins at `minutes` of the day: shorter in the lunch and dinner peaks. */
export function dinerGapMs(minutes: number): number {
  const base = DINER_GAP_MIN * REAL_MS_PER_GAME_MIN
  return DINER_PEAKS.some(([from, to]) => minutes >= from && minutes < to) ? base / DINER_PEAK_FACTOR : base
}

/** The restaurant beside the spa: its own room, grid, furniture and stream, paid from the spa's purse. */
export class RestaurantSim {
  items: Item[]
  grid: Grid
  readonly floors = 1
  readonly houses: Houses = NO_HOUSES
  owner: Mover & { task: DiningTask | null }
  /** The owner stands in this shop. */
  ownerIn = false
  /** A Phở game is open for this diner; the restaurant's clock stands still. */
  cookingDinerId: number | null = null
  stoves: { id: number; work: Tile; dinerId: number | null }[] = []
  private readonly host: RestaurantHost
  private readonly rng: Rng
  private readonly autoSpawn: boolean
  private shell: Grid | null = null
  private nextItemId: number
  private events: RestaurantEvent[] = []
  private untilDinerMs = FIRST_ARRIVAL_MS
  private waitToasted = false
  private nextDinerId = 1
  diners: Diner[] = []
  stats: RestaurantStats = emptyStats()
  /** True while the owner is at a branch: nobody new comes. */
  ownerAway = false

  constructor({ host, rng, autoSpawn }: { host: RestaurantHost; rng: Rng; autoSpawn: boolean }) {
    this.host = host
    this.rng = rng
    this.autoSpawn = autoSpawn
    this.items = DINING_START.map((it, i) => ({ ...it, id: i + 1 }))
    this.nextItemId = this.items.length + 1
    this.grid = buildGrid(this.shellGrid(), this.items, this.floors)
    this.owner = { pos: { ...this.grid.door }, facing: 'up', path: [], task: null }
    this.rebuildStoves()
  }

  /** The restaurant as plain JSON, a deep copy; where the owner stands in town is the street's to add. */
  toSave(): Omit<RestaurantSave, 'ownerAt'> {
    return structuredClone({
      items: this.items,
      nextItemId: this.nextItemId,
      houses: this.houses,
      floors: this.floors,
      diners: this.diners,
      nextDinerId: this.nextDinerId,
      untilArrivalMs: this.untilDinerMs,
      stats: this.stats,
      owner: this.owner,
      ownerIn: this.ownerIn,
      cookingDinerId: this.cookingDinerId,
    })
  }

  /**
   * Rebuilds a saved restaurant. Walkers still on the street are gone, uncounted. The owner is in only if `ownerAt` says so: with a task of hers still
   * standing she keeps her place (a bowl cooking is cooked again from the stove, its game reopening), else she stands at the door; and a diner whose bowl
   * is lost leaves.
   */
  static fromSave(data: RestaurantSave, options: { host: RestaurantHost; rng: Rng; autoSpawn: boolean }): RestaurantSim {
    const d = structuredClone(data)
    const r = new RestaurantSim(options)
    r.items = d.items
    r.nextItemId = d.nextItemId
    r.grid = buildGrid(r.shellGrid(), r.items, r.floors)
    r.rebuildStoves()
    r.diners = d.diners.filter(x => x.state !== 'street')
    r.nextDinerId = d.nextDinerId
    r.untilDinerMs = d.untilArrivalMs
    r.stats = d.stats
    r.ownerIn = d.ownerAt === 'restaurant'
    const task = d.owner.task
    const diner = task && r.diners.find(x => x.id === task.dinerId)
    const stove = task?.kind === 'cook' ? r.stoves.find(s => s.id === task.stoveId) : undefined
    const holds = r.ownerIn && task && diner && diner.state === (task.kind === 'order' ? 'ordering' : 'waitingFood') && (task.kind !== 'cook' || stove)
    if (holds) {
      r.owner = d.owner
      if (stove) stove.dinerId = diner.id
    }
    for (const x of [...r.diners]) if (x.state === 'waitingFood' && !(holds && task.dinerId === x.id)) r.startLeaving(x)
    return r
  }

  get money(): number {
    return this.host.purse.money
  }

  get day(): number {
    return this.host.day
  }

  /** The bare room, walls and door and stairs, parsed once. */
  shellGrid(): Grid {
    return (this.shell ??= diningShellGrid())
  }

  beauty(): number {
    return beautyOf(this.items)
  }

  canPlace(kind: ItemKind, x: number, y: number, flip: boolean, movingId?: number, turned = false): BuildProblem | null {
    const item = { id: movingId ?? this.nextItemId, kind, x, y, flip, ...(turned && { turned }) }
    return placementProblem('restaurant', this.shellGrid(), this.items, item, { door: this.grid.door, floors: this.floors })
  }

  buy(kind: ItemKind, x: number, y: number, flip: boolean, turned = false): BuildProblem | null {
    const price = ITEMS[kind].price
    if (this.money < price) return 'money'
    const problem = this.canPlace(kind, x, y, flip, undefined, turned)
    if (problem) return problem
    this.host.purse.money -= price
    this.items.push({ id: this.nextItemId++, kind, x, y, flip, ...(turned && { turned }) })
    this.changeRoom()
    return null
  }

  /** Free; the item keeps its id. */
  move(id: number, x: number, y: number, flip: boolean, turned = false): BuildProblem | null {
    const item = this.itemById(id)
    if (this.isBusy(id)) return 'busy'
    const problem = this.canPlace(item.kind, x, y, flip, id, turned)
    if (problem) return problem
    Object.assign(item, { x, y, flip })
    if (turned) item.turned = true
    else delete item.turned
    this.changeRoom()
    return null
  }

  /** Refunds half the price; the restaurant always keeps one stove, one table and one chair. */
  sell(id: number): BuildProblem | null {
    const { kind } = this.itemById(id)
    if (this.isBusy(id)) return 'busy'
    if ((kind === 'stove' || kind === 'diningTable' || kind === 'diningChair') && this.items.filter(i => i.kind === kind).length === 1) return 'lastDining'
    this.host.purse.money += sellRefund(kind)
    this.items = this.items.filter(i => i.id !== id)
    this.changeRoom()
    return null
  }

  /** A stove with a diner's dish on it, a chair a diner holds, or a table with a diner at any of its chairs. */
  isBusy(id: number): boolean {
    const item = this.itemById(id)
    if (item.kind === 'stove') return this.stoves.some(s => s.id === id && s.dinerId !== null)
    if (item.kind === 'diningChair') return this.diners.some(d => d.chair && tileEq(d.chair, item))
    if (item.kind === 'diningTable') return this.diners.some(d => d.chair && footprint(item).some(t => manhattan(t, d.chair!) === 1))
    return false
  }

  /** Runs `ms` of game time in STEP_MS steps; returns the ms it stepped. It stands still while a Phở game is open. */
  advance(ms: number): number {
    let ran = 0
    for (let left = ms; left > 0 && this.cookingDinerId === null; left -= STEP_MS) {
      const dt = Math.min(STEP_MS, left)
      this.step(dt)
      ran += dt
    }
    return ran
  }

  /** The chairs at a table that no diner holds. */
  freeSeats(): DiningSeat[] {
    return diningSeats(this.items).filter(s => !this.diners.some(d => d.chair && tileEq(d.chair, s.tile)))
  }

  /** The dishes the kitchen can make now: Phở while there is a stove. */
  sellableDishes(): DishId[] {
    return this.items.some(i => i.kind === 'stove') ? ['pho'] : []
  }

  /** Test hook: a diner at the door now, whatever the timer says; null when every chair is taken. */
  spawnDiner(opts: { kind?: CustomerKind; look?: Look } = {}): Diner | null {
    const seat = this.freeSeats()[0]
    if (!seat) return null
    const look = opts.look ?? randomLook(this.rng)
    const kind = opts.kind ?? drawKind(this.day, this.rng)
    return this.addDiner(look, kind, seat, false)
  }

  /** A paying spa customer may walk over to eat: true when a diner is now on the street. */
  walkOver(c: Customer): boolean {
    if (c.mood !== 'happy' && c.mood !== 'ok') return false
    if (c.vip || c.idol || c.kol) return false
    if (this.ownerAway || this.host.clock.isClosed) return false
    const seat = this.freeSeats()[0]
    if (!seat || this.sellableDishes().length === 0) return false
    if (this.rng() >= WALK_OVER_CHANCE) return false
    this.addDiner({ ...c.look }, c.kind, seat, true)
    return true
  }

  /** Anyone is in the restaurant, or a Phở game is open. */
  busy(): boolean {
    return this.diners.length > 0 || this.cookingDinerId !== null
  }

  /** Everyone goes at once, the chairs and stoves are free and the owner has nothing to do. */
  clearOut(): void {
    this.diners = []
    this.cookingDinerId = null
    for (const s of this.stoves) s.dinerId = null
    this.owner.task = null
    this.owner.path = []
  }

  startDay(): void {
    this.stats = emptyStats()
    this.clearOut()
    this.untilDinerMs = FIRST_ARRIVAL_MS
  }

  /** The owner is back: at the door, with nothing to do. */
  ownerArrives(): void {
    this.owner = { pos: { ...this.grid.door }, facing: 'up', path: [], task: null }
    this.ownerIn = true
  }

  /** The owner is gone from this shop; only called when no task is held. */
  ownerLeaves(): void {
    this.owner.task = null
    this.owner.path = []
    this.ownerIn = false
  }

  /** Sends the owner to the door unless work is held. */
  ownerWalksOut(): boolean {
    if (this.ownerBusy()) return false
    this.owner.path = this.walkTo(this.owner, t => tileEq(t, this.grid.door)) ?? []
    return true
  }

  ownerAtDoor(): boolean {
    return this.ownerIn && this.owner.path.length === 0 && tileEq(tileOf(this.owner.pos), this.grid.door)
  }

  ownerBusy(): boolean {
    return this.owner.task !== null || this.cookingDinerId !== null
  }

  /** The owner goes to a branch: the dish being carried is served at once, everyone who waits for the owner leaves quietly. */
  leaveTown(): void {
    this.ownerAway = true
    this.ownerIn = false
    this.cookingDinerId = null
    const carried = this.owner.task?.kind === 'carry' ? this.owner.task.dinerId : null
    this.owner.task = null
    this.owner.path = []
    for (const s of this.stoves) s.dinerId = null
    for (const d of [...this.diners]) {
      if (d.id === carried) this.setState(d, 'eating')
      else if (d.state === 'street') this.diners = this.diners.filter(x => x !== d)
      else if (d.state !== 'eating' && d.state !== 'leaving' && d.state !== 'exiting') this.startLeaving(d)
    }
  }

  /** A tap on the floor: take a waiting diner's ticket, or walk to a tile. */
  tapTile(t: Tile): void {
    if (!this.ownerIn || this.ownerBusy()) return
    const diner = this.diners.find(d => d.state === 'ordering' && d.chair && tileEq(d.chair, t))
    if (diner) {
      if (this.host.powerOut()) {
        this.events.push({ type: 'toast', key: 'powerWait' })
        return
      }
      if (!this.stoves.some(s => s.dinerId === null)) {
        this.events.push({ type: 'toast', key: 'stovesBusy' })
        return
      }
      const path = this.walkTo(this.owner, besideSeat(this.grid, diner.chair!))
      if (!path) return
      this.owner.task = { kind: 'order', dinerId: diner.id }
      this.owner.path = path
      return
    }
    if (!isWalkable(this.grid, t)) return
    const path = this.walkTo(this.owner, x => tileEq(x, t))
    if (!path) return
    this.owner.path = path
  }

  /** The Phở game ended with these stars: the owner carries the bowl to the diner. */
  completeCooking(dinerId: number, stars: Stars): void {
    const diner = this.diners.find(d => d.id === dinerId)
    if (this.cookingDinerId !== dinerId || !diner?.chair) return
    this.cookingDinerId = null
    for (const s of this.stoves) if (s.dinerId === dinerId) s.dinerId = null
    diner.stars = stars
    this.owner.task = { kind: 'carry', dinerId }
    this.owner.path = this.walkTo(this.owner, besideSeat(this.grid, diner.chair)) ?? []
  }

  drainEvents(): RestaurantEvent[] {
    const out = this.events
    this.events = []
    return out
  }

  private itemById(id: number): Item {
    const item = this.items.find(i => i.id === id)
    if (!item) throw new Error(`No item ${id}`)
    return item
  }

  private step(dt: number): void {
    this.updateOwner(dt)
    for (const d of [...this.diners]) this.updateDiner(d, dt)
    if (this.autoSpawn && !this.ownerAway && !this.host.clock.isClosed) {
      this.untilDinerMs -= dt
      if (this.untilDinerMs <= 0) {
        this.untilDinerMs = arrivalGapMs(dinerGapMs(this.host.clock.minutes), this.rng())
        const seat = this.freeSeats()[0]
        if (seat) this.spawnDiner()
        else this.events.push({ type: 'dinerPassed' })
      }
    }
  }

  /** A diner for `seat`: on the street for the walk over, else at the door; the ticket is drawn last. */
  private addDiner(look: Look, kind: CustomerKind, seat: DiningSeat, fromSpa: boolean): Diner {
    const patience = Math.round(PATIENCE_MS * KINDS[kind].patience)
    const d: Diner = {
      id: this.nextDinerId++,
      look,
      kind,
      state: fromSpa ? 'street' : 'arriving',
      stateMs: 0,
      pos: { ...this.grid.door },
      facing: 'up',
      path: [],
      patienceMs: patience,
      patienceMaxMs: patience,
      chair: { ...seat.tile },
      dish: 'pho',
      ticket: drawPhoTicket(this.rng, KINDS[kind].hard),
      stars: null,
      mood: null,
      fromSpa,
      legMs: fromSpa ? (WALK_OVER_TILES / KINDS[kind].speed) * 1000 : 0,
    }
    this.diners.push(d)
    return d
  }

  private setState(d: Diner, state: DinerState): void {
    d.state = state
    d.stateMs = 0
  }

  private updateDiner(d: Diner, dt: number): void {
    d.stateMs += dt
    switch (d.state) {
      case 'street':
        if (d.stateMs >= d.legMs) this.setState(d, 'arriving')
        break
      case 'arriving':
        if (d.stateMs >= ARRIVE_MS) {
          d.path = this.walkTo(d, t => d.chair !== null && tileEq(t, d.chair)) ?? []
          this.setState(d, 'toChair')
        }
        break
      case 'toChair':
        moveAlong(d, KINDS[d.kind].speed, dt)
        if (d.path.length === 0) {
          const seat = diningSeats(this.items).find(s => d.chair && tileEq(s.tile, d.chair))
          if (seat) d.facing = seat.facing
          this.setState(d, 'ordering')
          this.events.push({ type: 'dinerArrived', id: d.id })
        }
        break
      case 'ordering':
        // nobody loses patience while the power is out
        if (!this.host.powerOut()) d.patienceMs -= dt
        if (d.patienceMs <= 0) {
          d.mood = 'angry'
          this.stats.walkedAway++
          this.events.push({ type: 'dinerLeft', id: d.id, angry: true })
          this.startLeaving(d)
        }
        break
      case 'eating':
        if (d.stateMs >= EAT_MS) this.pay(d)
        break
      case 'leaving':
        moveAlong(d, KINDS[d.kind].speed, dt)
        if (d.path.length === 0) this.setState(d, 'exiting')
        break
      case 'exiting':
        if (d.stateMs >= EXIT_MS) this.diners = this.diners.filter(x => x !== d)
        break
    }
  }

  /** The diner pays at the table for the dish and the tip the stars earn, then leaves. */
  private pay(d: Diner): void {
    const stars = d.stars ?? 1
    const amount = DISH_PRICE[d.dish]
    const tip = DINER_TIP[stars]
    this.host.purse.money += amount + tip
    this.stats.served++
    this.stats.income += amount
    this.stats.tips += tip
    d.mood = stars >= 2 ? 'happy' : 'ok'
    this.events.push({ type: 'dinerPaid', dinerId: d.id, amount, tip, tile: { ...d.chair! } })
    this.startLeaving(d)
  }

  private updateOwner(dt: number): void {
    if (!this.ownerIn) return
    moveAlong(this.owner, OWNER_SPEED, dt)
    const task = this.owner.task
    if (!task) return
    const diner = this.diners.find(d => d.id === task.dinerId)
    if (diner?.state !== (task.kind === 'order' ? 'ordering' : 'waitingFood')) {
      this.dropTask()
      return
    }
    if (this.owner.path.length > 0) return
    if (task.kind === 'order') {
      const stove = this.stoves.find(s => s.dinerId === null)
      const path = stove && this.walkTo(this.owner, t => tileEq(t, stove.work))
      if (!stove || !path) {
        this.events.push({ type: 'toast', key: 'stovesBusy' })
        this.owner.task = null
        return
      }
      stove.dinerId = diner.id
      this.setState(diner, 'waitingFood')
      this.waitToasted = false
      this.owner.task = { kind: 'cook', dinerId: diner.id, stoveId: stove.id }
      this.owner.path = path
    } else if (task.kind === 'cook') {
      if (this.host.powerOut()) {
        if (!this.waitToasted) this.events.push({ type: 'toast', key: 'powerWait' })
        this.waitToasted = true
        return
      }
      this.cookingDinerId = diner.id
      this.events.push({ type: 'cookReady', dinerId: diner.id, stoveId: task.stoveId })
    } else {
      this.owner.task = null
      this.setState(diner, 'eating')
    }
  }

  /** The diner the owner works for is gone: the owner stops, and the stove is free. */
  private dropTask(): void {
    this.owner.task = null
    this.owner.path = []
    for (const s of this.stoves) if (s.dinerId !== null && !this.diners.some(d => d.id === s.dinerId && d.state === 'waitingFood')) s.dinerId = null
  }

  /** Frees the chair and sends the diner to the door. */
  private startLeaving(d: Diner): void {
    for (const s of this.stoves) if (s.dinerId === d.id) s.dinerId = null
    d.chair = null
    d.path = this.walkTo(d, t => tileEq(t, this.grid.door)) ?? []
    this.setState(d, 'leaving')
  }

  /** A walk from where `m` is now to the nearest tile that passes `isGoal`, or null; someone caught between two tiles steps back onto the first first. */
  private walkTo(m: Mover, isGoal: (t: Tile) => boolean): Tile[] | null {
    const from = tileOf(m.pos)
    const route = findPath(this.grid, from, isGoal)
    if (!route) return null
    return tileEq(from, m.pos) ? route : [from, ...route]
  }

  private rebuildStoves(): void {
    const held = new Map(this.stoves.map(s => [s.id, s.dinerId]))
    this.stoves = this.items.filter(i => i.kind === 'stove').map(i => ({ id: i.id, work: workTile(i)!, dinerId: held.get(i.id) ?? null }))
  }

  /** New furniture may block a walk: whoever is walking finds a new way to the same goal, from the tile they stand on. */
  private changeRoom(): void {
    this.grid = buildGrid(this.shellGrid(), this.items, this.floors)
    this.rebuildStoves()
    for (const m of [this.owner, ...this.diners]) {
      const goal = m.path[m.path.length - 1]
      if (goal) m.path = this.walkTo(m, t => tileEq(t, goal)) ?? []
    }
    this.events.push({ type: 'roomChanged' })
  }
}
