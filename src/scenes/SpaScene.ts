import * as Phaser from 'phaser'
import { lookColors, OWNER_COLORS } from '../art/palette'
import { ARRIVE_MS, EXIT_MS, PATIENCE_MS, TILE } from '../config'
import { createRng } from '../sim/rng'
import { SpaSim } from '../sim/spa'
import type { Customer, Facing, SimEvent, Tile } from '../sim/types'
import { formatMoney } from '../strings/format'
import { t } from '../strings/vi'
import { CHARACTER_HEIGHT_PX, CharacterView } from '../view/CharacterView'
import { Hud } from '../view/Hud'
import { RoomView } from '../view/RoomView'
import { textStyle } from '../view/text'
import type { ShampooData } from './ShampooScene'
import type { SummaryData } from './SummaryScene'

const FX_DEPTH = 9000
const TAP_SLOP_PX = 20
const STREET_SIDE_TILES = 4.5
const RIPPLE_MS = 1200

interface CustomerSprite {
  view: CharacterView
  bar: Phaser.GameObjects.Graphics
  ripple: Phaser.GameObjects.Image
  bubble: Phaser.GameObjects.Image | null
}

interface Placement {
  x: number
  y: number
  facing: Facing
  alpha: number
}

export class SpaScene extends Phaser.Scene {
  sim!: SpaSim
  private room!: RoomView
  private hud!: Hud
  private owner!: CharacterView
  private customers = new Map<number, CustomerSprite>()

  constructor() {
    super('SpaScene')
  }

  create() {
    this.sim = new SpaSim({ rng: createRng(Date.now()) })
    this.room = new RoomView(this, this.sim.grid)
    this.owner = new CharacterView(this, OWNER_COLORS)
    this.hud = new Hud(this, this.sim)
    this.input.on('pointerup', this.onTap, this)
    if (import.meta.env.DEV) Object.assign((window as any).__spa, { sim: this.sim, spa: this })
  }

  update(time: number, delta: number) {
    this.sim.update(delta)
    for (const e of this.sim.drainEvents()) this.handle(e)

    const dt = this.sim.paused ? 0 : delta
    const o = this.sim.owner
    const at = this.room.tileToWorld(o.pos)
    this.owner.setFacing(o.facing)
    this.owner.setPose(o.path.length > 0 ? 'walk' : 'stand')
    this.owner.container.setPosition(at.x, at.y).setDepth(at.y)
    this.owner.update(dt)

    for (const c of this.sim.customers) {
      const s = this.customers.get(c.id)
      if (s) this.syncCustomer(c, s, time, dt)
    }
    this.hud.update()
  }

  private handle(e: SimEvent): void {
    switch (e.type) {
      case 'customerArrived': {
        const c = this.sim.customers.find(x => x.id === e.id)
        if (!c) return
        this.customers.set(c.id, {
          view: new CharacterView(this, lookColors(c.look)),
          bar: this.add.graphics(),
          ripple: this.add.image(0, 0, 'ripple').setTint(0x5fb3a1).setVisible(false),
          bubble: null,
        })
        return
      }
      case 'customerLeft': {
        const s = this.customers.get(e.id)
        if (!s) return
        s.view.container.destroy()
        s.bar.destroy()
        s.ripple.destroy()
        s.bubble?.destroy()
        this.customers.delete(e.id)
        return
      }
      case 'serviceReady': {
        const c = this.sim.customers.find(x => x.id === e.customerId)
        if (!c) return
        this.hud.hideHint()
        const data: ShampooData = { look: c.look, onDone: stars => this.sim.completeService(c.id, stars) }
        this.scene.launch('ShampooScene', data)
        return
      }
      case 'paid':
        this.floatMoney(e.tile, e.amount + e.tip)
        return
      case 'review':
        this.showBubble(e.customerId, e.score)
        return
      case 'toast':
        this.hud.toast(t(e.key))
        return
      case 'dayEnded': {
        const data: SummaryData = { sim: this.sim, onNewDay: () => this.sim.startDay() }
        this.scene.launch('SummaryScene', data)
        return
      }
    }
  }

