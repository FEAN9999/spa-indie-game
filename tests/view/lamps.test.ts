import { describe, expect, it, vi } from 'vitest'
import { FURNITURE } from '../../src/art/furniture'
import { LAMPS } from '../../src/view/lamps'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

describe('lamps', () => {
  it('light the stone lamp, the candle shelf and the wall lantern at night', () => {
    expect(LAMPS['decor-stoneLamp']).toHaveLength(1)
    expect(LAMPS['decor-candleShelf']).toHaveLength(2)
    expect(LAMPS['decor-wallLantern']).toHaveLength(1)
  })
  it('sit inside their own picture', () => {
    for (const [key, spots] of Object.entries(LAMPS)) {
      const art = FURNITURE[key]
      expect(art, key).toBeDefined()
      for (const p of spots) {
        expect(p.x, key).toBeGreaterThan(0)
        expect(p.x, key).toBeLessThan(art.w)
        expect(p.y, key).toBeGreaterThan(0)
        expect(p.y, key).toBeLessThan(art.h)
      }
    }
  })
})
