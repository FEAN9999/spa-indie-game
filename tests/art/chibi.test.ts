import { describe, expect, it, vi } from 'vitest'
import { chibiTextures } from '../../src/art/chibi'
import { fxTextures } from '../../src/art/fx'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

describe('chibi and fx art', () => {
  it('draws four hair styles from every side, each with its brown lines', () => {
    const keys = Object.keys(chibiTextures())
    for (const s of [0, 1, 2, 3])
      for (const d of ['down', 'up', 'side']) expect(keys).toEqual(expect.arrayContaining([`hair${s}-${d}`, `hair${s}-${d}-line`]))
  })
  it('draws the hand, the dice and the lock', () => expect(Object.keys(fxTextures())).toEqual(expect.arrayContaining(['hand', 'icon-dice', 'icon-lock'])))
})
