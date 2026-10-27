import { CANDIDATES_PER_DAY, OWNER_START, REGULAR_OWNER_MS, STAFF_CAP, STAFF_REST_MS, UNLOCK_DAY } from '../config'
import { flood } from './build'
import type { Stars } from './economy'
import { besideSeat, isWalkable, manhattan, tileEq, tileOf } from './grid'
import { footprint } from './items'
import { findPath } from './path'
import type { Rng } from './rng'
import type { HireProblem, SpaSim } from './spa'
import type { ServiceId } from './services'
import { STOCK_USES, type StockItem } from './stock'
import { gainXp, makeCandidate, restAfter, serviceMs, staffStars, starSkill, type Staff } from './staff'
import type { Customer, Mover, SimEvent, Station, Tile } from './types'

/** What the staff's behaviour needs from the shop; the sim hands it the private helpers it keeps for itself. */
export interface CrewHost {
  sim: SpaSim
  rng: Rng
  emit(e: SimEvent): void
  walkTo(m: Mover, isGoal: (t: Tile) => boolean): Tile[] | null
  sendToBed(c: Customer, station: Station): void
  payFor(c: Customer, station: Station, stars: Stars, technicianFriendly: number | null): void
  takeStaffId(): number
}

/** Where the receptionist stands: the first floor tile beside the desk, nearest the owner's start; the start itself if there is none. */
export function receptionSpot({ sim }: CrewHost): Tile {
  const spot = flood(sim.grid, OWNER_START, t => isWalkable(sim.grid, t)).find(
    t => !tileEq(t, OWNER_START) && sim.grid.desks.some(d => manhattan(d, t) === 1),
  )
  return spot ?? { ...OWNER_START }
}

/**
 * Where a hired person waits: the receptionist at the desk; each technician in turn on the floor nearest the owner's start
 * that is not on, or one tile straight above or below, the owner's start, the desk spot or an earlier technician's home,
 * since the lower of two people one tile apart hides the upper one.
 */
export function homeOf(h: CrewHost, s: Staff): Tile {
  const { sim } = h
  const spot = receptionSpot(h)
  if (s.role === 'receptionist') return spot
  const k = sim.staff.filter(x => x.role === 'technician').indexOf(s)
  const floor = flood(sim.grid, OWNER_START, t => isWalkable(sim.grid, t))
  const homes: Tile[] = [OWNER_START, spot]
  for (let i = 0; i <= k; i++) {
    const next = floor.find(t => !homes.some(home => home.x === t.x && Math.abs(home.y - t.y) <= 1))
    if (!next) return spot
    homes.push(next)
  }
  return homes[homes.length - 1]
}

/** Idle, not leaving and standing on the spot. */
function atDesk(h: CrewHost, s: Staff): boolean {
  return s.task === null && s.path.length === 0 && !s.leaving && tileEq(tileOf(s.pos), receptionSpot(h))
}

/** The receptionist standing at the desk, who greets whoever arrives. */
export function greeterAtDesk(h: CrewHost): Staff | undefined {
  return h.sim.staff.find(s => s.role === 'receptionist' && atDesk(h, s))
}

/** The greeter greets a customer who just arrived: experience, and a rest if they are now tired. */
export function greet(h: CrewHost, greeter: Staff, customerId: number): void {
  h.emit({ type: 'greeted', staffId: greeter.id, customerId })
  if (earnXp(h, greeter)) startRest(h, greeter)
}

/** Three new people to hire, with names that differ from each other and from the staff's. */
export function refreshCandidates({ sim, rng }: CrewHost): void {
  const taken = sim.staff.map(s => s.name)
  sim.candidates = []
  for (let i = 0; i < CANDIDATES_PER_DAY; i++) {
    const c = makeCandidate(rng, taken)
    taken.push(c.name)
    sim.candidates.push(c)
  }
  sim.candidatesDay = sim.day
}

/** What stops the candidate being hired now: money is negative, or the role is full (staff who are leaving do not count); null if nothing. */
export function hireProblem({ sim }: CrewHost, index: number): HireProblem | null {
  if (sim.money < 0) return 'money'
  const c = sim.candidates[index]
  return sim.staff.filter(s => s.role === c.role && !s.leaving).length >= STAFF_CAP[c.role] ? 'full' : null
}

