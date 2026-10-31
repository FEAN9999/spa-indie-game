import {
  JOLLY_TIP,
  ANGRY_REVIEW,
  ARRIVE_MS,
  DAY_END_MIN,
  DAY_MINUTES,
  DAYS_PER_MONTH,
  EXIT_MS,
  EVENT_REWARD_FACTOR,
  FESTIVAL_ARRIVAL,
  FESTIVAL_PATIENCE,
  FESTIVAL_PRICE,
  FESTIVAL_SERVICE_CHANCE,
  FIRST_ARRIVAL_MS,
  FLOOR_PRICE,
  GENEROUS_CHANCE,
  GENEROUS_TIP,
  HEART_AT,
  HOT_ARRIVAL,
  IDOL_PRICE_FACTOR,
  INSPECT_BEAUTY,
  LESSON_STARS,
  LOW_STOCK,
  MAX_FRAME_MS,
  MEMBER_PATIENCE,
  OWNER_SPEED,
  OWNER_START,
  PATIENCE_MS,
  POWER_FROM_MIN,
  POWER_TIP_FACTOR,
  POWER_TO_MIN,
  POWER_WARN_MIN,
  QUEST_MIN_LEFT_MIN,
  RATING_WINDOW,
  REGULARS_FROM_DAY,
  RECIPE_TRY_COST,
  RESTOCK_AMOUNT,
  RESTOCK_PRICE,
  RIVAL_PICKY_FACTOR,
  STAIRS_MS,
  PLACE_KINDS,
  PLACES,
  STARTER_REWARD,
  STARTING_MONEY,
  STEP_MS,
  UNLOCK_DAY,
  AWAY_MAX_HOURS,
  AWAY_MIN_MS,
  VIP_PATIENCE,
  VIP_PRICE_FACTOR,
  VIP_REVIEWS,
  LITTER_FROM_DAY,
  MAX_PETS,
  HOUSE_PRICE,
  HOUSES_PER_SIDE,
} from '../config'
import { PET_NAME_IDEAS, t } from '../strings/vi'
import { newBadges, type BadgeShop, type Badges } from './badges'
import { claimed, doorReach, flood, offFloor, placementProblem, sellRefund, type BuildProblem } from './build'
import { drawKind, drawService, isMainKind, KINDS, type CustomerKind } from './customers'
import { BRANCH_LAYOUT, PLACE_DECOR, placePrice, type PlaceId } from './places'
import { dayOfMonth, daysLeftInMonth, monthOf, monthStart } from './calendar'
import { emptyFestivalBook, festivalOf, festivalService, FESTIVALS, type FestivalBook } from './festivals'
import { DayClock } from './clock'
import { fire, greet, greeterAtDesk, hire, hireProblem, makeWayForOwner, payWages, receptionSpot, refreshCandidates, repairAfterLoad, startDay, staffGoal, study, studyProblem, updateStaff, type CrewHost } from './crew'
import { arrivalGapMs, arrivalIntervalMs, beautyArrivalFactor, dayEase, dayProfit, rating as ratingOf, reviewScore, serviceArrivalFactor, tipFor, type Stars } from './economy'
import { bedSlotAt, besideSeat, buildGrid, isWalkable, manhattan, parseLayout, tileEq, tileOf, type Grid } from './grid'
import { clearIdolStale, dueIdol, emptyIdolBook, IDOL_IDS, IDOLS, planIdol, scoreIdol, type IdolBook, type IdolId } from './idols'
import { ITEMS, beautyOf, bedTile, deskSpot, itemsFromLayout, seatTiles, shellOf, workTile, type Item, type ItemKind } from './items'
import { floorOf, towerOf } from './floors'
import { NO_HOUSES, SHOP_LAYOUT, withHouses, type Houses, type Side } from './layout'
import { findPath } from './path'
import { cleanShopName, DEFAULT_OWNER_LOOK } from './profile'
import { addVisit, bookOpen, dueRegular, emptyBook, isMember, loseVisit, noteServed, planDay, REGULAR_IDS, REGULARS, visitMinute, type GuestBook, type RegularId } from './regulars'
import { emptyRecipes, isMix, pickHint, rightCount, sameMix, type Ingredient, type RecipeBook, type RecipeId } from './recipes'
import { averageDay, baseReward, closeNoWalk, emptyProgress, recordDay, rollDay, rollMonth, settle, swap, type Counts, type Progress, type Quest, type QuestShop } from './quests'
import { createRng, randomLook, type Rng } from './rng'
import { dueKol, emptyEventBook, hotCardToday, hotOn, makeHot, KOL_LOOK, MACHINES, planEvent, powerOutAt, rivalTarget, rivalToday, type EventBook } from './events'
import { clearStale, dueVip, emptyVipBook, planBooking, scoreVip, VIP_IDS, VIP_KIND, VIPS, type VipBook, type VipId } from './vips'
import { awayMean, awayPay, closeAwayDay, emptyAwayBook, type AwayBook, type AwayResult } from './away'
import { OUTFIT_IDS, unlockedOutfits, type OutfitId } from './outfits'
import { emptyRankBook, isJudgeDay, isYearEnd, judgeMonth, judgeYear, monthInput, rankParts, rankPrice, type RankBook, type RankInput } from './rank'
import { branchPetBook, BREEDS, cleanPetName, emptyPetBook, FREE_BREEDS, type BreedId, type Pet, type PetBook, type PetProblem } from './pets'
import { SAVE_VERSION, SaveError, type SaveData } from './save'
import { clearStairs } from './stairs'
import { isPast, newStarter, pastStarter, settleStarter, STARTER_OPENS, starterRunning, type StarterBook, type StarterShop } from './starter'
import { BASIC_SERVICES, isLessonService, LESSON_SERVICES, isRecipeService, SERVICE_IDS, SERVICES, serviceOfBed, type LessonService, type ServiceId, type ServiceProblem } from './services'
import { fullStock, STOCK_ITEMS, STOCK_USES, type StockItem } from './stock'
import { courses, greeterPatience, staffWalkSpeed, tipFactor, type Candidate, type Course, type Staff, type StaffRole } from './staff'
import type { Customer, CustomerState, DayStats, Facing, HintId, Look, Mover, Owner, Seat, SimEvent, Station, Tile } from './types'
import type { Feature } from './unlocks'

/** Customers on their way somewhere or sitting; a build change may put furniture in their way. */
const ON_FOOT: CustomerState[] = ['toSeat', 'waiting', 'toStation', 'leaving']

export type HireProblem = 'money' | 'full'
/** `max`: no such floor to open, or it is open already; `day`: floors are not on offer yet; `order`: the floor below is not open; `blocked`: the door cannot reach the foot of the stairs below it; `money`: too dear. */
export type FloorProblem = 'max' | 'day' | 'order' | 'blocked' | 'money'
export type HouseProblem = 'max' | 'day' | 'money'
/** `course`: no such working person, they are leaving, or the course is not on offer to them; `booked`: they already have a course tonight. */
export type StudyProblem = 'money' | 'booked' | 'course'
/** Where a lesson stands: not paid, tuition paid and not yet passed, or learned. */
export type LessonState = 'no' | 'paid' | 'yes'
/** What stops a lesson now: not the main shop, too few stars, massage not open, debt, or too little money for the tuition. */
export type LessonProblem = 'main' | 'stars' | 'order' | 'debt' | 'money'

/** A new bowl was paid for and tried; a bowl tried before answers again for free; or money stops a new one. `right` counts the recipe's ingredients in the bowl. */
export type MixOutcome = { kind: 'tried'; right: number } | { kind: 'repeat'; right: number } | { kind: 'problem'; problem: 'debt' | 'money' }

const emptyStats = (): DayStats => ({ served: 0, angry: 0, walkedAway: 0, income: 0, tips: 0, wages: 0, restock: 0, gifts: 0, quests: 0, ownerServed: 0 })

