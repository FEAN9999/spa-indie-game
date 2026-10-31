/**
 * Phây's follower curve, run headless: a main shop on three seeds for 240 days, a technician hired every few days,
 * the owner serving no one. Prints the followers at the checkpoints, the complaint posts a day early and late, and the save-code length.
 *
 * node has no TypeScript runner here, so bundle it first (from the project folder):
 *   npx rolldown scripts/phay-curve.ts --platform node --format esm --file .phay-curve.mjs && node .phay-curve.mjs
 */
import { encodeSaveCode } from '../src/save/code'
import { createRng } from '../src/sim/rng'
import { SpaSim } from '../src/sim/spa'
import { noTiers, wageFor, type StaffRole } from '../src/sim/staff'

const SEEDS = [1, 2, 3]
const DAYS = 240
const CHECKPOINTS = [20, 30, 60, 90, 120, 240]
/** A technician is hired this often until the shop is full. */
const HIRE_EVERY = 4
const EARLY = [8, 20]
const LATE = [100, 120]

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

const inDays = ([from, to]: number[], by: Map<number, number>) => {
  let n = 0
  for (let d = from; d <= to; d++) n += by.get(d) ?? 0
  return n / (to - from + 1)
}

async function run(seed: number) {
  const sim = new SpaSim({ rng: createRng(seed), autoSpawn: true })
  sim.profileDone = true
  sim.services = ['shampoo', 'mask', 'massage']
  hire(sim, 'receptionist')
  hire(sim, 'technician')
  const followers: Record<number, number> = {}
  const complaints = new Map<number, number>()
  const seen = new Set<number>()
  const codes: Record<number, number> = {}
  let last = 0
  for (let day = 1; day <= DAYS; day++) {
    playDay(sim)
    for (const p of sim.feed.posts) {
      if (p.kind === 'complaint' && !seen.has(p.id)) {
        seen.add(p.id)
        complaints.set(p.day, (complaints.get(p.day) ?? 0) + 1)
      }
    }
    if (sim.feed.followers < last) throw new Error(`followers fell on day ${day}`)
    last = sim.feed.followers
    if (CHECKPOINTS.includes(day)) followers[day] = sim.feed.followers
    if (day === 60 || day === 240) codes[day] = (await encodeSaveCode(sim.toSave())).length
    // the next morning: money topped up, what ran low bought again, a technician hired every few days until the shop is full
    sim.money = Math.max(sim.money, 5_000_000)
    for (const item of sim.lowStock()) sim.restock(item)
    if (day % HIRE_EVERY === 0) hire(sim, 'technician')
    sim.startDay()
  }
  return { followers, early: inDays(EARLY, complaints), late: inDays(LATE, complaints), codes, milestones: sim.feed.milestones }
}

console.log(`followers at day ${CHECKPOINTS.join(' / ')}`)
for (const seed of SEEDS) {
  const r = await run(seed)
  console.log(
    `seed ${seed}: ${CHECKPOINTS.map(d => r.followers[d]).join(' / ')} | complaints a day: days ${EARLY.join('-')} ${r.early.toFixed(2)}, days ${LATE.join('-')} ${r.late.toFixed(2)} | save code: day 60 ${r.codes[60]}, day 240 ${r.codes[240]} chars | milestones ${r.milestones.join(',')}`,
  )
}
