import { BADGE_IDS } from '../sim/badges'
import { OUTFIT_IDS, outfitNeed, type OutfitId } from '../sim/outfits'
import { t, type StringKey } from '../strings/vi'

/** Each outfit's name. */
export const OUTFIT_NAME: Record<OutfitId, StringKey> = {
  baba: 'outfitBaba',
  uniform: 'outfitUniform',
  khanran: 'outfitKhanran',
  teal: 'outfitTeal',
  lotus: 'outfitLotus',
  tile: 'outfitTile',
  mai: 'outfitMai',
  gam: 'outfitGam',
  year: 'outfitYear',
}

/** The wardrobe's head: the badges the shop has and the outfits open. */
export const wardrobeHead = (badges: number, open: number): string => t('wardrobeHead', { badges, badgeTotal: BADGE_IDS.length, open, total: OUTFIT_IDS.length })

/** The line under the picked outfit: worn, ready to wear, or what it still asks for. */
export function outfitStatus(id: OutfitId, worn: OutfitId, unlocked: OutfitId[], badges: number): { text: string; ok: boolean } {
  if (id === worn) return { text: t('outfitWorn'), ok: true }
  if (unlocked.includes(id)) return { text: t('outfitCanWear'), ok: true }
  const need = outfitNeed(id)
  if (need === 'year') return { text: t('outfitYearOnly'), ok: false }
  return { text: t('outfitNeedLeft', { need, left: need - badges }), ok: false }
}

/** The corner tag of a tile that asks for something; null for the bà ba. */
export function outfitTileTag(id: OutfitId): string | null {
  const need = outfitNeed(id)
  if (need === 'year') return t('outfitTagYear')
  return need === 0 ? null : t('outfitTagNeed', { need })
}

/** The head of the card that announces a new outfit. */
export function newOutfitHead(id: OutfitId): string {
  const need = outfitNeed(id)
  return need === 'year' ? t('newOutfitHeadYear') : t('newOutfitHead', { need })
}

/** The line about further new outfits in the same batch; null when there are none. */
export const newOutfitMore = (n: number): string | null => (n > 0 ? t('newOutfitMore', { n }) : null)
