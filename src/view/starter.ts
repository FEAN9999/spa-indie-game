import { UNLOCK_DAY } from '../config'
import type { SpaSim } from '../sim/spa'
import { STARTER_GOAL_IDS, STARTER_OPENS, starterRunning, type StarterGoalId } from '../sim/starter'
import type { Feature } from '../sim/unlocks'
import { t, type StringKey } from '../strings/vi'

export const GOAL_NAME: Record<StarterGoalId, StringKey> = {
  firstGuest: 'goalFirstGuest',
  threeStars: 'goalThreeStars',
  serveFew: 'goalServeFew',
  buyDecor: 'goalBuyDecor',
  serveMore: 'goalServeMore',
  placeMaskBed: 'goalPlaceMaskBed',
  maskTwice: 'goalMaskTwice',
  serveMany: 'goalServeMany',
  hireTech: 'goalHireTech',
  openMassage: 'goalOpenMassage',
  massageTwice: 'goalMassageTwice',
}

/** What a tap on a locked button says: the goal that opens it while the starter chain runs, else the day it opens. */
export function lockedText(sim: SpaSim, f: Feature): string {
  const goal = STARTER_GOAL_IDS.find(id => STARTER_OPENS[id] === f)
  if (goal && starterRunning(sim.starter)) return t('opensWhenDone', { goal: t(GOAL_NAME[goal]) })
  return t('unlocksOn', { day: UNLOCK_DAY[f] })
}
