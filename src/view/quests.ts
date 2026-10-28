import { progressOf, type Counts, type Quest, type QuestKind } from '../sim/quests'
import { SERVICES } from '../sim/services'
import { formatMoney } from '../strings/format'
import { t } from '../strings/vi'

/** The texture drawn in each quest's disc; a service quest shows its service's badge. */
export const QUEST_ICON: Record<Exclude<QuestKind, 'service'>, string> = {
  serve: 'quest-guest',
  owner3: 'star',
  earn: 'coin',
  tips: 'coin',
  staff: 'icon-staff',
  noWalk: 'heart-full',
  heart: 'heart-full',
  study: 'icon-book',
}

export const questIcon = (q: Quest): string => (q.kind === 'service' ? `svc-${q.service}` : QUEST_ICON[q.kind])

/** The quest as the panel and the toast name it. */
export function questTitle(q: Quest): string {
  const month = q.period === 'month'
  const n = q.target
  switch (q.kind) {
    case 'serve': return t(month ? 'questServeMonth' : 'questServe', { n })
    case 'owner3': return t(month ? 'questOwner3Month' : 'questOwner3', { n })
    case 'earn': return t(month ? 'questEarnMonth' : 'questEarn', { money: formatMoney(n) })
    case 'tips': return t('questTips', { money: formatMoney(n) })
    case 'service':
      if (q.festival) return t('questFestival', { n, service: t(SERVICES[q.service!].name) })
      return t('questService', { n, service: t(SERVICES[q.service!].name).toLocaleLowerCase('vi') })
    case 'staff': return t('questStaff', { n })
    case 'noWalk': return t('questNoWalk')
    case 'heart': return t('questHeart')
    case 'study': return t('questStudy')
  }
}

/** Money cut short for a progress label, rounded down so it never shows a target as reached early: 310k, 1,2tr. */
export function shortMoney(n: number): string {
  if (n < 1_000_000) return `${Math.floor(n / 1000)}k`
  return `${String(Math.floor(n / 100_000) / 10).replace('.', ',')}tr`
}

/** "4/10", or short money on both sides for a money quest. */
export function questCount(q: Quest, total: Counts): string {
  const done = progressOf(q, total)
  return q.kind === 'earn' || q.kind === 'tips' ? `${shortMoney(done)}/${shortMoney(q.target)}` : `${done}/${q.target}`
}
