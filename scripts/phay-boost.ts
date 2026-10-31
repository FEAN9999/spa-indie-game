/**
 * What each Phây boost tier earns the next day against its price, run headless on two shops, each on three seeds:
 *   small: the shop of phay-curve.ts at the end of day 40 (3 seats, 2 beds, 3 technicians, stock bought each morning), which is limited by its seats and beds;
 *   large: a late-game shop at the end of day 90 that a rich player would have built (both houses, all three floors, 12 beds, 9 seats, every technician
 *          the floors and houses allow and the receptionist, stock bought again whenever it runs low), which does not fill its beds on a normal day.
 * The shop is saved at the end of that day, then four arms start from that one save: no boost, and each tier bought that day for the day after.
 * Every arm plays the next day with the same random stream, so only the boost differs; the day is repeated on REPS streams to damp the noise.
 * This only measures: prices and effects stay as the config has them.
 *
 * node has no TypeScript runner here, so bundle it first (from the project folder):
 *   npx rolldown scripts/phay-boost.ts --platform node --format esm --file .phay-boost.mjs && node .phay-boost.mjs
 */
import { awayMean } from '../src/sim/away'
import { addPost, BOOST_TIERS, type BoostTier } from '../src/sim/feed'
import type { ItemKind } from '../src/sim/items'
import { createRng } from '../src/sim/rng'
import { SpaSim } from '../src/sim/spa'
import { noTiers, wageFor, type StaffRole } from '../src/sim/staff'

const SEEDS = [1, 2, 3]
const HIRE_EVERY = 4
/** The next day is played on this many random streams per seed. */
const REPS = 8

type Arm = BoostTier | 'none'
const ARMS: Arm[] = ['none', ...BOOST_TIERS]

interface Setup {
  name: string
  /** The day the boost is bought; it works on the next one. */
  buyDay: number
  large: boolean
}
const SETUPS: Setup[] = [
  { name: 'small shop, day 40', buyDay: 40, large: false },
  { name: 'large late-game shop, day 90', buyDay: 90, large: true },
]

/** Hires a candidate of the role with every stat at `level`; false when the role is full. */
function hire(sim: SpaSim, role: StaffRole, level = 3): boolean {
  const stats = { skill: level, speed: level, friendly: level, stamina: level }
  sim.candidates.push({ name: `T${sim.staff.length + 1}`, role, look: { skin: 0, hair: 0, hairStyle: 0, shirt: 0 }, stats, wage: wageFor(stats), rare: false, tiers: noTiers(), trait: 'studious' })
  const problem = sim.hire(sim.candidates.length - 1)
  if (problem) sim.candidates.pop()
  return problem === null
}

/** The shop plays one day to its end; a large shop buys what runs low at once, as its staff and money allow. */
function playDay(sim: SpaSim, large: boolean): void {
  for (let t = 0; !sim.dayOver; t += 100) {
    if (t > 600_000) throw new Error('day did not end')
    sim.advance(100)
    sim.drainEvents()
    if (large) for (const item of sim.lowStock()) sim.restock(item)
  }
}

/** Buys `kind` on the first tile where it fits; false when it fits nowhere. */
function put(sim: SpaSim, kind: ItemKind): boolean {
  const grid = sim.shellGrid()
  for (let y = 0; y < grid.rows; y++) for (let x = 0; x < grid.cols; x++) if (sim.canPlace(kind, x, y, false) === null) return sim.buy(kind, x, y, false) === null
  return false
}

const BEDS: ItemKind[] = ['bed', 'maskBed', 'massageBed']
const LARGE_BEDS = 12
const LARGE_BENCHES = 3

/** A rich player's morning: houses, floors, beds and benches while there is room, every technician and the receptionist the shop can hold. */
function grow(sim: SpaSim): void {
  for (const side of ['left', 'right'] as const) while (sim.buyHouse(side) === null);
  for (const floor of [2, 3]) sim.openFloor(floor)
  for (let n = 0; sim.items.filter(i => BEDS.includes(i.kind)).length < LARGE_BEDS && n < 30; n++) if (!put(sim, BEDS[n % 3])) break
  for (let n = 0; sim.items.filter(i => i.kind === 'bench').length < LARGE_BENCHES && n < 10; n++) if (!put(sim, 'bench')) break
  for (const role of ['technician', 'receptionist'] as const) while (hire(sim, role, 5));
}

/** A main shop played to the end of `setup.buyDay`, money topped up and stock bought as in phay-curve.ts, with a boostable post in its feed. */
function shopAtBuyDay(seed: number, setup: Setup): SpaSim {
  const { buyDay, large } = setup
  const purse = large ? 20_000_000 : 5_000_000
  const sim = new SpaSim({ rng: createRng(seed), autoSpawn: true })
  sim.profileDone = true
  sim.services = ['shampoo', 'mask', 'massage']
  hire(sim, 'receptionist')
  hire(sim, 'technician')
  for (let day = 1; day <= buyDay; day++) {
    playDay(sim, large)
    if (day === buyDay) break
    sim.money = Math.max(sim.money, purse)
    for (const item of sim.lowStock()) sim.restock(item)
    if (large && day >= 10) grow(sim)
    else if (day % HIRE_EVERY === 0) hire(sim, 'technician')
    sim.startDay()
  }
  sim.money = Math.max(sim.money, purse)
  for (const item of sim.lowStock()) sim.restock(item)
  // a shop post to boost, when the shop news has not filed one; every arm has it, so the followers it wins are in all of them
  if (!sim.feed.posts.some(p => p.boostable && p.boosted === null)) {
    addPost(sim.feed, { kind: 'shop', name: sim.shopName, face: null, tick: false, stars: null, text: 'boost me', pic: null, comments: [], complaint: null, boostable: true, notify: false }, buyDay, sim.clock.minutes, createRng(seed))
  }
  return sim
}

