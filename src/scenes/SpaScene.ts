import * as Phaser from 'phaser'
import { currentInstallEnv, installPlatform } from '../app/install'
import { BUILD_ID, latestVersion, onReturn, shouldReload } from '../app/update'
import { C, customerColors, ownerColors } from '../art/palette'
import { ARRIVE_MS, AUTOSAVE_MS, EXIT_MS, GAME_H, GAME_W, TILE, UNLOCK_DAY, UPDATE_WAIT_MS } from '../config'
import { SaveSession } from '../save/session'
import { openStore, type SaveStore } from '../save/store'
import { PROBLEM_TEXT } from '../sim/build'
import { KINDS } from '../sim/customers'
import { dayEase } from '../sim/economy'
import { onBed } from '../sim/grid'
import { ITEMS } from '../sim/items'
import { createRng } from '../sim/rng'
import { SaveError, SaveTooNewError, type SaveData } from '../sim/save'
import type { ServiceId } from '../sim/services'
import { SpaSim } from '../sim/spa'
import { pickHint } from '../sim/tutorial'
import type { Customer, Facing, HintId, SimEvent, Tile } from '../sim/types'
import { isUnlocked } from '../sim/unlocks'
import { formatMoney } from '../strings/format'
import { t } from '../strings/vi'
import { CHARACTER_HEIGHT_PX, CharacterView } from '../view/CharacterView'
import { HandPointer } from '../view/HandPointer'
import { BUILD_PLATE_TOP, DEPTH as HUD_DEPTH, Hud, SERVICES_PLATE_TOP, STAFF_PLATE_TOP } from '../view/Hud'
import type { MiniGameData } from '../view/miniGame'
import { RoomView } from '../view/RoomView'
import { StaffLayer } from '../view/StaffLayer'
import { textStyle } from '../view/text'
import { addButton, addCard } from '../view/ui'
import { TOP_BAR } from '../view/topBar'
import type { BuildData } from './BuildScene'
import type { OwnerData, OwnerMode } from './OwnerScene'
import type { PauseData, PausePanel } from './PauseScene'
import type { ServicesData } from './ServicesScene'
import type { StaffData } from './StaffScene'
import type { SummaryData } from './SummaryScene'

const FX_DEPTH = 9000
/** The quick-buy card covers the top bar and the bottom nav too. */
const CARD_DEPTH = HUD_DEPTH + 100
const TAP_SLOP_PX = 20
const STREET_SIDE_TILES = 4.5
const RIPPLE_MS = 1200
/** How long each of the money and star pointers stays after the first payment. */
const TOUR_STEP_MS = 3000
/** The patience pointer is done once it has been seen this long. */
const PATIENCE_HINT_MS = 4000
/** The money and star pointers aim just under the top bar's first row. */
const TOP_ROW_TIP_Y = 120
/** The top of a waiting customer's patience bar, from their feet. */
const PATIENCE_BAR_TOP = -CHARACTER_HEIGHT_PX - 12
/** The bottom of the service badge, just above the patience bar. */
const BADGE_BOTTOM = PATIENCE_BAR_TOP - 4
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
/** The close-up each service is played in; massage plays the shampoo game until its own is made. */
const MINI_GAME_SCENE: Record<ServiceId, string> = { shampoo: 'ShampooScene', mask: 'MaskScene', massage: 'ShampooScene' }
/** The hint marking each mini-game as played once, so its demo hand shows only the first time. */
const DEMO_HINT: Record<ServiceId, HintId> = { shampoo: 'demoShampoo', mask: 'demoMask', massage: 'demoShampoo' }

interface CustomerSprite {
  view: CharacterView
  bar: Phaser.GameObjects.Graphics
  /** The service the customer wants, over the patience bar. */
  badge: Phaser.GameObjects.Image
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
  private staffLayer!: StaffLayer
  private store!: SaveStore
  private session!: SaveSession
  /** A service that became ready while paused, with the scene it is played in; the mini-game opens on resume. */
  private pendingService: { scene: string; data: MiniGameData } | null = null
  /** Frozen while asking for a newer version on return, so nothing happens that the reload would drop. */
  private holding = false
  /** The owner card, the bed card, build mode or the staff panel is open: the shop waits and its events stay queued until it closes. */
  private modal = false
  /** The morning banner waits for the install card a new shop opens with. */
  private bannerOnResume = false
  /** The slot was saved by a newer version: only the card shows, and the shop never runs. */
  private tooNew = false
  private pointer!: HandPointer
  /** After the first payment: the money pointer, then the star pointer, each with the time it has left on screen. */
  private tour: { hint: 'money' | 'star'; ms: number }[] = []
  private patienceHintMs = 0

