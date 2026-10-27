import type { CustomerKind } from './customers'
import type { Stars } from './economy'
import type { RegularGift, RegularId } from './regulars'
import type { VipId } from './vips'
import type { ServiceId } from './services'
import type { StockItem } from './stock'
import type { Course } from './staff'

/** The first day's tips. */
export const TUTORIAL_HINTS = ['tapCustomer', 'demoShampoo', 'money', 'star', 'patience', 'summary'] as const
/** Tips the shop shows once each; saved so they do not come back. */
export const HINT_IDS = [...TUTORIAL_HINTS, 'openBuild', 'openStaff', 'openServices', 'openStock', 'demoMask', 'demoMassage', 'regular', 'openBook', 'vip', 'bookVip', 'study'] as const
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
  /** Which regular this is, or null for an ordinary customer. */
  regular: RegularId | null
  /** How long a waiting regular has been left to the owner, counted while a bed is free. */
  heldMs: number
  /** Which VIP this is, or null. */
  vip: VipId | null
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
  /** Money spent restocking today. */
  restock: number
  /** Gift money from regulars today. */
  gifts: number
}

export type SimEvent =
  | { type: 'customerArrived'; id: number }
  /** Right after their customerArrived; `first` on the day they are met. */
  | { type: 'regularArrived'; customerId: number; regular: RegularId; first: boolean }
  /** A regular's visit brought a new heart, and with it their member card when `member`. */
  | { type: 'heart'; customerId: number; regular: RegularId; hearts: number; member: boolean }
  /** A regular reached five hearts and gave their gift. */
  | { type: 'gift'; customerId: number; regular: RegularId; gift: RegularGift }
  /** Every regular has five hearts: the book's page is full. */
  | { type: 'bookPage' }
  /** Right after her customerArrived; `first` on her first visit. */
  | { type: 'vipArrived'; customerId: number; vip: VipId; first: boolean }
  /** A VIP paid; `photo` when this visit brought her signed photo, `board` when it brought the gold board. */
  | { type: 'vipServed'; customerId: number; vip: VipId; stars: Stars; photo: boolean; board: boolean }
  | { type: 'noSeat'; id: number }
  | { type: 'customerLeft'; id: number; angry: boolean }
  | { type: 'serviceReady'; customerId: number; stationId: number }
  | { type: 'paid'; customerId: number; amount: number; tip: number; tile: Tile }
  | { type: 'review'; customerId: number; score: number }
  | { type: 'greeted'; staffId: number; customerId: number }
  | { type: 'levelUp'; staffId: number; level: number }
  /** A quick technician's service came out a star worse than the roll. */
  | { type: 'sloppy'; staffId: number }
  /** A night course paid off this morning: `level` is the new tier, or the new friendly dots for `greet`. */
  | { type: 'studied'; staffId: number; course: Course; level: number }
  /** A booked course taught nothing (already at the top), so the tuition went back to the till. */
  | { type: 'studyRefunded'; staffId: number; amount: number }
  | { type: 'toast'; key: 'stationsBusy' | 'busyMask' | 'busyMassage' }
  /** An item reached the low-stock count, or ran out when a customer needed it. */
  | { type: 'stockLow'; item: StockItem }
  | { type: 'stockOut'; item: StockItem }
  /** An empty bed slot was tapped while a bed fits there. */
  | { type: 'bedSlot'; slot: Tile }
  /** Furniture was bought, moved or sold. */
  | { type: 'roomChanged' }
  | { type: 'dayEnded'; stats: DayStats }
