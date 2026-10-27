import {
  JOLLY_TIP,
  ANGRY_REVIEW,
  ARRIVE_MS,
  EXIT_MS,
  FIRST_ARRIVAL_MS,
  LOW_STOCK,
  MAX_FRAME_MS,
  MEMBER_PATIENCE,
  OWNER_SPEED,
  OWNER_START,
  PATIENCE_MS,
  RATING_WINDOW,
  RECIPE_TRY_COST,
  RESTOCK_AMOUNT,
  RESTOCK_PRICE,
  STARTING_MONEY,
  STEP_MS,
  UNLOCK_DAY,
  VIP_PATIENCE,
  VIP_PRICE_FACTOR,
  VIP_REVIEWS,
} from '../config'
import { t } from '../strings/vi'
import { doorReach, flood, offFloor, placeProblem, type BuildProblem } from './build'
import { drawKind, drawService, KINDS, type CustomerKind } from './customers'
import { DayClock } from './clock'
import { fire, greet, greeterAtDesk, hire, hireProblem, makeWayForOwner, payWages, receptionSpot, repairAfterLoad, startDay, staffGoal, study, studyProblem, updateStaff, type CrewHost } from './crew'
import { arrivalGapMs, arrivalIntervalMs, beautyArrivalFactor, dayEase, rating as ratingOf, reviewScore, serviceArrivalFactor, tipFor, type Stars } from './economy'
import { bedSlotAt, besideSeat, buildGrid, isWalkable, manhattan, parseLayout, tileEq, tileOf, type Grid } from './grid'
import { ITEMS, beautyOf, bedTile, itemsFromLayout, seatTiles, shellOf, workTile, type Item, type ItemKind } from './items'
import { SPA_LAYOUT_1A } from './layout'
import { findPath } from './path'
import { cleanShopName, DEFAULT_OWNER_LOOK } from './profile'
import { addVisit, bookOpen, dueRegular, emptyBook, isMember, loseVisit, noteServed, planDay, REGULARS, type GuestBook, type RegularId } from './regulars'
import { emptyRecipes, isMix, pickHint, rightCount, sameMix, type Ingredient, type RecipeBook, type RecipeId } from './recipes'
import { createRng, randomLook, type Rng } from './rng'
import { clearStale, dueVip, emptyVipBook, planBooking, scoreVip, VIP_KIND, VIPS, type VipBook, type VipId } from './vips'
import { SAVE_VERSION, SaveError, type SaveData } from './save'
import { BASIC_SERVICES, isRecipeService, SERVICE_IDS, SERVICES, serviceOfBed, type ServiceId, type ServiceProblem } from './services'
import { fullStock, STOCK_ITEMS, STOCK_USES, type StockItem } from './stock'
import { greeterPatience, staffWalkSpeed, tipFactor, type Candidate, type Course, type Staff } from './staff'
import type { Customer, CustomerState, DayStats, HintId, Look, Mover, Owner, Seat, SimEvent, Station, Tile } from './types'

/** Customers on their way somewhere or sitting; a build change may put furniture in their way. */
const ON_FOOT: CustomerState[] = ['toSeat', 'waiting', 'toStation', 'leaving']

export type HireProblem = 'money' | 'full'
/** `course`: no such working person, they are leaving, or the course is not on offer to them; `booked`: they already have a course tonight. */
export type StudyProblem = 'money' | 'booked' | 'course'
/** A new bowl was paid for and tried; a bowl tried before answers again for free; or money stops a new one. `right` counts the recipe's ingredients in the bowl. */
export type MixOutcome = { kind: 'tried'; right: number } | { kind: 'repeat'; right: number } | { kind: 'problem'; problem: 'debt' | 'money' }

