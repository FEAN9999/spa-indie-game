import { describe, expect, it, vi } from 'vitest'
import { chibiTextures, PART_ANCHORS } from '../../src/art/chibi'
import { fxTextures } from '../../src/art/fx'
import { SERVICE_IDS } from '../../src/sim/services'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

describe('chibi and fx art', () => {
  it('draws four hair styles from every side, each with its brown lines', () => {
    const keys = Object.keys(chibiTextures())
    for (const s of [0, 1, 2, 3])
      for (const d of ['down', 'up', 'side']) expect(keys).toEqual(expect.arrayContaining([`hair${s}-${d}`, `hair${s}-${d}-line`]))
  })
  it('draws the staff apron without a line texture, and the tea cup and spark', () => {
    const keys = Object.keys(chibiTextures())
    expect(keys).toEqual(expect.arrayContaining(['apron-down', 'apron-side']))
    expect(keys).not.toContain('apron-down-line')
    expect(keys).not.toContain('apron-side-line')
    expect(Object.keys(fxTextures())).toEqual(expect.arrayContaining(['tea-cup', 'spark']))
  })
  it('draws the hand, the dice and the lock', () => expect(Object.keys(fxTextures())).toEqual(expect.arrayContaining(['hand', 'icon-dice', 'icon-lock'])))

  it('draws what each kind of customer wears and the face mask untinted, each with an anchor', () => {
    const keys = Object.keys(chibiTextures())
    const worn = [
      'backpack-down', 'backpack-side', 'backpack-up', 'tie-down', 'glasses-down', 'glasses-side', 'face-frown',
      'sunglasses-down', 'sunglasses-side', 'hat-down', 'hat-side', 'hat-up', 'mask-face',
    ]
    for (const key of worn) {
      expect(keys, key).toContain(key)
      expect(keys).not.toContain(`${key}-line`)
      expect(PART_ANCHORS[key], key).toBeDefined()
    }
  })

  it('draws a badge for every service', () => {
    const fx = fxTextures()
    for (const id of SERVICE_IDS) expect(fx[`svc-${id}`], id).toBeDefined()
  })
})
