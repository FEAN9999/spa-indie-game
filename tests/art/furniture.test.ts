import { describe, expect, it, vi } from 'vitest'
import { FURNITURE, furnitureTextures, itemTexture } from '../../src/art/furniture'
import { ITEM_KINDS, ITEMS, type ItemKind } from '../../src/sim/items'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

describe('furniture art', () => {
  it("has art for every item kind and the room's movable parts", () => {
    const tex = furnitureTextures()
    for (const kind of ITEM_KINDS) expect(tex[itemTexture(kind)], kind).toBeDefined()
    for (const key of ['lantern', 'benchMat', 'bedSlot']) expect(tex[key], key).toBeDefined()
  })

  it('keeps the texture keys the existing pieces had', () => {
    const old: ItemKind[] = ['bed', 'bench', 'plant', 'cabinet', 'shelf', 'lotus', 'vase', 'tea', 'slippers', 'planter']
    expect(old.map(itemTexture)).toEqual([
      'bed', 'bench', 'plant', 'decor-cabinet', 'decor-shelf', 'decor-lotus', 'decor-vase', 'decor-tea', 'decor-slippers', 'decor-planter',
    ])
  })

  it('draws each new piece as wide as its footprint', () => {
    const added: ItemKind[] = ['teaChest', 'jar', 'bambooBench', 'bambooTea', 'bambooShelf', 'bambooLamp', 'clayJar', 'areca']
    for (const kind of added) expect(FURNITURE[itemTexture(kind)]?.w, kind).toBe(ITEMS[kind].w)
  })

  it('draws each gift piece as wide as its footprint, as a picture of its own', () => {
    const gifts: ItemKind[] = ['vyPainting', 'silkScreen', 'regularsBoard']
    for (const kind of gifts) {
      const key = itemTexture(kind)
      expect(key).toBe(`decor-${kind}`)
      expect(FURNITURE[key]?.w, kind).toBe(ITEMS[kind].w)
      const same = Object.keys(FURNITURE).filter(k => k !== key && FURNITURE[k].body === FURNITURE[key].body)
      expect(same, kind).toEqual([])
    }
  })

  it('draws the mask chair and the massage bed as their own pictures, as wide as the shampoo bed', () => {
    const tex = furnitureTextures()
    for (const kind of ['maskBed', 'massageBed'] as const) {
      expect(itemTexture(kind)).toBe(kind)
      expect(tex[kind], kind).toBeDefined()
      expect(FURNITURE[kind].w, kind).toBe(FURNITURE.bed.w)
    }
  })
})
