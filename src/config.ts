// Every tunable number lives here.

export const GAME_W = 1080
export const GAME_H = 2160
export const TILE = 78
// The grid: the old 13-column shop at columns 12 to 24, with room for two houses of 6 columns either side
export const SHOP_X0 = 12
export const HOUSE_COLS = 6
export const HOUSES_PER_SIDE = 2
/** Every floor's width: the old shop's 13 columns and two houses each side. */
export const SHOP_COLS = 13 + 2 * HOUSES_PER_SIDE * HOUSE_COLS
/** The map's origin: column 12's left edge lands at x 33, where the old shop's wall always stood, when the camera is at home. */
export const MAP_X = 33 - SHOP_X0 * TILE
export const MAP_Y = 210
/** Street strip below the front wall, in tiles. */
export const STREET_TILES = 2
/** The closest the map zooms in; the farthest out fits every bought column across the screen, never past normal size. */
export const ZOOM_MAX = 1.6
/** How much one tap of + or − zooms, about the middle of the map's area, and how long it eases. */
export const ZOOM_STEP = 1.35
export const ZOOM_STEP_MS = 200
/** How long the map eases to a point it is sent to. */
export const SLIDE_MS = 300
/** A flick's glide slows by e every this many ms. */
export const GLIDE_DECAY_MS = 250
/** How far a finger may move, in screen pixels, and still tap. */
export const TAP_SLOP_PX = 20
/** A swiping finger held still this long before it lifts leaves the map where it is, with no glide. */
export const GLIDE_STILL_MS = 100
/** In build mode, a held piece dragged this close to the map's left or right edge, in screen pixels, scrolls the map that way. */
export const EDGE_SCROLL = 80
/** How fast that scroll goes, in screen pixels per ms. */
export const EDGE_SCROLL_SPEED = 0.9

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
/** The stars a lesson service opens to learn at. */
export const LESSON_STARS = { scrub: 3, foot: 4, nails: 5 } as const
/** A lesson game is passed at this many stars. */
export const LESSON_PASS_STARS = 2
/** What a customer pays for each service, and what opening it costs; shampoo is built in. */
export const SERVICE_PRICE = { shampoo: 20000, mask: 30000, massage: 40000, steam: 50000, stone: 60000, mud: 75000, scrub: 85000, foot: 90000, nails: 100000 } as const
export const SERVICE_OPEN_COST = { shampoo: 0, mask: 200000, massage: 400000, steam: 500000, stone: 650000, mud: 800000, scrub: 700000, foot: 850000, nails: 1000000 } as const
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

// Chà muối biển scrub game: circle a finger on each salt patch; going over the speed cap burns and drops the turn under way.
// Positions are game pixels from the back's centre.
export const SCRUB_LIMIT_MS = 20000
export const SCRUB_SPOTS = [{ x: -150, y: -200 }, { x: 150, y: -120 }, { x: -140, y: 60 }, { x: 140, y: 190 }]
export const SCRUB_SPOTS_HARD = [{ x: -150, y: -210 }, { x: 150, y: -170 }, { x: 0, y: -20 }, { x: -150, y: 160 }, { x: 150, y: 190 }]
/** Full turns to clean one patch. */
export const SCRUB_TURNS = 3
/** Counting pauses closer to the patch centre than the dead radius and farther than the far one. */
export const SCRUB_DEAD_R = 40
export const SCRUB_FAR_R = 260
/** Speed caps in turns a second; a picky customer gets the lower one. */
export const SCRUB_CAP = 2.5
export const SCRUB_CAP_HARD = 1.8
/** Smoothing time of the measured speed, and the share of the cap it must fall under before counting resumes. */
export const SCRUB_TAU_S = 0.25
export const SCRUB_REARM = 0.8
/** Most burns for 3 stars, and patches cleaned for 2. */
export const SCRUB_STARS = { burns: 1, clean2: 3 }
/** For drawing only: the salt patch's radius and the guide ring's. */
export const SCRUB_PATCH_R = 92
export const SCRUB_RING_R = 150

