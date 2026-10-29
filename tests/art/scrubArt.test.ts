import { describe, expect, it, vi } from 'vitest'
import { C } from '../../src/art/palette'
import { scrubTextures } from '../../src/art/scrubArt'
import { SCRUB_PATCH_R } from '../../src/config'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

const palette = Object.values(C).map(c => c.toLowerCase())

describe('scrub art', () => {
  const salt = scrubTextures()['scrub-salt']

  it('draws the salt patch as an svg whose viewBox holds the patch and its grains', () => {
    expect(salt).toContain('<svg')
    const [x, y, w, h] = /viewBox="([^"]+)"/.exec(salt)![1].split(' ').map(Number)
    expect(x).toBeLessThanOrEqual(-SCRUB_PATCH_R * 1.07)
    expect(y).toBeLessThanOrEqual(-SCRUB_PATCH_R * 1.07)
    expect(x + w).toBeGreaterThanOrEqual(SCRUB_PATCH_R * 1.07)
    expect(y + h).toBeGreaterThanOrEqual(SCRUB_PATCH_R * 1.07)
    expect(salt.match(/<path d="M[-\d.]+,[-\d.]+ l7,9/g)).toHaveLength(8)
  })

  it('draws it in the game colours', () => {
    for (const colour of salt.match(/#[0-9a-fA-F]{6}\b/g) ?? []) expect(palette).toContain(colour.toLowerCase())
  })
})
