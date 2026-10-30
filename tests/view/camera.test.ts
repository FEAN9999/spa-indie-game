import { describe, expect, it } from 'vitest'
import { NO_HOUSES } from '../../src/sim/layout'
import { buildArea, clampView, contains, dragTile, MAP_VIEW, mapBounds, minZoom, panBy, refit, toScreen, toWorld, visibleWorld, zoomAbout } from '../../src/view/camera'

const shop = mapBounds(NO_HOUSES)
const all = mapBounds({ left: 2, right: 2 })
const home = clampView({ zoom: 1, cx: 0, cy: 0 }, shop, MAP_VIEW)

describe('the map view', () => {
  it('spans the old shop alone, or every house column once all are bought', () => {
    expect(shop).toEqual({ x: 33, y: 210, w: 1014, h: 1560 })
    expect(all).toEqual({ x: -903, y: 210, w: 2886, h: 1560 })
    expect(mapBounds({ left: 1, right: 0 })).toEqual({ x: 33 - 468, y: 210, w: 1014 + 468, h: 1560 })
  })

  it('at normal zoom puts the old shop exactly where it always was', () => {
    expect(home).toEqual({ zoom: 1, cx: 540, cy: 990 })
    expect(toScreen(home, MAP_VIEW, 33, 210)).toEqual({ x: 33, y: 210 })
    expect(toWorld(home, MAP_VIEW, 600, 700)).toEqual({ x: 600, y: 700 })
    expect(visibleWorld(home, MAP_VIEW)).toEqual(MAP_VIEW)
  })

  it('keeps the point between the fingers still while zooming in, within the limits', () => {
    const v = zoomAbout(home, MAP_VIEW, 1.6, 100, 300, shop)
    expect(v.zoom).toBe(1.6)
    const at = toScreen(v, MAP_VIEW, 100, 300)
    expect(at.x).toBeCloseTo(100, 9)
    expect(at.y).toBeCloseTo(300, 9)
    expect(zoomAbout(home, MAP_VIEW, 3, 540, 990, shop).zoom).toBe(1.6)
    expect(zoomAbout(home, MAP_VIEW, 0.5, 540, 990, shop)).toEqual(home)
  })

  it('never pans past the map', () => {
    const v = zoomAbout(home, MAP_VIEW, 1.6, 540, 990, shop)
    expect(panBy(v, MAP_VIEW, -10_000, 0, shop).cx).toBe(1047 - 540 / 1.6)
    expect(panBy(v, MAP_VIEW, 0, 10_000, shop).cy).toBe(210 + 780 / 1.6)
    expect(panBy(v, MAP_VIEW, 20, 0, shop).cx).toBe(v.cx - 20 / 1.6)
  })

  it('zooms out until the whole row fits the width, centred', () => {
    expect(minZoom(all, MAP_VIEW)).toBeCloseTo(1080 / 2886)
    expect(minZoom(shop, MAP_VIEW)).toBe(1)
    expect(clampView({ zoom: 0.1, cx: 0, cy: 0 }, all, MAP_VIEW)).toEqual({ zoom: 1080 / 2886, cx: 540, cy: 990 })
  })

  it('keeps the map still on screen when build mode shortens the area', () => {
    const area = buildArea(1640)
    const v = refit(home, MAP_VIEW, area, shop)
    expect(toScreen(v, area, 33, 210)).toEqual({ x: 33, y: 210 })
    expect(buildArea(1940)).toEqual(MAP_VIEW)
  })

  it('moves a held piece by the whole tiles the finger crossed on the map', () => {
    expect(dragTile({ x: 20, y: 5 }, { x: 0, y: 0 }, { x: 2.4 * 78, y: -0.6 * 78 })).toEqual({ x: 22, y: 4 })
  })

  it('tells a point inside a rect, or near it within a margin', () => {
    expect(contains(MAP_VIEW, 0, 210)).toBe(true)
    expect(contains(MAP_VIEW, 1080, 210)).toBe(false)
    expect(contains(MAP_VIEW, -10, 200)).toBe(false)
    expect(contains(MAP_VIEW, -10, 200, 20)).toBe(true)
  })
})