/** Moves along the path at `speed` tiles per second; facing follows the movement. A step onto another floor is a climb: they stand on the foot for STAIRS_MS, then appear on the other foot. */
export function moveAlong(m: Mover, speed: number, dtMs: number): void {
  let budget = (speed * dtMs) / 1000
  if (m.climbMs !== undefined && (m.path.length === 0 || floorOf(m.path[0].y) === floorOf(m.pos.y))) delete m.climbMs
  while (budget > 0 && m.path.length > 0) {
    const target = m.path[0]
    if (floorOf(target.y) !== floorOf(m.pos.y)) {
      m.facing = 'up'
      m.climbMs = (m.climbMs ?? 0) + (budget / speed) * 1000
      if (m.climbMs < STAIRS_MS) return
      budget = ((m.climbMs - STAIRS_MS) / 1000) * speed
      delete m.climbMs
      m.pos = { x: target.x, y: target.y }
      m.path.shift()
      continue
    }
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

/** Where a customer is while the shop has not yet put them on a bed. */
const WAITING_STATES: CustomerState[] = ['arriving', 'toSeat', 'waiting']

export interface SpaSimOptions {
  rng: Rng
  layout?: string[]
  autoSpawn?: boolean
  /** A new shop that runs the starter chain; without it the chain has passed, as for every shop from before it. */
  starter?: boolean
}

export class SpaSim {
  grid!: Grid
  /** The furniture; the grid, the stations and the seats are built from it. */
  items: Item[]
  owner: Owner
  customers: Customer[] = []
  stations: Station[] = []
  seats: Seat[] = []
  /** The till: a branch shares the main shop's. */
  purse = { money: STARTING_MONEY }
  /** Where this shop is: null for the main shop. */
  place: PlaceId | null = null
  reviews: number[] = []
  clock = new DayClock()
  day = 1
  stats: DayStats = emptyStats()
  book: GuestBook = emptyBook()
  vip: VipBook = emptyVipBook()
  /** The stars' own book: who has come, the pending booking, and the photos given. */
  idol: IdolBook = emptyIdolBook()
  /** The shop's grade, this month's start and the year's scores. */
  rank: RankBook = emptyRankBook(1, 0, 0)
  /** Tomorrow's or today's event, the hot days and the day's event counts. */
  eventBook: EventBook = emptyEventBook()
  paused = false
  /** The owner is in this shop; an absent shop runs on its staff. Not saved. */
  ownerHere = true
  /** The owner is in the restaurant or on the street between: taps here are ignored, and the shop otherwise runs as if she were in. Not saved. */
  ownerNextDoor = false
  /** Called just before a customer who has walked out is gone. */
  onCustomerGone: ((c: Customer) => void) | null = null
  /** Holds the day open after closing while it is true. */
  keepOpen: () => boolean = () => false
  servingCustomerId: number | null = null
  dayOver = false
  shopName = t('defaultShopName')
  ownerLook: Look = { ...DEFAULT_OWNER_LOOK }
  /** The outfit the owner wears; only one the shop has can be worn. */
  ownerOutfit: OutfitId = 'baba'
  /** The outfits the shop has been told about, in wardrobe order. */
  outfitsSeen: OutfitId[] = ['baba']
  /** What the shop needs to pay itself while closed. */
  away: AwayBook = emptyAwayBook()
  profileDone = false
  hints: HintId[] = []
  staff: Staff[] = []
  /** How many people of the role move here tomorrow; the chain this shop belongs to sets it. */
  incoming: (role: StaffRole) => number = () => 0
  candidates: Candidate[] = []
  candidatesDay = 0
  /** The services the shop has opened, in opening order; shampoo is built in. */
  services: ServiceId[] = ['shampoo']
  /** The lesson services whose tuition is paid and whose lesson is not passed yet. */
  lessonsPaid: LessonService[] = []
  /** What is left of each item; only used up from day 5. */
  stock: Record<StockItem, number> = fullStock()
  /** What has been tried and heard for each recipe, and whether it is solved. */
  recipes: RecipeBook = emptyRecipes()
  /** What the shop has counted, and its quests. */
  progress: Progress = emptyProgress()
  /** The badges the shop has earned. */
  badges: Badges = {}
  /** The festivals whose keepsake the shop has been given. */
  festival: FestivalBook = emptyFestivalBook()
  /** The starter chain: the goal being worked on and the buttons it opened. */
  starter: StarterBook
  /** The shop's pets; a branch's live at the main shop. */
  pets: PetBook = emptyPetBook()
  /** The neighbour houses bought each side, by this shop alone. */
  houses: Houses = { ...NO_HOUSES }

  private readonly rng: Rng
  private readonly crew: CrewHost
  readonly autoSpawn: boolean
  /** Floor 1's layout without its furniture or its houses. */
  private readonly base: string[]
  /** The layout without its furniture: walls and door; the screens and desk are furniture. */
  private shell: string[]
  /** How many floors are open; the shell always holds every floor the layout has. */
  floors = 1
  private nextItemId: number
  private events: SimEvent[] = []
  private nextId = 1
  private nextStaffId = 1
  private untilArrivalMs = FIRST_ARRIVAL_MS

  constructor({ rng, layout = SHOP_LAYOUT, autoSpawn = true, starter = false }: SpaSimOptions) {
    this.rng = rng
    this.autoSpawn = autoSpawn
    this.starter = starter ? newStarter() : pastStarter()
    this.crew = {
      sim: this,
      rng,
      emit: e => this.emit(e),
      walkTo: (m, isGoal) => this.walkTo(m, isGoal),
      sendToBed: (c, station) => this.sendToBed(c, station),
      payFor: (c, station, stars, technician) => this.payFor(c, station, stars, technician),
      takeStaffId: () => this.nextStaffId++,
    }
    this.base = shellOf(layout)
    this.shell = towerOf(this.base)
    this.items = itemsFromLayout(layout)
    this.nextItemId = this.items.length + 1
    this.rebuildRoom()
    this.owner = { pos: this.ownerStart(), facing: this.ownerStartFacing(), path: [], task: null }
  }

  get money(): number {
    return this.purse.money
  }

  set money(v: number) {
    this.purse.money = v
  }

  /** A branch of the main shop at `place`: the first day's room with the place's own decor, its own staff, stock and customers, drawing from its own stream, on the same day and minute, paid from the main shop's purse. */
  static newBranch(place: PlaceId, main: SpaSim, rng: Rng): SpaSim {
    const branch = new SpaSim({ rng, layout: BRANCH_LAYOUT, autoSpawn: main.autoSpawn })
    branch.place = place
    branch.day = main.day
    branch.clock.minutes = main.clock.minutes
    branch.services = [...main.services]
    branch.shopName = main.shopName
    branch.ownerLook = { ...main.ownerLook }
    branch.ownerOutfit = main.ownerOutfit
    branch.profileDone = main.profileDone
    branch.purse = main.purse
    branch.pets = branchPetBook()
    const decor = PLACE_DECOR[place]
    branch.items.push({ id: branch.nextItemId++, kind: decor.kind, x: decor.x, y: decor.y, flip: false, gift: true })
    branch.rebuildRoom()
    refreshCandidates(branch.crew)
    return branch
  }

  /** Runs `ms` of game time in STEP_MS steps; returns the ms it really stepped, which is less when the shop is paused, serving or over. */
  advance(ms: number): number {
    let ran = 0
    for (let left = ms; left > 0; left -= STEP_MS) {
      const dt = Math.min(STEP_MS, left)
      if (!this.step(dt)) break
      ran += dt
    }
    return ran
  }

  /** Per-frame entry point; a huge delta (phone was locked) is clamped. Returns the ms really stepped. */
  update(dtMs: number): number {
    return this.advance(Math.min(dtMs, MAX_FRAME_MS))
  }

  /** True when a technician who is not being let go works here. */
  hasTechnician(): boolean {
    return this.staff.some(s => s.role === 'technician' && !s.leaving)
  }

  /** The customer the owner is walking to a bed, if any. */
  private walkingToBed(): Customer | undefined {
    const task = this.owner.task
    return task?.kind === 'serve' ? this.customers.find(c => c.id === task.customerId && c.state === 'toStation') : undefined
  }

  /** How many customers would be sent away if the owner left now: none with a technician, else everyone arriving, walking to a seat or waiting, and the one the owner is walking to a bed. */
  leaversIfOwnerGoes(): number {
    if (this.hasTechnician()) return 0
    const toBed = this.walkingToBed()
    return this.customers.filter(c => c === toBed || WAITING_STATES.includes(c.state)).length
  }

  /** The owner goes: a walk to a bed is undone, the owner's task ends, and with no technician the shop's customers leave quietly. */
  ownerLeaves(): void {
    const walking = this.walkingToBed()
    if (walking) {
      const station = this.stations.find(s => s.id === walking.stationId)
      if (station) station.customerId = null
      walking.stationId = null
      if (this.stockTracked()) for (const item of STOCK_USES[walking.service]) this.stock[item]++
      const seat = this.seats.find(s => s.customerId === null)
      if (seat) seat.customerId = walking.id
      this.sendToSeat(walking, seat ? seat.tile : this.standSpot())
    }
    this.owner.task = null
    this.owner.path = []
    this.ownerHere = false
    if (!this.hasTechnician()) this.leaveQuietly()
  }

  private oldestDesk(): Item | undefined {
    return this.items.filter(i => i.kind === 'desk').sort((a, b) => a.id - b.id)[0]
  }

  /** Where the owner starts each day: behind the oldest desk; the old start for a layout with no desk. */
  ownerStart(): Tile {
    const desk = this.oldestDesk()
    return (desk && deskSpot(desk)) || { ...OWNER_START }
  }

  /** The way the owner starts the day: toward the oldest desk, down for one that is not turned. */
  ownerStartFacing(): Facing {
    const desk = this.oldestDesk()
    if (!desk?.turned) return 'down'
    return desk.flip ? 'left' : 'right'
  }

  /** The owner is back: at the start, facing the desk, with nothing to do. */
  ownerArrives(): void {
    this.owner = { pos: this.ownerStart(), facing: this.ownerStartFacing(), path: [], task: null }
    this.ownerHere = true
  }

  /** Sends the owner to the door for the restaurant; false while she fetches or serves someone. */
  ownerWalksOut(): boolean {
    if (this.owner.task || this.servingCustomerId !== null) return false
    this.owner.path = findPath(this.grid, this.ownerTile(), t => tileEq(t, this.grid.door)) ?? []
    return true
  }

  ownerAtDoor(): boolean {
    return this.owner.path.length === 0 && tileEq(this.ownerTile(), this.grid.door)
  }

  /** The owner is back from the restaurant: at the door, facing in, with nothing to do. */
  ownerWalksIn(): void {
    this.owner = { pos: { ...this.grid.door }, facing: 'up', path: [], task: null }
  }

  /** Everyone is gone at once and the staff's tasks are repaired; the shop can then end its day. */
  clearOut(): void {
    this.customers = []
    for (const s of this.seats) s.customerId = null
    for (const s of this.stations) s.customerId = null
    repairAfterLoad(this.crew)
  }

  /** Customers not yet in service walk out with no review, no count and no lost visit. */
  private leaveQuietly(): void {
    for (const c of this.customers) {
      if (!WAITING_STATES.includes(c.state)) continue
      this.freeSeat(c)
      c.mood = null
      this.startLeaving(c)
    }
  }

  /** The owner's look and the shop's name, chosen when the shop is made. */
  setProfile(look: Look, name: string): void {
    this.ownerLook = { ...look }
    this.shopName = cleanShopName(name, this.shopName)
    this.profileDone = true
  }

  hintDone(id: HintId): boolean {
    return this.place !== null || this.hints.includes(id)
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
    if (this.place !== null) return 'main'
    if (this.money < 0) return 'debt'
    if (isLessonService(id)) return 'lesson'
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
    return this.place === null && this.services.includes('massage')
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
    this.advanceStarter()
    return null
  }

  lessonState(id: LessonService): LessonState {
    if (this.services.includes(id)) return 'yes'
    return this.lessonsPaid.includes(id) ? 'paid' : 'no'
  }

  /** What stops the lesson now, or null. Once the tuition is paid the lesson can always go on, whatever the stars. */
  lessonProblem(id: LessonService): LessonProblem | null {
    if (this.place !== null) return 'main'
    if (this.lessonState(id) !== 'no') return null
    if (this.rank.stars < LESSON_STARS[id]) return 'stars'
    if (!this.services.includes('massage')) return 'order'
    if (this.money < 0) return 'debt'
    return this.money < SERVICES[id].openCost ? 'money' : null
  }

  /** Takes the tuition once (never in the day's figures). A paid or learned lesson costs nothing. */
  payLesson(id: LessonService): LessonProblem | null {
    const problem = this.lessonProblem(id)
    if (problem) return problem
    if (this.lessonState(id) === 'no') {
      this.money -= SERVICES[id].openCost
      this.lessonsPaid.push(id)
    }
    return null
  }

  /** The lesson is passed: opens the service and puts its bed in the gift box. Throws unless the tuition is paid. */
  passLesson(id: LessonService): void {
    if (this.lessonState(id) !== 'paid') throw new Error(`Lesson ${id} is not paid`)
    this.services = SERVICE_IDS.filter(x => x === id || this.services.includes(x))
    this.lessonsPaid = this.lessonsPaid.filter(x => x !== id)
    this.book.gifts.push(SERVICES[id].bed)
  }

  /** The first lesson the shop could take now (money may still be short); null when there is none. */
  learnable(): LessonService | null {
    return LESSON_SERVICES.find(id => {
      if (this.lessonState(id) !== 'no') return false
      const p = this.lessonProblem(id)
      return p === null || p === 'debt' || p === 'money'
    }) ?? null
  }

  /** The services customers can ask for: open, with at least one bed. */
  availableServices(): ServiceId[] {
    return SERVICE_IDS.filter(id => this.services.includes(id) && this.items.some(i => i.kind === SERVICES[id].bed))
  }

  /** Today's festival service: the one on this month's festival quest, else the nearest the shop has; null outside a festival. */
  festivalServiceToday(): ServiceId | null {
    const f = this.place === null ? festivalOf(this.day) : null
    if (!f) return null
    const m = this.progress.monthly
    if (m?.festival === f && m.service && this.progress.monthFrom === monthStart(this.day)) return m.service
    return festivalService(f, this.availableServices())
  }

  /** True when the shop can do a service that runs on power, so a power cut would matter. */
  hasMachines(): boolean {
    return this.availableServices().some(id => MACHINES.includes(id))
  }

  /** True while today's power cut is on. */
  powerOut(): boolean {
    return powerOutAt(this.eventBook, this.day, this.clock.minutes)
  }

  /** True when the service runs on power and the power is out: nobody new starts on it. */
  machineDown(service: ServiceId): boolean {
    return this.powerOut() && MACHINES.includes(service)
  }

  /** True on the days after Mi Mi's, or a star's, 3 stars. */
  hotToday(): boolean {
    return hotOn(this.eventBook, this.day)
  }

  /** What the gap between two customers is multiplied by today: shorter in a festival or a hot day, once when both. */
  eventArrivalFactor(): number {
    if (this.place !== null) return 1
    return Math.min(festivalOf(this.day) ? FESTIVAL_ARRIVAL : 1, this.hotToday() ? HOT_ARRIVAL : 1)
  }

  /** What the gap between two customers is multiplied by: a branch's place sets its own, the main shop has the events'. */
  arrivalFactor(): number {
    return this.place === null ? this.eventArrivalFactor() : 1 / PLACES[this.place].arrival
  }

  /** What a new customer's patience (not a VIP's) is multiplied by today: longer in a festival or a hot day, to go with the crowd. */
  private eventPatienceFactor(): number {
    if (this.place !== null) return 1
    return festivalOf(this.day) || this.hotToday() ? FESTIVAL_PATIENCE : 1
  }

  /**
   * Draws what it is not given, in this order: look, then kind, then service.
   * A regular comes with their own look and kind and asks for their favourite while the shop has it, so draws at most the service.
   * A VIP comes the same way and asks for her own service; her patience is VIP_PATIENCE of the plain one, with nothing for the early days or her kind.
   * Mi Mi comes in her own look as an office worker, draws only her service, and gets no festival or hot-day patience.
   * An idol comes like a VIP, in their own look as a celebrity with a VIP's patience, and always asks for their own service, so draws nothing.
   */
  spawnCustomer(opts: { kind?: CustomerKind; service?: ServiceId; regular?: RegularId; vip?: VipId; idol?: IdolId; kol?: boolean } = {}): Customer {
    const greeter = greeterAtDesk(this.crew)
    const greetFactor = greeter ? greeterPatience(greeter) : 1
    const vipSpec = opts.vip && VIPS[opts.vip]
    const idolSpec = opts.idol && IDOLS[opts.idol]
    const spec = opts.regular && REGULARS[opts.regular]
    const state = opts.regular && this.book.regulars[opts.regular]
    const kol = opts.kol === true
    const look = vipSpec ? { ...vipSpec.look } : idolSpec ? { ...idolSpec.look } : spec ? { ...spec.look } : kol ? { ...KOL_LOOK } : randomLook(this.rng)
    const kind = vipSpec || idolSpec ? VIP_KIND : spec ? spec.kind : kol ? 'office' : (opts.kind ?? drawKind(this.day, this.rng, rivalToday(this.eventBook, this.day) ? RIVAL_PICKY_FACTOR : 1, this.place ? PLACE_KINDS[this.place] : undefined))
    const available = this.availableServices().filter(id => !this.machineDown(id))
    const likes = vipSpec ? vipSpec.service : spec ? spec.likes : null
    // in a festival half the plain customers ask for its service, while fewer wait for it than it has beds,
    // so a shop with one bed of it gets no queue that sends customers off angry
    const festive = vipSpec || idolSpec || spec || kol ? null : this.festivalServiceToday()
    // the starter chain's mask gift: the first plain customer once a mask bed is down asks for mask
    const maskFirst = !opts.service && !vipSpec && !idolSpec && !spec && !kol && this.starter.maskNext && available.includes('mask')
    if (maskFirst) this.starter.maskNext = false
    const service =
      opts.service ??
      (idolSpec
        ? idolSpec.service
        : maskFirst
          ? 'mask'
          : likes && available.includes(likes)
            ? likes
            : festive && available.includes(festive) && this.waitingFor(festive) < this.bedsOf(festive) && this.rng() < FESTIVAL_SERVICE_CHANCE
              ? festive
              : drawService(kind, available, this.rng))
    const patience = Math.round(
      vipSpec || idolSpec
        ? PATIENCE_MS * VIP_PATIENCE * greetFactor
        : PATIENCE_MS * dayEase(this.day).patience * greetFactor * KINDS[kind].patience * (state && isMember(state) ? MEMBER_PATIENCE : 1) * (kol ? 1 : this.eventPatienceFactor()),
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
      idol: opts.idol ?? null,
      kol,
    }
    this.customers.push(c)
    this.emit({ type: 'customerArrived', id: c.id })
    if (opts.regular && state) {
      const first = !state.met
      state.met = true
      state.visitAt = null
      this.emit({ type: 'regularArrived', customerId: c.id, regular: opts.regular, first })
    }
    if (kol) {
      if (this.eventBook.plan?.kind === 'kol' && this.eventBook.plan.day === this.day) this.eventBook.plan = null
      this.emit({ type: 'kolArrived', customerId: c.id })
    }
    if (opts.vip) {
      const v = this.vip.vips[opts.vip]
      const first = v.visits === 0
      v.visits++
      if (this.vip.booking?.vip === opts.vip) this.vip.booking = null
      this.emit({ type: 'vipArrived', customerId: c.id, vip: opts.vip, first })
    }
    if (opts.idol) {
      const s = this.idol.idols[opts.idol]
      const first = s.visits === 0
      s.visits++
      if (this.idol.booking?.idol === opts.idol) this.idol.booking = null
      this.emit({ type: 'idolArrived', customerId: c.id, idol: opts.idol, first })
    }
    if (greeter) greet(this.crew, greeter, c.id)
    return c
  }

  ownerTile(): Tile {
    return tileOf(this.owner.pos)
  }

  /** A tap on the shop floor: fetch the waiting customer sitting there, offer a bed on an open bed slot, or walk there. */
  tapTile(t: Tile): void {
    if (!this.ownerHere || this.ownerNextDoor || this.paused || this.dayOver || this.servingCustomerId !== null || this.owner.task?.kind === 'serve') return
    const from = this.ownerTile()

    const waiting = this.customers.find(c => c.state === 'waiting' && c.seat && tileEq(c.seat, t))
    if (waiting) {
      if (this.machineDown(waiting.service)) {
        this.emit({ type: 'toast', key: 'powerWait' })
        return
      }
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

  /**
   * The customer pays, reviews and leaves; `technician` is null when the owner did the work. A VIP pays VIP_PRICE_FACTOR times the graded price,
   * and an idol IDOL_PRICE_FACTOR times, but both tip on the plain graded one.
   * Anyone else pays FESTIVAL_PRICE times the graded price for the festival service, and tips on that.
   */
  private payFor(c: Customer, station: Station, stars: Stars, technician: Staff | null): void {
    const plain = this.place ? placePrice(SERVICES[c.service].price, this.place) : rankPrice(SERVICES[c.service].price, this.rank.stars)
    const base = !c.vip && !c.idol && c.service === this.festivalServiceToday() ? Math.round(plain * FESTIVAL_PRICE) : plain
    const price = c.idol ? plain * IDOL_PRICE_FACTOR : c.vip ? plain * VIP_PRICE_FACTOR : base
    const spec = KINDS[c.kind]
    // a customer served while the power is out tips half again
    const tip = Math.round(
      tipFor(base, stars) * spec.tip[stars - 1] * (tipFactor(c.greet, technician?.stats.friendly ?? null) + (technician?.trait === 'jolly' ? JOLLY_TIP : 0)) * (this.powerOut() ? POWER_TIP_FACTOR : 1),
    )
    this.money += price + tip
    this.stats.income += price
    this.stats.tips += tip
    this.stats.served++
    if (technician === null && !c.vip && !c.idol && !c.kol) this.stats.ownerServed++
    this.emit({ type: 'paid', customerId: c.id, amount: price, tip, tile: station.bed })
    // the owner's three stars now and then bring a generous customer, who adds to the tip after the bill until it is GENEROUS_TIP times over;
    // drawn on a stream of its own so the shop's draws stay as they were
    if (technician === null && stars === 3 && tip > 0 && !c.vip && !c.idol && !c.kol && createRng(this.day * 5303 + c.id)() < GENEROUS_CHANCE) {
      const extra = tip * (GENEROUS_TIP - 1)
      this.money += extra
      this.stats.tips += extra
      this.emit({ type: 'generous', customerId: c.id, amount: extra, tile: station.bed })
    }
    // a picky customer grades like anyone else after a calm technician, or on the rival's day, so the rival costs no stars
    const fair = technician?.trait === 'calm' || rivalToday(this.eventBook, this.day)
    this.addReview(c, reviewScore(stars, spec.grading === 'harsh' && c.kind === 'picky' && fair ? 'normal' : spec.grading))
    if (stars === 3 && rivalToday(this.eventBook, this.day)) this.rivalScored()
    // a VIP has her own page in the book, not a place among the kinds served; so has an idol, whose 3 stars make the shop hot from the next morning
    if (c.vip) {
      const r = scoreVip(this.vip, this.book.gifts, c.vip, stars)
      this.emit({ type: 'vipServed', customerId: c.id, vip: c.vip, stars, photo: r.photo, board: r.board })
    } else if (c.idol) {
      const r = scoreIdol(this.idol, this.book.gifts, c.idol, stars)
      this.emit({ type: 'idolServed', customerId: c.id, idol: c.idol, stars, photo: r.photo, wall: r.wall })
      if (stars === 3) makeHot(this.eventBook, this.day, c.idol)
    } else if (isMainKind(c.kind)) noteServed(this.book, c.kind)
    // Mi Mi posts her video after 3 stars, and the shop is hot from the next morning
    if (c.kol) {
      if (stars === 3) {
        makeHot(this.eventBook, this.day, 'kol')
        this.emit({ type: 'kolPosted', customerId: c.id })
      } else this.emit({ type: 'kolLeft', customerId: c.id })
    }
    let hearts = 0
    if (c.regular) {
      const r = addVisit(this.book, c.regular, stars, technician === null, this.day)
      hearts = r.hearts
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
    // counted last, so a quest this visit finishes is told after everything else it brought
    this.count(t => {
      t.served++
      t.earned += price + tip
      t.tips += tip
      t.services[c.service]++
      if (technician) t.staff++
      else if (stars === 3) t.owner3++
      if (hearts) t.hearts++
    })
    c.mood = stars >= 2 ? 'happy' : 'ok'
    station.customerId = null
    c.stationId = null
    this.startLeaving(c)
  }

  /** Where the receptionist stands: the first floor tile beside the desk, nearest the owner's start; the start itself if there is none. */
  receptionSpot(): Tile {
    return receptionSpot(this.crew)
  }

  /** True for a VIP, an idol or Mi Mi who found every seat taken and waits on their feet by the desk. */
  isStanding(c: Customer): boolean {
    return (c.vip !== null || c.idol !== null || c.kol) && c.seat !== null && !this.seats.some(s => s.customerId === c.id)
  }

  /** True while a VIP or an idol is in the shop, walking out included: whoever of them is due next waits outside. */
  private ownerOnlyHere(): boolean {
    return this.customers.some(c => c.vip !== null || c.idol !== null)
  }

  /**
   * Where a VIP or a star stands when every seat is taken: in walking order from the door, the first plain floor beside the desk
   * (never a bed's work tile) that is not the receptionist's spot, the desk's spot or the door; with none, the first floor in from the door.
   */
  private standSpot(): Tile {
    const floor = flood(this.grid, this.grid.door, t => isWalkable(this.grid, t)).filter(t => !tileEq(t, this.grid.door))
    const desk = this.receptionSpot()
    const byDesk = floor.find(t => this.grid.cells[t.y][t.x] === 'floor' && !tileEq(t, desk) && !tileEq(t, this.ownerStart()) && this.grid.desks.some(d => manhattan(d, t) === 1))
    return byDesk ?? floor[0]
  }

  /** An event's reward: EVENT_REWARD_FACTOR plain daily quests' worth. */
  private eventReward(): number {
    return EVENT_REWARD_FACTOR * baseReward(averageDay(this.progress.recent))
  }

  /** The 3-star customers the rival's challenge asks for today; recent days change only at day end, so it holds all day. */
  rivalTarget(): number {
    return rivalTarget(this.progress.recent)
  }

  /** One more 3-star customer on the rival's day; reaching the target pays once, since the count only grows. */
  private rivalScored(): void {
    this.eventBook.count++
    if (this.eventBook.count !== this.rivalTarget()) return
    const reward = this.eventReward()
    this.money += reward
    this.stats.quests += reward
    this.emit({ type: 'rivalBeaten', reward })
  }

  /**
   * The inspector's three checks: no stock item running low, nobody gone since the morning (the noWalk quest's count),
   * and beauty from INSPECT_BEAUTY. All three pay an event's reward, and the first pass brings the Giấy khen. Nothing is ever taken.
   */
  private inspect(): void {
    const book = this.eventBook
    book.inspected = true
    const lowItem = this.lowStock()[0]
    const lost = this.stats.angry + this.stats.walkedAway
    const beauty = this.beauty()
    const checks = { stock: lowItem === undefined, calm: lost === 0, tidy: beauty >= INSPECT_BEAUTY }
    const pass = checks.stock && checks.calm && checks.tidy
    const reward = pass ? this.eventReward() : 0
    const cert = pass && !book.certGiven
    this.money += reward
    this.stats.quests += reward
    if (cert) {
      book.certGiven = true
      this.book.gifts.push('certificate')
    }
    this.emit({ type: 'inspected', checks, low: lowItem ? { item: lowItem, count: this.stock[lowItem] } : null, lost, beauty, reward, cert })
  }

  /** Customers who want `service` and have not reached a bed yet. */
  private waitingFor(service: ServiceId): number {
    return this.customers.filter(c => c.service === service && (c.state === 'arriving' || c.state === 'toSeat' || c.state === 'waiting')).length
  }

  private bedsOf(service: ServiceId): number {
    return this.stations.filter(s => s.service === service).length
  }

  beauty(): number {
    return beautyOf(this.items)
  }

  rating(): number | null {
    return ratingOf(this.reviews)
  }

  /** The month so far, graded part by part, for the tab. */
  rankNow(): { input: RankInput; parts: number[]; total: number } {
    const input = monthInput(this.rank, this.day, this.rating(), this.beauty(), this.services.length, this.progress.total)
    const parts = rankParts(input)
    return { input, parts, total: parts.reduce((a, b) => a + b, 0) }
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
      place: this.place,
      // Chain.toSave fills in the real one
      chain: this.place === null ? { at: null, told: false, branches: [] } : null,
      day: this.day,
      floors: this.floors,
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
      lessonsPaid: this.lessonsPaid,
      stock: this.stock,
      book: this.book,
      vip: this.vip,
      idol: this.idol,
      recipes: this.recipes,
      progress: this.progress,
      badges: this.badges,
      festival: this.festival,
      events: this.eventBook,
      rank: this.rank,
      ownerOutfit: this.ownerOutfit,
      outfitsSeen: this.outfitsSeen,
      away: this.away,
      starter: this.starter,
      pets: this.pets,
      houses: this.houses,
      savedAt: null,
    })
  }

  /** Rebuilds a saved shop, unpaused; re-announces a pending service or an ended day so the view reopens it. */
  static fromSave(data: SaveData, options: SpaSimOptions): SpaSim {
    const d = structuredClone(data)
    // a branch is built on its own room, and knows its place before anything else is read
    const sim = new SpaSim(d.place === null ? options : { ...options, layout: BRANCH_LAYOUT })
    sim.place = d.place
    // furniture off the grid or on a wall or the door cannot be laid out; overlaps and paths are not checked here
    sim.floors = d.floors
    // furniture in a house not bought is on a wall
    sim.houses = d.houses
    sim.rebuildShell()
    const shell = parseLayout(sim.shell)
    // an older shop may have furniture where the stairs now are: it goes first, with a refund
    const note = d.clearStairs ? clearStairs(d, shell) : null
    const stray = d.items.find(i => offFloor(shell, i, sim.floors))
    if (stray) throw new SaveError(`item ${stray.id} is off the floor`)
    const onFoot = d.items.find(i => claimed(i).some(t => shell.feet.some(f => tileEq(f, t))))
    if (onFoot) throw new SaveError(`item ${onFoot.id} is on the foot of the stairs`)
    sim.items = d.items
    // never hand out an id a damaged save already uses
    sim.nextItemId = Math.max(d.nextItemId, ...d.items.map(i => i.id + 1))
    sim.services = d.services
    sim.lessonsPaid = d.lessonsPaid
    sim.stock = d.stock
    sim.book = d.book
    sim.vip = d.vip
    sim.idol = d.idol
    sim.recipes = d.recipes
    sim.progress = d.progress
    sim.badges = d.badges ?? {}
    sim.festival = d.festival
    sim.eventBook = d.events
    sim.rank = d.rank
    sim.ownerOutfit = d.ownerOutfit
    sim.outfitsSeen = d.outfitsSeen
    sim.away = d.away
    // the starter chain is the main shop's: a branch's has always passed
    sim.starter = d.place === null ? d.starter : pastStarter()
    sim.pets = d.place === null ? d.pets : branchPetBook()
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
    if (note) {
      sim.settleCharacters()
      for (const id of note.leavers) sim.startLeaving(sim.customers.find(c => c.id === id)!)
      if (note.count > 0 || note.rebuy) sim.emit({ type: 'stairsCleared', count: note.count, refund: note.refund, gifts: note.gifts, rebuy: note.rebuy })
    }

    const serving = sim.customers.find(c => c.id === d.servingCustomerId)
    if (serving && serving.stationId !== null) sim.emit({ type: 'serviceReady', customerId: serving.id, stationId: serving.stationId })
    if (d.badges === null) sim.findBadges()
    sim.catchUpQuests()
    if (sim.dayOver) sim.emit({ type: 'dayEnded', stats: { ...sim.stats } })
    return sim
  }

  startDay(): void {
    // the day that closed is judged now, not at its end, so a shop reopened on the summary still announces its badges
    this.checkBadges()
    this.day++
    this.clock.reset()
    this.stats = emptyStats()
    this.dayOver = false
    this.untilArrivalMs = FIRST_ARRIVAL_MS
    // spec 7.3: each day starts with the owner behind the reception desk
    this.owner = { pos: this.ownerStart(), facing: this.ownerStartFacing(), path: [], task: null }
    startDay(this.crew)
    // a branch has no regulars, quests, rank or events of its own; its day's count still starts here, for its away book
    if (this.place !== null) {
      this.progress.dayStart = structuredClone(this.progress.total)
      return
    }
    planDay(this.book, this.day, this.rng)
    // chú Sáu, met on a new shop's first day, comes back on its second, at a minute drawn from a stream of its own;
    // missed then, he waits for the regulars' own days
    const sau = this.book.regulars.sau
    if (this.day === 2 && sau.met) sau.visitAt = visitMinute(createRng(this.day * 3301 + this.nextId))
    else if (this.day < REGULARS_FROM_DAY) sau.visitAt = null
    clearStale(this.vip, this.day)
    clearIdolStale(this.idol, this.day)
    const book = this.eventBook
    if (book.plan && book.plan.day < this.day) book.plan = null
    book.count = 0
    book.inspected = false
    this.progress.dayStart = structuredClone(this.progress.total)
    if (dayOfMonth(this.day) === 1) this.rank.month = { from: this.day, served: this.progress.total.served, lost: this.progress.total.lost }
    this.checkBadges()
    if (this.questsOpen()) {
      const rng = this.questRng()
      rollDay(this.progress, this.day, this.questShop(), 1, rng)
      // quests opened early by the starter chain can roll a plain month quest the day before the first festival: it rolls again for the festival
      const festival = festivalOf(this.day)
      if (this.progress.monthFrom !== monthStart(this.day) || (festival && this.progress.monthly?.festival !== festival)) {
        const last = this.progress.monthly
        rollMonth(this.progress, this.day, this.questShop(), daysLeftInMonth(this.day), rng)
        const ended = last && last.state !== 'done' ? last.festival : null
        if (dayOfMonth(this.day) === 1) this.emit({ type: 'monthStarted', month: monthOf(this.day), ended })
      }
    }
    // told after the quests are rolled, so the service is the one the month settled on
    const festival = festivalOf(this.day)
    if (festival && festival !== festivalOf(this.day - 1)) this.emit({ type: 'festivalStarted', festival, service: this.festivalServiceToday()! })
    if (book.plan?.day === this.day) this.emit({ type: 'eventToday', plan: { ...book.plan } })
    if (hotCardToday(book, this.day)) this.emit({ type: 'hotStarted', until: book.hotUntil })
  }

  /** The shop as the badges read it. */
  badgeShop(): BadgeShop {
    const regulars = REGULAR_IDS.map(id => this.book.regulars[id])
    const technicians = this.staff.filter(s => s.role === 'technician')
    return {
      served: Object.values(this.book.served).reduce((a, b) => a + b, 0) + VIP_IDS.reduce((n, id) => n + this.vip.vips[id].visits, 0) + IDOL_IDS.reduce((n, id) => n + this.idol.idols[id].visits, 0),
      owner3: this.progress.total.owner3,
      bestServed: Math.max(this.progress.life.bestServed, this.stats.served),
      cleanDay: this.progress.life.cleanDay,
      members: regulars.filter(isMember).length,
      fullHearts: regulars.filter(r => r.hearts >= HEART_AT.length).length,
      photos: VIP_IDS.filter(id => this.vip.vips[id].photo).length,
      boardHung: this.items.some(i => i.kind === 'goldBoard'),
      services: this.services.length,
      recipes: Object.values(this.recipes).filter(r => r.solved).length,
      floors: this.floors,
      beauty: this.beauty(),
      technicians: technicians.filter(s => !s.leaving).length,
      masterTier: Math.max(0, ...technicians.flatMap(s => Object.values(s.tiers))),
      money: this.money,
      bestProfit: this.progress.life.bestProfit,
      dailies: this.progress.life.dailies,
      day: this.day,
    }
  }

  /** Gives the badges the shop has just reached; they are announced only once the quest button is open. */
  private checkBadges(): void {
    if (this.place !== null) return
    for (const id of newBadges(this.badges, this.badgeShop())) {
      this.badges[id] = this.day
      if (this.questsOpen()) this.emit({ type: 'badge', id })
    }
  }

  /** Gives an old shop, on its first load since badges came, every badge it already has as Có từ trước (day 0), with no banner. */
  private findBadges(): void {
    if (this.place !== null) return
    const found = newBadges(this.badges, this.badgeShop())
    for (const id of found) this.badges[id] = 0
    if (found.length > 0 && this.questsOpen()) this.emit({ type: 'badgesFound', n: found.length })
  }

  /** The outfits the shop has, from its badges and Spa của năm wins; never stored, so nothing is ever taken away. */
  unlockedOutfits(): OutfitId[] {
    return unlockedOutfits(Object.keys(this.badges).length, this.rank.wins)
  }

  /**
   * The owner is back after `ms` away: the staff's pay goes into money and nothing else moves.
   * `tip` is true once per shop, when time away earned nothing because the last day did not qualify, once staff can be hired.
   */
  comeBack(ms: number): AwayResult {
    const paid = awayPay(this.away, ms)
    this.money += paid
    const tip = ms >= AWAY_MIN_MS && !this.away.ok && !this.away.tipSeen && this.featureOpen('staff')
    if (tip) this.away.tipSeen = true
    return { paid, places: paid > 0 ? [this.place] : [], ms, profit: awayMean(this.away), days: this.away.profits.length, capped: ms > AWAY_MAX_HOURS * 3_600_000, tip }
  }

  /** Puts an outfit on the owner; false, and no change, for one the shop does not have. */
  wearOutfit(id: OutfitId): boolean {
    if (!this.unlockedOutfits().includes(id)) return false
    this.ownerOutfit = id
    return true
  }

  /** The outfits the shop has that it has not been told about; none before the quest button opens. */
  newOutfits(): OutfitId[] {
    if (!this.questsOpen()) return []
    return this.unlockedOutfits().filter(id => !this.outfitsSeen.includes(id))
  }

  /** Records that the shop has been told about these outfits. */
  markOutfitsSeen(ids: OutfitId[]): void {
    this.outfitsSeen = OUTFIT_IDS.filter(id => this.outfitsSeen.includes(id) || ids.includes(id))
  }

  /** Whether Chú Sáu's litter waits for the shop: the main shop, from LITTER_FROM_DAY once the profile is done, while it has room for a pet. */
  litterDue(): boolean {
    return this.place === null && !this.pets.litter && this.day >= LITTER_FROM_DAY && this.profileDone && this.pets.owned.length < MAX_PETS
  }

  /** Takes Chú Sáu's litter, free: a pet of one of FREE_BREEDS named `name`; null, and no change, when the litter is not due or the breed is not on offer. */
  takeLitter(breed: BreedId, name: string): Pet | null {
    if (!this.litterDue() || !FREE_BREEDS.includes(breed)) return null
    this.pets.litter = true
    return this.addPet(breed, name)
  }

  /** Pays for a pet of `breed` named `name`; what stops it, or null. */
  adoptPet(breed: BreedId, name: string): PetProblem | null {
    if (this.place !== null) return 'main'
    if (this.pets.owned.length >= MAX_PETS) return 'full'
    const price = BREEDS[breed].price
    if (this.money < price) return 'money'
    this.money -= price
    this.addPet(breed, name)
    return null
  }

  /** Renames a pet; false, and no change, for one the shop does not have. */
  renamePet(id: number, name: string): boolean {
    const pet = this.pets.owned.find(p => p.id === id)
    if (!pet) return false
    pet.name = cleanPetName(name, PET_NAME_IDEAS[pet.breed][0])
    return true
  }

  /** Gives a pet away, with nothing paid back; false for one the shop does not have. */
  giveAwayPet(id: number): boolean {
    const before = this.pets.owned.length
    this.pets.owned = this.pets.owned.filter(p => p.id !== id)
    return this.pets.owned.length < before
  }

  private addPet(breed: BreedId, name: string): Pet {
    const pet = { id: this.pets.nextId++, breed, name: cleanPetName(name, PET_NAME_IDEAS[breed][0]) }
    this.pets.owned.push(pet)
    // a full shop has no room for the litter: it counts as taken
    if (this.pets.owned.length >= MAX_PETS) this.pets.litter = true
    return pet
  }

  /** Whether the daily quests, the badges and the outfits are open today. */
  questsOpen(): boolean {
    return this.place === null && this.featureOpen('quests')
  }

  /** Whether the quest button is open: from the first day for a shop that runs the starter chain, to show its goals. */
  questsButtonOpen(): boolean {
    return this.questsOpen() || !isPast(this.starter)
  }

  /** The day a feature opens: its day, or sooner by the starter chain, whose last goal opens the quests from the next day. */
  openDay(f: Feature): number {
    const opened: Partial<Record<Feature, number>> = this.starter.opened
    const early = f === 'quests' ? (this.starter.doneDay ?? Infinity) + 1 : (opened[f] ?? Infinity)
    return Math.min(UNLOCK_DAY[f], early)
  }

  featureOpen(f: Feature): boolean {
    return this.day >= this.openDay(f)
  }

  /** The shop as the starter goals read it. */
  starterShop(): StarterShop {
    const t = this.progress.total
    return {
      served: t.served,
      owner3: t.owner3,
      bought: this.starter.bought,
      maskBedPlaced: this.items.some(i => i.kind === 'maskBed'),
      maskServed: t.services.mask,
      technicians: this.staff.filter(s => s.role === 'technician' && !s.leaving).length,
      massageOpen: this.services.includes('massage'),
      massageServed: t.services.massage,
    }
  }

  /**
   * Finishes every starter goal the shop has reached, pays each into the till and the day, and tells the view.
   * The mask gift opens mask, or pays its opening price back when it was bought, and gives a mask bed; a button a goal opens
   * before its day is named, and staff opened early brings today's candidates at once.
   */
  private advanceStarter(): void {
    if (!starterRunning(this.starter)) return
    for (const goal of settleStarter(this.starter, this.starterShop(), this.day)) {
      let reward: number = STARTER_REWARD[goal]
      if (goal === 'serveMore') {
        if (this.services.includes('mask')) reward += SERVICES.mask.openCost
        else this.services = SERVICE_IDS.filter(x => x === 'mask' || this.services.includes(x))
        this.book.gifts.push('maskBed')
        this.starter.maskNext = true
      }
      this.money += reward
      this.stats.quests += reward
      const f = STARTER_OPENS[goal]
      const opens = f && this.day < UNLOCK_DAY[f] ? f : null
      if (opens === 'staff' && this.candidatesDay !== this.day) refreshCandidates(this.crew)
      this.emit({ type: 'goalDone', goal, reward, opens })
    }
  }

  /** What the shop has right now that decides which quests it can be given. */
  questShop(): QuestShop {
    const unfinished = REGULAR_IDS.map(id => this.book.regulars[id]).filter(r => r.met && r.hearts < 5)
    const heartDue = unfinished.some(r => r.visitAt !== null)
    // quests opened early by the starter chain: before the regulars' days only a visit already due can bring a heart
    const regularsCome = monthStart(this.day) + DAYS_PER_MONTH - 1 >= REGULARS_FROM_DAY
    return {
      available: this.availableServices(),
      technicians: this.staff.filter(s => s.role === 'technician' && !s.leaving).length,
      heartable: unfinished.length > 0 && (regularsCome || heartDue),
      heartDue,
      canStudy: this.staff.some(s => !s.leaving && courses(s, this.services).length > 0),
    }
  }

  /** Swaps daily quest `i` for another, sized to what is left of the day; once a day, never a finished one, never from 20:00. */
  swapQuest(i: number): 'swaps' | 'done' | 'closed' | null {
    if (this.dayOver || this.clock.isClosed) return 'closed'
    return swap(this.progress, i, this.questShop(), (DAY_END_MIN - this.clock.minutes) / DAY_MINUTES, this.questRng(101))
  }

  /** The quest button's red dot: new quests this morning, and the panel not opened since; never with its "Mới". */
  questsDot(): boolean {
    const p = this.progress
    return this.questsOpen() && this.hintDone('openQuests') && p.seenDay !== this.day && (p.daily.length > 0 || p.monthly !== null)
  }

  markQuestsSeen(): void {
    this.progress.seenDay = this.day
  }

  /** Quests draw from a stream of their own, so the shop's draws stay as they were. */
  private questRng(salt = 0): Rng {
    return createRng(this.day * 4241 + this.nextId + salt)
  }

  /**
   * Quests that are not today's (an older shop, or one saved before quests) are given now, sized to what is left of the day and the month.
   * None while the summary is up; no daily ones with under QUEST_MIN_LEFT_MIN left.
   */
  private catchUpQuests(): void {
    const p = this.progress
    if (!this.questsOpen() || this.dayOver) return
    const left = DAY_END_MIN - this.clock.minutes
    const rng = this.questRng()
    if (p.questDay !== this.day) {
      if (left >= QUEST_MIN_LEFT_MIN) rollDay(p, this.day, this.questShop(), left / DAY_MINUTES, rng)
      else Object.assign(p, { daily: [], swaps: 0, questDay: this.day })
    }
    const daysLeft = daysLeftInMonth(this.day) - 1 + left / DAY_MINUTES
    if (p.monthFrom !== monthStart(this.day) && daysLeft >= QUEST_MIN_LEFT_MIN / DAY_MINUTES) rollMonth(p, this.day, this.questShop(), daysLeft, rng)
  }

  /** Pays each finished quest into the till and the day, and tells the view; a festival quest also gives its keepsake, the first time only. */
  private payQuests(done: Quest[]): void {
    for (const q of done) {
      this.money += q.reward
      this.stats.quests += q.reward
      if (q.period === 'day') this.progress.life.dailies++
      if (q.festival) {
        const gift = !this.festival.keepsakes.includes(q.festival)
        if (gift) {
          this.festival.keepsakes.push(q.festival)
          this.book.gifts.push(FESTIVALS[q.festival].keepsake)
        }
        this.emit({ type: 'festivalQuestDone', quest: { ...q }, festival: q.festival, gift })
      } else this.emit({ type: 'questDone', quest: { ...q } })
    }
  }

  /** Free and at once: the new person stands on the door tile. Not while money is negative or the role is full (staff who are leaving do not count). */
  hire(index: number): HireProblem | null {
    const problem = hire(this.crew, index)
    if (!problem) this.advanceStarter()
    return problem
  }

  /** What `hire` would refuse with, so a button can be faded beforehand; null if the candidate can be hired. */
  hireProblem(index: number): HireProblem | null {
    return hireProblem(this.crew, index)
  }

  /** Lets someone go: today's wage is still paid. A technician with a customer finishes that customer first; everyone else walks out at once. */
  fire(id: number): void {
    fire(this.crew, id)
  }

  /** Takes in someone from another shop of the chain: a new id here, standing on the door tile with nothing to do; the morning places them as usual. */
  takeIn(s: Staff): void {
    this.staff.push({ ...s, id: this.nextStaffId++, moveTo: null, task: null, path: [], pos: { ...this.grid.door } })
  }

  /** What `study` would refuse with, so a button can be faded beforehand; null if the course can be booked. */
  studyProblem(staffId: number, course: Course): StudyProblem | null {
    return studyProblem(this.crew, staffId, course)
  }

  /** Books a night course for the person: the tuition is taken now (not counted in the day's costs), and the tier or friendliness rises when the next day starts. */
  study(staffId: number, course: Course): StudyProblem | null {
    const problem = study(this.crew, staffId, course)
    if (!problem) this.count(t => t.courses++)
    return problem
  }

  /** How many floors the shop's layout has: one, or every floor of the tower when it has stairs. */
  maxFloors(): number {
    return Math.max(1, this.grid.feet.length)
  }

  /** What stops floor `floor` being opened now, or null. */
  floorProblem(floor: number): FloorProblem | null {
    if (floor <= this.floors || floor > this.maxFloors()) return 'max'
    if (this.day < UNLOCK_DAY.floors) return 'day'
    if (floor > this.floors + 1) return 'order'
    if (!doorReach(this.grid, this.grid.door)(this.grid.feet[floor - 2])) return 'blocked'
    if (this.money < FLOOR_PRICE[floor]) return 'money'
    return null
  }

  /** Takes the price and opens the floor. */
  openFloor(floor: number): FloorProblem | null {
    const problem = this.floorProblem(floor)
    if (problem) return problem
    this.money -= FLOOR_PRICE[floor]
    this.floors = floor
    this.changeRoom()
    this.emit({ type: 'floorOpened', floor })
    return null
  }

  /** The price of the next house on `side`. */
  housePrice(side: Side): number {
    return HOUSE_PRICE[Math.min(this.houses[side], HOUSES_PER_SIDE - 1)]
  }

  /** What stops the next house on `side` being bought now, or null. */
  houseProblem(side: Side): HouseProblem | null {
    if (this.houses[side] >= HOUSES_PER_SIDE) return 'max'
    if (this.day < UNLOCK_DAY.houses) return 'day'
    if (this.money < this.housePrice(side)) return 'money'
    return null
  }

  /** True when the next house on `side` is up for sale, whether or not the shop can pay for it yet. */
  houseForSale(side: Side): boolean {
    const problem = this.houseProblem(side)
    return problem === null || problem === 'money'
  }

  /** Takes the price and opens the next house on `side` on every floor. */
  buyHouse(side: Side): HouseProblem | null {
    const problem = this.houseProblem(side)
    if (problem) return problem
    this.money -= this.housePrice(side)
    const n = (this.houses[side] + 1) as 1 | 2
    this.houses = { ...this.houses, [side]: n }
    this.rebuildShell()
    this.changeRoom()
    this.emit({ type: 'houseBought', house: { side, n } })
    return null
  }

  /** The houses the map shows: those bought, and the next one on each side while it is for sale. */
  shownHouses(): Houses {
    const shown = (side: Side) => this.houses[side] + (this.houseForSale(side) ? 1 : 0)
    return { left: shown('left'), right: shown('right') }
  }

  /** The tower shell parsed, with no furniture in it. */
  shellGrid(): Grid {
    return parseLayout(this.shell)
  }

  /** What stops a `kind` standing with its top-left on (x, y), or null; `movingId` is the item being moved, out of its own way. */
  canPlace(kind: ItemKind, x: number, y: number, flip: boolean, movingId?: number, turned = false): BuildProblem | null {
    const item = { id: movingId ?? this.nextItemId, kind, x, y, flip, ...(turned && { turned }) }
    return placementProblem('spa', parseLayout(this.shell), this.items, item, { door: this.grid.door, floors: this.floors })
  }

  buy(kind: ItemKind, x: number, y: number, flip: boolean, turned = false): BuildProblem | null {
    const price = ITEMS[kind].price
    if (this.money < price) return 'money'
    const problem = this.canPlace(kind, x, y, flip, undefined, turned)
    if (problem) return problem
    this.money -= price
    this.items.push({ id: this.nextItemId++, kind, x, y, flip, ...(turned && { turned }) })
    if (starterRunning(this.starter) && ITEMS[kind].group !== 'bed') this.starter.bought++
    this.changeRoom()
    this.advanceStarter()
    return null
  }

  /** Puts down the oldest waiting gift of `kind`, free; it stays a gift, so it can be moved but never sold. */
  placeGift(kind: ItemKind, x: number, y: number, flip: boolean, turned = false): BuildProblem | null {
    const waiting = this.book.gifts.indexOf(kind)
    if (waiting < 0) return 'gift'
    const problem = this.canPlace(kind, x, y, flip, undefined, turned)
    if (problem) return problem
    this.items.push({ id: this.nextItemId++, kind, x, y, flip, ...(turned && { turned }), gift: true })
    this.book.gifts.splice(waiting, 1)
    this.changeRoom()
    this.advanceStarter()
    return null
  }

  /** Free; the item keeps its id, so a bed keeps its station. */
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

  /** Refunds half the price; the shop always keeps one shampoo bed, one seat and one desk, and never sells a gift. */
  sell(id: number): BuildProblem | null {
    const { kind, gift } = this.itemById(id)
    if (gift) return 'gift'
    if (this.isBusy(id)) return 'busy'
    if (kind === 'bed' && this.items.filter(i => i.kind === 'bed').length === 1) return 'lastBed'
    if (ITEMS[kind].group === 'seat' && this.items.filter(i => ITEMS[i.kind].group === 'seat').length === 1) return 'lastSeat'
    if (kind === 'desk' && this.items.filter(i => i.kind === 'desk').length === 1) return 'lastDesk'
    this.money += sellRefund(kind)
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

  /** Gives each standing VIP, star or Mi Mi whose spot is now under furniture, or out of the door's reach, a new one; returns them. */
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
      if (c.stationId === null && ['arriving', 'toSeat', 'waiting'].includes(c.state) && !available.includes(c.service))
        c.service = c.idol !== null ? available[0] : drawService(c.kind, available, this.rng)
  }

  /** Builds the tower shell again from floor 1's layout and the houses bought. */
  private rebuildShell(): void {
    this.shell = towerOf(withHouses(this.base, this.houses))
  }

  /** Lays the floor out from the items again; whoever is on a bed or a seat that is still there stays on it. */
  private rebuildRoom(): void {
    this.grid = buildGrid(this.shell, this.items, this.floors)
    const byId = [...this.items].sort((a, b) => a.id - b.id)
    this.stations = byId
      .filter(item => ITEMS[item.kind].group === 'bed')
      .sort((a, b) => floorOf(a.y) - floorOf(b.y))
      .map(item => ({
        id: item.id,
        service: serviceOfBed(item.kind)!,
        bed: bedTile(item),
        work: workTile(item)!,
        customerId: this.stations.find(s => s.id === item.id)?.customerId ?? null,
      }))
    this.seats = byId.filter(item => floorOf(item.y) === 1).flatMap(seatTiles).map(tile => ({ tile, customerId: this.seats.find(s => tileEq(s.tile, tile))?.customerId ?? null }))
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

  /** One step of `dt` ms; false, having done nothing, when the shop is paused, serving or over. */
  private step(dt: number): boolean {
    if (this.paused || this.dayOver || this.servingCustomerId !== null) return false
    const before = this.clock.minutes
    this.clock.advance(dt)

    if (this.autoSpawn && !this.clock.isClosed && (this.ownerHere || this.hasTechnician())) {
      this.untilArrivalMs -= dt
      if (this.untilArrivalMs <= 0) {
        // a regular whose hour has come takes the place of a stranger, but only when a seat is left for her once
        // everyone walking in has sat down, so a full shop never uses up her visit; until then she stays due
        const due = dueRegular(this.book, this.clock.minutes)
        const seatLeft = this.seats.filter(s => s.customerId === null).length > this.customers.filter(c => c.state === 'arriving').length
        // a shop on the starter chain opens with chú Sáu
        const opening = starterRunning(this.starter) && !this.book.regulars.sau.met
        this.spawnCustomer(opening ? { regular: 'sau' } : due && seatLeft ? { regular: due } : {})
        this.untilArrivalMs = arrivalGapMs(
          arrivalIntervalMs(this.rating()) * dayEase(this.day).arrival * beautyArrivalFactor(this.beauty()) * serviceArrivalFactor(this.availableServices()) * this.arrivalFactor(),
          this.rng(),
        )
      }
      // chú Sáu's gift: one customer more a day
      if (this.book.extraAt !== null && this.clock.minutes >= this.book.extraAt) {
        this.book.extraAt = null
        this.spawnCustomer()
      }
      // a booked VIP comes at her minute, on top of the usual arrivals; with an idol in, she waits outside until they have left
      const b = dueVip(this.vip, this.day, this.clock.minutes)
      if (b && !this.ownerOnlyHere()) this.spawnCustomer({ vip: b.vip })
      // so does a booked idol, waiting outside while a VIP is in; one whose service the shop no longer has does not come
      const due = dueIdol(this.idol, this.day, this.clock.minutes)
      if (due && !this.ownerOnlyHere()) {
        if (this.availableServices().includes(IDOLS[due.idol].service)) this.spawnCustomer({ idol: due.idol })
        else this.idol.booking = null
      }
      // so does Mi Mi
      if (dueKol(this.eventBook, this.day, this.clock.minutes)) this.spawnCustomer({ kol: true })
    }
    // the inspector looks round once, at the first step at or after the planned minute
    const plan = this.eventBook.plan
    if (!this.eventBook.inspected && plan?.kind === 'inspect' && plan.day === this.day && this.clock.minutes >= plan.minute) this.inspect()
    // the power cut is told as the clock crosses each of its minutes, so a shop loaded mid-cut says nothing again
    if (plan?.kind === 'power' && plan.day === this.day) {
      const crossed = (m: number) => before < m && this.clock.minutes >= m
      // the warning names the machines that will rest, so a shop that sold its last one since the announcement gets none
      const machines = this.availableServices().filter(id => MACHINES.includes(id))
      if (crossed(POWER_FROM_MIN - POWER_WARN_MIN) && machines.length > 0) this.emit({ type: 'powerWarn', machines })
      if (crossed(POWER_FROM_MIN)) this.emit({ type: 'powerOff' })
      if (crossed(POWER_TO_MIN)) this.emit({ type: 'powerOn' })
    }

    moveAlong(this.owner, OWNER_SPEED, dt)
    for (const s of this.staff) moveAlong(s, staffWalkSpeed(s), dt)
    for (const c of [...this.customers]) this.updateCustomer(c, dt)
    this.updateOwnerTask()
    for (const s of this.staff) updateStaff(this.crew, s, dt)
    if (!this.ownerHere) {
      if (!this.hasTechnician()) this.leaveQuietly()
      for (const item of this.lowStock()) if (this.money >= RESTOCK_PRICE[item]) this.restock(item)
    }
    this.checkBadges()

    if (this.clock.isClosed && this.customers.length === 0 && this.servingCustomerId === null && !this.keepOpen()) {
      this.dayOver = true
      payWages(this.crew)
      this.payQuests(closeNoWalk(this.progress))
      recordDay(this.progress, this.stats, festivalOf(this.day) !== null || this.hotToday(), this.day)
      closeAwayDay(this.away, dayProfit(this.stats), this.stats.ownerServed, this.progress.dayStart ? this.progress.total.staff - this.progress.dayStart.staff : 0)
      if (this.place === null && isJudgeDay(this.day)) {
        this.money += judgeMonth(this.rank, this.rankNow().input, this.day).reward
        if (isYearEnd(this.day)) {
          const year = judgeYear(this.rank, this.day)
          if (year) {
            this.money += year.reward
            this.book.gifts.push(...year.gifts)
          }
        }
      }
      // tomorrow's VIP, then tomorrow's idol, then tomorrow's event on any day neither comes, each drawn from a stream of its own so the shop's draws stay as they were
      if (this.place === null) {
        const technicians = this.staff.filter(s => s.role === 'technician' && !s.leaving).length
        planBooking(this.vip, this.day, technicians, this.availableServices(), createRng(this.day * 7919 + this.nextId))
        planIdol(this.idol, this.day, this.vip.boardGiven, technicians, this.availableServices(), this.vip.booking, createRng(this.day * 8737 + this.nextId))
        const booked = this.vip.booking?.day === this.day + 1 || this.idol.booking?.day === this.day + 1
        planEvent(this.eventBook, this.day, booked ? this.day + 1 : null, this.hasMachines(), createRng(this.day * 6151 + this.nextId))
      }
      this.emit({ type: 'dayEnded', stats: { ...this.stats } })
    }
    return true
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
        // nobody loses patience while the power is out
        if (!this.powerOut()) c.patienceMs -= dt
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
          this.onCustomerGone?.(c)
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
      if (this.machineDown(c.service)) {
        this.emit({ type: 'toast', key: 'powerWait' })
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

  /** Sends the customer to the first free seat; with every seat taken a VIP or an idol stands by the desk, and anyone else walks out. */
  private seatCustomer(c: Customer): void {
    const seat = this.seats.find(s => s.customerId === null)
    if (!seat && c.vip === null && c.idol === null && !c.kol) {
      this.emit({ type: 'noSeat', id: c.id })
      this.stats.walkedAway++
      this.count(t => t.lost++)
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
    // Mi Mi walking out costs nothing (spec 7.5): no angry customer on the summary, no lost one for the quests or the clean day
    if (c.kol) this.emit({ type: 'kolLeft', customerId: c.id })
    else {
      this.stats.angry++
      this.count(t => t.lost++)
    }
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

  /** The customer's review, once or twice by their kind; VIP_REVIEWS times from a VIP or an idol. */
  private addReview(c: Customer, score: number): void {
    // Mi Mi's word goes into her video, never into the shop's stars
    if (c.kol) return
    for (let i = 0; i < (c.vip || c.idol ? VIP_REVIEWS : KINDS[c.kind].reviews); i++) {
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

  /** Moves the running counts, then pays any quest or starter goal they finish; every count goes through here. */
  private count(apply: (t: Counts) => void): void {
    apply(this.progress.total)
    this.payQuests(settle(this.progress))
    this.advanceStarter()
  }

  private emit(e: SimEvent): void {
    this.events.push(e)
  }
}