// Ngâm chân thảo mộc game: six points on the sole, in game pixels on the card. The sequence grows over three rounds; times are in ms.
export const FOOT_LIMIT_MS = 15000
export const FOOT_POINTS = [
  { x: 470, y: 760 },
  { x: 615, y: 790 },
  { x: 470, y: 940 },
  { x: 615, y: 960 },
  { x: 505, y: 1110 },
  { x: 565, y: 1270 },
] as const
/** The point's drawn radius, and how far from its centre a tap still reaches it. */
export const FOOT_POINT_R = 66
export const FOOT_TAP_R = 80
/** How long a customer takes to rise onto the seat of the foot chair or the nail desk, or step down from it, in ms. */
export const FOOT_SEAT_MS = 150
/** Points lit in each of the three rounds; a picky customer gets the longer ones, lit faster. */
export const FOOT_ROUNDS = [3, 4, 5]
export const FOOT_ROUNDS_HARD = [4, 5, 6]
export const FOOT_ON_MS = 500
export const FOOT_GAP_MS = 200
export const FOOT_ON_HARD_MS = 340
export const FOOT_GAP_HARD_MS = 140
/** Pauses before a round's show, after a wrong tap, and after a round is passed. */
export const FOOT_LEAD_MS = 700
export const FOOT_WRONG_MS = 800
export const FOOT_NEXT_MS = 700
/** Most mistakes for 3 stars, and rounds passed for 2. */
export const FOOT_STARS = { mistakes: 1, pass2: 2 }

// Sơn móng game: pick the sample's polish from four bottles, then trace the sample's dotted pattern on five nails.
// Positions are game pixels on the card; times are in ms.
export const NAILS_LIMIT_MS = 25000
export const NAILS_COUNT = 5
/** The bottles' centres, and how far from one a tap still picks it. */
export const NAILS_BOTTLE_X = [225, 435, 645, 855]
export const NAILS_BOTTLE_Y = 930
export const NAILS_BOTTLE_HIT = { x: 95, y: 130 }
/** The big nail's centre, and its shape round it: half width, top, where the round top meets the sides, bottom. */
export const NAILS_NAIL = { x: 540, y: 905 }
export const NAILS_SHAPE = { hw: 120, top: -165, cap: -45, bottom: 150 }
/** How far past the nail's edge the finger may go before it smudges. */
export const NAILS_EDGE_TOL = 8
/** The dots' drawn radius, how far from the finger's path a dot lights, and their spacing; a picky customer gets the finer ones. */
export const NAILS_DOT_R = 16
export const NAILS_DOT_R_HARD = 10
export const NAILS_REACH = 50
export const NAILS_REACH_HARD = 34
export const NAILS_GAP = 46
export const NAILS_GAP_HARD = 36
/** The coat after the right pick, the pause after each nail, and the customer's head shake after a wrong pick. */
export const NAILS_COAT_MS = 500
export const NAILS_NEXT_MS = 450
export const NAILS_SHAKE_MS = 600
/** A good nail: the share of its dots lit, and the most smudges. */
export const NAILS_GOOD = { lit: 0.8, smudges: 1 }
/** Most wrong picks and fewest good nails for 2 stars. */
export const NAILS_STARS = { wrong2: 1, good2: 3 }

// Stock: what a restock of 20 costs, how much a shop starts with, and the count at which it is running low.
export const RESTOCK_PRICE = { shampoo: 80000, towel: 60000, mask: 240000, oil: 360000, herbs: 440000, mud: 640000, salt: 400000, polish: 560000 } as const
export const RESTOCK_AMOUNT = 20
export const STOCK_START = 20

/** The stars the main shop needs before it can open a branch. */
export const CHAIN_FROM_STARS = 3
/** Where a branch can open: the main shop's stars and the price, how much faster customers come, and what its services cost against the plain price. */
export const PLACES = {
  beach: { stars: 3, price: 5_000_000, arrival: 1.2, priceFactor: 1.0 },
  oldTown: { stars: 4, price: 8_000_000, arrival: 1.0, priceFactor: 1.2 },
  uptown: { stars: 5, price: 12_000_000, arrival: 0.8, priceFactor: 1.6 },
}
/** The weights of the kinds each place draws. */
export const PLACE_KINDS: Record<keyof typeof PLACES, Record<string, number>> = {
  beach: { tourist: 5, student: 2, office: 1, picky: 1 },
  oldTown: { backpacker: 4, elder: 3, student: 1, picky: 1 },
  uptown: { lady: 4, office: 3, picky: 2 },
}
/** The game ms a branch may be fast-run at the end of the main shop's day. */
export const CHAIN_FINISH_MS = 300_000
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
export const OWNER_START = { x: 21, y: 13 } as const

// Saving
export const AUTOSAVE_MS = 10_000

// Updates
export const UPDATE_WAIT_MS = 3_000 // how long the game waits for version.json when the player comes back

/** The day each feature button opens. */
export const UNLOCK_DAY = { build: 2, staff: 3, services: 4, stock: 5, floors: 6, quests: 8, houses: 10 } as const

