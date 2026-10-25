import * as Phaser from 'phaser'
import { currentInstallEnv, installPlatform } from '../app/install'
import { BUILD_ID, latestVersion, onReturn, shouldReload } from '../app/update'
import { C, lookColors, OWNER_COLORS } from '../art/palette'
import { ARRIVE_MS, AUTOSAVE_MS, EXIT_MS, PATIENCE_MS, TILE, UPDATE_WAIT_MS } from '../config'
import { SaveSession } from '../save/session'
import { openStore, type SaveStore } from '../save/store'
import { onBed } from '../sim/grid'
import { createRng } from '../sim/rng'
import { SaveError, type SaveData } from '../sim/save'
import { SpaSim } from '../sim/spa'
import type { Customer, Facing, SimEvent, Tile } from '../sim/types'
import { formatMoney } from '../strings/format'
import { t } from '../strings/vi'
import { CHARACTER_HEIGHT_PX, CharacterView } from '../view/CharacterView'
import { Hud } from '../view/Hud'
import { RoomView } from '../view/RoomView'
import { textStyle } from '../view/text'
import type { PauseData, PausePanel } from './PauseScene'
import type { ShampooData } from './ShampooScene'
import type { SummaryData } from './SummaryScene'

const FX_DEPTH = 9000
const TAP_SLOP_PX = 20
const STREET_SIDE_TILES = 4.5
const RIPPLE_MS = 1200
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

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
  private store!: SaveStore
  private session!: SaveSession
  /** A service that became ready while paused; the mini-game opens on resume. */
  private pendingService: ShampooData | null = null
  /** Frozen while asking for a newer version on return, so nothing happens that the reload would drop. */
  private holding = false

  constructor() {
    super('SpaScene')
  }

  create() {
    this.customers = new Map()
    this.pendingService = null
    this.holding = false
    this.store = openStore()
    this.session = new SaveSession(this.store, () => this.sim.toSave(), () => location.reload())
    const saved = this.store.load(this.session.slot)
    this.sim = this.openShop(saved)
    this.room = new RoomView(this, this.sim.grid)
    this.owner = new CharacterView(this, OWNER_COLORS)
    for (const c of this.sim.customers) this.addCustomerSprite(c)
    this.hud = new Hud(this, this.sim, () => this.pause())
    this.input.on('pointerup', this.onTap, this)

    this.time.addEvent({ delay: AUTOSAVE_MS, loop: true, callback: () => this.session.saveNow() })
    const saveOnHide = () => {
      if (document.visibilityState === 'hidden') this.session.saveNow()
    }
    const saveOnLeave = () => this.session.saveNow()
    document.addEventListener('visibilitychange', saveOnHide)
    window.addEventListener('pagehide', saveOnLeave)
    const stopWatching = onReturn(() => void this.checkForUpdate())
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.removeEventListener('visibilitychange', saveOnHide)
      window.removeEventListener('pagehide', saveOnLeave)
      stopWatching()
    })

    // a reopened shop waits on the pause card; an ended day reopens its summary by itself
    if (saved && !this.sim.dayOver) this.pause()
    // a new shop on a phone asks once to be installed, before any progress could be lost
    else if (!saved && installPlatform(currentInstallEnv()) && !this.store.flag('installCardSeen')) {
      this.store.setFlag('installCardSeen')
      this.pause('install')
    }
    if (import.meta.env.DEV) Object.assign((window as any).__spa, { sim: this.sim, spa: this, store: this.store, session: this.session })
  }

  private openShop(saved: SaveData | null): SpaSim {
    const rng = createRng(Date.now())
    if (saved) {
      try {
        return SpaSim.fromSave(saved, { rng })
      } catch (e) {
        if (!(e instanceof SaveError)) throw e
      }
    }
    return new SpaSim({ rng })
  }

  /** Coming back to the game moves it to a newer version, unless a service is in progress. */
  private async checkForUpdate(): Promise<void> {
    if (BUILD_ID === 'dev' || this.sim.servingCustomerId !== null) return
    this.holding = true
    const latest = await latestVersion(UPDATE_WAIT_MS)
    if (shouldReload(BUILD_ID, latest, this.sim.servingCustomerId !== null)) this.session.reloadForUpdate()
    else this.holding = false
  }

  pause(panel: PausePanel = 'menu'): void {
    this.sim.paused = true
    const data: PauseData = { sim: this.sim, store: this.store, session: this.session, panel, onResume: () => this.resume() }
    this.scene.launch('PauseScene', data)
  }

  private resume(): void {
    this.sim.paused = false
    if (this.pendingService) {
      this.scene.launch('ShampooScene', this.pendingService)
      this.pendingService = null
    }
  }

  update(time: number, delta: number) {
    if (!this.holding) this.sim.update(delta)
    for (const e of this.sim.drainEvents()) this.handle(e)

    const dt = this.sim.paused ? 0 : delta
    const o = this.sim.owner
    const at = this.room.tileToWorld(o.pos)
    // serving: face the bed on the left of the work tile
    this.owner.setFacing(o.task?.kind === 'serve' && o.path.length === 0 ? 'left' : o.facing)
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
        if (c) this.addCustomerSprite(c)
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
        if (this.sim.paused) this.pendingService = data
        else this.scene.launch('ShampooScene', data)
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
        this.session.saveNow()
        const data: SummaryData = {
          sim: this.sim,
          onNewDay: () => {
            this.sim.startDay()
            this.session.saveNow()
          },
        }
        this.scene.launch('SummaryScene', data)
        return
      }
    }
  }

  private addCustomerSprite(c: Customer): void {
    this.customers.set(c.id, {
      view: new CharacterView(this, lookColors(c.look)),
      bar: this.add.graphics(),
      ripple: this.add.image(0, 0, 'ripple').setVisible(false),
      bubble: null,
    })
  }

  private syncCustomer(c: Customer, s: CustomerSprite, time: number, dt: number): void {
    // on the bed from arrival until the owner finishes, waiting or being served
    const lying = c.stationId !== null && c.path.length === 0
    const sitting = c.state === 'waiting'
    const street = this.streetPlacement(c)
    const p: Placement = street ?? { ...this.room.tileToWorld(c.pos), facing: c.facing, alpha: 1 }
    // a customer on the bed, or stepping on or off it, draws over the bed, whose anchor is one tile lower
    const depth = !street && onBed(this.sim.grid, c.pos) ? p.y + TILE + 1 : sitting ? p.y + 1 : p.y

    s.view.setFacing(lying || sitting ? 'down' : p.facing)
    s.view.setPose(lying ? 'lie' : sitting ? 'sit' : street || c.path.length > 0 ? 'walk' : 'stand')
    s.view.container.setPosition(p.x, p.y).setDepth(depth).setAlpha(p.alpha)
    s.view.update(dt)

    s.bar.clear()
    if (c.state === 'waiting') {
      const f = Math.max(0, c.patienceMs / PATIENCE_MS)
      const color = hex(f > 0.5 ? C.green : f > 0.25 ? C.mustard : C.lantern)
      const x = p.x - 36
      const y = p.y - CHARACTER_HEIGHT_PX - 8
      s.bar.fillStyle(hex(C.paper), 1).fillRoundedRect(x - 4, y - 4, 80, 20, 10)
      s.bar.lineStyle(3, hex(C.ink)).strokeRoundedRect(x - 4, y - 4, 80, 20, 10)
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
    const label = this.add.text(0, 0, '+' + formatMoney(amount), { ...textStyle(46), stroke: C.cream, strokeThickness: 10 }).setOrigin(0, 0.5)
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
    if (this.holding || over.length > 0) return
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
