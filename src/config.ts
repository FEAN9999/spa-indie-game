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
/** Game minutes from opening to closing. */
export const DAY_MINUTES = DAY_END_MIN - DAY_START_MIN

// Money and reviews
/** What a customer pays for each service, and what opening it costs; shampoo is built in. */
export const SERVICE_PRICE = { shampoo: 40000, mask: 60000, massage: 90000, steam: 110000, stone: 130000, mud: 160000 } as const
export const SERVICE_OPEN_COST = { shampoo: 0, mask: 200000, massage: 400000, steam: 500000, stone: 650000, mud: 800000 } as const
/** Each basic service open beyond the first shortens the arrival gap by this share. */
export const SERVICE_ARRIVAL_STEP = 0.1
/** Each open recipe service shortens it by this share. */
export const RECIPE_ARRIVAL_STEP = 0.05
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

// Xông lá leaf-drop game: collect the recipe's three leaves from the falling things within the limit.
export const STEAM_LIMIT_MS = 15000
export const STEAM_NEED = 6
export const STEAM_SPAWN_MS = { min: 550, max: 800 }
export const STEAM_FALL_MS = { min: 4000, max: 6000 }
export const STEAM_FALL_MS_HARD = { min: 3000, max: 4500 }
/** Leaves fall in this many lanes, each at its centre give or take the jitter (as a share of the width). */
export const STEAM_LANES = 4
export const STEAM_LANE_JITTER = 0.04
/** The share of falling things that are decoys. */
export const STEAM_DECOY_SHARE = 0.5
export const STEAM_DECOY_SHARE_HARD = 0.6
/** Caught and misses for 2 stars; 3 stars is all caught with no misses. */
export const STEAM_STAR2 = { got: 4, misses: 2 }

// Đá nóng hot-stone game: lay six stones on the spots, each when its heat is in the good band, within the limit.
export const STONE_LIMIT_MS = 25000
export const STONE_SPOTS = 6
/** How many stones sit in the pot to pick from. */
export const STONE_POT = 4
/** Heat that is just right to lay; below is cold, above is hot. */
export const STONE_GOOD = { min: 0.55, max: 0.85 }
export const STONE_MAX_HEAT = 1.4
export const STONE_START_HEAT = { min: 0, max: 0.2 }
/** Heat gained per second; a picky customer gets faster stones. */
export const STONE_RATE = { min: 0.2, max: 0.3 }
export const STONE_RATE_HARD = { min: 0.26, max: 0.39 }
/** Score (good minus hot) for 3 and 2 stars. */
export const STONE_STARS = { three: 5, two: 3 }

// Tắm bùn mud-bath game: hold to heat the mark, keep it in the drifting green band for as much of the limit as you can.
export const MUD_LIMIT_MS = 20000
/** The longest sub-step the rules simulate, so a long tick plays out the same as many short ones. */
export const MUD_STEP_MS = 50
export const MUD_START = { mark: 0.25, band: 0.5 }
/** Mark acceleration per second squared, while held and while released. */
export const MUD_ACCEL = { up: 1.5, down: 1.1 }
/** The mark's top speed per second, either way. */
export const MUD_MAX_SPEED = 0.55
/** How fast the band centre drifts to its target, per second. */
export const MUD_BAND_SPEED = 0.16
export const MUD_BAND_RANGE = { min: 0.18, max: 0.82 }
/** When the band picks its first new target, then the wait between later ones. */
export const MUD_RETARGET_MS = { first: 1000, min: 1400, max: 3000 }
/** Half the band's height; a picky customer gets a narrower one. */
export const MUD_HALF = 0.11
export const MUD_HALF_HARD = 0.08
/** Share of the time inside the band for 3 and 2 stars. */
export const MUD_STARS = { three: 0.7, two: 0.45 }

