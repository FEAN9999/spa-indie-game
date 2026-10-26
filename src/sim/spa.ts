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
  RATING_WINDOW,
  SHAMPOO_PRICE,
  STARTING_MONEY,
  STEP_MS,
} from '../config'
import { t } from '../strings/vi'
import { doorReach, flood, offFloor, placeProblem, type BuildProblem } from './build'
import { DayClock } from './clock'
import { arrivalIntervalMs, beautyArrivalFactor, dayEase, rating as ratingOf, reviewScore, tipFor, type Stars } from './economy'
import { bedSlotAt, buildGrid, isWalkable, manhattan, parseLayout, tileEq, type Grid } from './grid'
import { ITEMS, beautyOf, itemsFromLayout, seatTiles, shellOf, workTile, type Item, type ItemKind } from './items'
import { SPA_LAYOUT_1A } from './layout'
import { findPath } from './path'
import { cleanShopName, DEFAULT_OWNER_LOOK } from './profile'
import { randomLook, type Rng } from './rng'
import { SAVE_VERSION, SaveError, type SaveData } from './save'
import type { Customer, CustomerState, DayStats, Facing, HintId, Look, Owner, Seat, SimEvent, Station, Tile, Vec } from './types'

interface Mover {
  pos: Vec
  facing: Facing
  path: Tile[]
}

