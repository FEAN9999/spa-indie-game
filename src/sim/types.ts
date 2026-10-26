import type { CustomerKind } from './customers'
import type { ServiceId } from './services'

/** The first day's tips. */
export const TUTORIAL_HINTS = ['tapCustomer', 'demoShampoo', 'money', 'star', 'patience', 'summary'] as const
/** Tips the shop shows once each; saved so they do not come back. */
export const HINT_IDS = [...TUTORIAL_HINTS, 'openBuild', 'openStaff'] as const
export type HintId = (typeof HINT_IDS)[number]

export interface Tile {
  x: number
  y: number
}

export type Facing = 'down' | 'up' | 'left' | 'right'

/** Palette indices; the view maps them to colors. */
export interface Look {
  skin: number
  hair: number
  hairStyle: number
  shirt: number
}

/** Tile units, fractional while moving. */
export interface Vec {
  x: number
  y: number
}

/** Anyone who walks the shop: a position in tile units, which way they face, and the tiles still to walk. */
export interface Mover {
  pos: Vec
  facing: Facing
  path: Tile[]
}

export type CustomerState = 'arriving' | 'toSeat' | 'waiting' | 'toStation' | 'inService' | 'leaving' | 'exiting'

export interface Customer {
  id: number
  look: Look
  state: CustomerState
  /** Time spent in the current state. */
  stateMs: number
  pos: Vec
  facing: Facing
  path: Tile[]
  patienceMs: number
  /** patienceMs when the customer arrived; the view draws the bar against it. */
  patienceMaxMs: number
  seat: Tile | null
  stationId: number | null
  mood: 'happy' | 'ok' | 'angry' | null
  /** The receptionist's friendliness when they greeted this customer, else 0. */
  greet: number
  /** The service this customer wants. */
  service: ServiceId
  /** What sort of customer this is. */
  kind: CustomerKind
}

export type OwnerTask = { kind: 'fetch'; customerId: number } | { kind: 'serve'; customerId: number; stationId: number }

export interface Owner {
  pos: Vec
  facing: Facing
  path: Tile[]
  task: OwnerTask | null
}

export interface Station {
  id: number
  bed: Tile
  work: Tile
  customerId: number | null
  /** The service this bed gives. */
  service: ServiceId
}

export interface Seat {
  tile: Tile
  customerId: number | null
}

export interface DayStats {
  served: number
  angry: number
  walkedAway: number
  income: number
  tips: number
  /** Staff wages for the day, taken when the day ends. */
  wages: number
}

export type SimEvent =
  | { type: 'customerArrived'; id: number }
  | { type: 'noSeat'; id: number }
  | { type: 'customerLeft'; id: number; angry: boolean }
  | { type: 'serviceReady'; customerId: number; stationId: number }
  | { type: 'paid'; customerId: number; amount: number; tip: number; tile: Tile }
  | { type: 'review'; customerId: number; score: number }
  | { type: 'greeted'; staffId: number; customerId: number }
  | { type: 'levelUp'; staffId: number; level: number }
  | { type: 'toast'; key: 'stationsBusy' | 'busyMask' | 'busyMassage' }
  /** An empty bed slot was tapped while a bed fits there. */
  | { type: 'bedSlot'; slot: Tile }
  /** Furniture was bought, moved or sold. */
  | { type: 'roomChanged' }
  | { type: 'dayEnded'; stats: DayStats }
