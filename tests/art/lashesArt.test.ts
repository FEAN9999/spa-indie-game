import { describe, expect, it, vi } from 'vitest'
import { lashesTextures, LS_TOPLEFT } from '../../src/art/lashesArt'
import { C } from '../../src/art/palette'
import { lashSlots } from '../../src/sim/lashes'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

describe('lashes art', () => {
  it('has every picture the lashes game draws', () => {
    const tex = lashesTextures()
    for (const key of ['ls-face', 'ls-brow', 'ls-face-line']) expect(tex[key], key).toBeDefined()
  })

  it('keeps the brown lines out of the skin and brow, which are tinted, and in the line texture', () => {
    const tex = lashesTextures()
    for (const key of ['ls-face', 'ls-brow']) expect(tex[key]).not.toContain(`stroke="${C.ink}"`)
    expect(tex['ls-face-line']).toContain(`stroke="${C.ink}"`)
  })

  it('runs the lid line through every dot a lash goes on, on the card where the scene puts it', () => {
    const line = lashesTextures()['ls-face-line']
    for (const n of [7, 9]) for (const s of lashSlots(n)) expect(line).toContain(`${Math.round(s.x * 10) / 10},${Math.round(s.y * 10) / 10}`)
    expect(LS_TOPLEFT).toEqual({ x: 80, y: 700 })
  })
})
