import {
  ANGRY_REVIEW,
  ARRIVAL_JITTER,
  ARRIVE_MS,
  CUSTOMER_SPEED,
  EXIT_MS,
  FIRST_ARRIVAL_MS,
  MAX_FRAME_MS,
  OWNER_SPEED,
  OWNER_START,
  PATIENCE_MS,
  SHAMPOO_PRICE,
  STARTING_MONEY,
  STEP_MS,
} from '../config'
import { DayClock } from './clock'
import { arrivalIntervalMs, rating as ratingOf, reviewScore, tipFor, type Stars } from './economy'
import { isWalkable, manhattan, parseLayout, tileEq, type Grid } from './grid'
import { SPA_LAYOUT_1A } from './layout'
import { findPath } from './path'
import { randomLook, type Rng } from './rng'
import type { Customer, CustomerState, DayStats, Facing, Owner, Seat, SimEvent, Station, Tile, Vec } from './types'

interface Mover {
  pos: Vec
  facing: Facing
  path: Tile[]
}

const emptyStats = (): DayStats => ({ served: 0, angry: 0, walkedAway: 0, income: 0, tips: 0 })
const tileOf = (pos: Vec): Tile => ({ x: Math.round(pos.x), y: Math.round(pos.y) })

/** Moves along the path at `speed` tiles per second; facing follows the movement. */
function moveAlong(m: Mover, speed: number, dtMs: number): void {
  let budget = (speed * dtMs) / 1000
  while (budget > 0 && m.path.length > 0) {
    const target = m.path[0]
    const dx = target.x - m.pos.x
    const dy = target.y - m.pos.y
    const dist = Math.hypot(dx, dy)
    if (dist > 0) m.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'
    if (dist <= budget) {
      m.pos = { x: target.x, y: target.y }
      m.path.shift()
      budget -= dist
    } else {
      m.pos = { x: m.pos.x + (dx / dist) * budget, y: m.pos.y + (dy / dist) * budget }
      budget = 0
    }
  }
}

export interface SpaSimOptions {
  rng: Rng
  layout?: string[]
  autoSpawn?: boolean
}

export class SpaSim {
  readonly grid: Grid
  owner: Owner
  customers: Customer[] = []
  stations: Station[]
  seats: Seat[]
  money = STARTING_MONEY
  reviews: number[] = []
  clock = new DayClock()
  day = 1
  stats: DayStats = emptyStats()
  paused = false
  servingCustomerId: number | null = null
  dayOver = false

  private readonly rng: Rng
  private readonly autoSpawn: boolean
  private events: SimEvent[] = []
  private nextId = 1
  private untilArrivalMs = FIRST_ARRIVAL_MS

  constructor({ rng, layout = SPA_LAYOUT_1A, autoSpawn = true }: SpaSimOptions) {
    this.rng = rng
    this.autoSpawn = autoSpawn
    this.grid = parseLayout(layout)
    this.stations = this.grid.chairs.map((chair, id) => {
      const work = { x: chair.x, y: chair.y + 1 }
      if (!this.grid.works.some(w => tileEq(w, work))) throw new Error(`Chair at ${chair.x},${chair.y} has no work tile below it`)
      return { id, chair, work, customerId: null }
    })
    this.seats = this.grid.seats.map(tile => ({ tile, customerId: null }))
    this.owner = { pos: { ...OWNER_START }, facing: 'down', path: [], task: null }
  }

  advance(ms: number): void {
    for (let left = ms; left > 0; left -= STEP_MS) this.step(Math.min(STEP_MS, left))
  }

  /** Per-frame entry point; a huge delta (phone was locked) is clamped. */
  update(dtMs: number): void {
    this.advance(Math.min(dtMs, MAX_FRAME_MS))
  }

  spawnCustomer(): Customer {
    const c: Customer = {
      id: this.nextId++,
      look: randomLook(this.rng),
      state: 'arriving',
      stateMs: 0,
      pos: { ...this.grid.door },
      facing: 'up',
      path: [],
      patienceMs: PATIENCE_MS,
      seat: null,
      stationId: null,
      mood: null,
    }
    this.customers.push(c)
    this.emit({ type: 'customerArrived', id: c.id })
    return c
  }

  ownerTile(): Tile {
    return tileOf(this.owner.pos)
  }

  /** A tap on the shop floor: fetch the waiting customer sitting there, or walk there. */
  tapTile(t: Tile): void {
    if (this.paused || this.dayOver || this.servingCustomerId !== null || this.owner.task?.kind === 'serve') return
    const from = this.ownerTile()

    const waiting = this.customers.find(c => c.state === 'waiting' && c.seat && tileEq(c.seat, t))
    if (waiting) {
      const seat = waiting.seat!
      const path = findPath(this.grid, from, x => isWalkable(this.grid, x) && manhattan(x, seat) === 1)
      if (!path) return
      this.owner.task = { kind: 'fetch', customerId: waiting.id }
      this.owner.path = path
      return
    }

    if (!isWalkable(this.grid, t)) return
    const path = findPath(this.grid, from, x => tileEq(x, t))
    if (!path) return
    this.owner.task = null
    this.owner.path = path
  }

