/**
 * What each Phây boost tier earns the next day against its price, run headless: a main shop on three seeds to day 40 (the same shop as
 * phay-curve.ts), saved at the end of day 40, then four arms from that one save: no boost, and each tier bought on day 40 for day 41.
 * Every arm plays day 41 with the same random stream, so only the boost differs; the day is repeated on REPS streams to damp the noise.
 * This only measures: prices and effects stay as the config has them.
 *
 * node has no TypeScript runner here, so bundle it first (from the project folder):
 *   npx rolldown scripts/phay-boost.ts --platform node --format esm --file .phay-boost.mjs && node .phay-boost.mjs
 */
import { awayMean } from '../src/sim/away'
import { addPost, BOOST_TIERS, type BoostTier } from '../src/sim/feed'
import { createRng } from '../src/sim/rng'
import { SpaSim } from '../src/sim/spa'
import { noTiers, wageFor, type StaffRole } from '../src/sim/staff'

const SEEDS = [1, 2, 3]
/** The day the boost is bought; it works on the next one. */
const BUY_DAY = 40
const HIRE_EVERY = 4
/** Day 41 is played on this many random streams per seed. */
const REPS = 8

type Arm = BoostTier | 'none'
const ARMS: Arm[] = ['none', ...BOOST_TIERS]

function hire(sim: SpaSim, role: StaffRole): void {
  const stats = { skill: 3, speed: 3, friendly: 3, stamina: 3 }
  sim.candidates.push({ name: `T${sim.staff.length + 1}`, role, look: { skin: 0, hair: 0, hairStyle: 0, shirt: 0 }, stats, wage: wageFor(stats), rare: false, tiers: noTiers(), trait: 'studious' })
  sim.hire(sim.candidates.length - 1)
}

/** The shop plays one day to its end. */
function playDay(sim: SpaSim): void {
  for (let t = 0; !sim.dayOver; t += 100) {
    if (t > 600_000) throw new Error('day did not end')
    sim.advance(100)
    sim.drainEvents()
  }
}

/** A main shop played to the end of day 40, money topped up and stock bought as in phay-curve.ts, with a boostable post in its feed. */
function shopAtDay40(seed: number): SpaSim {
  const sim = new SpaSim({ rng: createRng(seed), autoSpawn: true })
  sim.profileDone = true
  sim.services = ['shampoo', 'mask', 'massage']
  hire(sim, 'receptionist')
  hire(sim, 'technician')
  for (let day = 1; day <= BUY_DAY; day++) {
    playDay(sim)
    if (day === BUY_DAY) break
    sim.money = Math.max(sim.money, 5_000_000)
    for (const item of sim.lowStock()) sim.restock(item)
    if (day % HIRE_EVERY === 0) hire(sim, 'technician')
    sim.startDay()
  }
  sim.money = Math.max(sim.money, 5_000_000)
  for (const item of sim.lowStock()) sim.restock(item)
  // a shop post to boost, when the shop news has not filed one; every arm has it, so the followers it wins are in all of them
  if (!sim.feed.posts.some(p => p.boostable && p.boosted === null)) {
    addPost(sim.feed, { kind: 'shop', name: sim.shopName, face: null, tick: false, stars: null, text: 'boost me', pic: null, comments: [], complaint: null, boostable: true, notify: false }, BUY_DAY, sim.clock.minutes, createRng(seed))
  }
  return sim
}

interface Day41 {
  price: number
  /** Income plus tips of day 41. */
  take: number
  tips: number
  served: number
  followers: number
}

function arm(save: ReturnType<SpaSim['toSave']>, arm: Arm, stream: number): Day41 {
  const sim = SpaSim.fromSave(save, { rng: createRng(stream), autoSpawn: true })
  sim.drainEvents()
  const followers = sim.feed.followers
  let price = 0
  if (arm !== 'none') {
    const post = sim.feed.posts.find(p => p.boostable && p.boosted === null)
    if (!post) throw new Error('no post to boost')
    price = sim.boostPrice(arm)
    const problem = sim.boostPost(post.id, arm)
    if (problem) throw new Error(`boost refused: ${problem}`)
    if (sim.boostTier() !== null) throw new Error('boost runs on the day it was bought')
  }
  sim.startDay()
  if (sim.boostTier() !== (arm === 'none' ? null : arm)) throw new Error(`boost not running on day ${sim.day}: ${sim.boostTier()}`)
  playDay(sim)
  return { price, take: sim.stats.income + sim.stats.tips, tips: sim.stats.tips, served: sim.stats.served, followers: sim.feed.followers - followers }
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
  netSd: number
}

function table(rows: Record<Arm, Row>): string[] {
  const head = 'arm     price  take(inc+tips)  extra(tips)       net      followers  served  net sd over streams'
  const lines = ARMS.map(a => {
    const r = rows[a]
    return `${a.padEnd(7)} ${k(r.price).padStart(6)}  ${k(r.take).padStart(14)}  ${(a === 'none' ? '' : `${sk(r.extra)} (${sk(r.tipsExtra)})`).padStart(11)}  ${(a === 'none' ? '' : sk(r.net)).padStart(8)}  ${(a === 'none' ? '' : `+${r.followers.toFixed(0)}`).padStart(9)}  ${r.served.toFixed(1).padStart(6)}  ${(a === 'none' ? '' : k(r.netSd)).padStart(8)}`
  })
  return [head, ...lines]
}

const perSeed: Record<Arm, Row>[] = []
for (const seed of SEEDS) {
  const sim = shopAtDay40(seed)
  const save = sim.toSave()
  const runs = {} as Record<Arm, Day41[]>
  for (const a of ARMS) runs[a] = Array.from({ length: REPS }, (_, i) => arm(save, a, seed * 1000 + i))
  const rows = {} as Record<Arm, Row>
  for (const a of ARMS) {
    const extras = runs[a].map((r, i) => r.take - runs.none[i].take)
    const nets = extras.map((e, i) => e - runs[a][i].price)
    rows[a] = {
      price: runs[a][0].price,
      take: mean(runs[a].map(r => r.take)),
      extra: mean(extras),
      tipsExtra: mean(runs[a].map((r, i) => r.tips - runs.none[i].tips)),
      net: mean(nets),
      followers: mean(runs[a].map((r, i) => r.followers - runs.none[i].followers)),
      served: mean(runs[a].map(r => r.served)),
      netSd: sd(nets),
    }
  }
  perSeed.push(rows)
  console.log(`seed ${seed}: day ${BUY_DAY} money ${k(sim.money)}, 3-day mean profit ${k(awayMean(sim.away))}, ${REPS} streams of day ${BUY_DAY + 1}`)
  for (const line of table(rows)) console.log(line)
  console.log('')
}

const all = {} as Record<Arm, Row>
for (const a of ARMS) {
  const pick = <K extends keyof Row>(key: K) => mean(perSeed.map(r => r[a][key]))
  all[a] = { price: pick('price'), take: pick('take'), extra: pick('extra'), tipsExtra: pick('tipsExtra'), net: pick('net'), followers: pick('followers'), served: pick('served'), netSd: pick('netSd') }
}
console.log(`mean over ${SEEDS.length} seeds (money in thousands; extra and net against no boost on the same stream; followers gained beyond the no-boost arm, boost's own included)`)
for (const line of table(all)) console.log(line)
