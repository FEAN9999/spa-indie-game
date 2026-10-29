import { describe, expect, it, vi } from 'vitest'
import { chibiTextures, PART_ANCHORS } from '../../src/art/chibi'
import { OUTFIT_HAS_HAT, OUTFIT_PANTS, OUTFIT_PARTS } from '../../src/art/outfits'
import { OUTFIT_IDS } from '../../src/sim/outfits'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

const DRESSED = OUTFIT_IDS.filter(id => id !== 'baba')
const DIRS = ['down', 'side', 'up']

describe("the owner's outfit art", () => {
  it('draws every outfit but the bà ba from three sides with its sleeve, each with an anchor', () => {
    const tex = chibiTextures()
    for (const id of DRESSED)
      for (const key of [...DIRS.map(d => `outfit-${id}-${d}`), `sleeve-${id}`]) {
        expect(tex[key], key).toBeDefined()
        expect(PART_ANCHORS[key], key).toBeDefined()
      }
  })

  it('has a hat from three sides for the nón lá, both khăn vấn and the flower crown only', () => {
    expect([...OUTFIT_HAS_HAT].sort()).toEqual(['gam', 'lotus', 'mai', 'teacher', 'year'])
    const tex = chibiTextures()
    for (const id of OUTFIT_IDS)
      for (const d of DIRS) {
        const key = `outfitHat-${id}-${d}`
        if (OUTFIT_HAS_HAT.includes(id)) expect(tex[key], key).toBeDefined()
        else expect(tex[key], key).toBeUndefined()
      }
  })

  it('draws the teacher from three sides with her sleeve and nón lá, outside the wardrobe', () => {
    const tex = chibiTextures()
    for (const d of DIRS) for (const key of [`outfit-teacher-${d}`, `outfitHat-teacher-${d}`]) expect(tex[key], key).toBeDefined()
    expect(tex['sleeve-teacher']).toBeDefined()
    expect((OUTFIT_IDS as readonly string[]).includes('teacher')).toBe(false)
    expect(OUTFIT_PANTS.teacher).toBe(0xfbf7ee)
  })

  it('draws nothing for the bà ba, which stays the tinted body', () => {
    expect(Object.keys(OUTFIT_PARTS).filter(k => k.includes('baba'))).toEqual([])
    expect(Object.keys(OUTFIT_PANTS)).not.toContain('baba')
  })

  it('draws every outfit piece untinted, as an SVG document', () => {
    const tex = chibiTextures()
    for (const key of Object.keys(OUTFIT_PARTS)) {
      expect(tex[`${key}-line`], key).toBeUndefined()
      expect(tex[key], key).toMatch(/^<svg [^>]*>[\s\S]*<\/svg>$/)
    }
  })

  it('wears cream trousers with every áo dài', () => {
    expect(Object.keys(OUTFIT_PANTS).sort()).toEqual([...DRESSED, 'teacher'].sort())
    for (const id of ['teal', 'lotus', 'tile', 'mai', 'gam', 'year'] as const) expect(OUTFIT_PANTS[id], id).toBe(0xfbf7ee)
  })
})
