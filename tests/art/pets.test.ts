import { describe, expect, it, vi } from 'vitest'
import { PET_POSES, petKey, petTextures } from '../../src/art/pets'
import { BREED_IDS } from '../../src/sim/pets'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

const textures = petTextures()

describe('pet art', () => {
  it('draws every breed in every pose as svg', () => {
    expect(Object.keys(textures)).toHaveLength(BREED_IDS.length * PET_POSES.length)
    for (const breed of BREED_IDS)
      for (const pose of PET_POSES) {
        const svg = textures[petKey(breed, pose)]
        expect(svg).toContain('<svg')
        expect(svg).toContain('<path')
        expect(svg).not.toMatch(/NaN|undefined/)
      }
  })

  it('tells the eight breeds apart when they sit', () => {
    const sits = new Set(BREED_IDS.map(b => textures[petKey(b, 'sit')]))
    expect(sits.size).toBe(BREED_IDS.length)
  })

  it('swings the tail over when wagging', () => {
    for (const breed of BREED_IDS) expect(textures[petKey(breed, 'wag')]).not.toBe(textures[petKey(breed, 'sit')])
  })
})