/** Free and at once: the new person stands on the door tile. */
export function hire(h: CrewHost, index: number): HireProblem | null {
  const { sim } = h
  const problem = hireProblem(h, index)
  if (problem) return problem
  const c = sim.candidates[index]
  sim.candidates.splice(index, 1)
  sim.staff.push({
    name: c.name,
    role: c.role,
    look: c.look,
    stats: c.stats,
    wage: c.wage,
    rare: c.rare,
    tiers: { ...c.tiers },
    id: h.takeStaffId(),
    level: 1,
    xp: 0,
    pos: { ...sim.grid.door },
    facing: 'up',
    path: [],
    task: null,
    sinceRest: 0,
    leaving: false,
    study: null,
  })
  const s = sim.staff[sim.staff.length - 1]
  const home = homeOf(h, s)
  s.path = findPath(sim.grid, tileOf(s.pos), t => tileEq(t, home)) ?? []
  return null
}

/**
 * Lets someone go: today's wage is still paid. A technician with a customer finishes that customer first; everyone else walks out at once.
 * After the day has ended the wages are already paid, so they just leave.
 */
export function fire(h: CrewHost, id: number): void {
  const { sim } = h
  const s = sim.staff.find(x => x.id === id)
  if (!s || s.leaving) return
  if (sim.dayOver) {
    sim.staff = sim.staff.filter(x => x !== s)
    return
  }
  s.leaving = true
  sim.stats.wages += s.wage
  if (s.task?.kind !== 'serve') startExit(h, s)
}

function startExit(h: CrewHost, s: Staff): void {
  s.task = { kind: 'exit' }
  s.path = h.walkTo(s, t => tileEq(t, h.sim.grid.door)) ?? []
}

/** Where a staff member's walk ends: beside the customer being fetched, on the work tile, at the rest spot, at the door, or where their path ended if that is still floor. */
export function staffGoal(h: CrewHost, s: Staff): ((t: Tile) => boolean) | null {
  const { sim } = h
  const task = s.task
  if (task?.kind === 'fetch') {
    const seat = sim.customers.find(c => c.id === task.customerId)?.seat
    return seat ? besideSeat(sim.grid, seat) : null
  }
  if (task?.kind === 'serve') {
    const work = sim.stations.find(x => x.id === task.stationId)?.work
    return work ? x => tileEq(x, work) : null
  }
  if (task?.kind === 'rest') {
    const spot = restSpot(h, s)
    return x => tileEq(x, spot)
  }
  if (task?.kind === 'exit') return x => tileEq(x, sim.grid.door)
  const end = s.path[s.path.length - 1]
  return end && isWalkable(sim.grid, end) ? x => tileEq(x, end) : null
}

export function updateStaff(h: CrewHost, s: Staff, dt: number): void {
  const { sim } = h
  if (s.task?.kind === 'exit') {
    if (s.path.length > 0) return
    if (!tileEq(tileOf(s.pos), sim.grid.door)) s.path = h.walkTo(s, t => tileEq(t, sim.grid.door)) ?? []
    if (s.path.length === 0) sim.staff = sim.staff.filter(x => x !== s)
    return
  }
  if (s.leaving && s.task?.kind !== 'serve') {
    startExit(h, s)
    return
  }
  if (s.task?.kind === 'rest') {
    if (s.path.length > 0) return
    s.task.leftMs -= dt
    if (s.task.leftMs <= 0) {
      s.sinceRest = 0
      s.task = null
    }
    return
  }
  if (s.role === 'technician') updateTechnician(h, s, dt)
  else if (s.task === null) walkHome(h, s)
}

/** One more customer served or greeted: experience, and a level up if it is enough. True when they are now due a rest (judged before a level up changes their stamina). */
function earnXp(h: CrewHost, s: Staff): boolean {
  s.sinceRest++
  const due = s.sinceRest >= restAfter(s)
  if (gainXp(s, h.rng)) h.emit({ type: 'levelUp', staffId: s.id, level: s.level })
  return due
}

/** Walks to the nearest floor beside a towel cabinet, or rests where they stand if there is none. */
function startRest(h: CrewHost, s: Staff): void {
  s.task = { kind: 'rest', leftMs: STAFF_REST_MS }
  const spot = restSpot(h, s)
  s.path = h.walkTo(s, t => tileEq(t, spot)) ?? []
}

