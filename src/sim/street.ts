import { RIDE_MS } from '../config'
import type { ShopSide } from './dining'
import { isWalkable, tileEq } from './grid'
import type { RestaurantSim } from './restaurant'
import type { SpaSim } from './spa'
import type { Tile } from './types'

/** Where the owner is: in a shop, walking out of one to the door with the tap that sent her, or riding to the other with the last tap made. */
export type OwnerWhere =
  | { at: ShopSide }
  | { at: 'leaving'; from: ShopSide; tap: Tile }
  | { at: 'riding'; to: ShopSide; ms: number; tap: Tile }

/** `busy`: the owner holds work in the shop she is in and cannot go to the other. */
export type TapResult = 'busy' | null

const other = (side: ShopSide): ShopSide => (side === 'spa' ? 'restaurant' : 'spa')

/** The owner between the spa and the restaurant beside it: which shop a tap goes to, and the timed ride from door to door. */
export class Street {
  where: OwnerWhere = { at: 'spa' }
  readonly spa: SpaSim
  readonly restaurant: RestaurantSim

  constructor(spa: SpaSim, restaurant: RestaurantSim) {
    this.spa = spa
    this.restaurant = restaurant
  }

  /** Where the owner is as a save has it: a walk to the door or a ride is on the street. */
  toSave(): 'spa' | 'restaurant' | 'street' {
    return this.where.at === 'leaving' || this.where.at === 'riding' ? 'street' : this.where.at
  }

  /** The owner as saved: in the restaurant, or in the spa, a trip between the two ending at the spa door. */
  static fromSave(spa: SpaSim, restaurant: RestaurantSim, at: 'spa' | 'restaurant' | 'street'): Street {
    const street = new Street(spa, restaurant)
    spa.ownerNextDoor = at === 'restaurant'
    if (at === 'street') spa.ownerWalksIn()
    street.where = { at: at === 'restaurant' ? 'restaurant' : 'spa' }
    return street
  }

  /** A tap on `side`'s floor: worked there if the owner is in, kept for when she gets there, or a trip over if it asks for her. */
  tap(side: ShopSide, t: Tile): TapResult {
    const w = this.where
    if (w.at === side) {
      this.shop(side).tapTile(t)
      return null
    }
    if (w.at === 'leaving') {
      if (w.from === side) {
        this.shop(side).owner.path = []
        this.where = { at: side }
        this.shop(side).tapTile(t)
      } else w.tap = t
      return null
    }
    if (w.at === 'riding') {
      if (w.to === side) w.tap = t
      return null
    }
    if (!this.wanted(side, t)) return null
    const from = w.at
    if (this.busy(from)) return 'busy'
    this.shop(from).ownerWalksOut()
    this.where = { at: 'leaving', from, tap: t }
    return null
  }

  /** Runs the restaurant for `ms`, then the owner: out of the door onto the bike, and in at the other door after RIDE_MS with her tap. */
  advance(ms: number): void {
    this.restaurant.advance(ms)
    const w = this.where
    if (w.at === 'leaving') {
      if (!this.shop(w.from).ownerAtDoor()) return
      if (w.from === 'spa') this.spa.ownerNextDoor = true
      else this.restaurant.ownerLeaves()
      this.where = { at: 'riding', to: other(w.from), ms: 0, tap: w.tap }
    } else if (w.at === 'riding') {
      w.ms += ms
      if (w.ms < RIDE_MS) return
      if (w.to === 'spa') {
        this.spa.ownerNextDoor = false
        this.spa.ownerWalksIn()
        this.spa.tapTile(w.tap)
      } else {
        this.restaurant.ownerArrives()
        this.restaurant.tapTile(w.tap)
      }
      this.where = { at: w.to }
    }
  }

  /** Where the ride is, from 0 at the door left to 1 at the door reached; null off the bike. */
  rideProgress(): { to: ShopSide; k: number } | null {
    return this.where.at === 'riding' ? { to: this.where.to, k: this.where.ms / RIDE_MS } : null
  }

  /** The owner goes to a branch from wherever she is between the two shops; the restaurant closes up quietly. */
  ownerLeavesTown(): void {
    this.restaurant.leaveTown()
    this.spa.ownerNextDoor = false
    this.where = { at: 'spa' }
  }

  /** The owner is back from a branch, at the spa: the restaurant takes diners again. */
  ownerBack(): void {
    this.restaurant.ownerAway = false
  }

  /** Each morning the owner starts in the spa. */
  startDay(): void {
    this.restaurant.startDay()
    this.restaurant.ownerAway = false
    this.restaurant.ownerIn = false
    this.spa.ownerNextDoor = false
    this.where = { at: 'spa' }
  }

  private shop(side: ShopSide): SpaSim | RestaurantSim {
    return side === 'spa' ? this.spa : this.restaurant
  }

  /** A tap that asks for the owner: a waiting spa customer or a diner with a ticket up, or a floor tile. */
  private wanted(side: ShopSide, t: Tile): boolean {
    if (side === 'spa') return this.spa.customers.some(c => c.state === 'waiting' && c.seat !== null && tileEq(c.seat, t)) || isWalkable(this.spa.grid, t)
    return this.restaurant.diners.some(d => d.state === 'ordering' && d.chair !== null && tileEq(d.chair, t)) || isWalkable(this.restaurant.grid, t)
  }

  private busy(side: ShopSide): boolean {
    return side === 'spa' ? this.spa.owner.task !== null || this.spa.servingCustomerId !== null : this.restaurant.ownerBusy()
  }
}
