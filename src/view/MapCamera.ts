import type * as Phaser from 'phaser'
import { GLIDE_DECAY_MS, SLIDE_MS, ZOOM_STEP, ZOOM_STEP_MS } from '../config'
import type { Vec } from '../sim/types'
import { clampView, contains, panBy, refit, toScreen, toWorld, visibleWorld, zoomAbout, type Rect, type View } from './camera'

/** A glide ends once it is slower than this, in screen px per ms. */
const GLIDE_STOP = 0.02

const easeOut = (k: number) => 1 - (1 - k) ** 3
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/**
 * The map's view on a scene's main camera: shown in `area`, held to `bounds` and the zoom limits, and put on the camera each update.
 * Fingers move it at once; + / − and slides ease it; a flick glides on and slows to a stop.
 */
export class MapCamera {
  view: View
  area: Rect
  bounds: Rect
  private readonly cam: Phaser.Cameras.Scene2D.Camera
  private slide: { from: View; to: View; ms: number; duration: number } | null = null
  /** A flick's speed, in screen px per ms. */
  private glide: { vx: number; vy: number } | null = null

  constructor(scene: Phaser.Scene, area: Rect, bounds: Rect) {
    this.cam = scene.cameras.main
    this.area = area
    this.bounds = bounds
    this.view = clampView({ zoom: 1, cx: bounds.x + bounds.w / 2, cy: bounds.y + bounds.h / 2 }, bounds, area)
    this.cam.setViewport(area.x, area.y, area.w, area.h)
  }

  /** A new area, keeping every point of the map where it was on screen as far as the bounds allow. */
  setArea(area: Rect): void {
    this.stop()
    this.view = refit(this.view, this.area, area, this.bounds)
    this.area = area
    this.cam.setViewport(area.x, area.y, area.w, area.h)
  }

  setBounds(b: Rect): void {
    this.bounds = b
    this.view = clampView(this.view, b, this.area)
  }

  /** Sets the view at once, clamped. */
  jump(v: Partial<View>): void {
    this.stop()
    this.view = clampView({ ...this.view, ...v }, this.bounds, this.area)
  }

  /** Eases the middle of the area to the world point, keeping y and zoom unless given. */
  slideTo(wx: number, wy = this.view.cy, zoom = this.view.zoom): void {
    this.ease(clampView({ zoom, cx: wx, cy: wy }, this.bounds, this.area), SLIDE_MS)
  }

  /** One step of + or − about the middle of the area; a step during another goes on from where that one ends. */
  zoomStep(dir: 1 | -1): void {
    const from = this.slide?.to ?? this.view
    const mid = { x: this.area.x + this.area.w / 2, y: this.area.y + this.area.h / 2 }
    this.ease(zoomAbout(from, this.area, dir === 1 ? ZOOM_STEP : 1 / ZOOM_STEP, mid.x, mid.y, this.bounds), ZOOM_STEP_MS)
  }

  /** A finger moved (dx, dy) screen pixels. */
  pan(dx: number, dy: number): void {
    this.stop()
    this.view = panBy(this.view, this.area, dx, dy, this.bounds)
  }

  /** Two fingers: their midpoint moved (dx, dy) to (x, y) and their distance grew by `factor`; the map point under them stays under them. */
  pinch(factor: number, x: number, y: number, dx: number, dy: number): void {
    this.stop()
    this.view = zoomAbout(panBy(this.view, this.area, dx, dy, this.bounds), this.area, factor, x, y, this.bounds)
  }

  /** A finger let go at this speed, in screen px per ms: the map glides on. */
  release(vx: number, vy: number): void {
    this.slide = null
    this.glide = { vx, vy }
  }

  update(dtMs: number): void {
    const s = this.slide
    const g = this.glide
    if (s) {
      s.ms += dtMs
      const k = easeOut(Math.min(1, s.ms / s.duration))
      const v = { zoom: lerp(s.from.zoom, s.to.zoom, k), cx: lerp(s.from.cx, s.to.cx, k), cy: lerp(s.from.cy, s.to.cy, k) }
      this.view = clampView(v, this.bounds, this.area)
      if (s.ms >= s.duration) this.slide = null
    } else if (g) {
      this.view = panBy(this.view, this.area, g.vx * dtMs, g.vy * dtMs, this.bounds)
      const decay = Math.exp(-dtMs / GLIDE_DECAY_MS)
      g.vx *= decay
      g.vy *= decay
      if (Math.hypot(g.vx, g.vy) < GLIDE_STOP) this.glide = null
    }
    this.cam.setZoom(this.view.zoom)
    this.cam.centerOn(this.view.cx, this.view.cy)
  }

  toScreen(wx: number, wy: number): Vec {
    return toScreen(this.view, this.area, wx, wy)
  }

  toWorld(sx: number, sy: number): Vec {
    return toWorld(this.view, this.area, sx, sy)
  }

  /** The part of the map on screen, in world pixels. */
  visible(): Rect {
    return visibleWorld(this.view, this.area)
  }

  /** Whether the world point is on screen, at least `margin` world px inside the edges. */
  isVisible(wx: number, wy: number, margin = 0): boolean {
    return contains(this.visible(), wx, wy, -margin)
  }

  /** The map is wider than the area: there is somewhere to swipe to sideways. */
  overflowsX(): boolean {
    return this.bounds.w * this.view.zoom > this.area.w
  }

  private ease(to: View, duration: number): void {
    this.glide = null
    this.slide = { from: { ...this.view }, to, ms: 0, duration }
  }

  private stop(): void {
    this.slide = null
    this.glide = null
  }
}
