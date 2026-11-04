import { describe, expect, it } from 'vitest'
import { COMMANDS } from '../../src/view/bake'
import { cameraView, cullOffCamera, reachOf, type Cullable } from '../../src/view/cull'

const cam = { id: 1, scrollX: 1000, scrollY: 0, width: 1000, height: 1000, zoom: 1 }

const image = (x: number, y: number, over: Partial<Cullable> = {}): Cullable => ({
  x,
  y,
  scaleX: 1,
  scaleY: 1,
  originX: 0.5,
  originY: 0.5,
  displayWidth: 100,
  displayHeight: 100,
  rotation: 0,
  visible: true,
  scrollFactorX: 1,
  scrollFactorY: 1,
  cameraFilter: 0,
  ...over,
})

const container = (x: number, y: number, list: Cullable[], over: Partial<Cullable> = {}): Cullable => ({ ...image(x, y), originX: undefined, displayWidth: 0, displayHeight: 0, list, ...over })

let frame = 0
const cull = (o: Cullable, c = cam) => {
  // far enough apart that each case measures afresh
  frame += 1000
  cullOffCamera([o], c, frame)
  return o.cameraFilter !== 0
}

describe('cameraView', () => {
  it('is what the camera shows, with the margin, and narrows about the middle as it zooms in', () => {
    expect(cameraView(cam)).toEqual([872, -128, 2128, 1128])
    expect(cameraView({ ...cam, zoom: 2 })).toEqual([1122, 122, 1878, 878])
  })
})

describe('reachOf', () => {
  it('is more than any corner of a part, however its container is turned', () => {
    const part = image(30, -40)
    expect(reachOf(container(0, 0, [part]))).toBe(30 + 40 + 100 + 100)
  })

  it('takes in parts within parts and scales with each container', () => {
    const inner = container(10, 0, [image(0, 0)], { scaleX: 2, scaleY: 2 })
    expect(reachOf(container(0, 0, [inner], { scaleX: 3, scaleY: 1 }))).toBe((10 + 2 * 200) * 3)
  })

  it('reads the commands of a Graphics', () => {
    const g: Cullable = { x: 0, y: 0, scaleX: 1, scaleY: 1, visible: true, cameraFilter: 0, commandBuffer: [COMMANDS.FILL_RECT, 0, 0, 40, 20] }
    expect(reachOf(g)).toBeGreaterThanOrEqual(60)
    expect(reachOf(g)).toBeLessThan(80)
  })

  it('cannot tell what it cannot size, a Graphics with a gradient or a part with no size', () => {
    expect(reachOf({ x: 0, y: 0, scaleX: 1, scaleY: 1, visible: true, cameraFilter: 0 })).toBe(Infinity)
    expect(reachOf({ x: 0, y: 0, scaleX: 1, scaleY: 1, visible: true, cameraFilter: 0, commandBuffer: [99] })).toBe(Infinity)
  })
})

describe('cullOffCamera', () => {
  it('passes over a picture beyond the margin and draws one inside it', () => {
    expect(cull(image(2200, 500))).toBe(true)
    expect(cull(image(2100, 500))).toBe(false)
    expect(cull(image(800, 500))).toBe(true)
    expect(cull(image(900, 500))).toBe(false)
    expect(cull(image(1500, 1200))).toBe(true)
    expect(cull(image(1500, -200))).toBe(true)
  })

  it('goes by a picture\'s own box when its origin is at a corner', () => {
    const room = { originX: 0, originY: 0, displayWidth: 1000 }
    expect(cull(image(-100, 0, room))).toBe(false)
    expect(cull(image(-200, 0, room))).toBe(true)
  })

  it('sees a picture again once the camera has come to it', () => {
    const o = image(2200, 500)
    expect(cull(o)).toBe(true)
    expect(cull(o, { ...cam, scrollX: 1500 })).toBe(false)
  })

  it('never passes over what scrolls with the screen, what it cannot size or a Graphics it cannot read', () => {
    expect(cull(image(9000, 500, { scrollFactorX: 0 }))).toBe(false)
    expect(cull(image(9000, 500, { originX: undefined, displayWidth: undefined }))).toBe(false)
    expect(cull({ x: 9000, y: 0, scaleX: 1, scaleY: 1, visible: true, cameraFilter: 0, scrollFactorX: 1, scrollFactorY: 1, commandBuffer: [99] })).toBe(false)
  })

  it('keeps a container drawn while any of its parts could show', () => {
    const near = container(2400, 500, [image(-300, 0)])
    expect(cull(near)).toBe(false)
    const far = container(3000, 500, [image(-300, 0)])
    expect(cull(far)).toBe(true)
  })

  it('goes by the reach of a turned or flipped picture', () => {
    expect(cull(image(2200, 500, { rotation: 1 }))).toBe(false)
    expect(cull(image(2400, 500, { rotation: 1 }))).toBe(true)
    expect(cull(image(2200, 500, { scaleX: -1 }))).toBe(false)
  })

  it('keeps no filter on what is hidden, so it is drawn as soon as it shows', () => {
    const o = image(9000, 500)
    expect(cull(o)).toBe(true)
    o.visible = false
    expect(cull(o)).toBe(false)
  })

  it('looks at the list only every few frames while the camera keeps still, and at once when it moves', () => {
    const o = image(1500, 500)
    expect(cull(o)).toBe(false)
    o.x = 9000
    cullOffCamera([o], cam, frame + 5)
    expect(o.cameraFilter).toBe(0)
    cullOffCamera([o], cam, frame + 6)
    expect(o.cameraFilter).toBe(cam.id)
    frame += 6
    o.x = 1500
    cullOffCamera([o], { ...cam, scrollX: 1001 }, frame + 1)
    expect(o.cameraFilter).toBe(0)
  })

  it('measures a container again after a while, so a part added later counts', () => {
    const parts = [image(0, 0)]
    const box = container(2400, 500, parts)
    frame += 1000
    cullOffCamera([box], cam, frame)
    expect(box.cameraFilter).toBe(cam.id)
    parts.push(image(-1000, 0))
    cullOffCamera([box], cam, frame + 1)
    expect(box.cameraFilter).toBe(cam.id)
    cullOffCamera([box], cam, frame + 60)
    expect(box.cameraFilter).toBe(0)
  })
})
