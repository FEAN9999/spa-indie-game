import { CHAIN_FINISH_MS, CHAIN_FROM_STARS, MAX_FRAME_MS, PLACES, STEP_MS } from '../config'
import { staffCap } from './crew'
import { dayProfit } from './economy'
import { PLACE_IDS, type PlaceId } from './places'
import { createRng } from './rng'
import { SaveError, type SaveData } from './save'
import { SpaSim } from './spa'
import type { MoveTo, Staff, StaffRole } from './staff'
import type { CustomerState, SimEvent } from './types'
import type { VipId } from './vips'

/** `open`: a branch is there already; `stars`: the main shop's stars are short; `money`: the purse is short. */
export type OpenProblem = 'open' | 'stars' | 'money'
/** `here`: the owner is there; `notOpen`: no branch is there; `closed`: a branch once the day has closed. */
export type GoProblem = 'here' | 'notOpen' | 'closed'
/** `staff`: no such working person there, or they are leaving; `place`: their own shop, or no branch there; `full`: no room left there for their role. */
export type MoveProblem = 'staff' | 'place' | 'full'
/** The shop a booked move goes to: null for the main shop. */
export const moveDest = (to: Exclude<MoveTo, null>): PlaceId | null => (to === 'main' ? null : to)

export interface ChainDayRow {
  place: PlaceId | null
  profit: number
}

/** The main shop's events with a card or a reward: kept in order while the owner is away, for when she is back. */
const HELD: readonly SimEvent['type'][] = ['badge', 'questDone', 'goalDone', 'festivalQuestDone', 'inspected', 'kolPosted', 'rivalBeaten', 'heart', 'gift', 'bookPage', 'recipeHint', 'dayEnded']

const WAITING: readonly CustomerState[] = ['arriving', 'toSeat', 'waiting']

/** The main shop and its branches: one clock, one purse, and the owner in one of them. */
export class Chain {
  readonly main: SpaSim
  /** In PLACE_IDS order. */
  branches: SpaSim[] = []
  /** Where the owner is: null for the main shop. */
  at: PlaceId | null = null
  /** True once the card that opens the chain has been shown. */
  told = false

  private readonly seed: number
  /** The main shop's cards waiting for the owner. */
  private held: SimEvent[] = []
  /** The VIPs who came to the main shop while the owner was at a branch. */
  private vipCalls: VipId[] = []

  constructor(main: SpaSim, seed: number) {
    this.main = main
    this.seed = seed
    this.wireIncoming(main)
  }

  /** The shop the owner is in. */
  active(): SpaSim {
    return this.shop(this.at)!
  }

  /** The main shop for null, else the branch at `place` if one is open there. */
  shop(place: PlaceId | null): SpaSim | null {
    return place === null ? this.main : (this.branches.find(b => b.place === place) ?? null)
  }

  chainShown(): boolean {
    return this.main.rank.stars >= CHAIN_FROM_STARS
  }

  shouldTell(): boolean {
    return this.chainShown() && !this.told
  }

  openProblem(place: PlaceId): OpenProblem | null {
    if (this.shop(place)) return 'open'
    if (this.main.rank.stars < PLACES[place].stars) return 'stars'
    if (this.main.money < PLACES[place].price) return 'money'
    return null
  }

  /** Takes the price and opens a branch at `place`, drawing from its own stream; the owner stays where she is. */
  open(place: PlaceId): OpenProblem | null {
    const problem = this.openProblem(place)
    if (problem) return problem
    this.main.money -= PLACES[place].price
    const branch = SpaSim.newBranch(place, this.main, createRng(this.seed + 1 + PLACE_IDS.indexOf(place)))
    branch.ownerHere = false
    this.wireIncoming(branch)
    this.branches = PLACE_IDS.flatMap(id => (id === place ? [branch] : this.branches.filter(b => b.place === id)))
    this.sync()
    return null
  }