  constructor() {
    super('SpaScene')
  }

  create() {
    this.customers = new Map()
    this.pendingService = null
    this.holding = false
    this.modal = false
    this.tooNew = false
    this.bannerOnResume = false
    this.tour = []
    this.patienceHintMs = 0
    this.store = openStore()
    this.session = new SaveSession(this.store, () => this.sim.toSave(), () => location.reload())
    let saved: SaveData | null
    try {
      saved = this.session.load()
    } catch (e) {
      if (!(e instanceof SaveTooNewError)) throw e
      this.showTooNew()
      return
    }
    this.sim = this.openShop(saved)
    this.room = new RoomView(this, this.sim.grid)
    this.syncRoom()
    this.owner = new CharacterView(this, ownerColors(this.sim.ownerLook))
    for (const c of this.sim.customers) this.addCustomerSprite(c)
    this.staffLayer = new StaffLayer(this, this.room)
    this.hud = new Hud(this, this.sim, () => this.pause(), () => this.openBuild(), () => this.openStaff(), () => this.openServices())
    this.pointer = new HandPointer(this)
    this.input.on('pointerup', this.onTap, this)

    // a shop is first written once it has an owner; until then the owner card holds it still, so nothing is lost
    const autosave = () => {
      if (this.sim.profileDone) this.session.saveNow()
    }
    this.time.addEvent({ delay: AUTOSAVE_MS, loop: true, callback: autosave })
    const saveOnHide = () => {
      if (document.visibilityState === 'hidden') autosave()
    }
    const saveOnLeave = () => autosave()
    document.addEventListener('visibilitychange', saveOnHide)
    window.addEventListener('pagehide', saveOnLeave)
    // back in the game: first the shop another page may have saved meanwhile, then a newer version
    const stopWatching = onReturn(() => {
      this.session.reloadIfChangedElsewhere()
      void this.checkForUpdate()
    })
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.removeEventListener('visibilitychange', saveOnHide)
      window.removeEventListener('pagehide', saveOnLeave)
      stopWatching()
    })

    if (!saved) {
      this.openOwnerCard('new', () => {
        // a new shop on a phone asks once to be installed, before any progress could be lost
        if (installPlatform(currentInstallEnv()) && !this.store.flag('installCardSeen')) {
          this.store.setFlag('installCardSeen')
          this.bannerOnResume = true
          this.pause('install')
        } else this.showMorningBanner()
      })
    }
    // a shop from before owners picks its owner and name once, then reopens as usual
    else if (!this.sim.profileDone) {
      this.openOwnerCard('upgrade', () => {
        if (!this.sim.dayOver) this.pause()
      })
    }
    // a reopened shop waits on the pause card; an ended day reopens its summary by itself
    else if (!this.sim.dayOver) this.pause()
    if (import.meta.env.DEV) Object.assign((window as any).__spa, { sim: this.sim, spa: this, store: this.store, session: this.session })
  }

  /** The slot was saved by a newer version: nothing runs and nothing is written; reloading fetches the newer version. */
  private showTooNew(): void {
    this.tooNew = true
    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    addCard(this, 90, 800, 900, 520)
    this.add
      .text(GAME_W / 2, 880, t('saveTooNew'), { ...textStyle(42, '600'), align: 'center', wordWrap: { width: 780 } })
      .setOrigin(0.5, 0)
    addButton(this, GAME_W / 2, 1190, 720, 120, t('reload'), 'primary', () => location.reload())
  }

  private openShop(saved: SaveData | null): SpaSim {
    const rng = createRng(Date.now())
    if (saved) {
      try {
        return SpaSim.fromSave(saved, { rng })
      } catch (e) {
        if (!(e instanceof SaveError)) throw e
        // kept for a later version that may read it, instead of being written over by the new shop
        this.session.setAside()
      }
    }
    return new SpaSim({ rng })
  }

  /** Coming back to the game moves it to a newer version, unless a service is in progress or the shop has no owner yet. */
  private async checkForUpdate(): Promise<void> {
    if (BUILD_ID === 'dev' || !this.sim.profileDone || this.sim.servingCustomerId !== null) return
    this.holding = true
    const latest = await latestVersion(UPDATE_WAIT_MS)
    if (shouldReload(BUILD_ID, latest, this.sim.servingCustomerId !== null)) this.session.reloadForUpdate()
    else this.holding = false
  }

  pause(panel: PausePanel = 'menu'): void {
    this.sim.paused = true
    const data: PauseData = { sim: this.sim, store: this.store, session: this.session, panel, onResume: () => this.resume(), onEditProfile: () => this.openOwnerCard('edit', () => this.pause()) }
    this.scene.launch('PauseScene', data)
  }

  private resume(): void {
    this.sim.paused = false
    if (this.bannerOnResume) {
      this.bannerOnResume = false
      this.showMorningBanner()
    }
    if (this.pendingService) {
      this.scene.launch(this.pendingService.scene, this.pendingService.data)
      this.pendingService = null
    }
  }

  /** Opens the owner card over the shop; `after` runs once it closes. */
  openOwnerCard(mode: OwnerMode, after: () => void): void {
    this.modal = true
    const data: OwnerData = {
      mode,
      look: { ...this.sim.ownerLook },
      name: this.sim.shopName,
      onSave: (look, name) => {
        this.sim.setProfile(look, name)
        this.owner.container.destroy()
        this.owner = new CharacterView(this, ownerColors(this.sim.ownerLook))
        this.session.saveNow()
      },
      onClose: () => {
        this.modal = false
        after()
      },
    }
    this.scene.launch('OwnerScene', data)
  }

  /** Build mode over the frozen shop; the build button opens it only while nothing else is open or being played. */
  private openBuild(): void {
    const sim = this.sim
    if (this.modal || this.holding || sim.paused || sim.dayOver || sim.servingCustomerId !== null) return
    this.modal = true
    const intro = !sim.hintDone('openBuild')
    sim.markHint('openBuild')
    const data: BuildData = {
      sim,
      room: this.room,
      intro,
      onChange: () => {
        this.syncRoom()
        this.session.saveNow()
      },
      onClose: () => {
        this.modal = false
        this.session.saveNow()
      },
    }
    this.scene.launch('BuildScene', data)
  }

  /** The staff panel over the frozen shop, opened only when build mode would be. */
  private openStaff(): void {
    const sim = this.sim
    if (this.modal || this.holding || sim.paused || sim.dayOver || sim.servingCustomerId !== null) return
    this.modal = true
    const intro = !sim.hintDone('openStaff')
    sim.markHint('openStaff')
    const data: StaffData = {
      sim,
      intro,
      onChange: () => this.session.saveNow(),
      onClose: () => {
        this.modal = false
        this.session.saveNow()
      },
    }
    this.scene.launch('StaffScene', data)
  }

  /** The services panel over the frozen shop, opened only when build mode would be. */
  private openServices(): void {
    const sim = this.sim
    if (this.modal || this.holding || sim.paused || sim.dayOver || sim.servingCustomerId !== null) return
    this.modal = true
    const intro = !sim.hintDone('openServices')
    sim.markHint('openServices')
    const data: ServicesData = {
      sim,
      intro,
      onChange: () => this.session.saveNow(),
      onClose: () => {
        this.modal = false
        this.session.saveNow()
      },
    }
    this.scene.launch('ServicesScene', data)
  }

  private showMorningBanner(): void {
    this.hud.banner(t('morningBanner', { name: this.sim.shopName, day: this.sim.day }))
  }

  /** Draws the furniture as the sim has it, and a bed slot wherever a bed would fit. */
  private syncRoom(): void {
    const sim = this.sim
    this.room.sync(sim.items, sim.grid.bedSlots.map(tile => ({ tile, open: sim.canPlace('bed', tile.x, tile.y, false) === null })))
  }

  /** A tap on an open bed slot: once building is open and the money is there, a card over the frozen shop asks before buying. */
  private offerBed(slot: Tile): void {
    const price = ITEMS.bed.price
    if (!isUnlocked('build', this.sim.day)) {
      this.hud.toast(t('unlocksOn', { day: UNLOCK_DAY.build }))
      return
    }
    if (this.sim.money < price) {
      this.hud.toast(t(PROBLEM_TEXT.money, { money: formatMoney(price - this.sim.money) }))
      return
    }
    this.modal = true
    const close = () => {
      for (const p of parts) p.destroy()
      this.modal = false
    }
    const buy = () => {
      close()
      const problem = this.sim.buy('bed', slot.x, slot.y, false)
      if (problem) {
        this.hud.toast(t(PROBLEM_TEXT[problem], { money: formatMoney(price - this.sim.money) }))
        return
      }
      this.syncRoom()
      this.session.saveNow()
    }
    const text = t('quickBuyBed', { money: formatMoney(price) })
    const parts = [
      this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive(),
      addCard(this, 90, 860, 900, 440),
      this.add.text(GAME_W / 2, 950, text, { ...textStyle(48, '800'), align: 'center', wordWrap: { width: 720 } }).setOrigin(0.5, 0),
      addButton(this, GAME_W / 2 - 190, 1170, 340, 120, t('cancel'), 'plain', close),
      addButton(this, GAME_W / 2 + 190, 1170, 340, 120, t('buy'), 'primary', buy),
    ]
    for (const p of parts) p.setDepth(CARD_DEPTH)
  }

  update(time: number, delta: number) {
    if (this.tooNew) return
    if (!this.modal) {
      if (!this.holding) this.sim.update(delta)
      for (const e of this.sim.drainEvents()) this.handle(e)
    }

    const dt = this.sim.paused || this.modal ? 0 : delta
    const o = this.sim.owner
    const at = this.room.tileToWorld(o.pos)
    // serving: face the bed beside the work tile
    const task = o.task
    const station = task?.kind === 'serve' && o.path.length === 0 ? this.sim.stations.find(s => s.id === task.stationId) : undefined
    this.owner.setFacing(station ? (station.bed.x < station.work.x ? 'left' : 'right') : o.facing)
    this.owner.setPose(o.path.length > 0 ? 'walk' : 'stand')
    this.owner.container.setPosition(at.x, at.y).setDepth(at.y)
    this.owner.update(dt)

    // a badge tells which service a waiting customer wants once the shop offers more than one
    const badges = this.sim.availableServices().length > 1
    for (const c of this.sim.customers) {
      const s = this.customers.get(c.id)
      if (s) this.syncCustomer(c, s, time, dt, badges)
    }
    // staff also hold still while the owner plays, as the sim does
    this.staffLayer.update(this.sim, this.sim.servingCustomerId !== null ? 0 : dt)
    this.hud.update()
    this.updatePointer(delta)
  }

  /** One hint at a time: the money and star pointers after the first payment first, then the waiting customers, then the build or staff button. */
  private updatePointer(delta: number): void {
    const sim = this.sim
    if (sim.paused || sim.dayOver || sim.servingCustomerId !== null || this.modal || this.holding) {
      this.pointer.hide()
      return
    }

    const step = this.tour[0]
    if (step) {
      if (step.hint === 'money') this.pointer.show(t('hintMoney'), TOP_BAR.moneyX + 80, TOP_ROW_TIP_Y, 'up')
      else this.pointer.show(t('hintStar'), this.hud.starX, TOP_ROW_TIP_Y, 'up')
      step.ms -= delta
      if (step.ms <= 0) this.tour.shift()
      return
    }

    const pick = pickHint(sim)
    if (pick?.hint === 'openBuild') {
      this.pointer.show(t('hintBuild'), BUILD_PLATE_TOP.x, BUILD_PLATE_TOP.y, 'down')
      return
    }
    if (pick?.hint === 'openStaff') {
      this.pointer.show(t('hintStaff'), STAFF_PLATE_TOP.x, STAFF_PLATE_TOP.y, 'down')
      return
    }
    if (pick?.hint === 'openServices') {
      this.pointer.show(t('hintServices'), SERVICES_PLATE_TOP.x, SERVICES_PLATE_TOP.y, 'down')
      return
    }
    const at = pick && this.customers.get(pick.customerId)?.view.container
    if (!pick || !at) {
      this.pointer.hide()
      return
    }
    if (pick.hint === 'tapCustomer') {
      this.pointer.show(t('hintTapCustomer'), at.x, at.y - CHARACTER_HEIGHT_PX - 10, 'down')
      return
    }
    this.pointer.show(t('hintPatience'), at.x, at.y + PATIENCE_BAR_TOP, 'down')
    this.patienceHintMs += delta
    if (this.patienceHintMs >= PATIENCE_HINT_MS) sim.markHint('patience')
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
        s.badge.destroy()
        s.ripple.destroy()
        s.bubble?.destroy()
        this.customers.delete(e.id)
        return
      }
      case 'serviceReady': {
        const c = this.sim.customers.find(x => x.id === e.customerId)
        if (!c) return
        const scene = MINI_GAME_SCENE[c.service]
        const demo = DEMO_HINT[c.service]
        const data: MiniGameData = {
          look: c.look,
          kind: c.kind,
          extraMs: dayEase(this.sim.day).miniGameExtraMs,
          hard: KINDS[c.kind].hard,
          demo: !this.sim.hintDone(demo),
          onDone: stars => {
            this.sim.markHint(demo)
            this.sim.completeService(c.id, stars)
          },
        }
        if (this.sim.paused) this.pendingService = { scene, data }
        else this.scene.launch(scene, data)
        return
      }
      case 'paid':
        this.floatMoney(e.tile, e.amount + e.tip)
        // the first payment ever points out the money, then the star; marked now so a reload never repeats them
        if (!this.sim.hintDone('money')) {
          this.sim.markHint('money')
          this.sim.markHint('star')
          this.tour = [
            { hint: 'money', ms: TOUR_STEP_MS },
            { hint: 'star', ms: TOUR_STEP_MS },
          ]
        }
        return
      case 'review':
        this.showBubble(e.customerId, e.score)
        return
      case 'greeted':
      case 'levelUp':
        this.staffLayer.handle(e)
        return
      case 'toast':
        this.hud.toast(t(e.key))
        return
      case 'roomChanged':
        this.syncRoom()
        return
      case 'bedSlot':
        this.offerBed(e.slot)
        return
      case 'dayEnded': {
        this.session.saveNow()
        const data: SummaryData = {
          sim: this.sim,
          firstDay: !this.sim.hintDone('summary'),
          onNewDay: () => {
            this.sim.markHint('summary')
            this.sim.startDay()
            this.session.saveNow()
            this.showMorningBanner()
          },
        }
        this.scene.launch('SummaryScene', data)
        return
      }
    }
  }

  private addCustomerSprite(c: Customer): void {
    this.customers.set(c.id, {
      view: new CharacterView(this, customerColors(c.look, c.kind)),
      bar: this.add.graphics(),
      badge: this.add.image(0, 0, `svc-${c.service}`).setOrigin(0.5, 1).setDepth(FX_DEPTH).setVisible(false),
      ripple: this.add.image(0, 0, 'ripple').setVisible(false),
      bubble: null,
    })
  }

  private syncCustomer(c: Customer, s: CustomerSprite, time: number, dt: number, badges: boolean): void {
    // on the bed from arrival until the owner finishes, waiting or being served
    const lying = c.stationId !== null && c.path.length === 0
    const sitting = c.state === 'waiting'
    const street = this.streetPlacement(c)
    const p: Placement = street ?? { ...this.room.tileToWorld(c.pos), facing: c.facing, alpha: 1 }
    // a customer on the bed, or stepping on or off it, draws over the bed, whose anchor is one tile lower
    const depth = !street && onBed(this.sim.grid, c.pos) ? p.y + TILE + 1 : sitting ? p.y + 1 : p.y

    // face down on the massage bed, face up anywhere else
    s.view.setFacing(lying ? (c.service === 'massage' ? 'up' : 'down') : sitting ? 'down' : p.facing)
    s.view.setPose(lying ? 'lie' : sitting ? 'sit' : street || c.path.length > 0 ? 'walk' : 'stand')
    s.view.setMask(c.service === 'mask' && c.state === 'inService')
    s.view.container.setPosition(p.x, p.y).setDepth(depth).setAlpha(p.alpha)
    s.view.update(dt)

    s.bar.clear()
    if (c.state === 'waiting') {
      const f = Math.max(0, c.patienceMs / c.patienceMaxMs)
      const color = hex(f > 0.5 ? C.green : f > 0.25 ? C.mustard : C.lantern)
      const x = p.x - 36
      const y = p.y + PATIENCE_BAR_TOP + 4
      s.bar.fillStyle(hex(C.paper), 1).fillRoundedRect(x - 4, y - 4, 80, 20, 10)
      s.bar.lineStyle(3, hex(C.ink)).strokeRoundedRect(x - 4, y - 4, 80, 20, 10)
      s.bar.fillStyle(color, 1).fillRoundedRect(x, y, Math.max(12, 72 * f), 12, 6)
      s.bar.setDepth(FX_DEPTH)
    }
    const badge = c.state === 'waiting' && badges
    s.badge.setVisible(badge)
    if (badge) {
      const key = `svc-${c.service}`
      if (s.badge.texture.key !== key) s.badge.setTexture(key)
      s.badge.setPosition(p.x, p.y + BADGE_BOTTOM)
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