interface NextDay {
  price: number
  /** Income plus tips of the next day. */
  take: number
  tips: number
  served: number
  /** Customers who came in: served, lost to patience, and turned away for want of a seat. */
  arrivals: number
  walked: number
  angry: number
  followers: number
}

function arm(save: ReturnType<SpaSim['toSave']>, which: Arm, stream: number, large: boolean): NextDay {
  const sim = SpaSim.fromSave(save, { rng: createRng(stream), autoSpawn: true })
  sim.drainEvents()
  const followers = sim.feed.followers
  let price = 0
  if (which !== 'none') {
    const post = sim.feed.posts.find(p => p.boostable && p.boosted === null)
    if (!post) throw new Error('no post to boost')
    price = sim.boostPrice(which)
    const problem = sim.boostPost(post.id, which)
    if (problem) throw new Error(`boost refused: ${problem}`)
    if (sim.boostTier() !== null) throw new Error('boost runs on the day it was bought')
  }
  sim.startDay()
  if (sim.boostTier() !== (which === 'none' ? null : which)) throw new Error(`boost not running on day ${sim.day}: ${sim.boostTier()}`)
  playDay(sim, large)
  const { served, angry, walkedAway, income, tips } = sim.stats
  return { price, take: income + tips, tips, served, arrivals: served + angry + walkedAway, walked: walkedAway, angry, followers: sim.feed.followers - followers }
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
const sd = (xs: number[]) => Math.sqrt(mean(xs.map(x => (x - mean(xs)) ** 2)))
const k = (n: number) => `${(n / 1000).toFixed(0)}k`
const sk = (n: number) => `${n >= 0 ? '+' : '-'}${k(Math.abs(n))}`

interface Row {
  price: number
  take: number
  extra: number
  tipsExtra: number
  net: number
  followers: number
  served: number
  arrivals: number
  walked: number
  angry: number
  netSd: number
}
const KEYS: (keyof Row)[] = ['price', 'take', 'extra', 'tipsExtra', 'net', 'followers', 'served', 'arrivals', 'walked', 'angry', 'netSd']

function table(rows: Record<Arm, Row>): string[] {
  const head = 'arm     price  take(inc+tips)  extra(tips)        net  followers  served  arrivals  walk-outs  angry  net sd'
  const lines = ARMS.map(a => {
    const r = rows[a]
    const none = a === 'none'
    return [
      a.padEnd(7),
      k(r.price).padStart(6),
      k(r.take).padStart(14),
      (none ? '' : `${sk(r.extra)} (${sk(r.tipsExtra)})`).padStart(11),
      (none ? '' : sk(r.net)).padStart(9),
      (none ? '' : `+${r.followers.toFixed(0)}`).padStart(9),
      r.served.toFixed(1).padStart(6),
      r.arrivals.toFixed(1).padStart(8),
      r.walked.toFixed(1).padStart(9),
      r.angry.toFixed(1).padStart(5),
      (none ? '' : k(r.netSd)).padStart(6),
    ].join('  ')
  })
  return [head, ...lines]
}

for (const setup of SETUPS) {
  const perSeed: Record<Arm, Row>[] = []
  console.log(`=== ${setup.name} ===`)
  for (const seed of SEEDS) {
    const sim = shopAtBuyDay(seed, setup)
    const beds = sim.items.filter(i => BEDS.includes(i.kind)).length
    const save = sim.toSave()
    const runs = {} as Record<Arm, NextDay[]>
    for (const a of ARMS) runs[a] = Array.from({ length: REPS }, (_, i) => arm(save, a, seed * 1000 + i, setup.large))
    const rows = {} as Record<Arm, Row>
    for (const a of ARMS) {
      const extras = runs[a].map((r, i) => r.take - runs.none[i].take)
      const nets = extras.map((e, i) => e - runs[a][i].price)
      const avg = (f: (r: NextDay) => number) => mean(runs[a].map(f))
      rows[a] = {
        price: runs[a][0].price,
        take: avg(r => r.take),
        extra: mean(extras),
        tipsExtra: mean(runs[a].map((r, i) => r.tips - runs.none[i].tips)),
        net: mean(nets),
        followers: mean(runs[a].map((r, i) => r.followers - runs.none[i].followers)),
        served: avg(r => r.served),
        arrivals: avg(r => r.arrivals),
        walked: avg(r => r.walked),
        angry: avg(r => r.angry),
        netSd: sd(nets),
      }
    }
    perSeed.push(rows)
    console.log(`seed ${seed}: day ${setup.buyDay}, ${beds} beds, ${sim.seats.length} seats, ${sim.staff.length} staff, 3-day mean profit ${k(awayMean(sim.away))}, ${REPS} streams of day ${setup.buyDay + 1}`)
    for (const line of table(rows)) console.log(line)
    console.log('')
  }
  const all = {} as Record<Arm, Row>
  for (const a of ARMS) all[a] = Object.fromEntries(KEYS.map(key => [key, mean(perSeed.map(r => r[a][key]))])) as unknown as Row
  console.log(`mean over ${SEEDS.length} seeds, ${setup.name} (money in thousands; extra and net against no boost on the same stream; followers beyond the no-boost arm, boost included)`)
  for (const line of table(all)) console.log(line)
  console.log('')
}
