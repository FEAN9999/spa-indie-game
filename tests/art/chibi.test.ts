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

  it("has every regular's accessory in each side it lists", () => {
    const keys = Object.keys(chibiTextures())
    const sides: Record<string, string[]> = {
      redApron: ['down', 'side'],
      artTube: ['down', 'side', 'up'],
      helmet: ['down', 'side', 'up'],
      headphones: ['down', 'side', 'up'],
      goldGlasses: ['down', 'side'],
      silkScarf: ['down', 'side', 'up'],
      readingGlasses: ['down', 'side'],
      paperFan: ['down', 'side'],
      flowerClip: ['down', 'side', 'up'],
      daisies: ['down', 'side'],
    }
    for (const [part, listed] of Object.entries(sides))
      for (const side of ['down', 'side', 'up']) {
        const key = `${part}-${side}`
        if (!listed.includes(side)) {
          expect(keys, key).not.toContain(key)
          continue
        }
        expect(keys, key).toContain(key)
        expect(keys, key).not.toContain(`${key}-line`)
        expect(PART_ANCHORS[key], key).toBeDefined()
      }
  })

  it("has every VIP's accessories in each side they list", () => {
    const keys = Object.keys(chibiTextures())
    const sides: Record<string, string[]> = {
      featherBoa: ['down', 'side', 'up'],
      micPin: ['down', 'side'],
      tiara: ['down', 'side', 'up'],
      sash: ['down', 'side'],
      bigShades: ['down', 'side'],
      headscarf: ['down', 'side', 'up'],
      chefHat: ['down', 'side', 'up'],
    }
    for (const [part, listed] of Object.entries(sides))
      for (const side of ['down', 'side', 'up']) {
        const key = `${part}-${side}`
        if (!listed.includes(side)) {
          expect(keys, key).not.toContain(key)
          continue
        }
        expect(keys, key).toContain(key)
        expect(keys, key).not.toContain(`${key}-line`)
        expect(PART_ANCHORS[key], key).toBeDefined()
      }
  })

  it("has every star's pieces in each side they list", () => {
    const keys = Object.keys(chibiTextures())
    const sides: Record<string, string[]> = {
      bangsTaylor: ['down', 'side'],
      redLips: ['down', 'side'],
      sequins: ['down', 'side', 'up'],
      redSuit: ['down', 'side', 'up'],
      moustache: ['down', 'side'],
      hoodie: ['down', 'side', 'up'],
      beanie: ['down', 'side', 'up'],
      daisyPin: ['down', 'side'],
      hoops: ['down', 'side'],
      tankChain: ['down', 'side', 'up'],
      mohawk: ['down', 'side', 'up'],
      bowTieSuit: ['down', 'side', 'up'],
      backCap: ['down', 'side', 'up'],
      jersey: ['down', 'side', 'up'],
      quiff: ['down', 'side', 'up'],
      goldChainJacket: ['down', 'side', 'up'],
      bangsJennie: ['down', 'side'],
      bow: ['down', 'side', 'up'],
      tweed: ['down', 'side', 'up'],
    }
    for (const [part, listed] of Object.entries(sides))
      for (const side of ['down', 'side', 'up']) {
        const key = `${part}-${side}`
        if (!listed.includes(side)) {
          expect(keys, key).not.toContain(key)
          continue
        }
        expect(keys, key).toContain(key)
        expect(keys, key).not.toContain(`${key}-line`)
        expect(PART_ANCHORS[key], key).toBeDefined()
      }
    for (const key of ['face-grin', 'face-grinSide']) {
      expect(keys, key).toContain(key)
      expect(keys, key).not.toContain(`${key}-line`)
      expect(PART_ANCHORS[key], key).toBeDefined()
    }
  })

  it("draws the tourist's straw hat and flower shirt from every side, untinted, each with an anchor", () => {
    const keys = Object.keys(chibiTextures())
    for (const part of ['strawHat', 'flowerShirt'])
      for (const side of ['down', 'side', 'up']) {
        const key = `${part}-${side}`
        expect(keys, key).toContain(key)
        expect(keys, key).not.toContain(`${key}-line`)
        expect(PART_ANCHORS[key], key).toBeDefined()
      }
  })

  it("draws the backpacker's cap, big pack and the lady's hairpin, handbag and pearls, untinted, each with an anchor", () => {
    const keys = Object.keys(chibiTextures())
    for (const part of ['cap', 'bigPack', 'hairpin', 'handbag', 'pearls'])
      for (const side of ['down', 'side', 'up']) {
        const key = `${part}-${side}`
        if (key === 'pearls-up') {
          expect(keys, key).not.toContain(key)
          continue
        }
        expect(keys, key).toContain(key)
        expect(keys, key).not.toContain(`${key}-line`)
        expect(PART_ANCHORS[key], key).toBeDefined()
      }
  })

  it("draws Mi Mi's phone and the inspector's clipboard from the front and the side, untinted", () => {
    const keys = Object.keys(chibiTextures())
    for (const part of ['phone', 'clipboard']) {
      for (const side of ['down', 'side']) {
        const key = `${part}-${side}`
        expect(keys, key).toContain(key)
        expect(keys, key).not.toContain(`${key}-line`)
        expect(PART_ANCHORS[key], key).toBeDefined()
      }
      expect(keys).not.toContain(`${part}-up`)
    }
  })

  it('draws a badge for every service', () => {
    const fx = fxTextures()
    for (const id of SERVICE_IDS) expect(fx[`svc-${id}`], id).toBeDefined()
  })
})
