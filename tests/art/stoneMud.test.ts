import { describe, expect, it, vi } from 'vitest'
import { chibiTextures, PART_ANCHORS } from '../../src/art/chibi'
import { FURNITURE, furnitureTextures } from '../../src/art/furniture'
import { MUD_ORIGIN, mudTextures } from '../../src/art/mudArt'
import { C } from '../../src/art/palette'
import { SN_POT_STONES, stoneTextures } from '../../src/art/stoneArt'
import { STONE_POT } from '../../src/config'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

describe('stone and mud art', () => {
  it('has every picture the stone game draws, with a place in the pot for each stone', () => {
    const tex = stoneTextures()
    for (const key of ['sn-stone', 'sn-stone-line', 'sn-spot', 'sn-pot']) expect(tex[key], key).toContain('<svg')
    expect(SN_POT_STONES).toHaveLength(STONE_POT)
  })

  it('draws the stone white without its ink lines, so a tint colours it, and the lines on their own', () => {
    const tex = stoneTextures()
    expect(tex['sn-stone']).not.toContain(`stroke="${C.ink}"`)
    expect(tex['sn-stone']).toContain('fill="#ffffff"')
    expect(tex['sn-stone-line']).toContain(`stroke="${C.ink}"`)
  })

  it('has every picture the mud game draws', () => {
    const tex = mudTextures()
    const keys = ['mud-tub', 'mud-head', 'mud-head-line', 'mud-towel', 'mud-face-cold', 'mud-face-ok', 'mud-face-hot', 'mud-steam']
    for (const key of keys) expect(tex[key], key).toContain('<svg')
  })

  it('draws the mud head without its ink lines, so the skin tint colours it, and the lines on their own', () => {
    const tex = mudTextures()
    expect(tex['mud-head']).not.toContain(`stroke="${C.ink}"`)
    expect(tex['mud-head-line']).toContain(`stroke="${C.ink}"`)
  })

  it('centres every mud picture on the head across', () => {
    for (const o of Object.values(MUD_ORIGIN)) expect(o.x).toBe(0.5)
  })

  it('draws the stone bed as wide as the massage bed and the mud tub two tiles wide', () => {
    const tex = furnitureTextures()
    for (const key of ['stoneBed', 'mudTub']) expect(tex[key], key).toContain('<svg')
    expect(FURNITURE.stoneBed.w).toBe(FURNITURE.massageBed.w)
    expect(FURNITURE.mudTub.w).toBe(2)
  })

  it('draws the towel wrap untinted, anchored on the head like the other head parts', () => {
    const keys = Object.keys(chibiTextures())
    expect(keys).toContain('towel-wrap')
    expect(keys).not.toContain('towel-wrap-line')
    expect(PART_ANCHORS['towel-wrap']).toBeDefined()
  })
})