// Stock: what a restock of 20 costs, how much a shop starts with, and the count at which it is running low.
export const RESTOCK_PRICE = { shampoo: 80000, towel: 60000, mask: 240000, oil: 360000, herbs: 440000, mud: 640000 } as const
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
export const UNLOCK_DAY = { build: 2, staff: 3, services: 4, stock: 5, floors: 6, quests: 8 } as const

// Floors: the shop is one tall grid of three floors stacked, each this many rows
export const FLOOR_ROWS = 18
export const MAX_FLOORS = 3
/** What opening floor 2 and the rooftop costs. */
export const FLOOR_PRICE: Record<number, number> = { 2: 2_000_000, 3: 4_000_000 }
/** How long someone spends on the stairs between two floors. */
export const STAIRS_MS = 1000
/** Each floor beyond the first lets the shop hire this many more technicians. */
export const STAFF_PER_FLOOR = 2

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
/** The highest tier a technician can reach in one service. */
export const MAX_TIER = 3
/** The tier a rare technician starts with in their specialty. */
export const RARE_TIER = 2
/** What a night course costs, by the tier it starts from. */
export const STUDY_PRICE = [100000, 200000, 400000] as const
/** What a Tiếp khách course costs, by the friendliness it starts from, less 1. */
export const GREET_STUDY_PRICE = [50000, 100000, 200000, 400000] as const
export const WAGE_BASE = 20000
export const WAGE_PER_DOT = 2500
export const LEVEL_WAGE_RAISE = 2500
/** Experience needed for levels 1 to 5. */
export const LEVEL_XP = [0, 3, 8, 15, 25] as const
export const STAFF_WORK_MS_SLOW = 24000
export const STAFF_WORK_MS_STEP = 3000
/** Each tier of a service cuts a technician's time on it to this fraction, never under the floor: half of what speed 5 takes. */
export const TIER_WORK_FACTOR = 0.85
export const WORK_FLOOR_MS = (STAFF_WORK_MS_SLOW - 4 * STAFF_WORK_MS_STEP) / 2
/** A tea break lasts one game hour. */
export const STAFF_REST_MS = 60 * REAL_MS_PER_GAME_MIN
/** A deft technician arrives this many game minutes after opening. */
export const LATE_MIN = 30
/** A quick technician drops a star this often. */
export const SLOPPY_CHANCE = 1 / 7
/** A jolly person stops to chat after a customer this often, for CHAT_MS_MIN to CHAT_MS_MAX milliseconds. */
export const CHAT_CHANCE = 0.25
export const CHAT_MS_MIN = 3000
export const CHAT_MS_MAX = 5000
/** Chance of three stars and of one star, by skill 1 to 5. */
export const STAFF_STAR_ODDS = { three: [0, 0.1, 0.25, 0.45, 0.65], one: [0.4, 0.25, 0.1, 0.05, 0] } as const
export const GREET_PATIENCE_BASE = 1.15
export const GREET_PATIENCE_PER_DOT = 0.02
export const GREET_TIP_PER_DOT = 0.05
export const STAFF_TIP_PER_DOT = 0.05

// Personalities: the numbers behind each good side and the flaws that are only numbers
export const QUICK_WORK_FACTOR = 0.8
export const JOLLY_TIP = 0.1
export const JOLLY_GREET_PATIENCE = 0.1
export const DILIGENT_XP = 1.5
export const CALM_WALK_FACTOR = 0.8
export const STUDIOUS_TUITION = 0.7
export const STUDIOUS_RAISE = 2

