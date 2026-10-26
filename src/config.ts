// Every tunable number lives here.

export const GAME_W = 1080
export const GAME_H = 2160
export const TILE = 78
export const MAP_X = 33
export const MAP_Y = 210

export const LOOK_COUNTS = { skin: 3, hair: 5, hairStyle: 2, shirt: 5 } as const
/** What the owner can pick when making the shop. */
export const OWNER_LOOK_COUNTS = { skin: 4, hair: 5, hairStyle: 4, shirt: 4 } as const

// Day: 8:00 to 20:00, 35 real seconds per game hour (about 7 minutes a day).
export const DAY_START_MIN = 480
export const DAY_END_MIN = 1200
export const REAL_MS_PER_GAME_MIN = 35000 / 60

// Money and reviews
export const SHAMPOO_PRICE = 40000
export const TIP_RATE = { 1: 0, 2: 0.1, 3: 0.25 } as const
export const REVIEW_FOR_STARS = { 1: 3, 2: 4, 3: 5 } as const
export const ANGRY_REVIEW = 1
export const RATING_WINDOW = 20

// Shampoo mini-game; swipe distances are in hair-zone widths
export const SHAMPOO_TIME_LIMIT_MS = 25000
export const FOAM_SWIPES = 6
export const RINSE_HOLD_MS = 2500
export const DRY_SWIPES = 4
export const STAR3_MS = 15000
export const STAR2_MS = 22000

// Shop simulation
export const STARTING_MONEY = 100000
export const FIRST_ARRIVAL_MS = 3000
export const ARRIVAL_JITTER = [0.6, 1.4] as const
export const PATIENCE_MS = 60000
export const CUSTOMER_SPEED = 5 // tiles per second
export const OWNER_SPEED = 5 // tiles per second
export const ARRIVE_MS = 1500 // walking in from the street
export const EXIT_MS = 1500 // walking out to the street
export const STEP_MS = 50
export const MAX_FRAME_MS = 250
export const OWNER_START = { x: 9, y: 13 } as const

// Saving
export const AUTOSAVE_MS = 10_000

// Updates
export const UPDATE_WAIT_MS = 3_000 // how long the game waits for version.json when the player comes back

/** The day each feature button opens. */
export const UNLOCK_DAY = { build: 2, staff: 3, services: 4, stock: 5 } as const

/** Gentler first days: more patience, more mini-game time, fewer customers on day 1. */
export const DAY_EASE = [
  { patience: 1.6, miniGameExtraMs: 10_000, arrival: 1.3 },
  { patience: 1.4, miniGameExtraMs: 10_000, arrival: 1 },
  { patience: 1.2, miniGameExtraMs: 5_000, arrival: 1 },
] as const
