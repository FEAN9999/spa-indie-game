import { describe, expect, it, vi } from 'vitest'
import { beachRoomTexture } from '../../src/art/beach'
import { branchTextures } from '../../src/art/branchArt'
import { branchFloorTextures } from '../../src/art/branchFloors'
import { branchHouseTextures } from '../../src/art/branchHouses'
import { preloadSvgTextures } from '../../src/art/svg'
import { parseLayout } from '../../src/sim/grid'
import { BRANCH_ROOM } from '../../src/sim/places'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

const PLACES = ['beach', 'oldTown', 'uptown'] as const

describe('the pictures a branch makes the first time it shows', () => {
  it('are its own room on every floor, its houses and its sale roof', () => {
    const keys = Object.keys(branchTextures('beach'))
    expect(keys).toEqual(expect.arrayContaining(['room-beach', 'room-beach-2', 'room-beach-3', 'sale-beach']))
    expect(keys.filter(k => k.startsWith('house-')).every(k => k.startsWith('house-beach-'))).toBe(true)
    expect(branchTextures('beach')['room-beach']).toBe(beachRoomTexture(parseLayout(BRANCH_ROOM)))
  })

  it('together are every branch picture the boot made, each once', () => {
    const grid = parseLayout(BRANCH_ROOM)
    const boot = ['room-beach', 'room-oldTown', 'room-uptown', ...Object.keys(branchFloorTextures()), ...Object.keys(branchHouseTextures(grid))]
    expect(PLACES.flatMap(p => Object.keys(branchTextures(p))).sort()).toEqual(boot.sort())
  })
})

describe('putting pictures on a scene loader', () => {
  it('asks only for the ones not yet textures, as SVG data', () => {
    const image = vi.fn()
    const scene = { textures: { exists: (key: string) => key === 'old' }, load: { image } }
    preloadSvgTextures(scene as never, { old: '<svg/>', fresh: '<svg a="1"/>' })
    expect(image.mock.calls).toEqual([['fresh', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg a="1"/>')]])
  })
})
