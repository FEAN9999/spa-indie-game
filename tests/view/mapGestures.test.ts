import type * as Phaser from 'phaser'
import { describe, expect, it } from 'vitest'
import { NO_HOUSES } from '../../src/sim/layout'
import { MAP_VIEW, mapBounds } from '../../src/view/camera'
import { MapCamera } from '../../src/view/MapCamera'
import { MapGestures } from '../../src/view/MapGestures'

/** MapGestures on a stand-in input that keeps its handlers, over a map camera on a stand-in scene camera. */
function make() {
  const handlers = new Map<string, (...a: unknown[]) => void>()
  const input = { on: (ev: string, fn: (...a: unknown[]) => void, ctx: unknown) => handlers.set(ev, fn.bind(ctx)), off: () => {} }
  const main = { setViewport: () => {}, setZoom: () => {}, centerOn: () => {} }
  const cam = new MapCamera({ cameras: { main } } as unknown as Phaser.Scene, MAP_VIEW, mapBounds(NO_HOUSES))
  cam.jump({ zoom: 1.6 })
  const gestures = new MapGestures(input as unknown as Phaser.Input.InputPlugin, cam, { allow: () => true, onTap: () => {} })
  const emit = (ev: string, p: object) => handlers.get(ev)!(p, [])
  return { cam, gestures, emit }
}

describe('the map gestures', () => {
  it('ends a swipe whose release a scene above swallowed, at the next move of that pointer', () => {
    const { cam, gestures, emit } = make()
    const p = { id: 0, x: 500, y: 900, time: 0, isDown: true }
    emit('pointerdown', p)
    emit('pointermove', Object.assign(p, { x: 450, time: 16 }))
    expect(gestures.busy).toBe(true)
    // lifted over a panel scene: the release never reaches the map, and the mouse then only hovers
    p.isDown = false
    const at = cam.view.cx
    emit('pointermove', Object.assign(p, { x: 300, time: 400 }))
    expect(cam.view.cx).toBe(at)
    expect(gestures.busy).toBe(false)
  })
})
