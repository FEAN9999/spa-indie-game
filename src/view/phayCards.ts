import { C } from '../art/palette'
import { formatCount } from '../strings/format'
import { t } from '../strings/vi'
import type { StringKey } from '../strings/vi'
import type { GoldCard } from './festivals'

const LINES: Record<number, StringKey> = { 1_000: 'phayMilestone1k', 10_000: 'phayMilestone10k', 100_000: 'phayMilestone100k', 1_000_000: 'phayMilestone1m' }

/** The gold card for a follower mark: the count, the blue tick (gold at a million); 100.000 tells of the tick, 1.000.000 of the gold ring. */
export function milestoneCard(n: number): GoldCard {
  return {
    icon: { texture: 'icon-tick', disc: n >= 1_000_000 ? C.mustard : C.cobalt },
    head: t('phayMilestoneHead'),
    name: t('phayMilestoneName', { n: formatCount(n) }),
    line: t(LINES[n] ?? 'phayMilestone1k'),
  }
}
