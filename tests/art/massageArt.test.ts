import { describe, expect, it, vi } from 'vitest'
import { MS_ORIGIN, massageTextures } from '../../src/art/massageArt'
import { C } from '../../src/art/palette'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

describe('massage art', () => {
  it('has every picture the massage game draws', () => {
    const tex = massageTextures()
    for (const key of ['ms-bed', 'ms-back', 'ms-back-line', 'ms-hair', 'ms-hair-line', 'ms-point', 'ms-ring', 'ms-hold']) expect(tex[key], key).toBeDefined()
  })

  it('draws the brown lines of the tinted back and hair untinted, in their own textures, with the towel', () => {
    const tex = massageTextures()
    for (const key of ['ms-back', 'ms-hair']) {
      expect(tex[key]).not.toContain(`stroke="${C.ink}"`)
      expect(tex[`${key}-line`]).toContain(`stroke="${C.ink}"`)
    }
    // the towel keeps its own colour, so it is not in the skin-tinted layer
    expect(tex['ms-back']).not.toContain(C.terracotta)
    expect(tex['ms-back-line']).toContain(C.terracotta)
  })

  it('draws the pressure point in turmeric yellow and the tap point without it', () => {
    const tex = massageTextures()
    expect(tex['ms-hold']).toContain(C.mustard)
    expect(tex['ms-point']).not.toContain(C.mustard)
  })

  it('centres the bed, back and hair on the back centre across', () => {
    for (const o of Object.values(MS_ORIGIN)) expect(o.x).toBe(0.5)
  })
})
