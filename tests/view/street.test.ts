import { describe, expect, it } from 'vitest'
import { MAP_Y, MAP_X, RESTAURANT_X0, SHOP_X0, TILE } from '../../src/config'
import type { Diner } from '../../src/sim/restaurant'
import { NO_HOUSES } from '../../src/sim/layout'
import { mapBounds } from '../../src/view/camera'
import { DOOR_X, restaurantTileAt, restaurantX, rideX, shopAt, stripBlocks, streetBounds, ticketDots, walkerX } from '../../src/view/street'

const diner = (over: Partial<Diner>): Diner => ({ state: 'ordering', pos: { x: 18, y: 17 }, stateMs: 0, legMs: 0, ...over }) as Diner

describe('the street', () => {
  it("spans the spa and the restaurant's main block", () => {
    const b = streetBounds(NO_HOUSES)
    expect(b.x).toBe(mapBounds(NO_HOUSES).x)
    expect(b.x + b.w).toBe(restaurantX(SHOP_X0 + 13))
    expect(b.y).toBe(mapBounds(NO_HOUSES).y)
    expect(b.h).toBe(mapBounds(NO_HOUSES).h)
    const wide = streetBounds({ left: 2, right: 0 })
    expect(wide.x).toBe(b.x - 12 * TILE)
    expect(wide.x + wide.w).toBe(restaurantX(SHOP_X0 + 13))
  })

  it('tells which shop is under an x', () => {
    expect(shopAt(restaurantX(0) - 1, true)).toBe('spa')
    expect(shopAt(restaurantX(0), true)).toBe('restaurant')
    expect(shopAt(restaurantX(20), false)).toBe('spa')
  })

  it('maps restaurant tiles to the world and back', () => {
    for (const t of [{ x: 18, y: 17 }, { x: 14, y: 7 }]) {
      expect(restaurantTileAt({ x: restaurantX(t.x + 0.5), y: MAP_Y + (t.y + 0.5) * TILE })).toEqual(t)
    }
    expect(restaurantX(0)).toBe(MAP_X + RESTAURANT_X0 * TILE)
  })

  it('rides from one door to the other', () => {
    expect(rideX('restaurant', 0)).toBe(DOOR_X.spa)
    expect(rideX('restaurant', 1)).toBe(DOOR_X.restaurant)
    expect(rideX('spa', 0)).toBe(DOOR_X.restaurant)
    expect(rideX('spa', 1)).toBe(DOOR_X.spa)
    expect(rideX('spa', 0.5)).toBe((DOOR_X.spa + DOOR_X.restaurant) / 2)
  })

  it('draws a walker along the street by the time walked', () => {
    const d = diner({ state: 'street', stateMs: 3700, legMs: 7400 })
    expect(walkerX(d)).toBe((DOOR_X.spa + DOOR_X.restaurant) / 2)
  })

  it('marks the spa block and the restaurant block', () => {
    const [spa, rest] = stripBlocks(NO_HOUSES)
    expect(spa).toEqual({ from: streetBounds(NO_HOUSES).x, to: restaurantX(0), restaurant: false })
    expect(rest).toEqual({ from: restaurantX(0), to: restaurantX(SHOP_X0 + 13), restaurant: true })
    expect(stripBlocks(NO_HOUSES)).toHaveLength(2)
  })

  it('puts a red dot for each ticket held off-screen', () => {
    const visible = { x: 0, y: 0, w: 400, h: 1000 }
    const away = diner({ state: 'ordering', pos: { x: 18, y: 17 } })
    const eating = diner({ state: 'eating', pos: { x: 20, y: 17 } })
    expect(ticketDots([away, eating], visible)).toEqual([restaurantX(18.5)])
    const near = diner({ state: 'ordering', pos: { x: 0, y: 17 } })
    expect(ticketDots([near], { x: restaurantX(0), y: 0, w: 400, h: 1000 })).toEqual([])
  })
})
