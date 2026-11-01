import { describe, expect, it, vi } from 'vitest'
import { BUSTLE_ROWS, MAP_X, MAP_Y, TILE } from '../../src/config'
import { BUSTLE_IDS } from '../../src/sim/bustle'
import { bustleAt, bustleHits, bustleMarks, bustlePercentText, bustlePictures, colX, LOTS, millions, onSidewalk, openStreetBounds, roadCovers, streetAt, STRIP_ROW, upperFronts, type StreetRect } from '../../src/view/bustle'

// the street's art loads through svg.ts, which imports Phaser
vi.mock('phaser', () => ({}))

/** The spa's door is column 18 and the restaurant's 55 (37 + 18): nothing on the sidewalk stands in front of either. */
const DOORS = [[17.5, 19.5], [54.5, 56.5]]
const overlaps = (a: StreetRect, b: StreetRect) => a.col < b.col + b.w && b.col < a.col + a.w && a.row < b.row + b.h && b.row < a.row + a.h

describe("the street's spots", () => {
  const all = BUSTLE_IDS.flatMap(id => bustleHits(id).map(r => ({ id, r })))

  it('all lie between the spa and the restaurant, columns 12 to 62, the stretch always on the street once the restaurant is bought', () => {
    for (const { r } of all) {
      expect(r.col).toBeGreaterThanOrEqual(12)
      expect(r.col + r.w).toBeLessThanOrEqual(62)
    }
  })

  it('never overlap one another', () => {
    for (const a of all) for (const b of all) if (a !== b) expect(overlaps(a.r, b.r), `${a.id} and ${b.id}`).toBe(false)
  })

  it('keep the sidewalk in front of both doors clear', () => {
    for (const { id, r } of all) if (onSidewalk(id)) for (const [from, to] of DOORS) expect(r.col + r.w <= from || r.col >= to, id).toBe(true)
  })

  it('put the sidewalk pieces on the sidewalk and the lots across the road', () => {
    for (const { id, r } of all) {
      if (onSidewalk(id)) expect([r.row, r.row + r.h]).toEqual([18, 19.2])
      else expect(r.row).toBeGreaterThanOrEqual(STRIP_ROW)
    }
    expect(LOTS.park[0]).toBeGreaterThanOrEqual(LOTS.busStop[1])
    expect(LOTS.nightMarket[0]).toBeGreaterThanOrEqual(LOTS.park[1])
  })
})

describe('a tap on the street', () => {
  it('finds the piece under it, bought or not, and nothing elsewhere', () => {
    expect(bustleAt(14.5, 18.6)).toBe('trees')
    expect(bustleAt(59.5, 19.1)).toBe('trees')
    expect(bustleAt(12.8, 18.5)).toBe('lamps')
    expect(bustleAt(37, 18.5)).toBe('benches')
    expect(bustleAt(26, 18.5)).toBe('banhMi')
    expect(bustleAt(31, 18.5)).toBe('sugarcane')
    expect(bustleAt(18, 22)).toBe('busStop')
    expect(bustleAt(33, 24.9)).toBe('park')
    expect(bustleAt(50, 21.2)).toBe('nightMarket')
    // the doors, the road and the shops above
    expect(bustleAt(18.5, 18.5)).toBeNull()
    expect(bustleAt(55.5, 18.5)).toBeNull()
    expect(bustleAt(30, 20.5)).toBeNull()
    expect(bustleAt(14.5, 17.5)).toBeNull()
  })

  it('on an upper floor finds only the lots across the road', () => {
    expect(bustleAt(14.5, 18.6, 2)).toBeNull()
    expect(bustleAt(26, 18.5, 3)).toBeNull()
    expect(bustleAt(33, 23, 2)).toBe('park')
  })

  it('reads a world point as street tiles', () => {
    expect(streetAt(colX(23) + TILE / 2, MAP_Y + 18.5 * TILE)).toEqual({ col: 23.5, row: 18.5 })
    expect(colX(0)).toBe(MAP_X)
  })
})

describe("the street's pictures and marks", () => {
  it('stand every sidewalk piece on the sidewalk, near the curb', () => {
    for (const id of BUSTLE_IDS.filter(onSidewalk)) for (const p of bustlePictures(id, 600)) expect(p.foot).toBeCloseTo(19.15, 5)
  })

  it('set the night market out from 17:00 and keep it under tarps before', () => {
    expect(bustlePictures('nightMarket', 1019)[0].key).toBe('bustle-market-day')
    expect(bustlePictures('nightMarket', 1020)[0].key).toBe('bustle-market-night')
  })

  it('give each sidewalk piece one + and faint rings over its other copies, and each lot a frame and a +', () => {
    expect(bustleMarks('trees').map(m => m.key)).toEqual(['bustle-plus', 'bustle-ghost', 'bustle-ghost', 'bustle-ghost', 'bustle-ghost'])
    expect(bustleMarks('banhMi').map(m => m.key)).toEqual(['bustle-plus'])
    expect(bustleMarks('park').map(m => m.key)).toEqual(['bustle-frame-park', 'bustle-plus'])
  })
})

describe('the words and bounds of the street', () => {
  it('words how much sooner customers come, and lot prices in millions', () => {
    expect(bustlePercentText(0)).toBe('0%')
    expect(bustlePercentText(3)).toBe('1,5%')
    expect(bustlePercentText(12)).toBe('6%')
    expect(bustlePercentText(30)).toBe('15%')
    expect([millions(6_000_000), millions(12_000_000), millions(1_200_000)]).toEqual(['6', '12', '1,2'])
  })

  it('runs the map BUSTLE_ROWS rows further down once open, keeping its top and width', () => {
    const b = { x: -100, y: MAP_Y, w: 5000, h: 1560 }
    expect(openStreetBounds(b)).toEqual({ ...b, h: 1560 + BUSTLE_ROWS * TILE })
  })
})

describe("the old road's dashed line", () => {
  it('lies under balconies upstairs only at the two blocks and their bought houses', () => {
    expect(upperFronts({ left: 0, right: 0 }, null)).toEqual([[12, 25]])
    expect(upperFronts({ left: 1, right: 2 }, { left: 0, right: 1 })).toEqual([[6, 37], [49, 68]])
  })

  it('is covered across the whole street on floor 1, and upstairs only under the houses drawn down to the road', () => {
    const fronts = upperFronts({ left: 0, right: 0 }, { left: 0, right: 0 })
    expect(roadCovers(1, [6, 68], fronts)).toEqual([[6, 68]])
    expect(roadCovers(2, [6, 68], fronts)).toEqual([[6, 12], [25, 49], [62, 68]])
    expect(roadCovers(3, [12, 62], fronts)).toEqual([[25, 49]])
    expect(roadCovers(2, [6, 68], upperFronts({ left: 2, right: 2 }, { left: 2, right: 2 }))).toEqual([])
  })
})
