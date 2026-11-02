import { describe, expect, it, vi } from 'vitest'
import { AC_TOPLEFT, acneTextures } from '../../src/art/acneArt'
import { C } from '../../src/art/palette'
import { ACNE_AT } from '../../src/config'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

describe('acne art', () => {
  it('has every picture the acne game draws', () => {
    const tex = acneTextures()
    for (const key of ['ac-face', 'ac-brow', 'ac-face-line']) expect(tex[key], key).toBeDefined()
  })

  it('keeps the brown lines out of the skin and brows, which are tinted, and in the line texture', () => {
    const tex = acneTextures()
    for (const key of ['ac-face', 'ac-brow']) expect(tex[key]).not.toContain(`stroke="${C.ink}"`)
    expect(tex['ac-face-line']).toContain(`stroke="${C.ink}"`)
  })

  it('puts every place a blemish can sit inside the skin behind the lens', () => {
    const skin = { x: 540, y: 1010, rx: 410, ry: 300 }
    for (const p of ACNE_AT) expect(((p.x - skin.x) / skin.rx) ** 2 + ((p.y - skin.y) / skin.ry) ** 2).toBeLessThan(0.8)
    expect(acneTextures()['ac-face']).toContain(`M${skin.x - skin.rx},${skin.y} a${skin.rx},${skin.ry}`)
    expect(AC_TOPLEFT).toEqual({ x: 94, y: 680 })
  })
})
