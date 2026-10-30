import type * as Phaser from 'phaser'
import { Gestures, type GestureStep } from './gestures'
import type { MapCamera } from './MapCamera'

type Over = Phaser.GameObjects.GameObject[]

/**
 * Swipes, pinches and taps on the map, from a scene's pointer events: a pointer is followed only if its press passed `allow`,
 * so a press on a button or a card never moves the map nor taps it. A ctrl + wheel (a trackpad pinch) zooms about the pointer.
 */
export class MapGestures {
  private readonly gestures = new Gestures()
  /** The pointers being followed: one whose release a scene above swallowed is still marked down here. */
  private readonly held = new Set<Phaser.Input.Pointer>()

  constructor(
    private readonly input: Phaser.Input.InputPlugin,
    private readonly cam: MapCamera,
    private readonly opts: { allow: (p: Phaser.Input.Pointer, over: Over) => boolean; onTap: (p: Phaser.Input.Pointer) => void },
  ) {
    input.on('pointerdown', this.onDown, this)
    input.on('pointermove', this.onMove, this)
    input.on('pointerup', this.onUp, this)
    input.on('pointerupoutside', this.onUp, this)
    input.on('wheel', this.onWheel, this)
  }

  /** A swipe or a pinch is under way. */
  get busy(): boolean {
    return this.gestures.busy
  }

  destroy(): void {
    this.input.off('pointerdown', this.onDown, this)
    this.input.off('pointermove', this.onMove, this)
    this.input.off('pointerup', this.onUp, this)
    this.input.off('pointerupoutside', this.onUp, this)
    this.input.off('wheel', this.onWheel, this)
    this.gestures.cancel()
    this.held.clear()
  }

  private onDown(p: Phaser.Input.Pointer, over: Over): void {
    // a finger lifted over a scene above never reached us: start afresh, or it would make every touch a pinch
    if ([...this.held].some(h => !h.isDown)) {
      this.gestures.cancel()
      this.held.clear()
    }
    if (!this.opts.allow(p, over)) return
    this.held.add(p)
    this.apply(this.gestures.down(p.id, p.x, p.y, p.time), p)
  }

  private onMove(p: Phaser.Input.Pointer): void {
    this.apply(this.gestures.move(p.id, p.x, p.y, p.time), p)
  }

  private onUp(p: Phaser.Input.Pointer): void {
    this.held.delete(p)
    this.apply(this.gestures.up(p.id, p.x, p.y, p.time), p)
  }

  private onWheel(p: Phaser.Input.Pointer, over: Over, _dx: number, dy: number): void {
    const e = p.event as WheelEvent
    if (!e.ctrlKey || !this.opts.allow(p, over)) return
    this.cam.pinch(Math.exp(-dy / 100), p.x, p.y, 0, 0)
  }

  private apply(step: GestureStep, p: Phaser.Input.Pointer): void {
    if (step.kind === 'pan') this.cam.pan(step.dx, step.dy)
    else if (step.kind === 'pinch') this.cam.pinch(step.factor, step.x, step.y, step.dx, step.dy)
    else if (step.kind === 'release') this.cam.release(step.vx, step.vy)
    else if (step.kind === 'tap') this.opts.onTap(p)
  }
}
