import { describe, expect, it } from 'vitest'
import { MAP_X, TILE } from '../../src/config'
import { NO_HOUSES } from '../../src/sim/layout'
import type { Customer } from '../../src/sim/types'
import { mapBounds } from '../../src/view/camera'
import { offscreenWaiting, stripX, worldXAt } from '../../src/view/strip'

const shop = mapBounds(NO_HOUSES)

describe('the position strip', () => {
  it('lays the shop along the strip', () => {
    expect(stripX(shop, 33)).toBe(140)
    expect(stripX(shop, 1047)).toBe(940)
    expect(worldXAt(shop, stripX(shop, 500))).toBeCloseTo(500)
  })

  it('keeps points past the shop on the strip', () => {
    expect(stripX(shop, -500)).toBe(140)
    expect(stripX(shop, 3000)).toBe(940)
    expect(worldXAt(shop, 0)).toBe(33)
    expect(worldXAt(shop, 1080)).toBe(1047)
  })

  it('dots the waiting customers out of view or upstairs', () => {
    const waiting = (x: number, y: number) => ({ state: 'waiting', pos: { x, y } }) as Customer
    const left = { x: 33, y: 210, w: 400, h: 1560 }
    expect(offscreenWaiting([waiting(13, 14), waiting(22, 14), waiting(13, 20)], 1, left)).toEqual([MAP_X + 22.5 * TILE, MAP_X + 13.5 * TILE])
  })

  it('gives a customer walking to a seat no dot', () => {
    const walking = { state: 'toSeat', pos: { x: 22, y: 14 } } as Customer
    expect(offscreenWaiting([walking], 1, { x: 33, y: 210, w: 400, h: 1560 })).toEqual([])
  })
})