/** Customers on their way somewhere or sitting; a build change may put furniture in their way. */
const ON_FOOT: CustomerState[] = ['toSeat', 'waiting', 'toStation', 'leaving']

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
  grid!: Grid
  /** The furniture; the grid, the stations and the seats are built from it. */
  items: Item[]
  owner: Owner
  customers: Customer[] = []
  stations: Station[] = []
  seats: Seat[] = []
  money = STARTING_MONEY
  reviews: number[] = []
  clock = new DayClock()
  day = 1
  stats: DayStats = emptyStats()
  paused = false
  servingCustomerId: number | null = null
  dayOver = false
  shopName = t('defaultShopName')
  ownerLook: Look = { ...DEFAULT_OWNER_LOOK }
  profileDone = false
  hints: HintId[] = []

  private readonly rng: Rng
  private readonly autoSpawn: boolean
  /** The layout without its furniture: walls, door, screen and desk. */
  private shell: string[]
  private nextItemId: number
  private events: SimEvent[] = []
  private nextId = 1
  private untilArrivalMs = FIRST_ARRIVAL_MS

  constructor({ rng, layout = SPA_LAYOUT_1A, autoSpawn = true }: SpaSimOptions) {
    this.rng = rng
    this.autoSpawn = autoSpawn
    this.shell = shellOf(layout)
    this.items = itemsFromLayout(layout)
    this.nextItemId = this.items.length + 1
    this.rebuildRoom()
    this.owner = { pos: { ...OWNER_START }, facing: 'down', path: [], task: null }
  }

  advance(ms: number): void {
    for (let left = ms; left > 0; left -= STEP_MS) this.step(Math.min(STEP_MS, left))
  }

  /** Per-frame entry point; a huge delta (phone was locked) is clamped. */
  update(dtMs: number): void {
    this.advance(Math.min(dtMs, MAX_FRAME_MS))
  }

  /** The owner's look and the shop's name, chosen when the shop is made. */
  setProfile(look: Look, name: string): void {
    this.ownerLook = { ...look }
    this.shopName = cleanShopName(name, this.shopName)
    this.profileDone = true
  }

  hintDone(id: HintId): boolean {
    return this.hints.includes(id)
  }

  markHint(id: HintId): void {
    if (!this.hints.includes(id)) this.hints.push(id)
  }

  spawnCustomer(): Customer {
    const patience = Math.round(PATIENCE_MS * dayEase(this.day).patience)
    const c: Customer = {
      id: this.nextId++,
      look: randomLook(this.rng),
      state: 'arriving',
      stateMs: 0,
      pos: { ...this.grid.door },
      facing: 'up',
      path: [],
      patienceMs: patience,
      patienceMaxMs: patience,
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

  /** A tap on the shop floor: fetch the waiting customer sitting there, offer a bed on an open bed slot, or walk there. */
  tapTile(t: Tile): void {
    if (this.paused || this.dayOver || this.servingCustomerId !== null || this.owner.task?.kind === 'serve') return
    const from = this.ownerTile()

    const waiting = this.customers.find(c => c.state === 'waiting' && c.seat && tileEq(c.seat, t))
    if (waiting) {
      const seat = waiting.seat!
      const path = findPath(this.grid, from, x => isWalkable(this.grid, x) && manhattan(x, seat) === 1)
      if (!path) return
      this.owner.task = { kind: 'fetch', customerId: waiting.id }
      this.markHint('tapCustomer')
      this.owner.path = path
      return
    }

    const slot = bedSlotAt(this.grid, t)
    if (slot && this.canPlace('bed', slot.x, slot.y, false) === null) {
      this.emit({ type: 'bedSlot', slot: { ...slot } })
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
    const station = c && this.stations.find(s => s.id === c.stationId)
    if (!c || c.state !== 'inService' || !station) return
    const tip = tipFor(SHAMPOO_PRICE, stars)
    this.money += SHAMPOO_PRICE + tip
    this.stats.income += SHAMPOO_PRICE
    this.stats.tips += tip
    this.stats.served++
    this.emit({ type: 'paid', customerId, amount: SHAMPOO_PRICE, tip, tile: station.bed })
    this.addReview(customerId, reviewScore(stars))
    c.mood = stars >= 2 ? 'happy' : 'ok'
    station.customerId = null
    c.stationId = null
    this.servingCustomerId = null
    this.owner.task = null
    this.startLeaving(c)
  }

  beauty(): number {
    return beautyOf(this.items)
  }

  rating(): number | null {
    return ratingOf(this.reviews)
  }

  drainEvents(): SimEvent[] {
    const out = this.events
    this.events = []
    return out
  }

  /** The whole shop as plain JSON; a deep copy. */
  toSave(): SaveData {
    return structuredClone({
      v: SAVE_VERSION,
      day: this.day,
      minutes: this.clock.minutes,
      money: this.money,
      reviews: this.reviews.slice(-RATING_WINDOW),
      stats: this.stats,
      dayOver: this.dayOver,
      servingCustomerId: this.servingCustomerId,
      owner: this.owner,
      customers: this.customers,
      items: this.items,
      nextItemId: this.nextItemId,
      nextId: this.nextId,
      untilArrivalMs: this.untilArrivalMs,
      shopName: this.shopName,
      ownerLook: this.ownerLook,
      profileDone: this.profileDone,
      hints: this.hints,
    })
  }

  /** Rebuilds a saved shop, unpaused; re-announces a pending service or an ended day so the view reopens it. */
  static fromSave(data: SaveData, options: SpaSimOptions): SpaSim {
    const sim = new SpaSim(options)
    const d = structuredClone(data)
    // furniture off the grid or on a wall, the door, the screen or the desk cannot be laid out; overlaps and paths are not checked here
    const shell = parseLayout(sim.shell)
    const stray = d.items.find(i => offFloor(shell, i))
    if (stray) throw new SaveError(`item ${stray.id} is off the floor`)
    sim.items = d.items
    // never hand out an id a damaged save already uses
    sim.nextItemId = Math.max(d.nextItemId, ...d.items.map(i => i.id + 1))
    sim.rebuildRoom()
    sim.day = d.day
    sim.clock.minutes = d.minutes
    sim.money = d.money
    sim.reviews = d.reviews
    sim.stats = d.stats
    sim.dayOver = d.dayOver
    sim.servingCustomerId = d.servingCustomerId
    sim.owner = d.owner
    sim.customers = d.customers
    for (const c of sim.customers) {
      if (c.stationId !== null) {
        const station = sim.stations.find(s => s.id === c.stationId)
        if (!station) throw new SaveError(`customer ${c.id} is on item ${c.stationId}, which is not a bed`)
        station.customerId = c.id
      }
      const seat = c.seat && sim.seats.find(s => tileEq(s.tile, c.seat!))
      if (seat) seat.customerId = c.id
    }
    sim.nextId = d.nextId
    sim.untilArrivalMs = d.untilArrivalMs
    sim.shopName = d.shopName
    sim.ownerLook = d.ownerLook
    sim.profileDone = d.profileDone
    sim.hints = d.hints

    const serving = sim.customers.find(c => c.id === d.servingCustomerId)
    if (serving && serving.stationId !== null) sim.emit({ type: 'serviceReady', customerId: serving.id, stationId: serving.stationId })
    if (sim.dayOver) sim.emit({ type: 'dayEnded', stats: { ...sim.stats } })
    return sim
  }

  startDay(): void {
    this.day++
    this.clock.reset()
    this.stats = emptyStats()
    this.dayOver = false
    this.untilArrivalMs = FIRST_ARRIVAL_MS
    // spec 7.3: each day starts with the owner behind the reception desk
    this.owner = { pos: { ...OWNER_START }, facing: 'down', path: [], task: null }
  }

  /** What stops a `kind` standing with its top-left on (x, y), or null; `movingId` is the item being moved, out of its own way. */
  canPlace(kind: ItemKind, x: number, y: number, flip: boolean, movingId?: number): BuildProblem | null {
    const others = this.items.filter(i => i.id !== movingId)
    const item = { id: movingId ?? this.nextItemId, kind, x, y, flip }
    return placeProblem(parseLayout(this.shell), others, item, { door: this.grid.door, ownerStart: OWNER_START })
  }

  buy(kind: ItemKind, x: number, y: number, flip: boolean): BuildProblem | null {
    const price = ITEMS[kind].price
    if (this.money < price) return 'money'
    const problem = this.canPlace(kind, x, y, flip)
    if (problem) return problem
    this.money -= price
    this.items.push({ id: this.nextItemId++, kind, x, y, flip })
    this.changeRoom()
    return null
  }

  /** Free; the item keeps its id, so a bed keeps its station. */
  move(id: number, x: number, y: number, flip: boolean): BuildProblem | null {
    const item = this.itemById(id)
    if (this.isBusy(id)) return 'busy'
    const problem = this.canPlace(item.kind, x, y, flip, id)
    if (problem) return problem
    Object.assign(item, { x, y, flip })
    this.changeRoom()
    return null
  }

  /** Refunds half the price; the shop always keeps one shampoo bed and one seat. */
  sell(id: number): BuildProblem | null {
    const { kind } = this.itemById(id)
    if (this.isBusy(id)) return 'busy'
    if (kind === 'bed' && this.items.filter(i => i.kind === 'bed').length === 1) return 'lastBed'
    if (ITEMS[kind].group === 'seat' && this.items.filter(i => ITEMS[i.kind].group === 'seat').length === 1) return 'lastSeat'
    this.money += Math.floor(ITEMS[kind].price / 2)
    this.items = this.items.filter(i => i.id !== id)
    this.changeRoom()
    return null
  }

  /** True for a bed a customer lies on or walks to, and for a bench with someone sitting on or walking to one of its seats. */
  isBusy(id: number): boolean {
    const item = this.itemById(id)
    if (item.kind === 'bed') return this.stations.some(s => s.id === id && s.customerId !== null)
    return seatTiles(item).some(t => this.seats.some(s => tileEq(s.tile, t) && s.customerId !== null))
  }

  private itemById(id: number): Item {
    const item = this.items.find(i => i.id === id)
    if (!item) throw new Error(`No item ${id}`)
    return item
  }

  /** After a build change: lay the room out again, get everyone out of the way, and tell the view. */
  private changeRoom(): void {
    this.rebuildRoom()
    this.settleCharacters()
    this.emit({ type: 'roomChanged' })
  }

  /** Lays the floor out from the items again; whoever is on a bed or a seat that is still there stays on it. */
  private rebuildRoom(): void {
    this.grid = buildGrid(this.shell, this.items)
    const byId = [...this.items].sort((a, b) => a.id - b.id)
    this.stations = byId
      .filter(item => item.kind === 'bed')
      .map(item => ({
        id: item.id,
        bed: { x: item.x, y: item.y + 1 },
        work: workTile(item)!,
        customerId: this.stations.find(s => s.id === item.id)?.customerId ?? null,
      }))
    this.seats = byId.flatMap(seatTiles).map(tile => ({ tile, customerId: this.seats.find(s => tileEq(s.tile, tile))?.customerId ?? null }))
  }

  /**
   * Whoever now stands on furniture, or somewhere the door no longer reaches, steps to the nearest tile the door does reach.
   * Then every walk finds its way again.
   */
  private settleCharacters(): void {
    const reached = doorReach(this.grid, this.grid.door)
    const walkers = this.customers.filter(c => ON_FOOT.includes(c.state))
    const stepAside = (m: Mover, goal: Tile | null) => {
      const tile = tileOf(m.pos)
      if (reached(tile) || (goal && tileEq(tile, goal))) return
      m.pos = { ...flood(this.grid, tile, () => true).find(reached)! }
    }
    stepAside(this.owner, null)
    for (const c of walkers) stepAside(c, this.goalOf(c))

    for (const c of walkers) {
      const goal = this.goalOf(c)
      if (c.path.length > 0) this.reroute(c, goal && (x => tileEq(x, goal)))
    }
    if (this.owner.path.length > 0) this.reroute(this.owner, this.ownerGoal())
  }

  /** Where a customer on foot is headed: their seat, their bed or the door. */
  private goalOf(c: Customer): Tile | null {
    if (c.state === 'leaving') return this.grid.door
    if (c.state === 'toStation') return this.stations.find(s => s.id === c.stationId)?.bed ?? null
    return c.seat
  }

  /** Where the owner's walk ends: beside the customer being fetched, on the work tile, or where the player tapped if that is still floor. */
  private ownerGoal(): ((t: Tile) => boolean) | null {
    const task = this.owner.task
    if (task?.kind === 'fetch') {
      const seat = this.customers.find(c => c.id === task.customerId)?.seat
      return seat ? x => isWalkable(this.grid, x) && manhattan(x, seat) === 1 : null
    }
    if (task?.kind === 'serve') {
      const work = this.stations.find(s => s.id === task.stationId)?.work
      return work ? x => tileEq(x, work) : null
    }
    const end = this.owner.path[this.owner.path.length - 1]
    return isWalkable(this.grid, end) ? x => tileEq(x, end) : null
  }

  /** A new path from the nearest tile, which someone caught between two tiles steps back onto first; with no goal they just stop there. */
  private reroute(m: Mover, isGoal: ((t: Tile) => boolean) | null): void {
    const from = tileOf(m.pos)
    const route = (isGoal && findPath(this.grid, from, isGoal)) || []
    m.path = tileEq(from, m.pos) ? route : [from, ...route]
  }

  private step(dt: number): void {
    if (this.paused || this.dayOver || this.servingCustomerId !== null) return
    this.clock.advance(dt)

    if (this.autoSpawn && !this.clock.isClosed) {
      this.untilArrivalMs -= dt
      if (this.untilArrivalMs <= 0) {
        this.spawnCustomer()
        const [lo, hi] = ARRIVAL_JITTER
        this.untilArrivalMs = arrivalIntervalMs(this.rating()) * dayEase(this.day).arrival * beautyArrivalFactor(this.beauty()) * (lo + (hi - lo) * this.rng())
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
      c.path = findPath(this.grid, tileOf(c.pos), t => tileEq(t, station.bed)) ?? []
      this.setState(c, 'toStation')
      this.owner.path = findPath(this.grid, this.ownerTile(), t => tileEq(t, station.work)) ?? []
      this.owner.task = { kind: 'serve', customerId: c.id, stationId: station.id }
      return
    }

    // serve: wait until the customer has also reached the bed
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
