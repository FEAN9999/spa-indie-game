import type * as Phaser from 'phaser'
import { describe, expect, it } from 'vitest'
import { SLIDE_MS, ZOOM_STEP, ZOOM_STEP_MS } from '../../src/config'
import { NO_HOUSES } from '../../src/sim/layout'
import { MAP_VIEW, mapBounds } from '../../src/view/camera'
import { MapCamera } from '../../src/view/MapCamera'

const shop = mapBounds(NO_HOUSES)

/** A MapCamera on a stand-in for the scene's main camera, which records what it is given. */
function make() {
  const main = { viewport: [0, 0, 0, 0], zoom: 1, centre: [0, 0] }
  const fake = {
    setViewport: (x: number, y: number, w: number, h: number) => (main.viewport = [x, y, w, h]),
    setZoom: (z: number) => (main.zoom = z),
    centerOn: (x: number, y: number) => (main.centre = [x, y]),
  }
  const cam = new MapCamera({ cameras: { main: fake } } as unknown as Phaser.Scene, MAP_VIEW, shop)
  return { cam, main }
}

/** Runs the camera for `ms` in frames of 10 ms. */
const run = (cam: MapCamera, ms: number) => {
  for (let t = 0; t < ms; t += 10) cam.update(10)
}

describe('the map camera', () => {
  it('starts at normal size on the old shop and puts the view on the scene camera each update', () => {
    const { cam, main } = make()
    expect(main.viewport).toEqual([0, 210, 1080, 1560])
    expect(cam.view).toEqual({ zoom: 1, cx: 540, cy: 990 })
    cam.jump({ zoom: 1.6, cx: 0 })
    cam.update(16)
    expect(main.zoom).toBe(1.6)
    expect(main.centre).toEqual([33 + 540 / 1.6, 990])
  })

  it('steps + to 1.35, then to 1.6 and no further, easing over the step time', () => {
    const { cam } = make()
    cam.zoomStep(1)
    run(cam, ZOOM_STEP_MS / 2)
    expect(cam.view.zoom).toBeGreaterThan(1)
    expect(cam.view.zoom).toBeLessThan(ZOOM_STEP)
    run(cam, ZOOM_STEP_MS / 2)
    expect(cam.view.zoom).toBe(ZOOM_STEP)
    cam.zoomStep(1)
    run(cam, ZOOM_STEP_MS)
    expect(cam.view.zoom).toBe(1.6)
    cam.zoomStep(1)
    run(cam, ZOOM_STEP_MS)
    expect(cam.view.zoom).toBe(1.6)
  })

  it('steps − back to normal size and no further', () => {
    const { cam } = make()
    cam.jump({ zoom: 1.6 })
    cam.zoomStep(-1)
    run(cam, ZOOM_STEP_MS)
    expect(cam.view.zoom).toBeCloseTo(1.6 / ZOOM_STEP, 9)
    cam.zoomStep(-1)
    run(cam, ZOOM_STEP_MS)
    expect(cam.view.zoom).toBe(1)
    expect(cam.view).toEqual({ zoom: 1, cx: 540, cy: 990 })
  })

  it('counts a second tap during a step from where the first one ends', () => {
    const { cam } = make()
    cam.zoomStep(1)
    cam.update(10)
    cam.zoomStep(1)
    run(cam, ZOOM_STEP_MS)
    expect(cam.view.zoom).toBe(1.6)
  })

  it('slides to a point, held inside the map', () => {
    const { cam } = make()
    cam.jump({ zoom: 1.6 })
    const y = cam.view.cy
    cam.slideTo(5000)
    cam.update(10)
    expect(cam.view.cx).toBeGreaterThan(540)
    expect(cam.view.cx).toBeLessThan(1047 - 540 / 1.6)
    run(cam, SLIDE_MS)
    expect(cam.view).toEqual({ zoom: 1.6, cx: 1047 - 540 / 1.6, cy: y })
  })

  it('tells while a slide runs, until it ends or a finger moves the map', () => {
    const { cam } = make()
    cam.jump({ zoom: 1.6 })
    expect(cam.sliding).toBe(false)
    cam.slideTo(900)
    cam.update(10)
    expect(cam.sliding).toBe(true)
    run(cam, SLIDE_MS)
    expect(cam.sliding).toBe(false)
    cam.slideTo(300)
    cam.pan(1, 0)
    expect(cam.sliding).toBe(false)
  })

  it('glides on after a flick, slower each frame, and stops', () => {
    const { cam } = make()
    cam.jump({ zoom: 1.6, cx: 400 })
    cam.release(-0.5, 0)
    cam.update(10)
    const first = cam.view.cx - 400
    expect(first).toBeCloseTo(5 / 1.6, 9)
    const at = cam.view.cx
    cam.update(10)
    expect(cam.view.cx - at).toBeLessThan(first)
    run(cam, 2000)
    const stopped = cam.view.cx
    cam.update(10)
    expect(cam.view.cx).toBe(stopped)
  })

  it('stops a glide or a slide when a finger moves the map', () => {
    const { cam } = make()
    cam.jump({ zoom: 1.6, cx: 400 })
    cam.release(-0.5, 0)
    cam.update(10)
    cam.pan(0, 0)
    const at = cam.view.cx
    cam.update(10)
    expect(cam.view.cx).toBe(at)
    cam.slideTo(700)
    cam.pinch(1, 540, 990, 0, 0)
    cam.update(10)
    expect(cam.view.cx).toBe(at)
  })

  it('keeps the map point between two fingers under them as they pinch and move', () => {
    const { cam } = make()
    cam.jump({ zoom: 1.2 })
    const under = cam.toWorld(500, 800)
    cam.pinch(1.2, 520, 790, 20, -10)
    expect(cam.view.zoom).toBeCloseTo(1.44, 9)
    const now = cam.toScreen(under.x, under.y)
    expect(now.x).toBeCloseTo(520, 9)
    expect(now.y).toBeCloseTo(790, 9)
  })

  it('tells what is in view, a margin inside its edges, and whether the map is wider than the area', () => {
    const { cam } = make()
    expect(cam.overflowsX()).toBe(false)
    cam.jump({ zoom: 1.6, cx: 0 })
    expect(cam.overflowsX()).toBe(true)
    const v = cam.visible()
    expect(v.x).toBe(33)
    expect(cam.isVisible(40, 990)).toBe(true)
    expect(cam.isVisible(40, 990, 78)).toBe(false)
    expect(cam.isVisible(v.x + v.w + 1, 990)).toBe(false)
  })
})
