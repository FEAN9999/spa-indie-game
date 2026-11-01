import { describe, expect, it, vi } from 'vitest'
import { BUSTLE_ROWS, MAP_X, MAP_Y, TILE } from '../../src/config'
import { BUSTLE_IDS, type BustleId } from '../../src/sim/bustle'
import { BUS, busAt, bustleAt, laneRow, bustleHits, bustleMarks, bustlePercentText, bustlePictures, colX, LOTS, millions, onSidewalk, openStreetBounds, roadCovers, streetAt, streetLights, STRIP_ROW, upperFronts, walkLanes, WALK_ROWS, type StreetRect } from '../../src/view/bustle'

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

describe('who walks the street', () => {
  const street: [number, number] = [6, 68]

  it('is two on the near sidewalk with nothing bought, and more as the street gets busier, at most eight', () => {
    expect(walkLanes([], 600, street)).toEqual([{ row: WALK_ROWS.near, from: 6, to: 68, count: 2, speed: 0.9, loop: true, near: true, detour: null }])
    expect(walkLanes(['trees', 'banhMi'], 600, street)[0].count).toBe(3)
    expect(walkLanes([...BUSTLE_IDS], 600, street)[0].count).toBe(8)
  })

  it('crosses to the far sidewalk once a lot is bought, strolls the park and shops at the market only from 17:00', () => {
    const rows = (bought: BustleId[], minutes: number) => walkLanes(bought, minutes, street).map(l => l.row)
    expect(rows(['trees', 'lamps'], 600)).toEqual([WALK_ROWS.near])
    expect(rows(['busStop'], 600)).toEqual([WALK_ROWS.near, WALK_ROWS.far])
    expect(rows(['park'], 600)).toEqual([WALK_ROWS.near, WALK_ROWS.far, WALK_ROWS.park])
    expect(rows(['nightMarket'], 1019)).toEqual([WALK_ROWS.near, WALK_ROWS.far])
    expect(rows(['nightMarket'], 1020)).toEqual([WALK_ROWS.near, WALK_ROWS.far, WALK_ROWS.market])
    const market = walkLanes(['nightMarket'], 1100, street).at(-1)!
    expect([market.from, market.to, market.count, market.loop]).toEqual([LOTS.nightMarket[0] + 0.6, LOTS.nightMarket[1] - 0.6, 6, false])
  })

  it('walks the near sidewalk just behind the pieces at the curb, and the far lanes on the far side of the road', () => {
    for (const id of BUSTLE_IDS.filter(onSidewalk)) for (const p of bustlePictures(id, 600)) expect(WALK_ROWS.near).toBeLessThan(p.foot)
    expect(WALK_ROWS.far).toBeGreaterThan(STRIP_ROW + 1)
    expect(WALK_ROWS.far).toBeLessThan(STRIP_ROW + 1.7)
  })
})

describe('the bus', () => {
  const street: [number, number] = [6, 68]
  /** Every 50 ms of one long run, the bus's place or null. */
  const run = (ms: number) => Array.from({ length: ms / 50 }, (_, i) => busAt(i * 50, street))

  it('comes in off the left end, stops at the bay for 1.8 s, and goes off the right end', () => {
    expect(busAt(0, street)).toBe(6 - BUS.len - 1)
    const stopped = run(40_000).filter(x => x === BUS.stopCol)
    expect(stopped.length * 50).toBeGreaterThanOrEqual(BUS.stopMs * 2 - 100)
    const places = run(20_000).filter((x): x is number => x !== null)
    expect(Math.max(...places)).toBeGreaterThan(68)
  })

  it('only ever moves right, and comes round about every 15 seconds', () => {
    const places = run(14_000)
    for (let i = 1; i < places.length; i++) if (places[i] !== null && places[i - 1] !== null) expect(places[i]!).toBeGreaterThanOrEqual(places[i - 1]!)
    const empties = run(60_000).map(x => x === null)
    const rounds = empties.filter((e, i) => e && !empties[i - 1]).length
    expect(rounds).toBeGreaterThanOrEqual(3)
    expect(rounds).toBeLessThanOrEqual(5)
  })
})

describe("the street's lights", () => {
  it('light the lamps with a pool under each, the carts, the shelter, the park and the market', () => {
    const all = streetLights([...BUSTLE_IDS], 1)
    expect(all).toHaveLength(4 * 2 + 1 + 1 + 1 + 2 + 12 + 4)
    for (const l of all) {
      expect(l.col).toBeGreaterThanOrEqual(12)
      expect(l.col).toBeLessThanOrEqual(62)
    }
  })

  it('leave out the sidewalk pieces upstairs, where the balcony hides them', () => {
    expect(streetLights(['lamps', 'banhMi', 'sugarcane'], 2)).toEqual([])
    expect(streetLights(['park'], 3)).toHaveLength(2)
  })
})

describe('the far sidewalk round the bus shelter', () => {
  const street: [number, number] = [6, 68]
  const far = (bought: BustleId[]) => walkLanes(bought, 600, street).find(l => l.row === WALK_ROWS.far)!
  /** The shelter's roof and its sign's disc, in street columns, and the rows of its bench and the person waiting on it, its flower bed and its planter. */
  const ROOF = [14.6, 19.6]
  const SIGN = [19.71, 20.39]
  const BENCH_FOOT = 22.45
  const FLOWER_BED = 23.85
  const PLANTER = { col: 21.2, top: 22.17 }

  it('bends only with the bus stop bought', () => {
    expect(far(['park']).detour).toBeNull()
    expect(far(['busStop']).detour).not.toBeNull()
  })

  it('keeps to the far sidewalk away from the shelter, and goes round behind it, in front of its bench and clear of its flower bed', () => {
    const lane = far(['busStop'])
    expect(laneRow(lane, 8)).toBe(WALK_ROWS.far)
    expect(laneRow(lane, 30)).toBe(WALK_ROWS.far)
    for (let col = ROOF[0]; col <= SIGN[1]; col += 0.1) {
      expect(laneRow(lane, col)).toBeGreaterThan(BENCH_FOOT)
      expect(laneRow(lane, col)).toBeLessThan(FLOWER_BED)
    }
  })

  it('eases there and back with no jump, and is back on the sidewalk before the planter', () => {
    const lane = far(['busStop'])
    let last = laneRow(lane, 10)
    for (let col = 10; col <= 25; col += 0.05) {
      const row = laneRow(lane, col)
      expect(Math.abs(row - last)).toBeLessThan(0.1)
      last = row
    }
    // a walker stands about a tile tall: at the planter's edge their feet are above its leaves
    expect(laneRow(lane, PLANTER.col)).toBeLessThan(PLANTER.top)
  })
})