// Regulars
export const REGULARS_FROM_DAY = 7
export const REGULAR_MEET_GAP_DAYS = 2
/** A day's regulars come between these game minutes: 9:00 and 17:00. */
export const REGULAR_VISIT_FROM_MIN = 540
export const REGULAR_VISIT_TO_MIN = 1020
export const REGULARS_PER_DAY = 3
/** The chance a met regular comes on a given day, before and after their member card. */
export const REGULAR_VISIT_CHANCE = { plain: 1 / 3, member: 1 / 2 } as const
/** Points for 1, 2 and 3 stars, by who served; a walk-out costs HEART_POINTS_ANGRY. */
export const HEART_POINTS = { owner: [0, 2, 4], staff: [0, 1, 2] } as const
export const HEART_POINTS_ANGRY = -2
/** Points at which hearts 1 to 5 are reached. */
export const HEART_AT = [4, 8, 12, 16, 20] as const
export const MEMBER_HEARTS = 3
export const MEMBER_PATIENCE = 1.5
/** Staff leave a waiting regular to the owner this long, counted only while a bed of their service is free. */
export const REGULAR_OWNER_MS = 10_000

/** VIPs begin booking once the shop has this many technicians who are not leaving. */
export const VIP_MIN_TECHNICIANS = 2
/** A booked hour falls on a half hour between these game minutes: 10:00 and 17:00. */
export const VIP_FROM_MIN = 600
export const VIP_TO_MIN = 1020
/** Days from one VIP visit to the day of the next, at least and at most. */
export const VIP_GAP_DAYS = [2, 4] as const
export const VIP_PRICE_FACTOR = 3
export const VIP_REVIEWS = 3
/** A VIP's patience against PATIENCE_MS; the early days' extra patience does not apply. */
export const VIP_PATIENCE = 0.7
/** The clock's gold star shows from this many game minutes before the booked time. */
export const VIP_WARN_MIN = 60
/** How long a speech bubble stays, for a greeting and for a story line. */
export const BUBBLE_MS = { greet: 4000, story: 6000 } as const
/** What one try at the recipe bench costs. */
export const RECIPE_TRY_COST = 20000
/** Chance that a regular tells a recipe hint on a visit. */
export const RECIPE_HINT_CHANCE = 0.5

// Calendar: a fast in-game month, so every month's festival comes round after a few days of play
export const DAYS_PER_MONTH = 3
export const MONTHS_PER_YEAR = 12

// Quests: three a day and one a month, sized from the shop's last finished days
export const QUESTS_PER_DAY = 3
export const QUEST_SWAPS_PER_DAY = 1
/** How many finished days the targets are averaged over. */
export const QUEST_RECENT_DAYS = 3
/** A target asks for this share of the recent average. */
export const QUEST_TARGET_SHARE = 0.8
/** A plain daily reward is this share of the recent average earnings, and at least QUEST_REWARD_MIN. */
export const QUEST_REWARD_SHARE = 0.05
export const QUEST_REWARD_MIN = 30_000
/** "Tự tay làm 3 sao" and "Không để khách nào bỏ về" pay this many times the plain reward. */
export const QUEST_HARD_FACTOR = 1.5
/** A monthly quest pays this many times the plain reward for a whole month, less for part of one. */
export const MONTH_QUEST_REWARD_FACTOR = 5
/** A shop opened with fewer game minutes than this left in the day gets no daily quests that day. */
export const QUEST_MIN_LEFT_MIN = 120
/** What the targets are sized from before the shop has finished a day. */
export const QUEST_DEFAULT_DAY = { served: 10, earned: 500_000, tips: 50_000, owner3: 3, staff: 4 } as const
/** The least each target asks for, over a whole day; owner3 is also capped. monthOwner3 is the monthly one's least. */
export const QUEST_FLOOR = { serve: 5, owner3Min: 2, owner3Max: 6, earn: 150_000, tips: 20_000, service: 2, staff: 3, monthOwner3: 4 } as const
/** A day with at least this many served and nobody walking out is a clean day. */
export const CLEAN_DAY_MIN_SERVED = 15

/** What each badge with a number in it asks for. */
export const BADGE_GOALS = { served100: 100, served1000: 1000, goldHands: 50, busyDay: 25, pretty: 60, fullCrew: 7, million: 1_000_000, bigProfit: 1_000_000, diligent: 20, fullYear: 36 } as const
/** How long the gold banner for a new badge stays on screen. */
export const BADGE_BANNER_MS = 3000
