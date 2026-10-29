import { describe, expect, it, vi } from 'vitest'
import { FURNITURE, furnitureTextures, itemTexture } from '../../src/art/furniture'
import { FESTIVAL_IDS, FESTIVALS } from '../../src/sim/festivals'
import { canTurn, ITEM_KINDS, ITEMS, type ItemKind } from '../../src/sim/items'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

const KEEPSAKES = FESTIVAL_IDS.map(id => FESTIVALS[id].keepsake)

describe('furniture art', () => {
  it("has art for every item kind and the room's movable parts", () => {
    const tex = furnitureTextures()
    for (const kind of ITEM_KINDS) expect(tex[itemTexture(kind)], kind).toBeDefined()
    for (const key of ['lantern', 'benchMat', 'bedSlot']) expect(tex[key], key).toBeDefined()
  })

  it('keeps the texture keys the existing pieces had', () => {
    const old: ItemKind[] = ['bed', 'bench', 'plant', 'cabinet', 'shelf', 'lotus', 'vase', 'tea', 'slippers', 'planter']
    expect(old.map(kind => itemTexture(kind))).toEqual([
      'bed', 'bench', 'plant', 'decor-cabinet', 'decor-shelf', 'decor-lotus', 'decor-vase', 'decor-tea', 'decor-slippers', 'decor-planter',
    ])
  })

  it('draws each new piece as wide as its footprint', () => {
    const added: ItemKind[] = ['teaChest', 'jar', 'bambooBench', 'bambooTea', 'bambooShelf', 'bambooLamp', 'clayJar', 'areca']
    for (const kind of added) expect(FURNITURE[itemTexture(kind)]?.w, kind).toBe(ITEMS[kind].w)
  })

  it('draws each gift piece as wide as its footprint, as a picture of its own', () => {
    const gifts: ItemKind[] = ['vyPainting', 'silkScreen', 'regularsBoard', 'photoSinger', 'photoMiss', 'photoStar', 'photoChef', 'goldBoard', 'photoIdolSontung', 'photoIdolTaylor', 'photoIdolGd', 'photoIdolJennie', 'photoIdolHieuthuhai', 'photoIdolWeeknd', 'photoIdolTaeyang', 'photoIdolBieber', 'photoIdolDaesung', 'starWall', 'certificate', 'trophy', 'merit', 'surfboard', 'lanternString', 'orchid', ...KEEPSAKES]
    for (const kind of gifts) {
      const key = itemTexture(kind)
      expect(key).toBe(`decor-${kind}`)
      expect(FURNITURE[key]?.w, kind).toBe(ITEMS[kind].w)
      const same = Object.keys(FURNITURE).filter(k => k !== key && FURNITURE[k].body === FURNITURE[key].body)
      expect(same, kind).toEqual([])
    }
  })

  it('draws the gold board as wide as its footprint', () => {
    expect(FURNITURE[itemTexture('goldBoard')]?.w).toBe(ITEMS.goldBoard.w)
  })

  it('draws the mask chair and the massage bed as their own pictures, as wide as the shampoo bed', () => {
    const tex = furnitureTextures()
    for (const kind of ['maskBed', 'massageBed'] as const) {
      expect(itemTexture(kind)).toBe(kind)
      expect(tex[kind], kind).toBeDefined()
      expect(FURNITURE[kind].w, kind).toBe(FURNITURE.bed.w)
    }
  })

  it('draws the steam tent as wide as its footprint', () => expect(FURNITURE.steamTent.w).toBe(2))

  it('draws an upright picture of its own for every piece that turns', () => {
    const tex = furnitureTextures()
    const turning = ITEM_KINDS.filter(canTurn)
    expect(turning).toHaveLength(17)
    for (const kind of turning) {
      const key = itemTexture(kind, true)
      expect(key).toBe(`${itemTexture(kind)}-turned`)
      expect(tex[key], kind).toBeDefined()
      expect(FURNITURE[key].w, kind).toBeGreaterThanOrEqual(1)
      expect(FURNITURE[key].w, kind).toBeLessThanOrEqual(1.2)
      expect(FURNITURE[key].h, kind).toBeGreaterThanOrEqual(ITEMS[kind].w)
      expect(FURNITURE[key].body, kind).not.toBe(FURNITURE[itemTexture(kind)].body)
    }
  })

  it('keeps one picture for every piece that only mirrors', () => {
    for (const kind of ITEM_KINDS.filter(k => !canTurn(k))) expect(itemTexture(kind, true)).toBe(itemTexture(kind))
  })

  it('draws the screen and the desk as wide as their footprints', () => {
    expect(FURNITURE[itemTexture('screen')].w).toBe(5)
    expect(FURNITURE[itemTexture('desk')].w).toBe(3)
  })
})
