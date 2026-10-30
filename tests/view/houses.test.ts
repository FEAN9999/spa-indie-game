import { describe, expect, it, vi } from 'vitest'
import { HOUSE_LOOK } from '../../src/art/houses'
import { MAP_X, TILE } from '../../src/config'
import { forSale, houseImageX, houseRect, innerFloor, saleAt, stripLots } from '../../src/view/houses'

// the house art loads through svg.ts, which imports Phaser
vi.mock('phaser', () => ({}))

/** The world x of the middle of grid column `col`. */
const colX = (col: number) => MAP_X + (col + 0.5) * TILE

describe('the neighbour houses on the map', () => {
  it('places each house on its own six columns', () => {
    expect(houseRect({ side: 'right', n: 1 })).toEqual({ x: 1047, y: 210, w: 468, h: 1560 })
    expect(houseRect({ side: 'left', n: 2 }).x).toBe(-903)
    expect(houseImageX({ side: 'right', n: 1 })).toBe(1008)
    expect(houseImageX({ side: 'left', n: 1 })).toBe(-435)
  })

  it('lists the houses for sale and finds one under a tap', () => {
    const bought = { left: 0, right: 1 }
    const shown = { left: 1, right: 2 }
    expect(forSale(bought, shown)).toEqual([
      { side: 'left', n: 1 },
      { side: 'right', n: 2 },
    ])
    expect(saleAt(bought, shown, colX(8))).toEqual({ side: 'left', n: 1 })
    expect(saleAt(bought, shown, colX(27))).toBeNull()
    expect(saleAt(bought, shown, colX(33))).toEqual({ side: 'right', n: 2 })
    expect(saleAt(bought, shown, colX(18))).toBeNull()
  })

  it('widens the floor a bench mat may cover with every bought house', () => {
    expect(innerFloor({ left: 0, right: 0 })).toEqual({ left: 13, top: 2, right: 24, bottom: 17 })
    expect(innerFloor({ left: 1, right: 2 })).toEqual({ left: 7, top: 2, right: 36, bottom: 17 })
  })

  it('shows bought houses in their wall colour and houses for sale as empty lots', () => {
    const lots = stripLots({ left: 0, right: 1 }, { left: 1, right: 2 })
    expect(lots).toHaveLength(3)
    const at = (side: 'left' | 'right', n: 1 | 2) => {
      const r = houseRect({ side, n })
      return lots.find(l => l.x === r.x && l.w === r.w)
    }
    expect(at('right', 1)?.fill).toBe(HOUSE_LOOK.right1.wall)
    expect(at('left', 1)?.fill).toBeNull()
    expect(at('right', 2)?.fill).toBeNull()
  })
})