  completeService(customerId: number, stars: Stars): void {
    const c = this.customers.find(x => x.id === customerId)
    if (!c || c.state !== 'inService' || c.stationId === null) return
    const station = this.stations[c.stationId]
    const tip = tipFor(SHAMPOO_PRICE, stars)
    this.money += SHAMPOO_PRICE + tip
    this.stats.income += SHAMPOO_PRICE
    this.stats.tips += tip
    this.stats.served++
    this.emit({ type: 'paid', customerId, amount: SHAMPOO_PRICE, tip, tile: station.chair })
    this.addReview(customerId, reviewScore(stars))
    c.mood = stars >= 2 ? 'happy' : 'ok'
    station.customerId = null
    c.stationId = null
    this.servingCustomerId = null
    this.owner.task = null
    this.startLeaving(c)
  }

  rating(): number | null {
    return ratingOf(this.reviews)
  }

  drainEvents(): SimEvent[] {
    const out = this.events
    this.events = []
    return out
  }

  startDay(): void {
    this.day++
    this.clock.reset()
    this.stats = emptyStats()
    this.dayOver = false
    this.untilArrivalMs = FIRST_ARRIVAL_MS
  }

  private step(dt: number): void {
    if (this.paused || this.dayOver || this.servingCustomerId !== null) return
    this.clock.advance(dt)

    if (this.autoSpawn && !this.clock.isClosed) {
      this.untilArrivalMs -= dt
      if (this.untilArrivalMs <= 0) {
        this.spawnCustomer()
        const [lo, hi] = ARRIVAL_JITTER
        this.untilArrivalMs = arrivalIntervalMs(this.rating()) * (lo + (hi - lo) * this.rng())
      }
    }

    moveAlong(this.owner, OWNER_SPEED, dt)
    for (const c of [...this.customers]) this.updateCustomer(c, dt)
    this.updateOwnerTask()

    if (this.clock.isClosed && this.customers.length === 0 && this.servingCustomerId === null) {
      this.dayOver = true
      this.emit({ type: 'dayEnded', stats: { ...this.stats } })
    }
  }

  private updateCustomer(c: Customer, dt: number): void {
    c.stateMs += dt
    switch (c.state) {
      case 'arriving':
        if (c.stateMs >= ARRIVE_MS) this.seatCustomer(c)
        break
      case 'toSeat':
        moveAlong(c, CUSTOMER_SPEED, dt)
        if (c.path.length === 0) this.setState(c, 'waiting')
        break
      case 'waiting':
        c.patienceMs -= dt
        if (c.patienceMs <= 0) this.loseCustomer(c)
        break
      case 'toStation':
        moveAlong(c, CUSTOMER_SPEED, dt)
        break
      case 'leaving':
        moveAlong(c, CUSTOMER_SPEED, dt)
        if (c.path.length === 0) this.setState(c, 'exiting')
        break
      case 'exiting':
        if (c.stateMs >= EXIT_MS) {
          this.customers = this.customers.filter(x => x !== c)
          this.emit({ type: 'customerLeft', id: c.id, angry: c.mood === 'angry' })
        }
        break
    }
  }

  private updateOwnerTask(): void {
    const task = this.owner.task
    if (!task || this.owner.path.length > 0) return
    const c = this.customers.find(x => x.id === task.customerId)

    if (task.kind === 'fetch') {
      if (!c || c.state !== 'waiting') {
        this.owner.task = null
        return
      }
      const station = this.stations.find(s => s.customerId === null)
      if (!station) {
        this.emit({ type: 'toast', key: 'stationsBusy' })
        this.owner.task = null
        return
      }
      station.customerId = c.id
      c.stationId = station.id
      this.freeSeat(c)
      c.path = findPath(this.grid, tileOf(c.pos), t => tileEq(t, station.chair)) ?? []
      this.setState(c, 'toStation')
      this.owner.path = findPath(this.grid, this.ownerTile(), t => tileEq(t, station.work)) ?? []
      this.owner.task = { kind: 'serve', customerId: c.id, stationId: station.id }
      return
    }

    // serve: wait until the customer has also reached the chair
    if (c && c.state === 'toStation' && c.path.length === 0) {
      this.setState(c, 'inService')
      this.servingCustomerId = c.id
      this.emit({ type: 'serviceReady', customerId: c.id, stationId: task.stationId })
    }
  }

  private seatCustomer(c: Customer): void {
    const seat = this.seats.find(s => s.customerId === null)
    if (!seat) {
      this.emit({ type: 'noSeat', id: c.id })
      this.stats.walkedAway++
      this.startLeaving(c)
      return
    }
    seat.customerId = c.id
    c.seat = seat.tile
    c.path = findPath(this.grid, tileOf(c.pos), t => tileEq(t, seat.tile)) ?? []
    this.setState(c, 'toSeat')
  }

  private loseCustomer(c: Customer): void {
    this.freeSeat(c)
    c.mood = 'angry'
    this.addReview(c.id, ANGRY_REVIEW)
    this.stats.angry++
    this.startLeaving(c)
  }

  private freeSeat(c: Customer): void {
    for (const s of this.seats) if (s.customerId === c.id) s.customerId = null
    c.seat = null
  }

  private startLeaving(c: Customer): void {
    c.path = findPath(this.grid, tileOf(c.pos), t => tileEq(t, this.grid.door)) ?? []
    this.setState(c, 'leaving')
  }

  private addReview(customerId: number, score: number): void {
    this.reviews.push(score)
    this.emit({ type: 'review', customerId, score })
  }

  private setState(c: Customer, state: CustomerState): void {
    c.state = state
    c.stateMs = 0
  }

  private emit(e: SimEvent): void {
    this.events.push(e)
  }
}
