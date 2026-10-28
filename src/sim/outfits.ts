import { OUTFIT_NEED } from '../config'

export const OUTFIT_IDS = ['baba', 'uniform', 'khanran', 'teal', 'lotus', 'tile', 'mai', 'gam', 'year'] as const
export type OutfitId = (typeof OUTFIT_IDS)[number]

export const isOutfitId = (x: unknown): x is OutfitId => OUTFIT_IDS.includes(x as OutfitId)

/** How many badges an outfit asks for; the year dress asks for a Spa của năm win instead. */
export function outfitNeed(id: OutfitId): number | 'year' {
  if (id === 'baba') return 0
  if (id === 'year') return 'year'
  return OUTFIT_NEED[OUTFIT_IDS.indexOf(id) - 1]
}

/** The outfits a shop has, from its badge count and Spa của năm wins, in wardrobe order. */
export function unlockedOutfits(badges: number, wins: number): OutfitId[] {
  return OUTFIT_IDS.filter(id => {
    const need = outfitNeed(id)
    return need === 'year' ? wins > 0 : badges >= need
  })
}