// Floors: the shop is one tall grid of three floors stacked, each this many rows
export const FLOOR_ROWS = 18
export const MAX_FLOORS = 3
/** What opening floor 2 and the rooftop costs. */
export const FLOOR_PRICE: Record<number, number> = { 2: 2_000_000, 3: 4_000_000 }
/** How long someone spends on the stairs between two floors. */
export const STAIRS_MS = 1000
/** Each floor beyond the first lets the shop hire this many more technicians. */
export const STAFF_PER_FLOOR = 2
/** What the neighbour house next to the shop costs, then the far one, on either side. */
export const HOUSE_PRICE = [3_000_000, 6_000_000] as const
/** Each neighbour house bought lets the shop hire this many more technicians. */
export const STAFF_PER_HOUSE = 1

// Pets
/** The most pets a shop keeps. */
export const MAX_PETS = 6
export const PET_NAME_MAX = 12
/** The day Chú Sáu first brings his litter. */
export const LITTER_FROM_DAY = 2

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
/** One customer in this many the owner serves with three stars tips GENEROUS_TIP times over; never a VIP or Mi Mi. */
export const GENEROUS_CHANCE = 1 / 8
export const GENEROUS_TIP = 5

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

/** Days from one star's visit to the day of the next, at least and at most. */
export const IDOL_GAP_DAYS = [3, 5] as const
export const IDOL_PRICE_FACTOR = 5
/** A star is booked no closer than this many game minutes to a VIP's hour. */
export const IDOL_VIP_APART_MIN = 180
/** A star hums for HUM_MS out of every HUM_EVERY_MS while walking to or waiting at a seat. */
export const HUM_EVERY_MS = 10000
export const HUM_MS = 3000
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
export const BADGE_GOALS = { allServices: 6, served100: 100, served1000: 1000, goldHands: 50, busyDay: 25, pretty: 60, fullCrew: 7, million: 1_000_000, bigProfit: 1_000_000, diligent: 20, fullYear: 36 } as const
/** The badges each owner outfit asks for, from the uniform to the gấm; the bà ba is free and the Spa của năm dress comes from a win. */
export const OUTFIT_NEED = [2, 4, 6, 9, 12, 16, 20] as const
/** How long the gold banner for a new badge stays on screen. */
export const BADGE_BANNER_MS = 3000
/** A gold card stays this much longer for each line its sentence wraps onto after the first. */
export const GOLD_CARD_LINE_MS = 1500

/** Festivals start on this day, with the quests, so the first days stay for learning. */
export const FESTIVAL_FROM_DAY = 8
/** In a festival month the gap between two customers is this much of the usual one. */
export const FESTIVAL_ARRIVAL = 0.8
/** In a festival month a new customer (not a VIP) waits this much longer. */
export const FESTIVAL_PATIENCE = 1.2
/** The share of plain new customers who ask for the festival service. */
export const FESTIVAL_SERVICE_CHANCE = 0.5
/** The festival service costs this much more in its month, for all but VIPs. */
export const FESTIVAL_PRICE = 1.2
/** A festival quest's target against the shop's "serve N customers this month" target. */
export const FESTIVAL_QUEST_SHARE = 0.5
/** Each festival keepsake's beauty. */
export const KEEPSAKE_BEAUTY = 5

/** Random events start on this day. */
export const EVENT_FROM_DAY = 10
/** From one event to the next, at least and at most this many days. */
export const EVENT_GAP_DAYS: [number, number] = [2, 4]
/** An event's reward against one plain daily quest's. */
export const EVENT_REWARD_FACTOR = 2
/** How many days the shop is hot after Mi Mi's 3 stars, from the next morning. */
export const HOT_DAYS = 2
/** On a hot day the gap between two customers is this much of the usual one. */
export const HOT_ARRIVAL = 0.8
/** The inspector comes at 15:00. */
export const INSPECT_MIN = 900
/** The beauty the inspector wants. */
export const INSPECT_BEAUTY = 30
/** The Giấy khen's beauty. */
export const CERTIFICATE_BEAUTY = 4
/** The gold cup's beauty, given for Spa của năm. */
export const TROPHY_BEAUTY = 8
/** The bằng khen's beauty, given for a place in the year. */
export const MERIT_BEAUTY = 5
/** On the rival's day the picky customers' weight in the kind draw is this many times the usual. */
export const RIVAL_PICKY_FACTOR = 2
/** The rival's challenge: this share of an average day's customers served with 3 stars... */
export const RIVAL_TARGET_SHARE = 0.3
/** ...and never fewer than this. */
export const RIVAL_TARGET_MIN = 4
/** The power is out from 14:00 to 16:00. */
export const POWER_FROM_MIN = 840
export const POWER_TO_MIN = 960
/** The warning comes this many minutes before the power goes. */
export const POWER_WARN_MIN = 60
/** Tips on a service finished while the power is out are this many times the usual. */
export const POWER_TIP_FACTOR = 1.5