  private syncCustomer(c: Customer, s: CustomerSprite, time: number, dt: number): void {
    const sitting = c.state === 'waiting' || c.state === 'inService'
    const street = this.streetPlacement(c)
    const p: Placement = street ?? { ...this.room.tileToWorld(c.pos), facing: c.facing, alpha: 1 }
    const depth = sitting ? p.y + 1 : p.y

    s.view.setFacing(sitting ? 'down' : p.facing)
    s.view.setPose(sitting ? 'sit' : street || c.path.length > 0 ? 'walk' : 'stand')
    s.view.container.setPosition(p.x, p.y).setDepth(depth).setAlpha(p.alpha)
    s.view.update(dt)

    s.bar.clear()
    if (c.state === 'waiting') {
      const f = Math.max(0, c.patienceMs / PATIENCE_MS)
      const color = f > 0.5 ? 0x7dcf8f : f > 0.25 ? 0xf5c242 : 0xe86a6a
      const x = p.x - 36
      const y = p.y - CHARACTER_HEIGHT_PX - 8
      s.bar.fillStyle(0xffffff, 0.95).fillRoundedRect(x - 4, y - 4, 80, 20, 10)
      s.bar.fillStyle(color, 1).fillRoundedRect(x, y, Math.max(12, 72 * f), 12, 6)
      s.bar.setDepth(FX_DEPTH)
    }

    const pulsing = c.state === 'waiting' && this.sim.owner.task === null
    s.ripple.setVisible(pulsing)
    if (pulsing) {
      const k = (time % RIPPLE_MS) / RIPPLE_MS
      s.ripple.setPosition(p.x, p.y - CHARACTER_HEIGHT_PX * 0.35).setScale(0.9 + 0.6 * k).setAlpha(0.9 * (1 - k)).setDepth(depth - 0.5)
    }

    s.bubble?.setPosition(p.x, p.y - CHARACTER_HEIGHT_PX + 4).setAlpha(p.alpha)
  }

  /** Arriving and exiting customers walk along the sidewalk and through the door. */
  private streetPlacement(c: Customer): Placement | null {
    if (c.state !== 'arriving' && c.state !== 'exiting') return null
    const door = this.room.tileToWorld(this.sim.grid.door)
    const walkY = door.y + 0.9 * TILE
    const fromLeft = c.id % 2 === 1
    const sideX = door.x + (fromLeft ? -1 : 1) * STREET_SIDE_TILES * TILE
    const across: Facing = fromLeft ? 'right' : 'left'
    const back: Facing = fromLeft ? 'left' : 'right'

    if (c.state === 'arriving') {
      const k = Math.min(1, c.stateMs / ARRIVE_MS)
      const alpha = Math.min(1, k / 0.2)
      if (k < 0.7) return { x: Phaser.Math.Linear(sideX, door.x, k / 0.7), y: walkY, facing: across, alpha }
      return { x: door.x, y: Phaser.Math.Linear(walkY, door.y, (k - 0.7) / 0.3), facing: 'up', alpha }
    }
    const k = Math.min(1, c.stateMs / EXIT_MS)
    const alpha = Math.min(1, (1 - k) / 0.2)
    if (k < 0.3) return { x: door.x, y: Phaser.Math.Linear(door.y, walkY, k / 0.3), facing: 'down', alpha }
    return { x: Phaser.Math.Linear(door.x, sideX, (k - 0.3) / 0.7), y: walkY, facing: back, alpha }
  }

  private floatMoney(tile: Tile, amount: number): void {
    const at = this.room.tileToWorld(tile)
    const label = this.add.text(0, 0, '+' + formatMoney(amount), { ...textStyle(46), stroke: '#ffffff', strokeThickness: 10 }).setOrigin(0, 0.5)
    const width = 48 + 8 + label.width
    const coin = this.add.image(-width / 2 + 24, 0, 'coin')
    label.x = -width / 2 + 56
    const box = this.add.container(at.x, at.y - 130, [coin, label]).setDepth(FX_DEPTH + 10)
    this.tweens.add({ targets: box, y: box.y - 60, duration: 1000, ease: 'Cubic.easeOut' })
    this.tweens.add({ targets: box, alpha: 0, duration: 1000, ease: 'Cubic.easeIn', onComplete: () => box.destroy() })
  }

  private showBubble(customerId: number, score: number): void {
    const s = this.customers.get(customerId)
    if (!s) return
    const key = score >= 4 ? 'bubble-happy' : score === 3 ? 'bubble-ok' : 'bubble-angry'
    s.bubble?.destroy()
    s.bubble = this.add.image(0, 0, key).setOrigin(0.5, 1).setDepth(FX_DEPTH).setScale(0)
    this.tweens.add({ targets: s.bubble, scale: 1.2, duration: 250, ease: 'Back.easeOut' })
  }

  private onTap(p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): void {
    if (over.length > 0) return
    if (Phaser.Math.Distance.Between(p.downX, p.downY, p.upX, p.upY) > TAP_SLOP_PX) return
    // A seated customer's head covers the tile above the seat, so test the figure before the floor.
    const hit = this.sim.customers.find(c => {
      if (c.state !== 'waiting' || !c.seat) return false
      const at = this.room.tileToWorld(c.pos)
      return Math.abs(p.x - at.x) <= TILE / 2 && p.y <= at.y && p.y >= at.y - CHARACTER_HEIGHT_PX
    })
    this.sim.tapTile(hit?.seat ?? this.room.worldToTile(p.x, p.y))
  }
}
