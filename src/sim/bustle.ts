import { BUSTLE_MAX_SPEEDUP, BUSTLE_PIECES } from '../config'

/** A piece the street in front of the main shop can be given. */
export type BustleId = keyof typeof BUSTLE_PIECES

/** Every piece, in the order the street's list shows them. */
export const BUSTLE_IDS: readonly BustleId[] = ['trees', 'lamps', 'benches', 'banhMi', 'sugarcane', 'busStop', 'park', 'nightMarket']

export const isBustleId = (x: unknown): x is BustleId => (BUSTLE_IDS as readonly unknown[]).includes(x)

/** Phố sầm uất: what the bought pieces add up to. */
export const bustleScore = (bought: readonly BustleId[]): number => bought.reduce((sum, id) => sum + BUSTLE_PIECES[id].score, 0)

/** The most Phố sầm uất reaches, with every piece bought. */
export const BUSTLE_SCORE_MAX = bustleScore(BUSTLE_IDS)

/** Multiplies the gap between two customers: exactly 1 with nothing bought, down to 1 - BUSTLE_MAX_SPEEDUP with every piece. */
export const bustleArrivalFactor = (score: number): number => 1 - (BUSTLE_MAX_SPEEDUP * score) / BUSTLE_SCORE_MAX

/** How much sooner customers come at `score`, in percent, as the game words it. */
export const bustlePercent = (score: number): number => (BUSTLE_MAX_SPEEDUP * 100 * score) / BUSTLE_SCORE_MAX

/** A saved street read back: known pieces, each once, in the order bought; anything that is not a list is an empty street. */
export function repairBustle(x: unknown): BustleId[] {
  if (!Array.isArray(x)) return []
  const out: BustleId[] = []
  for (const id of x) if (isBustleId(id) && !out.includes(id)) out.push(id)
  return out
}
