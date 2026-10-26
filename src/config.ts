// Every tunable number lives here.

export const GAME_W = 1080
export const GAME_H = 2160
export const TILE = 78
export const MAP_X = 33
export const MAP_Y = 210

export const LOOK_COUNTS = { skin: 4, hair: 5, hairStyle: 4, shirt: 5 } as const
/** What the owner can pick when making the shop. */
export const OWNER_LOOK_COUNTS = { skin: 4, hair: 5, hairStyle: 4, shirt: 4 } as const

// Day: 8:00 to 20:00, 12.5 real seconds per game hour (2 and a half minutes a day).
export const DAY_START_MIN = 480
export const DAY_END_MIN = 1200
export const REAL_MS_PER_GAME_MIN = 12500 / 60

// Money and reviews
/** What a customer pays for each service, and what opening it costs; shampoo is built in. */
export const SERVICE_PRICE = { shampoo: 40000, mask: 60000, massage: 90000 } as const
export const SERVICE_OPEN_COST = { shampoo: 0, mask: 200000, massage: 400000 } as const
/** Each service open beyond the first shortens the arrival gap by this share. */
export const SERVICE_ARRIVAL_STEP = 0.1
export const TIP_RATE = { 1: 0, 2: 0.1, 3: 0.25 } as const
export const REVIEW_FOR_STARS = { 1: 3, 2: 4, 3: 5 } as const
/** The review a customer leaves for 1, 2 and 3 stars, by how kindly they grade; `normal` is the plain one. */
export const REVIEW_BY_GRADING = { easy: { 1: 4, 2: 5, 3: 5 }, normal: REVIEW_FOR_STARS, harsh: { 1: 2, 2: 3, 3: 5 } } as const
export const ANGRY_REVIEW = 1
export const RATING_WINDOW = 20

// Shampoo mini-game; swipe distances are in hair-zone widths
export const SHAMPOO_TIME_LIMIT_MS = 25000
export const FOAM_SWIPES = 6
export const RINSE_HOLD_MS = 2500
export const DRY_SWIPES = 4
/** A picky customer's hair needs more swiping. */
export const FOAM_SWIPES_HARD = 9
export const DRY_SWIPES_HARD = 6
export const STAR3_MS = 15000
export const STAR2_MS = 22000

// Face-mask mini-game, in face units: the face is the unit circle. Stars use STAR3_MS and STAR2_MS, like the shampoo.
export const MASK_TIME_LIMIT_MS = 25000
/** The paint grid has this many cells a side over [−1, 1]². */
export const MASK_GRID = 20
export const MASK_EYES = [
  { x: -0.38, y: -0.1 },
  { x: 0.38, y: -0.1 },
] as const
export const MASK_EYE_R = 0.16
export const MASK_EYE_R_HARD = 0.22
export const MASK_BRUSH_R = 0.18
/** The share of the face outside the eyes to cover. */
export const MASK_GOAL = 0.9
export const MASK_GOAL_HARD = 0.95
/** A cucumber slice dropped this close to an empty eye snaps onto it. */
export const MASK_SNAP_R = 0.25
/** This many eye errors cost a star. */
export const MASK_ERRORS_FOR_PENALTY = 3

