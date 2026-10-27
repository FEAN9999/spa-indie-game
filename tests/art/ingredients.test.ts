import { describe, expect, it, vi } from 'vitest'
import { ingredientTextures } from '../../src/art/ingredients'
import { steamTextures } from '../../src/art/steamArt'
import { INGREDIENTS } from '../../src/sim/recipes'
import { DECOYS } from '../../src/sim/steam'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

describe('steam art', () => {
  it('draws every ingredient and every leaf-game decoy', () => {
    const tex = ingredientTextures()
    for (const id of [...INGREDIENTS, ...DECOYS]) expect(tex[`ing-${id}`], id).toContain('<svg')
  })

  it('draws the leaf pot', () => expect(steamTextures()['st-pot']).toContain('<svg'))
})
