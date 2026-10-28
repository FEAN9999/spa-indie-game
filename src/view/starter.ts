import { C } from '../art/palette'
import { STARTER_REWARD, UNLOCK_DAY } from '../config'
import type { SpaSim } from '../sim/spa'
import { currentGoal, goalProgress, STARTER_GOAL_IDS, STARTER_OPENS, starterRunning, type StarterFeature, type StarterGoalId } from '../sim/starter'
import type { SimEvent } from '../sim/types'
import type { Feature } from '../sim/unlocks'
import { formatMoney } from '../strings/format'
import { t, type StringKey } from '../strings/vi'
import type { GoldCard } from './festivals'
import type { TodayLine } from './today'

/** The starter goals' flag, on the goal line and the goal card. */
export const GOAL_ICON = { texture: 'icon-flag', disc: C.mint }

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

const BUTTON_NAME: Record<StarterFeature, StringKey> = { build: 'navBuild', services: 'navServices', staff: 'navStaff' }
const STORY: Record<StarterFeature, StringKey> = { build: 'goalStoryBuild', services: 'goalStoryServices', staff: 'goalStoryStaff' }

/** The goal being worked on, over the floor buttons: its name, and how far along when it needs more than one thing. */
export function goalLine(sim: SpaSim): TodayLine | null {
  const goal = currentGoal(sim.starter)
  if (!goal) return null
  const { have, need } = goalProgress(goal, sim.starterShop())
  const name = t(GOAL_NAME[goal])
  return { icon: GOAL_ICON, text: need > 1 ? `${name} · ${have}/${need}` : name }
}

/** The gold card for a finished goal: its reward, the mask gift, and a button it opened with a line of story. */
export function goalCard(e: Extract<SimEvent, { type: 'goalDone' }>): GoldCard {
  const parts: string[] = []
  if (e.reward > 0) parts.push(`+${formatMoney(e.reward)}`)
  // the mask gift pays the opening price back when the shop had already paid it
  if (e.goal === 'serveMore') parts.push(t(e.reward > 0 ? 'goalMaskGiftPaid' : 'goalMaskGift'))
  if (e.opens) parts.push(`${t('goalOpens', { name: t(BUTTON_NAME[e.opens]) })}. ${t(STORY[e.opens])}`)
  return { icon: GOAL_ICON, head: t('goalDoneHead'), name: t(GOAL_NAME[e.goal]), line: parts.join(' · ') }
}

export interface ChainRow {
  name: string
  state: 'done' | 'current' | 'later'
  have: number
  need: number
  /** What the goal gives: its reward, the mask gift, and the button it opens. */
  detail: string
}

/** The starter chain as the quest panel lists it before the daily quests open. */
export function chainRows(sim: SpaSim): ChainRow[] {
  const shop = sim.starterShop()
  return STARTER_GOAL_IDS.map((goal, i) => {
    const state = i < sim.starter.at ? 'done' : i === sim.starter.at ? 'current' : 'later'
    const { have, need } = goalProgress(goal, shop)
    const parts: string[] = []
    if (STARTER_REWARD[goal] > 0) parts.push(`+${formatMoney(STARTER_REWARD[goal])}`)
    if (goal === 'serveMore') parts.push(t('goalMaskGiftShort'))
    const opens = STARTER_OPENS[goal]
    if (opens) parts.push(t('goalOpens', { name: t(BUTTON_NAME[opens]) }))
    // the last goal opens the daily quests
    if (i === STARTER_GOAL_IDS.length - 1) parts.push(t('goalOpensDaily'))
    return { name: t(GOAL_NAME[goal]), state, have: state === 'done' ? need : have, need, detail: parts.join(' · ') }
  })
}