/** The shop is graded on the last day of each month from this day. */
export const RANK_FROM_DAY = 9
/** The rating that earns 0 points and the rating that earns all 20. */
export const RANK_RATING: [number, number] = [3, 4.8]
/** The beauty that earns all 20 points. */
export const RANK_BEAUTY_FULL = 60
/** The number of services on the menu that earns all 20 points. */
export const RANK_SERVICES_FULL = 6
/** The customers served a day that earn all 20 points. */
export const RANK_SERVED_FULL = 25
/** The share of customers walking out that earns 0 points. */
export const RANK_LOST_ZERO = 0.2
/** The total (out of 100) that earns 2, 3, 4 and 5 stars. */
export const RANK_STAR_AT: [number, number, number, number] = [30, 50, 70, 85]
/** What a rise to this many stars pays. */
export const RANK_REWARD: Record<number, number> = { 2: 200_000, 3: 400_000, 4: 700_000, 5: 1_000_000 }
/** Prices go up this much for each star after the first. */
export const RANK_PRICE_STEP = 0.05
/** The street's rivals and the score each starts with in year 1. */
export const RIVAL_BASE = { coBa: 48, ngocLan: 58, hoaSen: 66, spaMoi: 74 }
/** Each rival gains this many points a year... */
export const RIVAL_YEAR_STEP = 4
/** ...up to this score. */
export const RIVAL_SCORE_MAX = 86
/** What the year's first to fifth place is paid. */
export const YEAR_REWARD = [3_000_000, 1_000_000, 500_000, 0, 0]

/** The starter chain, in order: what each goal asks for (a count, or 1 for a yes) and what it pays; serveMore pays with the mask gift instead. */
export const STARTER_NEED = { firstGuest: 1, threeStars: 1, serveFew: 4, buyDecor: 1, serveMore: 10, placeMaskBed: 1, maskTwice: 2, serveMany: 16, hireTech: 1, openMassage: 1, massageTwice: 2 } as const
export const STARTER_REWARD = { firstGuest: 20_000, threeStars: 30_000, serveFew: 30_000, buyDecor: 40_000, serveMore: 0, placeMaskBed: 30_000, maskTwice: 50_000, serveMany: 50_000, hireTech: 50_000, openMassage: 100_000, massageTwice: 100_000 } as const

/** A shop closed for less than this earns nothing. */
export const AWAY_MIN_MS = 10 * 60_000
/** Time away counts for at most this many hours. */
export const AWAY_MAX_HOURS = 8
/** Each hour away pays this share of a day's profit. */
export const AWAY_DAY_SHARE = 0.25
/** The pay is worked from the mean profit of this many finished days. */
export const AWAY_PROFIT_DAYS = 3

/** Phây, the shop's feed: the followers a new feed starts with, and how many posts it keeps. */
export const FEED_START_FOLLOWERS = 50
export const FEED_MAX_POSTS = 50
/** Posts of each sort a day may make. */
export const FEED_DAY_CAP = { praise: 3, complaint: 3 }
/** The chance a happy guest posts. */
export const FEED_PRAISE_CHANCE = 1 / 3
/** The follower counts that are cheered once. */
export const FEED_MILESTONES = [1_000, 10_000, 100_000, 1_000_000]
/** An old save's followers: the start, then so much per rank star, idol met and year's win, at most max. */
export const FEED_SEED = { base: 50, star: 1_000, idol: 5_000, win: 20_000, max: 99_000 }
/** likes = fixed + share x min(followers, FEED_REACH_CAP) x (0.6 + 0.8 r). */
export const FEED_REACH = { praise: [40, 0.02], complaint: [1, 0.005], shop: [5, 0.08], vip: [30, 0.05], rival: [20, 0.01], ward: [10, 0.02] } as const
/** Followers past this bring no more likes, so a plain shop grows by a steady amount a day past it and 100.000 needs stars and boosts. */
export const FEED_REACH_CAP = 8_000
/** An idol's or a KOL's likes are their own fans: lo + (hi - lo) r. */
export const FEED_FANS = { idol: [20_000, 60_000], kol: [5_000, 15_000] } as const
/** followers += round(likes x gain). */
export const FEED_GAIN = { praise: 0.4, complaint: 0, shop: 0.1, vip: 0.1, rival: 0, ward: 0.05, idol: 0.04, kol: 0.08 }
/** extra = round(likes x this): the comments not shown. */
export const FEED_EXTRA_COMMENTS = 0.03
