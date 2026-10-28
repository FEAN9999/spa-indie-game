import { GAME_W } from '../config'
import type { Chain } from '../sim/chain'

export type NavId = 'build' | 'staff' | 'services' | 'quests' | 'chain'

/** The buttons of the bottom bar: the quests belong to the main shop, and the chain shows from its stars or once a branch is there. */
export function navIds(chain: Chain): NavId[] {
  const atBranch = chain.at !== null
  return ['build', 'staff', 'services', ...(atBranch ? [] : (['quests'] as const)), ...(chain.chainShown() || atBranch ? (['chain'] as const) : [])]
}

/** The centre of plate `i` of `n`, which share the width. */
export const navX = (i: number, n: number): number => (GAME_W / n) * (i + 0.5)
