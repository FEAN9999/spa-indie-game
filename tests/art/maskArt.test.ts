import { describe, expect, it, vi } from 'vitest'
import { MK_ORIGIN, maskTextures } from '../../src/art/maskArt'
import { C } from '../../src/art/palette'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

describe('face-mask art', () => {
  it('has every picture the mask game draws', () => {
    const tex = maskTextures()
    for (const key of ['mk-pillow', 'mk-face', 'mk-face-line', 'mk-hair', 'mk-hair-line', 'mk-cucumber', 'mk-frown']) expect(tex[key], key).toBeDefined()
  })

  it('draws the brown lines of the tinted face and hair untinted, in their own textures', () => {
    const tex = maskTextures()
    for (const key of ['mk-face', 'mk-hair']) {
      expect(tex[key]).not.toContain(`stroke="${C.ink}"`)
      expect(tex[`${key}-line`]).toContain(`stroke="${C.ink}"`)
    }
  })

  it('draws the face around its centre, as wide as the face rule', () => {
    expect(MK_ORIGIN.face).toEqual({ x: 0.5, y: 0.5 })
    expect(maskTextures()['mk-face']).toContain('<circle cx="0" cy="0" r="300"')
  })
})
