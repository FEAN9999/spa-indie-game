import type * as Phaser from 'phaser'
import type { Houses } from '../sim/layout'
import type { PlaceId } from '../sim/places'
import { branchTextures } from './branchArt'
import { boughtHouseTextures } from './houses'
import { boughtRestaurantTextures } from './restaurant'
import { loadSvgTextures } from './svg'

/**
 * The pictures boot leaves out, as a new shop shows none of them, each made the first time it is about to show: a branch's room and
 * houses, the main shop's bought houses, and a bought restaurant's floors and houses.
 */
export type LaterArt = PlaceId | 'houses' | 'restaurant'

const drawn = new Set<LaterArt>()

export const laterArtTextures = (art: LaterArt): Record<string, string> =>
  art === 'houses' ? boughtHouseTextures() : art === 'restaurant' ? boughtRestaurantTextures() : branchTextures(art)

/** What the shop at `place` shows of them: a branch its own, the main shop its houses once it has one and the restaurant once it is bought. */
export function laterArtAt(place: PlaceId | null, houses: Houses, restaurant: boolean): LaterArt[] {
  if (place !== null) return [place]
  const arts: LaterArt[] = []
  if (houses.left + houses.right > 0) arts.push('houses')
  if (restaurant) arts.push('restaurant')
  return arts
}

export const artDrawn = (arts: readonly LaterArt[]): boolean => arts.every(art => drawn.has(art))

/** Makes those of `arts` not yet made. */
export function drawArt(scene: Phaser.Scene, arts: readonly LaterArt[]): Promise<void> {
  const missing = arts.filter(art => !drawn.has(art))
  return loadSvgTextures(scene, Object.assign({}, ...missing.map(laterArtTextures))).then(() => {
    for (const art of missing) drawn.add(art)
  })
}
