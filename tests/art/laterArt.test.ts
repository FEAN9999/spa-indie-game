import { describe, expect, it, vi } from 'vitest'
import { saleRoofTextures } from '../../src/art/houses'
import { laterArtAt, laterArtTextures } from '../../src/art/laterArt'
import { streetRestaurantTextures } from '../../src/art/restaurant'
import { NO_HOUSES } from '../../src/sim/layout'
import { houseTextureKey, housesBetween, saleTextureKey } from '../../src/view/houses'

vi.mock('phaser', () => ({}))

const ALL = { left: 2, right: 2 } as const

describe('laterArtAt', () => {
  it('asks nothing of a new main shop', () => {
    expect(laterArtAt(null, NO_HOUSES, false)).toEqual([])
  })

  it('asks for the houses once one is bought, and for the restaurant once it is', () => {
    expect(laterArtAt(null, { left: 1, right: 0 }, false)).toEqual(['houses'])
    expect(laterArtAt(null, { left: 0, right: 2 }, true)).toEqual(['houses', 'restaurant'])
    expect(laterArtAt(null, NO_HOUSES, true)).toEqual(['restaurant'])
  })

  it('asks a branch only for its own, whatever the main shop has', () => {
    expect(laterArtAt('beach', ALL, true)).toEqual(['beach'])
  })
})

describe('laterArtTextures', () => {
  it('has every floor of every house the main shop can buy', () => {
    const textures = laterArtTextures('houses')
    for (const h of housesBetween(NO_HOUSES, ALL)) for (const floor of [1, 2, 3]) expect(textures[houseTextureKey(null, h, floor)]).toBeTruthy()
  })

  it('leaves the roofs for sale to boot, as they stand on the street before anything is bought', () => {
    const roofs = saleRoofTextures()
    for (const h of housesBetween(NO_HOUSES, ALL)) expect(roofs[saleTextureKey(null, h)]).toBeTruthy()
    expect(Object.keys(laterArtTextures('houses')).some(k => k in roofs)).toBe(false)
  })

  it('has the bought restaurant floors, and leaves the old house to boot', () => {
    const textures = laterArtTextures('restaurant')
    for (const key of ['rest-room', 'rest-room-2', 'rest-room-3']) expect(textures[key]).toBeTruthy()
    const street = streetRestaurantTextures()
    for (const key of ['rest-old', 'rest-upper', 'spa-upper', 'lot-front', 'fx-bike']) expect(street[key]).toBeTruthy()
    expect(Object.keys(textures).some(k => k in street)).toBe(false)
  })
})
