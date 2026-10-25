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
  seat: Tile | null
  stationId: number | null
  mood: 'happy' | 'ok' | 'angry' | null
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
  chair: Tile
  work: Tile
  customerId: number | null
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
}

export type SimEvent =
  | { type: 'customerArrived'; id: number }
  | { type: 'noSeat'; id: number }
  | { type: 'customerLeft'; id: number; angry: boolean }
  | { type: 'serviceReady'; customerId: number; stationId: number }
  | { type: 'paid'; customerId: number; amount: number; tip: number; tile: Tile }
  | { type: 'review'; customerId: number; score: number }
  | { type: 'toast'; key: 'stationsBusy' }
  | { type: 'dayEnded'; stats: DayStats }
