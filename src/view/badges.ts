import { badgeProgress, type BadgeId, type Badges, type BadgeShop } from '../sim/badges'
import { formatCount, formatMoney } from '../strings/format'
import { t, type StringKey } from '../strings/vi'

/** Each badge's name and what it asks for. */
export const BADGE_TEXT: Record<BadgeId, { name: StringKey; cond: StringKey }> = {
  served100: { name: 'badgeServed100', cond: 'badgeServed100Cond' },
  served1000: { name: 'badgeServed1000', cond: 'badgeServed1000Cond' },
  goldHands: { name: 'badgeGoldHands', cond: 'badgeGoldHandsCond' },
  busyDay: { name: 'badgeBusyDay', cond: 'badgeBusyDayCond' },
  cleanDay: { name: 'badgeCleanDay', cond: 'badgeCleanDayCond' },
  firstCard: { name: 'badgeFirstCard', cond: 'badgeFirstCardCond' },
  fullBook: { name: 'badgeFullBook', cond: 'badgeFullBookCond' },
  vipPhoto: { name: 'badgeVipPhoto', cond: 'badgeVipPhotoCond' },
  vipBoard: { name: 'badgeVipBoard', cond: 'badgeVipBoardCond' },
  allServices: { name: 'badgeAllServices', cond: 'badgeAllServicesCond' },
  firstRecipe: { name: 'badgeFirstRecipe', cond: 'badgeFirstRecipeCond' },
  floor2: { name: 'badgeFloor2', cond: 'badgeFloor2Cond' },
  rooftop: { name: 'badgeRooftop', cond: 'badgeRooftopCond' },
  pretty: { name: 'badgePretty', cond: 'badgePrettyCond' },
  fullCrew: { name: 'badgeFullCrew', cond: 'badgeFullCrewCond' },
  masterTech: { name: 'badgeMasterTech', cond: 'badgeMasterTechCond' },
  million: { name: 'badgeMillion', cond: 'badgeMillionCond' },
  bigProfit: { name: 'badgeBigProfit', cond: 'badgeBigProfitCond' },
  diligent: { name: 'badgeDiligent', cond: 'badgeDiligentCond' },
  fullYear: { name: 'badgeFullYear', cond: 'badgeFullYearCond' },
}

/** The texture each badge's medal shows. */
export const BADGE_ICON: Record<BadgeId, string> = {
  served100: 'badge-person',
  served1000: 'badge-people',
  goldHands: 'badge-star',
  busyDay: 'badge-people',
  cleanDay: 'badge-heart',
  firstCard: 'badge-card',
  fullBook: 'badge-book',
  vipPhoto: 'badge-photo',
  vipBoard: 'badge-plaque',
  allServices: 'badge-lotus',
  firstRecipe: 'badge-bowl',
  floor2: 'badge-stairs',
  rooftop: 'badge-flower',
  pretty: 'badge-sparkle',
  fullCrew: 'badge-people',
  masterTech: 'badge-medal',
  million: 'badge-coins',
  bigProfit: 'badge-chart',
  diligent: 'badge-list',
  fullYear: 'badge-cake',
}

/** A badge's line under its name: the day it came, how far it has come, or not yet. */
export function badgeStatus(id: BadgeId, got: Badges, s: BadgeShop): { text: string; done: boolean } {
  const day = got[id]
  if (day !== undefined) return { text: day > 0 ? t('badgeSince', { day }) : t('badgeFromBefore'), done: true }
  const progress = badgeProgress(id, s)
  if (!progress) return { text: t('badgeNotYet'), done: false }
  const [n, goal] = progress
  const text = id === 'bigProfit' ? t('badgeProgressMoney', { n: formatMoney(n), goal: formatMoney(goal) }) : t('badgeProgress', { n: formatCount(n), goal: formatCount(goal) })
  return { text, done: false }
}