  /** Rebuilds a saved chain: the main shop and its branches, each branch drawing from its own stream and sharing the main shop's purse. Nothing is paid again. */
  static fromSave(data: SaveData, seed: number): Chain {
    const chain = new Chain(SpaSim.fromSave(data, { rng: createRng(seed) }), seed)
    const saved = data.chain
    for (const b of saved?.branches ?? []) {
      try {
        const branch = SpaSim.fromSave(b, { rng: createRng(seed + 1 + PLACE_IDS.indexOf(b.place!)) })
        branch.purse = chain.main.purse
        chain.wireIncoming(branch)
        chain.branches.push(branch)
      } catch (e) {
        if (!(e instanceof SaveError)) throw e
      }
    }
    chain.told = saved?.told === true
    // a move that names the person's own shop, a place with no branch or someone leaving does not happen
    for (const s of [chain.main, ...chain.branches])
      for (const p of s.staff) if (p.moveTo !== null && (p.leaving || moveDest(p.moveTo) === s.place || !chain.shop(moveDest(p.moveTo)))) p.moveTo = null
    chain.at = saved && chain.shop(saved.at) ? saved.at : null
    chain.main.ownerHere = chain.at === null
    // a VIP already waiting at the main shop calls the owner, as one who arrives while she is away does
    if (chain.at !== null) chain.callForWaitingVips()
    for (const b of chain.branches) b.ownerHere = b.place === chain.at
    // the events a shop queued while loading are routed like those of a shop the owner is away from; the owner's own shop keeps hers
    for (const s of [chain.main, ...chain.branches]) if (s !== chain.active()) chain.route(s, s.drainEvents())
    return chain
  }

  /** The main shop's save with the chain in it: each branch is a save of its own, at its place. */
  toSave(): SaveData {
    return { ...this.main.toSave(), place: null, chain: { at: this.at, told: this.told, branches: this.branches.map(b => b.toSave()) } }
  }

  /** Back to the main shop is always allowed; a branch is not once the day has closed. */
  goProblem(place: PlaceId | null): GoProblem | null {
    if (place === this.at) return 'here'
    if (!this.shop(place)) return 'notOpen'
    if (place !== null && this.main.clock.isClosed) return 'closed'
    return null
  }

  /** The owner leaves the shop she is in for `place`; what the shop left still had queued is kept or dropped as when she is away. */
  goTo(place: PlaceId | null): GoProblem | null {
    const problem = this.goProblem(place)
    if (problem) return problem
    const left = this.active()
    this.route(left, left.drainEvents())
    left.ownerLeaves()
    this.sync()
    this.at = place
    // a VIP call is for an owner who is away from the main shop
    if (place === null) this.vipCalls = []
    else if (left === this.main) this.callForWaitingVips()
    this.active().ownerArrives()
    return null
  }

  /** Each VIP waiting at the main shop calls the owner, once. */
  private callForWaitingVips(): void {
    for (const c of this.main.customers) if (c.vip !== null && WAITING.includes(c.state) && !this.vipCalls.includes(c.vip)) this.vipCalls.push(c.vip)
  }

  /** Per-frame entry point; a huge delta is clamped. */
  update(dtMs: number): number {
    return this.advance(Math.min(dtMs, MAX_FRAME_MS))
  }

  /** Runs the owner's shop, then every other shop for exactly the ms it ran; returns those ms. */
  advance(ms: number): number {
    const here = this.active()
    const ran = here.advance(ms)
    for (const s of [this.main, ...this.branches]) {
      if (s === here) continue
      s.advance(ran)
      this.route(s, s.drainEvents())
    }
    return ran
  }

  /** Whether the person can move to `to` (null for the main shop) tomorrow; one already moving there is not counted twice. */
  moveProblem(from: PlaceId | null, id: number, to: PlaceId | null): MoveProblem | null {
    const s = this.shop(from)?.staff.find(x => x.id === id)
    if (!s || s.leaving) return 'staff'
    const target = this.shop(to)
    if (!target || to === from) return 'place'
    return this.room(target, s) > 0 ? null : 'full'
  }

  /** Books the person to move to `to` (null for the main shop) at the next morning; they work today where they are. */
  move(from: PlaceId | null, id: number, to: PlaceId | null): MoveProblem | null {
    const problem = this.moveProblem(from, id, to)
    if (problem) return problem
    this.shop(from)!.staff.find(x => x.id === id)!.moveTo = to ?? 'main'
    return null
  }