/** The nearest floor, in walking order from where `s` stands, that touches a towel cabinet; where they stand if there is none. */
function restSpot({ sim }: CrewHost, s: Staff): Tile {
  const from = tileOf(s.pos)
  const cabinets = sim.items.filter(i => i.kind === 'cabinet').flatMap(footprint)
  const spot = flood(sim.grid, from, t => isWalkable(sim.grid, t)).find(t => cabinets.some(c => manhattan(c, t) === 1))
  return spot ?? from
}

/** An idle person who is not on their home tile walks there; one who is faces the door. */
function walkHome(h: CrewHost, s: Staff): void {
  if (s.path.length > 0) return
  const home = homeOf(h, s)
  if (tileEq(tileOf(s.pos), home)) {
    s.facing = 'down'
    return
  }
  s.path = h.walkTo(s, t => tileEq(t, home)) ?? []
}

function updateTechnician(h: CrewHost, s: Staff, dt: number): void {
  const { sim } = h
  const task = s.task
  if (!task) {
    if (!fetchWaiting(h, s)) walkHome(h, s)
    return
  }
  if (task.kind === 'fetch') {
    if (s.path.length > 0) return
    const c = sim.customers.find(x => x.id === task.customerId)
    const station = c && sim.stations.find(x => x.customerId === null && x.service === c.service)
    if (!c || c.state !== 'waiting' || !station || sim.missingStock(c.service)) {
      s.task = null
      return
    }
    h.sendToBed(c, station)
    s.path = h.walkTo(s, t => tileEq(t, station.work)) ?? []
    const total = serviceMs(s, c.service)
    s.task = { kind: 'serve', customerId: c.id, stationId: station.id, leftMs: total, totalMs: total }
    return
  }
  if (task.kind !== 'serve') return

  const c = sim.customers.find(x => x.id === task.customerId)
  const station = sim.stations.find(x => x.id === task.stationId)
  if (!c || !station) {
    if (station?.customerId === task.customerId) station.customerId = null
    finishWork(h, s)
    return
  }
  if (s.path.length > 0) return
  if (c.state === 'toStation' && c.path.length === 0) {
    c.state = 'inService'
    c.stateMs = 0
  }
  if (c.state !== 'inService') return
  task.leftMs -= dt
  if (task.leftMs > 0) return
  h.payFor(c, station, staffStars(starSkill(s, c.service), h.rng()), s.stats.friendly)
  finishWork(h, s, earnXp(h, s))
}

/** A service is over: walk out if being let go, rest if tired, else wait for the next customer. */
function finishWork(h: CrewHost, s: Staff, due = false): void {
  s.task = null
  if (s.leaving) startExit(h, s)
  else if (due) startRest(h, s)
}

/**
 * Starts walking to a waiting customer, if a bed of their service is free and nobody else is on the way to them;
 * false if nothing started. Whoever is past half their patience goes first, the longest wait among them; the rest by the tier she has
 * in their service, then the longest wait. A regular is left to the owner until they have had REGULAR_OWNER_MS of free-bed time.
 * A VIP is always left to the owner, and while one is in the shop and not yet sent to a bed, nobody of her service is fetched.
 */
function fetchWaiting(h: CrewHost, s: Staff): boolean {
  const { sim } = h
  const fetched = new Set<number>()
  if (sim.owner.task?.kind === 'fetch') fetched.add(sim.owner.task.customerId)
  for (const x of sim.staff) if (x.task?.kind === 'fetch') fetched.add(x.task.customerId)
  const fetchesOf = (service: ServiceId) => sim.customers.filter(c => fetched.has(c.id) && c.service === service).length
  const hasRoom = (service: ServiceId) => freeBeds(sim, service) > fetchesOf(service)
  const stockFetches = (item: StockItem) => sim.customers.filter(c => fetched.has(c.id) && STOCK_USES[c.service].includes(item)).length
  const hasStock = (service: ServiceId) => !sim.stockTracked() || STOCK_USES[service].every(item => sim.stock[item] > stockFetches(item))
  const ownersTurn = (c: Customer) => c.regular !== null && c.heldMs < REGULAR_OWNER_MS
  const queue = sim.customers.filter(c => c.state === 'waiting' && c.seat && !fetched.has(c.id) && c.vip === null)
  // a regular in her owner window keeps her place: nobody who came after her takes her service's bed meanwhile
  const heldFor = (c: Customer) => queue.some(r => ownersTurn(r) && r.service === c.service && r.stateMs >= c.stateMs)
  // a VIP's service waits for her: its beds stay free until the owner sends her to one
  const vipHeld = sim.customers.filter(c => c.vip !== null && c.stationId === null && ['arriving', 'toSeat', 'waiting'].includes(c.state)).map(c => c.service)
  const urgent = (c: Customer) => c.patienceMs < c.patienceMaxMs / 2
  const next = queue
    .filter(c => !vipHeld.includes(c.service) && !heldFor(c) && hasRoom(c.service) && hasStock(c.service))
    .sort((a, b) => Number(urgent(b)) - Number(urgent(a)) || (urgent(a) ? 0 : s.tiers[b.service] - s.tiers[a.service]) || b.stateMs - a.stateMs || a.id - b.id)[0]
  if (!next) return false
  const path = h.walkTo(s, besideSeat(sim.grid, next.seat!))
  if (!path) return false
  s.task = { kind: 'fetch', customerId: next.id }
  s.path = path
  return true
}