const emptyStats = (): DayStats => ({ served: 0, angry: 0, walkedAway: 0, income: 0, tips: 0, wages: 0, restock: 0, gifts: 0 })

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
  book: GuestBook = emptyBook()
  vip: VipBook = emptyVipBook()
  paused = false
  servingCustomerId: number | null = null
  dayOver = false
  shopName = t('defaultShopName')
  ownerLook: Look = { ...DEFAULT_OWNER_LOOK }
  profileDone = false
  hints: HintId[] = []
  staff: Staff[] = []
  candidates: Candidate[] = []
  candidatesDay = 0
  /** The services the shop has opened, in opening order; shampoo is built in. */
  services: ServiceId[] = ['shampoo']
  /** What is left of each item; only used up from day 5. */
  stock: Record<StockItem, number> = fullStock()
  /** What has been tried and heard for each recipe, and whether it is solved. */
  recipes: RecipeBook = emptyRecipes()

  private readonly rng: Rng
  private readonly crew: CrewHost
  private readonly autoSpawn: boolean
  /** The layout without its furniture: walls, door, screen and desk. */
  private shell: string[]
  private nextItemId: number
  private events: SimEvent[] = []
  private nextId = 1
  private nextStaffId = 1
  private untilArrivalMs = FIRST_ARRIVAL_MS

  constructor({ rng, layout = SPA_LAYOUT_1A, autoSpawn = true }: SpaSimOptions) {
    this.rng = rng
    this.autoSpawn = autoSpawn
    this.crew = {
      sim: this,
      rng,
      emit: e => this.emit(e),
      walkTo: (m, isGoal) => this.walkTo(m, isGoal),
      sendToBed: (c, station) => this.sendToBed(c, station),
      payFor: (c, station, stars, technician) => this.payFor(c, station, stars, technician),
      takeStaffId: () => this.nextStaffId++,
    }
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

  /** Whether the guest book is there to open: once a regular has been met or a VIP booked. */
  bookShown(): boolean {
    return bookOpen(this.book) || this.vip.everBooked
  }

  /** The hint an open of the guest book uses up: the regulars' once one has been met, else the VIP-only one. */
  bookHint(): 'openBook' | 'bookVip' {
    return bookOpen(this.book) ? 'openBook' : 'bookVip'
  }

  /**
   * What stops `id` opening now, or null if it can: not while money is negative, not before the service ahead of it
   * (for a recipe service, massage; then not before its recipe is solved), not without the money. An open service has no problem.
   */
  serviceProblem(id: ServiceId): ServiceProblem | null {
    if (this.services.includes(id)) return null
    if (this.money < 0) return 'debt'
    if (isRecipeService(id)) {
      if (!this.benchOpen()) return 'order'
      if (!this.recipes[id].solved) return 'recipe'
    } else {
      const ahead = BASIC_SERVICES.slice(0, BASIC_SERVICES.indexOf(id))
      if (ahead.some(a => !this.services.includes(a))) return 'order'
    }
    return this.money < SERVICES[id].openCost ? 'money' : null
  }

  /** Whether the recipe bench is there: once massage is open. */
  benchOpen(): boolean {
    return this.services.includes('massage')
  }

  /**
   * One bowl at the bench. A bowl tried before, in any order, answers again for free; a new one costs RECIPE_TRY_COST
   * (not a day's cost), never while money is negative or short, and all 3 right solves the recipe.
   * Throws for a bowl that is not 3 different ingredients, before the bench is there, or for a solved recipe.
   */
  mixRecipe(id: RecipeId, mix: readonly Ingredient[]): MixOutcome {
    if (!isMix(mix)) throw new Error(`Not a mix: ${mix.join(', ')}`)
    if (!this.benchOpen()) throw new Error('The recipe bench is not open')
    const recipe = this.recipes[id]
    if (recipe.solved) throw new Error(`Recipe ${id} is solved`)
    const before = recipe.tries.find(t => sameMix(t.mix, mix))
    if (before) return { kind: 'repeat', right: before.right }
    if (this.money < 0) return { kind: 'problem', problem: 'debt' }
    if (this.money < RECIPE_TRY_COST) return { kind: 'problem', problem: 'money' }
    this.money -= RECIPE_TRY_COST
    const right = rightCount(id, mix)
    recipe.tries.push({ mix: [...mix], right })
    if (right === 3) recipe.solved = true
    return { kind: 'tried', right }
  }

  /** Opens the service for its price; opening an open one does nothing. */
  openService(id: ServiceId): ServiceProblem | null {
    if (this.services.includes(id)) return null
    const problem = this.serviceProblem(id)
    if (problem) return problem
    this.money -= SERVICES[id].openCost
    this.services = SERVICE_IDS.filter(x => x === id || this.services.includes(x))
    return null
  }

  /** The services customers can ask for: open, with at least one bed. */
  availableServices(): ServiceId[] {
    return SERVICE_IDS.filter(id => this.services.includes(id) && this.items.some(i => i.kind === SERVICES[id].bed))
  }

  /**
   * Draws what it is not given, in this order: look, then kind, then service.
   * A regular comes with their own look and kind and asks for their favourite while the shop has it, so draws at most the service.
   * A VIP comes the same way and asks for her own service; her patience is VIP_PATIENCE of the plain one, with nothing for the early days or her kind.
   */
  spawnCustomer(opts: { kind?: CustomerKind; service?: ServiceId; regular?: RegularId; vip?: VipId } = {}): Customer {
    const greeter = greeterAtDesk(this.crew)
    const greetFactor = greeter ? greeterPatience(greeter) : 1
    const vipSpec = opts.vip && VIPS[opts.vip]
    const spec = opts.regular && REGULARS[opts.regular]
    const state = opts.regular && this.book.regulars[opts.regular]
    const look = vipSpec ? { ...vipSpec.look } : spec ? { ...spec.look } : randomLook(this.rng)
    const kind = vipSpec ? VIP_KIND : spec ? spec.kind : (opts.kind ?? drawKind(this.day, this.rng))
    const available = this.availableServices()
    const likes = vipSpec ? vipSpec.service : spec ? spec.likes : null
    const service = opts.service ?? (likes && available.includes(likes) ? likes : drawService(kind, available, this.rng))
    const patience = Math.round(
      vipSpec
        ? PATIENCE_MS * VIP_PATIENCE * greetFactor
        : PATIENCE_MS * dayEase(this.day).patience * greetFactor * KINDS[kind].patience * (state && isMember(state) ? MEMBER_PATIENCE : 1),
    )
    const c: Customer = {
      id: this.nextId++,
      look,
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
      greet: greeter ? greeter.stats.friendly : 0,
      service,
      kind,
      regular: opts.regular ?? null,
      heldMs: 0,
      vip: opts.vip ?? null,
    }
    this.customers.push(c)
    this.emit({ type: 'customerArrived', id: c.id })
    if (opts.regular && state) {
      const first = !state.met
      state.met = true
      state.visitAt = null
      this.emit({ type: 'regularArrived', customerId: c.id, regular: opts.regular, first })
    }
    if (opts.vip) {
      const v = this.vip.vips[opts.vip]
      const first = v.visits === 0
      v.visits++
      if (this.vip.booking?.vip === opts.vip) this.vip.booking = null
      this.emit({ type: 'vipArrived', customerId: c.id, vip: opts.vip, first })
    }
    if (greeter) greet(this.crew, greeter, c.id)
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
      const missing = this.missingStock(waiting.service)
      if (missing) {
        this.emit({ type: 'stockOut', item: missing })
        return
      }
      if (!this.stations.some(s => s.service === waiting.service && s.customerId === null)) {
        this.emitBusy(waiting.service)
        return
      }
      makeWayForOwner(this.crew, waiting.id)
      const path = findPath(this.grid, from, besideSeat(this.grid, waiting.seat!))
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
    this.payFor(c, station, stars, null)
    this.servingCustomerId = null
    this.owner.task = null
  }

  /** The customer pays, reviews and leaves; `technician` is null when the owner did the work. A VIP pays VIP_PRICE_FACTOR times the price, but tips on the plain one. */
  private payFor(c: Customer, station: Station, stars: Stars, technician: Staff | null): void {
    const base = SERVICES[c.service].price
    const price = c.vip ? base * VIP_PRICE_FACTOR : base
    const spec = KINDS[c.kind]
    const tip = Math.round(tipFor(base, stars) * spec.tip[stars - 1] * (tipFactor(c.greet, technician?.stats.friendly ?? null) + (technician?.trait === 'jolly' ? JOLLY_TIP : 0)))
    this.money += price + tip
    this.stats.income += price
    this.stats.tips += tip
    this.stats.served++
    this.emit({ type: 'paid', customerId: c.id, amount: price, tip, tile: station.bed })
    this.addReview(c, reviewScore(stars, spec.grading === 'harsh' && c.kind === 'picky' && technician?.trait === 'calm' ? 'normal' : spec.grading))
    // a VIP has her own page in the book, not a place among the kinds served
    if (c.vip) {
      const r = scoreVip(this.vip, this.book.gifts, c.vip, stars)
      this.emit({ type: 'vipServed', customerId: c.id, vip: c.vip, stars, photo: r.photo, board: r.board })
    } else noteServed(this.book, c.kind)
    if (c.regular) {
      const r = addVisit(this.book, c.regular, stars, technician === null, this.day)
      if (r.hearts) this.emit({ type: 'heart', customerId: c.id, regular: c.regular, hearts: r.hearts, member: r.member })
      if (r.gift) {
        if (r.gift.kind === 'money') {
          this.money += r.gift.amount
          this.stats.gifts += r.gift.amount
        }
        this.emit({ type: 'gift', customerId: c.id, regular: c.regular, gift: r.gift })
      }
      if (r.board) this.emit({ type: 'bookPage' })
      // a pleased regular may tell a recipe's secret once the bench is there, but not on the visit that brings their gift
      if (stars >= 2 && this.benchOpen() && !r.gift) {
        const hint = pickHint(this.recipes, this.rng)
        if (hint) {
          this.recipes[hint.recipe].heard.push(hint.ingredient)
          this.emit({ type: 'recipeHint', customerId: c.id, regular: c.regular, ...hint })
        }
      }
    }
    c.mood = stars >= 2 ? 'happy' : 'ok'
    station.customerId = null
    c.stationId = null
    this.startLeaving(c)
  }

  /** Where the receptionist stands: the first floor tile beside the desk, nearest the owner's start; the start itself if there is none. */
  receptionSpot(): Tile {
    return receptionSpot(this.crew)
  }

  /** True for a VIP who found every seat taken and waits on her feet by the desk. */
  isStanding(c: Customer): boolean {
    return c.vip !== null && c.seat !== null && !this.seats.some(s => s.customerId === c.id)
  }

  /**
   * Where a VIP stands when every seat is taken: in walking order from the door, the first plain floor beside the desk
   * (never a bed's work tile) that is not the receptionist's spot, the owner's start or the door; with none, the first floor in from the door.
   */
  private standSpot(): Tile {
    const floor = flood(this.grid, this.grid.door, t => isWalkable(this.grid, t)).filter(t => !tileEq(t, this.grid.door))
    const desk = this.receptionSpot()
    const byDesk = floor.find(t => this.grid.cells[t.y][t.x] === 'floor' && !tileEq(t, desk) && !tileEq(t, OWNER_START) && this.grid.desks.some(d => manhattan(d, t) === 1))
    return byDesk ?? floor[0]
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
      staff: this.staff,
      candidates: this.candidates,
      candidatesDay: this.candidatesDay,
      nextStaffId: this.nextStaffId,
      services: this.services,
      stock: this.stock,
      book: this.book,
      vip: this.vip,
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
    sim.services = d.services
    sim.stock = d.stock
    sim.book = d.book
    sim.vip = d.vip
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
    sim.staff = d.staff
    sim.candidates = d.candidates
    sim.candidatesDay = d.candidatesDay
    // never hand out an id a damaged save already uses
    sim.nextStaffId = Math.max(d.nextStaffId, ...d.staff.map(s => s.id + 1))
    sim.repickLostServices()
    repairAfterLoad(sim.crew)

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
    startDay(this.crew)
    planDay(this.book, this.day, this.rng)
    clearStale(this.vip, this.day)
  }

  /** Free and at once: the new person stands on the door tile. Not while money is negative or the role is full (staff who are leaving do not count). */
  hire(index: number): HireProblem | null {
    return hire(this.crew, index)
  }

  /** What `hire` would refuse with, so a button can be faded beforehand; null if the candidate can be hired. */
  hireProblem(index: number): HireProblem | null {
    return hireProblem(this.crew, index)
  }

  /** Lets someone go: today's wage is still paid. A technician with a customer finishes that customer first; everyone else walks out at once. */
  fire(id: number): void {
    fire(this.crew, id)
  }

  /** What `study` would refuse with, so a button can be faded beforehand; null if the course can be booked. */
  studyProblem(staffId: number, course: Course): StudyProblem | null {
    return studyProblem(this.crew, staffId, course)
  }

  /** Books a night course for the person: the tuition is taken now (not counted in the day's costs), and the tier or friendliness rises when the next day starts. */
  study(staffId: number, course: Course): StudyProblem | null {
    return study(this.crew, staffId, course)
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

  /** Puts down the oldest waiting gift of `kind`, free; it stays a gift, so it can be moved but never sold. */
  placeGift(kind: ItemKind, x: number, y: number, flip: boolean): BuildProblem | null {
    const waiting = this.book.gifts.indexOf(kind)
    if (waiting < 0) return 'gift'
    const problem = this.canPlace(kind, x, y, flip)
    if (problem) return problem
    this.items.push({ id: this.nextItemId++, kind, x, y, flip, gift: true })
    this.book.gifts.splice(waiting, 1)
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

  /** Refunds half the price; the shop always keeps one shampoo bed and one seat, and never sells a gift. */
  sell(id: number): BuildProblem | null {
    const { kind, gift } = this.itemById(id)
    if (gift) return 'gift'
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
    if (ITEMS[item.kind].group === 'bed') return this.stations.some(s => s.id === id && s.customerId !== null)
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
    this.repickLostServices()
    // a VIP's new spot is picked first, so settling never leaves her on the old one as if it were still her goal;
    // then she walks there from wherever settling left her, even off a tile that had no way out
    const restood = this.restandVips()
    this.settleCharacters()
    for (const c of restood) this.sendToSeat(c, c.seat!)
    this.emit({ type: 'roomChanged' })
  }

  /** Gives each standing VIP whose spot is now under furniture, or out of the door's reach, a new one; returns them. */
  private restandVips(): Customer[] {
    const reached = doorReach(this.grid, this.grid.door)
    const moved = this.customers.filter(c => ['toSeat', 'waiting'].includes(c.state) && this.isStanding(c) && !(isWalkable(this.grid, c.seat!) && reached(c.seat!)))
    for (const c of moved) c.seat = this.standSpot()
    return moved
  }

  /** Whoever is still to be served and wants a service that is no longer available picks again among those that are. */
  private repickLostServices(): void {
    const available = this.availableServices()
    for (const c of this.customers)
      if (c.stationId === null && ['arriving', 'toSeat', 'waiting'].includes(c.state) && !available.includes(c.service)) c.service = drawService(c.kind, available, this.rng)
  }

  /** Lays the floor out from the items again; whoever is on a bed or a seat that is still there stays on it. */
  private rebuildRoom(): void {
    this.grid = buildGrid(this.shell, this.items)
    const byId = [...this.items].sort((a, b) => a.id - b.id)
    this.stations = byId
      .filter(item => ITEMS[item.kind].group === 'bed')
      .map(item => ({
        id: item.id,
        service: serviceOfBed(item.kind)!,
        bed: bedTile(item),
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
    const moved = new Set<Staff>()
    for (const s of this.staff) {
      const before = s.pos
      stepAside(s, null)
      if (s.pos !== before) moved.add(s)
    }
    for (const c of walkers) stepAside(c, this.goalOf(c))

    for (const c of walkers) {
      const goal = this.goalOf(c)
      if (c.path.length > 0) this.reroute(c, goal && (x => tileEq(x, goal)))
    }
    if (this.owner.path.length > 0) this.reroute(this.owner, this.ownerGoal())
    for (const s of this.staff) if (s.path.length > 0 || moved.has(s)) this.reroute(s, staffGoal(this.crew, s))
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
      return seat ? besideSeat(this.grid, seat) : null
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
        // a regular whose hour has come takes the place of a stranger, but only when a seat is left for her once
        // everyone walking in has sat down, so a full shop never uses up her visit; until then she stays due
        const due = dueRegular(this.book, this.clock.minutes)
        const seatLeft = this.seats.filter(s => s.customerId === null).length > this.customers.filter(c => c.state === 'arriving').length
        this.spawnCustomer(due && seatLeft ? { regular: due } : {})
        this.untilArrivalMs = arrivalGapMs(
          arrivalIntervalMs(this.rating()) * dayEase(this.day).arrival * beautyArrivalFactor(this.beauty()) * serviceArrivalFactor(this.availableServices()),
          this.rng(),
        )
      }
      // chú Sáu's gift: one customer more a day
      if (this.book.extraAt !== null && this.clock.minutes >= this.book.extraAt) {
        this.book.extraAt = null
        this.spawnCustomer()
      }
      // a booked VIP comes at her minute, on top of the usual arrivals
      const b = dueVip(this.vip, this.day, this.clock.minutes)
      if (b) this.spawnCustomer({ vip: b.vip })
    }

    moveAlong(this.owner, OWNER_SPEED, dt)
    for (const s of this.staff) moveAlong(s, staffWalkSpeed(s), dt)
    for (const c of [...this.customers]) this.updateCustomer(c, dt)
    this.updateOwnerTask()
    for (const s of this.staff) updateStaff(this.crew, s, dt)

    if (this.clock.isClosed && this.customers.length === 0 && this.servingCustomerId === null) {
      this.dayOver = true
      payWages(this.crew)
      // tomorrow's VIP, drawn from a stream of her own so the shop's draws stay as they were
      const technicians = this.staff.filter(s => s.role === 'technician' && !s.leaving).length
      planBooking(this.vip, this.day, technicians, this.availableServices(), createRng(this.day * 7919 + this.nextId))
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
        moveAlong(c, KINDS[c.kind].speed, dt)
        if (c.path.length === 0) this.setState(c, 'waiting')
        break
      case 'waiting':
        c.patienceMs -= dt
        // the owner's turn with a regular runs only while a bed of their service is free
        if (c.regular && this.stations.some(s => s.service === c.service && s.customerId === null)) c.heldMs += dt
        if (c.patienceMs <= 0) this.loseCustomer(c)
        break
      case 'toStation':
        moveAlong(c, KINDS[c.kind].speed, dt)
        break
      case 'leaving':
        moveAlong(c, KINDS[c.kind].speed, dt)
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
      const station = this.stations.find(s => s.customerId === null && s.service === c.service)
      if (!station) {
        this.emitBusy(c.service)
        this.owner.task = null
        return
      }
      const missing = this.missingStock(c.service)
      if (missing) {
        this.emit({ type: 'stockOut', item: missing })
        this.owner.task = null
        return
      }
      this.sendToBed(c, station)
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

  /** Whether the shop counts its stock yet. */
  stockTracked(): boolean {
    return this.day >= UNLOCK_DAY.stock
  }

  /** The first item a customer of the service would use that has run out, while stock is tracked; else null. */
  missingStock(service: ServiceId): StockItem | null {
    if (!this.stockTracked()) return null
    return STOCK_USES[service].find(item => this.stock[item] < 1) ?? null
  }

  /** The items at the low-stock count or fewer that an open service uses, while stock is tracked. */
  lowStock(): StockItem[] {
    if (!this.stockTracked()) return []
    return STOCK_ITEMS.filter(item => this.stock[item] <= LOW_STOCK && this.services.some(id => STOCK_USES[id].includes(item)))
  }

  /** Buys RESTOCK_AMOUNT more of an item for its price, even when money is short or already below zero. */
  restock(item: StockItem): void {
    this.money -= RESTOCK_PRICE[item]
    this.stock[item] += RESTOCK_AMOUNT
    this.stats.restock += RESTOCK_PRICE[item]
  }

  /** Claims the bed for a waiting customer, frees their seat and sends them to lie down; from day 5 it also takes the service's items from the stock. */
  private sendToBed(c: Customer, station: Station): void {
    if (this.stockTracked()) {
      for (const item of STOCK_USES[c.service]) {
        const before = this.stock[item]
        this.stock[item] = before - 1
        if (before > LOW_STOCK && before - 1 <= LOW_STOCK) this.emit({ type: 'stockLow', item })
      }
    }
    station.customerId = c.id
    c.stationId = station.id
    this.freeSeat(c)
    c.path = findPath(this.grid, tileOf(c.pos), t => tileEq(t, station.bed)) ?? []
    this.setState(c, 'toStation')
  }

  /** A walk from where `m` is now to the nearest tile that passes `isGoal`, or null; someone caught between two tiles steps back onto the first first. */
  private walkTo(m: Mover, isGoal: (t: Tile) => boolean): Tile[] | null {
    const from = tileOf(m.pos)
    const route = findPath(this.grid, from, isGoal)
    if (!route) return null
    return tileEq(from, m.pos) ? route : [from, ...route]
  }

  /** Sends the customer to the first free seat; with every seat taken a VIP stands by the desk, and anyone else walks out. */
  private seatCustomer(c: Customer): void {
    const seat = this.seats.find(s => s.customerId === null)
    if (!seat && c.vip === null) {
      this.emit({ type: 'noSeat', id: c.id })
      this.stats.walkedAway++
      this.startLeaving(c)
      return
    }
    if (seat) seat.customerId = c.id
    this.sendToSeat(c, seat ? seat.tile : this.standSpot())
  }

  /** Walks the customer from where they are to `spot`: their seat, or where a VIP stands. */
  private sendToSeat(c: Customer, spot: Tile): void {
    c.seat = spot
    c.path = this.walkTo(c, t => tileEq(t, spot)) ?? []
    this.setState(c, 'toSeat')
  }

  private loseCustomer(c: Customer): void {
    this.freeSeat(c)
    c.mood = 'angry'
    this.addReview(c, ANGRY_REVIEW)
    if (c.regular) loseVisit(this.book, c.regular)
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

  /** The customer's review, once or twice by their kind; VIP_REVIEWS times from a VIP. */
  private addReview(c: Customer, score: number): void {
    for (let i = 0; i < (c.vip ? VIP_REVIEWS : KINDS[c.kind].reviews); i++) {
      this.reviews.push(score)
      this.emit({ type: 'review', customerId: c.id, score })
    }
  }

  private setState(c: Customer, state: CustomerState): void {
    c.state = state
    c.stateMs = 0
  }

  /** Tells the player every bed of the service is taken. */
  private emitBusy(id: ServiceId): void {
    this.emit({ type: 'toast', key: SERVICES[id].busy as Extract<SimEvent, { type: 'toast' }>['key'] })
  }

  private emit(e: SimEvent): void {
    this.events.push(e)
  }
}
