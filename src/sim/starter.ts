import { STARTER_NEED } from '../config'

/** The starter chain's goals, in the order a new shop works through them. */
export const STARTER_GOAL_IDS = ['firstGuest', 'threeStars', 'serveFew', 'buyDecor', 'serveMore', 'placeMaskBed', 'maskTwice', 'serveMany', 'hireTech', 'openMassage', 'massageTwice'] as const
export type StarterGoalId = (typeof STARTER_GOAL_IDS)[number]

/** The buttons a goal can open before their day. */
export type StarterFeature = 'build' | 'services' | 'staff'

export const STARTER_OPENS: Partial<Record<StarterGoalId, StarterFeature>> = { serveFew: 'build', serveMore: 'services', serveMany: 'staff' }

/** What the shop has done, as the goals read it; the counts run from the shop's opening. */
export interface StarterShop {
  served: number
  /** Customers the owner served with three stars. */
  owner3: number
  /** Decor and seats bought while the chain runs. */
  bought: number
  maskBedPlaced: boolean
  maskServed: number
  /** Technicians who are not leaving. */
  technicians: number
  massageOpen: boolean
  massageServed: number
}

export interface StarterBook {
  /** The goal being worked on, as an index into STARTER_GOAL_IDS; its length once the chain is done. */
  at: number
  /** The day the last goal was done; null while the chain runs, and for a shop that never ran it. */
  doneDay: number | null
  /** Decor and seats bought while the chain runs. */
  bought: number
  /** The day a goal opened each button. */
  opened: Partial<Record<StarterFeature, number>>
  /** The mask gift is given and the next plain customer, once a mask bed is down, still has to ask for mask. */
  maskNext: boolean
}

export const newStarter = (): StarterBook => ({ at: 0, doneDay: null, bought: 0, opened: {}, maskNext: false })

/** A shop from before the chain, or one built without it: done, with nothing opened early. */
export const pastStarter = (): StarterBook => ({ at: STARTER_GOAL_IDS.length, doneDay: null, bought: 0, opened: {}, maskNext: false })

export const isPast = (b: StarterBook): boolean => b.at >= STARTER_GOAL_IDS.length && b.doneDay === null

export const starterRunning = (b: StarterBook): boolean => b.at < STARTER_GOAL_IDS.length

export const currentGoal = (b: StarterBook): StarterGoalId | null => STARTER_GOAL_IDS[b.at] ?? null

const HAVE: Record<StarterGoalId, (s: StarterShop) => number | boolean> = {
  firstGuest: s => s.served,
  threeStars: s => s.owner3,
  serveFew: s => s.served,
  buyDecor: s => s.bought,
  serveMore: s => s.served,
  placeMaskBed: s => s.maskBedPlaced,
  maskTwice: s => s.maskServed,
  serveMany: s => s.served,
  hireTech: s => s.technicians,
  openMassage: s => s.massageOpen,
  massageTwice: s => s.massageServed,
}

/** How far the shop is with a goal; `have` never passes `need`. */
export function goalProgress(id: StarterGoalId, shop: StarterShop): { have: number; need: number } {
  const need = STARTER_NEED[id]
  return { have: Math.min(need, Number(HAVE[id](shop))), need }
}

/** Finishes, in order from the current one, every goal the shop has reached; a goal that opens a button stamps the day unless it was stamped before. */
export function settleStarter(b: StarterBook, shop: StarterShop, day: number): StarterGoalId[] {
  const done: StarterGoalId[] = []
  for (let id = currentGoal(b); id !== null; id = currentGoal(b)) {
    const { have, need } = goalProgress(id, shop)
    if (have < need) break
    done.push(id)
    b.at++
    const opens = STARTER_OPENS[id]
    if (opens && b.opened[opens] === undefined) b.opened[opens] = day
    if (!starterRunning(b)) b.doneDay = day
  }
  return done
}

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)
const isDay = (x: unknown): x is number => Number.isInteger(x) && (x as number) >= 1

/** A saved book, or the past one when it is missing or cannot be read. */
export function repairStarter(x: unknown): StarterBook {
  if (!isObject(x) || !Number.isInteger(x.at) || (x.at as number) < 0 || (x.at as number) > STARTER_GOAL_IDS.length) return pastStarter()
  const opened: Partial<Record<StarterFeature, number>> = {}
  const raw = isObject(x.opened) ? x.opened : {}
  for (const f of ['build', 'services', 'staff'] as const) if (isDay(raw[f])) opened[f] = raw[f]
  return {
    at: x.at as number,
    doneDay: isDay(x.doneDay) ? x.doneDay : null,
    bought: Number.isInteger(x.bought) && (x.bought as number) >= 0 ? (x.bought as number) : 0,
    opened,
    maskNext: x.maskNext === true,
  }
}
