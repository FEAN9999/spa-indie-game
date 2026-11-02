import { describe, expect, it, vi } from 'vitest'
import { AC_CLEAR, AC_SKIN, AC_TOPLEFT, acneTextures } from '../../src/art/acneArt'
import { C } from '../../src/art/palette'
import { ACNE_AT } from '../../src/config'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

describe('acne art', () => {
  it('has every picture the acne game draws', () => {
    const tex = acneTextures()
    for (const key of ['ac-pillow', 'ac-hair', 'ac-face', 'ac-brow', 'ac-face-line']) expect(tex[key], key).toBeDefined()
  })

  it('keeps the brown lines out of the skin and brows, which are tinted, and in the line texture', () => {
    const tex = acneTextures()
    for (const key of ['ac-hair', 'ac-face', 'ac-brow']) expect(tex[key]).not.toContain(`stroke="${C.ink}"`)
    expect(tex['ac-face-line']).toContain(`stroke="${C.ink}"`)
  })

  it('puts every place a blemish can sit on bare skin, between the closed eyes and the mouth, with its pink halo', () => {
    // quầng hồng của mụn rộng 32 điểm ảnh (SPOT.halo trong AcneScene)
    const halo = 32
    for (const p of ACNE_AT) {
      expect(((p.x - AC_SKIN.x) / AC_SKIN.rx) ** 2 + ((p.y - AC_SKIN.y) / AC_SKIN.ry) ** 2).toBeLessThan(0.8)
      expect(p.y - halo).toBeGreaterThanOrEqual(AC_CLEAR.eyes)
      expect(p.y + halo).toBeLessThanOrEqual(AC_CLEAR.mouth)
    }
    expect(AC_TOPLEFT).toEqual({ x: 80, y: 450 })
  })
})