// Massage mini-game, in back units: the back is [−1, 1]², from the shoulders at y −1 to the waist at y 1. Points show one after another.
/** Shoulders, the blades either side of the spine, mid back and lower back. */
export const MASSAGE_POINTS: readonly { x: number; y: number }[] = [
  { x: -0.6, y: -0.65 },
  { x: 0.6, y: -0.65 },
  { x: 0, y: -0.65 },
  { x: -0.3, y: -0.2 },
  { x: -0.6, y: 0.25 },
  { x: 0, y: 0.25 },
  { x: 0.6, y: 0.25 },
  { x: 0.3, y: -0.2 },
  { x: -0.3, y: 0.7 },
  { x: 0.3, y: 0.7 },
]
/** The pressure points, held until their ring fills; every other point is tapped. */
export const MASSAGE_HOLD_INDICES: readonly number[] = [3, 7]
/** A tap point's ring shrinks this long; it closes at the end. */
export const RING_MS = 1400
export const RING_MS_HARD = 1000
/** A tap this close to the ring closing is perfect, and this close good. */
export const MASSAGE_PERFECT_MS = 150
export const MASSAGE_PERFECT_MS_HARD = 100
export const MASSAGE_GOOD_MS = 350
export const MASSAGE_GOOD_MS_HARD = 220
/** A press this close to the point is on it. */
export const MASSAGE_HIT_R = 0.25
/** A hold point fills after this much holding, and is missed if still unfilled this long after it shows. */
export const MASSAGE_HOLD_MS = 1500
export const MASSAGE_HOLD_LIMIT_MS = 4000
/** The next point shows this long after the last is judged. */
export const MASSAGE_GAP_MS = 400
export const MASSAGE_GAP_MS_HARD = 250
export const MASSAGE_SCORE = { perfect: 2, good: 1, miss: 0 } as const
/** The scores, out of 20, for 3 and 2 stars. */
export const MASSAGE_STAR3_SCORE = 16
export const MASSAGE_STAR2_SCORE = 10

// Stock: what a restock of 20 costs, how much a shop starts with, and the count at which it is running low.
export const RESTOCK_PRICE = { shampoo: 80000, towel: 60000, mask: 240000, oil: 360000 } as const
export const RESTOCK_AMOUNT = 20
export const STOCK_START = 20
export const LOW_STOCK = 5

// Shop simulation
export const STARTING_MONEY = 100000
export const FIRST_ARRIVAL_MS = 3000
/** Customers come at random: the gap to the next one is never shorter than this, nor longer than this many times the average gap. */
export const ARRIVAL_MIN_MS = 2000
export const ARRIVAL_MAX_FACTOR = 2.5
export const PATIENCE_MS = 60000
/** From this day a roll below CELEB_CHANCE makes the next customer a celebrity. */
export const CELEB_FROM_DAY = 6
export const CELEB_CHANCE = 0.05
/** The chance a customer takes one of their favourite services when the shop has one. */
export const PREFERRED_SERVICE_CHANCE = 0.7
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

/** Beauty of the default shop, the beauty where the speed-up tops out, and the most it can shorten the arrival gap. */
export const BEAUTY_BASE = 21
export const BEAUTY_TOP = 81
export const BEAUTY_MAX_SPEEDUP = 0.2

/** Gentler first days: more patience, more mini-game time, fewer customers on day 1. */
export const DAY_EASE = [
  { patience: 1.6, miniGameExtraMs: 10_000, arrival: 1.3 },
  { patience: 1.4, miniGameExtraMs: 10_000, arrival: 1 },
  { patience: 1.2, miniGameExtraMs: 5_000, arrival: 1 },
] as const

// Staff
export const STAFF_CAP = { receptionist: 1, technician: 3 } as const
export const CANDIDATES_PER_DAY = 3
export const RECEPTIONIST_CHANCE = 1 / 3
export const RARE_CHANCE = 0.1
export const WAGE_BASE = 20000
export const WAGE_PER_DOT = 2500
export const LEVEL_WAGE_RAISE = 2500
/** Experience needed for levels 1 to 5. */
export const LEVEL_XP = [0, 3, 8, 15, 25] as const
export const STAFF_WORK_MS_SLOW = 24000
export const STAFF_WORK_MS_STEP = 3000
/** A tea break lasts one game hour. */
export const STAFF_REST_MS = 60 * REAL_MS_PER_GAME_MIN
/** Chance of three stars and of one star, by skill 1 to 5. */
export const STAFF_STAR_ODDS = { three: [0, 0.1, 0.25, 0.45, 0.65], one: [0.4, 0.25, 0.1, 0.05, 0] } as const
export const GREET_PATIENCE_BASE = 1.15
export const GREET_PATIENCE_PER_DOT = 0.02
export const GREET_TIP_PER_DOT = 0.05
export const STAFF_TIP_PER_DOT = 0.05
