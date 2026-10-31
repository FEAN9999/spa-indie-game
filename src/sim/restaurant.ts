import { ARRIVE_MS, DINER_GAP_MIN, DINER_PEAK_FACTOR, DINER_PEAKS, EXIT_MS, FIRST_ARRIVAL_MS, PATIENCE_MS, REAL_MS_PER_GAME_MIN, STEP_MS, WALK_OVER_CHANCE, WALK_OVER_TILES } from '../config'
import { beautyOf, ITEMS, type Item, type ItemKind } from './items'
import { placementProblem, sellRefund, type BuildProblem } from './build'
import { drawKind, KINDS, type CustomerKind } from './customers'
import { DINING_SHELL, DINING_START, diningSeats, type DiningSeat } from './dining'
import { arrivalGapMs, type Stars } from './economy'
import { buildGrid, parseLayout, tileEq, tileOf, type Grid } from './grid'
import { towerOf } from './floors'
import { NO_HOUSES, widen, withHouses, type Houses } from './layout'
import { findPath } from './path'
import { drawPhoTicket, type PhoTicket } from './pho'
import { randomLook, type Rng } from './rng'
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
  private readonly host: RestaurantHost
  private readonly rng: Rng
  private readonly autoSpawn: boolean
  private shell: Grid | null = null
  private nextItemId: number
  private events: RestaurantEvent[] = []
  private untilDinerMs = FIRST_ARRIVAL_MS
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
  }

  get money(): number {
    return this.host.purse.money
  }

  get day(): number {
    return this.host.day
  }

  /** The bare room, walls and door and stairs, parsed once. */
  shellGrid(): Grid {
    return (this.shell ??= parseLayout(towerOf(withHouses(widen(DINING_SHELL), NO_HOUSES))))
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

  /** Nobody uses a piece yet; the owner's cooking and the diners fill this in. */
  isBusy(id: number): boolean {
    this.itemById(id)
    return false
  }

  /** Runs `ms` of game time in STEP_MS steps; returns the ms it stepped. */
  advance(ms: number): number {
    let ran = 0
    for (let left = ms; left > 0; left -= STEP_MS) {
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

  /** Anyone is in the restaurant. */
  busy(): boolean {
    return this.diners.length > 0
  }

  /** Everyone goes at once and the chairs are free. */
  clearOut(): void {
    this.diners = []
  }

  startDay(): void {
    this.stats = emptyStats()
    this.diners = []
    this.untilDinerMs = FIRST_ARRIVAL_MS
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
      case 'leaving':
        moveAlong(d, KINDS[d.kind].speed, dt)
        if (d.path.length === 0) this.setState(d, 'exiting')
        break
      case 'exiting':
        if (d.stateMs >= EXIT_MS) this.diners = this.diners.filter(x => x !== d)
        break
    }
  }

  /** Frees the chair and sends the diner to the door. */
  private startLeaving(d: Diner): void {
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

  private changeRoom(): void {
    this.grid = buildGrid(this.shellGrid(), this.items, this.floors)
    this.events.push({ type: 'roomChanged' })
  }
}