/** The beds of a service nobody is lying on or walking to. */
const freeBeds = (sim: SpaSim, service: ServiceId): number => sim.stations.filter(x => x.service === service && x.customerId === null).length

/**
 * The owner taps a waiting customer: whoever is fetching that customer lets go. Then, while the free beds of that customer's service
 * number no more than the technicians' fetches of customers of that service still on their way, the last hired lets go of theirs too,
 * so the owner's customer finds a bed. The same goes for each item that customer uses, against what is left of it.
 * Whoever let go is idle and picks again on the next step.
 */
export function makeWayForOwner({ sim }: CrewHost, customerId: number): void {
  const service = sim.customers.find(c => c.id === customerId)?.service ?? 'shampoo'
  const drop = (s: Staff) => {
    s.task = null
    s.path = []
  }
  for (const s of sim.staff) if (s.task?.kind === 'fetch' && s.task.customerId === customerId) drop(s)
  const free = freeBeds(sim, service)
  const fetching = sim.staff.filter(s => {
    const task = s.task
    return task?.kind === 'fetch' && sim.customers.find(c => c.id === task.customerId)?.service === service
  })
  for (let n = fetching.length; n >= free && n > 0; n--) drop(fetching[n - 1])
  if (!sim.stockTracked()) return
  // the same for stock: no more technicians on their way than there are units left of each item the owner's customer uses
  for (const item of STOCK_USES[service]) {
    const using = () =>
      sim.staff.filter(s => {
        const task = s.task
        const c = task?.kind === 'fetch' ? sim.customers.find(x => x.id === task.customerId) : undefined
        return c !== undefined && STOCK_USES[c.service].includes(item)
      })
    for (let list = using(); list.length > 0 && list.length >= sim.stock[item]; list = using()) drop(list[list.length - 1])
  }
}

/** The day starts with everyone on their home tile, and new candidates once staff is open. */
export function startDay(h: CrewHost): void {
  const { sim } = h
  for (const s of sim.staff) Object.assign(s, { pos: { ...homeOf(h, s) }, path: [], task: null, sinceRest: 0, facing: 'down' })
  if (sim.day >= UNLOCK_DAY.staff) refreshCandidates(h)
}

/** After a load: a task that names a customer who is no longer there is dropped (a leaver with no task walks out on the next step); stale candidates are replaced. */
export function repairAfterLoad(h: CrewHost): void {
  const { sim } = h
  for (const s of sim.staff) {
    const task = s.task
    const c = task && 'customerId' in task ? sim.customers.find(x => x.id === task.customerId) : undefined
    if (task?.kind === 'fetch' && c?.state !== 'waiting') s.task = null
    if (task?.kind === 'serve' && (!c || c.stationId !== task.stationId)) s.task = null
  }
  if (sim.day >= UNLOCK_DAY.staff && sim.candidatesDay !== sim.day) refreshCandidates(h)
}

/** The day is over: everyone still here is paid, and those who were let go leave the payroll. */
export function payWages({ sim }: CrewHost): void {
  for (const s of sim.staff) if (!s.leaving) sim.stats.wages += s.wage
  sim.money -= sim.stats.wages
  sim.staff = sim.staff.filter(s => !s.leaving)
}