  /** Cancels a booked move. */
  stay(from: PlaceId | null, id: number): void {
    const s = this.shop(from)?.staff.find(x => x.id === id)
    if (s) s.moveTo = null
  }

  /** Tells `shop` how many people of a role move to it tomorrow. */
  private wireIncoming(shop: SpaSim): void {
    shop.incoming = role => this.heading(shop, role)
  }

  /** How many people of `role` in other shops are booked to move to `shop` and are not leaving, not counting `except`. */
  private heading(shop: SpaSim, role: StaffRole, except?: Staff): number {
    return [this.main, ...this.branches]
      .filter(x => x !== shop)
      .flatMap(x => x.staff)
      .filter(s => s !== except && s.moveTo !== null && moveDest(s.moveTo) === shop.place && s.role === role && !s.leaving).length
  }

  /** How many more people of `mover`'s role `shop` can take: its cap, less those there who are not leaving and the others moving there. */
  private room(shop: SpaSim, mover: Staff): number {
    return staffCap(mover.role, shop.floors) - shop.staff.filter(s => s.role === mover.role && !s.leaving).length - this.heading(shop, mover.role, mover)
  }

  /** Everyone booked to move goes to their new shop, if it has room; the others stay. */
  private carryOver(): void {
    for (const from of [this.main, ...this.branches]) {
      for (const s of [...from.staff]) {
        if (s.moveTo === null) continue
        const target = this.shop(moveDest(s.moveTo))
        if (target && target !== from && this.room(target, s) > 0) {
          from.staff = from.staff.filter(x => x !== s)
          target.takeIn(s)
        }
        s.moveTo = null
      }
    }
  }

  /** The main shop's morning, then each branch's, whose events are dropped; the owner opens at the main shop. */
  startDay(): void {
    this.carryOver()
    this.main.startDay()
    for (const b of this.branches) {
      b.startDay()
      b.drainEvents()
    }
    this.at = null
    this.vipCalls = []
    this.main.ownerHere = true
    for (const b of this.branches) b.ownerHere = false
    this.sync()
  }

  /** Runs each branch still open for up to `capMs`; one still not over is cleared out and closed. Their events are dropped. */
  finishDay(capMs = CHAIN_FINISH_MS): void {
    for (const b of this.branches) {
      for (let spent = 0; !b.dayOver && spent < capMs; spent += STEP_MS) b.advance(STEP_MS)
      if (!b.dayOver) {
        b.clearOut()
        b.advance(STEP_MS)
      }
      b.drainEvents()
    }
  }

  /** Copies what the main shop decides for the whole chain to every branch. */
  sync(): void {
    for (const b of this.branches) {
      b.services = [...this.main.services]
      b.ownerLook = { ...this.main.ownerLook }
      b.ownerOutfit = this.main.ownerOutfit
      b.shopName = this.main.shopName
      b.profileDone = this.main.profileDone
    }
  }

  /** Each shop's profit today, the main shop first. */
  dayRows(): ChainDayRow[] {
    return [this.main, ...this.branches].map(s => ({ place: s.place, profit: dayProfit(s.stats) }))
  }

  /** How many customers would leave the owner's shop if she went now. */
  leaveCount(): number {
    return this.active().leaversIfOwnerGoes()
  }

  /** The main shop's cards kept while the owner was away, in order; taking them empties the list. */
  takeHeld(): SimEvent[] {
    const out = this.held
    this.held = []
    return out
  }

  /** The next VIP who came to the main shop while the owner was away, or null. */
  takeVipCall(): VipId | null {
    return this.vipCalls.shift() ?? null
  }

  /** The events of a shop the owner is away from: a branch's are dropped; the main shop's VIP calls her, and its cards are kept. */
  private route(shop: SpaSim, events: SimEvent[]): void {
    if (shop.place !== null) return
    for (const e of events) {
      if (e.type === 'vipArrived') this.vipCalls.push(e.vip)
      else if (HELD.includes(e.type)) this.held.push(e)
    }
  }
}
