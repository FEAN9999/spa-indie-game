import { describe, expect, it, vi } from 'vitest'
import { C } from '../../src/art/palette'
import { shampooTextures } from '../../src/art/shampooArt'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

describe('shampoo art', () => {
  it('draws the brown lines of the tinted head and hair untinted, in their own textures', () => {
    const tex = shampooTextures()
    for (const key of ['sh-head', 'sh-hair']) {
      expect(tex[key]).not.toContain(`stroke="${C.ink}"`)
      expect(tex[`${key}-line`]).toContain(`stroke="${C.ink}"`)
    }
  })
})
