import * as Phaser from 'phaser'
import { C, staffColors } from '../art/palette'
import { TILE } from '../config'
import type { SpaSim } from '../sim/spa'
import type { Staff } from '../sim/staff'
import type { SimEvent } from '../sim/types'
import { t } from '../strings/vi'
import { CHARACTER_HEIGHT_PX, CharacterView } from './CharacterView'
import { climbPose } from './floors'
import type { RoomView } from './RoomView'
import { textStyle } from './text'

/** SpaScene's effects depth, over every character. */
const FX_DEPTH = 9000
/** Where things above a head rest, from the feet. */
const HEAD_TOP = -CHARACTER_HEIGHT_PX - 10
/** The middle of the head, from the feet, where a level-up bursts. */
const HEAD_MID = -CHARACTER_HEIGHT_PX * 0.7
const CUP_BOB_PX = 5
const CUP_BOB_MS = 1600
const BAR_W = 72
const PILL_H = 56
const GREET_MS = 1500
const POP_MS = 200
const SPARKS = 10
const SPARK_TINTS = [C.mustard, C.lotus, C.teal]
const SPARK_MS = 700
const LEVEL_UP_MS = 1200
const SWEAT_MS = 1000
const COIN_SCALE = 1.3
const COIN_HOP_PX = 12
const SWEAT_SIDE_PX = 44
const CHAT_TEXT = '…'
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

/** A deft technician waiting out their late start: no one stands there yet. */
const isHidden = (sim: SpaSim, s: Staff): boolean => s.task?.kind === 'late' && sim.clock.minutes < s.task.untilMinute

interface StaffSprite {
  view: CharacterView
  bar: Phaser.GameObjects.Graphics
  cup: Phaser.GameObjects.Image
  clock: Phaser.GameObjects.Image
  /** The "…" over someone chatting; never shown with a greeting. */
  chat: Phaser.GameObjects.Container | null
  sweat: Phaser.GameObjects.Image | null
  pill: Phaser.GameObjects.Container | null
}

/** One chibi per staff member: a tea cup over a resting head, a work bar while serving, the receptionist's greeting and a level-up burst. */
export class StaffLayer {
  private readonly sprites = new Map<number, StaffSprite>()
  /** A celebration that came while the person was not in yet, played when they walk in. */
  private readonly pendingCelebration = new Map<number, string>()
  /** Runs only while the shop does, so the cup's bob stops with it. */
  private clockMs = 0

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly room: RoomView,
  ) {}

  update(sim: SpaSim, dt: number): void {
    this.clockMs += dt
    const ids = new Set(sim.staff.map(s => s.id))
    for (const [id, sp] of this.sprites) {
      if (ids.has(id)) continue
      sp.view.container.destroy()
      sp.bar.destroy()
      sp.cup.destroy()
      sp.clock.destroy()
      sp.chat?.destroy()
      sp.sweat?.destroy()
      sp.pill?.destroy()
      this.sprites.delete(id)
      this.pendingCelebration.delete(id)
    }
    for (const s of sim.staff) this.sync(sim, s, this.sprites.get(s.id) ?? this.add(s), dt)
  }

  /** `sim` gives where people stand now: morning events come before the sprites have caught up. */
  handle(e: SimEvent, sim: SpaSim): void {
    if (e.type === 'greeted') this.greet(e.staffId)
    else if (e.type === 'levelUp') {
      this.celebrate(sim, e.staffId, t('levelUp'))
      if (sim.staff.find(s => s.id === e.staffId)?.trait === 'studious') this.coin(sim, e.staffId)
    } else if (e.type === 'sloppy') this.sweat(e.staffId)
    else if (e.type === 'studied') this.celebrate(sim, e.staffId, t('studiedPill'))
  }

  private add(s: Staff): StaffSprite {
    const sp: StaffSprite = {
      view: new CharacterView(this.scene, staffColors(s.look)),
      bar: this.scene.add.graphics().setDepth(FX_DEPTH),
      cup: this.scene.add.image(0, 0, 'tea-cup').setOrigin(0.5, 1).setDepth(FX_DEPTH).setVisible(false),
      clock: this.scene.add.image(0, 0, 'icon-clock').setOrigin(0.5, 1).setDepth(FX_DEPTH).setVisible(false),
      chat: null,
      sweat: null,
      pill: null,
    }
    this.sprites.set(s.id, sp)
    return sp
  }

  private sync(sim: SpaSim, s: Staff, sp: StaffSprite, dt: number): void {
    const at = this.room.tileToWorld(s.pos)
    const task = s.task
    // on the stairs, they rise toward the next floor and fade, here on the floor they are leaving
    const climb = climbPose(s)
    if (climb) at.y -= climb.lift * TILE
    if (!this.room.onFloor(s.pos.y) && !isHidden(sim, s)) {
      // on another floor: out of sight, with whatever is over their head
      sp.view.container.setVisible(false)
      sp.bar.clear()
      sp.cup.setVisible(false)
      sp.clock.setVisible(false)
      sp.chat?.setVisible(false)
      sp.pill?.setVisible(false)
      sp.sweat?.setVisible(false)
      return
    }
    if (isHidden(sim, s)) {
      // a deft technician not in yet: nobody stands here
      sp.view.container.setVisible(false)
      sp.bar.clear()
      sp.cup.setVisible(false)
      sp.clock.setVisible(false)
      this.dropPills(sp)
      sp.sweat?.destroy()
      sp.sweat = null
      return
    }
    sp.view.container.setVisible(true).setAlpha(climb?.alpha ?? 1)
    sp.chat?.setVisible(true)
    sp.pill?.setVisible(true)
    sp.sweat?.setVisible(true)
    const pending = this.pendingCelebration.get(s.id)
    if (pending !== undefined) {
      this.pendingCelebration.delete(s.id)
      this.celebrate(sim, s.id, pending)
    }
    const still = s.path.length === 0
    // at work: face the bed beside the work tile, as the owner does
    const station = task?.kind === 'serve' && still ? sim.stations.find(x => x.id === task.stationId) : undefined
    const atWork = station !== undefined && s.pos.x === station.work.x && s.pos.y === station.work.y
    sp.view.setFacing(atWork ? (station.bed.x < station.work.x ? 'left' : 'right') : s.facing)
    sp.view.setPose(still ? 'stand' : 'walk')
    sp.view.container.setPosition(at.x, at.y).setDepth(at.y)
    sp.view.update(dt)

    const resting = task?.kind === 'rest' && still
    sp.cup.setVisible(resting)
    if (resting) sp.cup.setPosition(at.x, at.y + HEAD_TOP + CUP_BOB_PX * Math.sin((this.clockMs / CUP_BOB_MS) * Math.PI * 2))

    sp.bar.clear()
    if (task?.kind === 'serve' && still && sim.customers.find(c => c.id === task.customerId)?.state === 'inService') {
      const f = 1 - task.leftMs / task.totalMs
      const x = at.x - BAR_W / 2
      const y = at.y + HEAD_TOP - 16
      sp.bar.fillStyle(hex(C.paper), 1).fillRoundedRect(x - 4, y - 4, BAR_W + 8, 20, 10)
      sp.bar.lineStyle(3, hex(C.ink)).strokeRoundedRect(x - 4, y - 4, BAR_W + 8, 20, 10)
      sp.bar.fillStyle(hex(C.teal), 1).fillRoundedRect(x, y, Math.max(12, BAR_W * f), 12, 6)
    }

    const late = task?.kind === 'late'
    sp.clock.setVisible(late)
    if (late) sp.clock.setPosition(at.x, at.y + HEAD_TOP + CUP_BOB_PX * Math.sin((this.clockMs / CUP_BOB_MS) * Math.PI * 2))

    // the chat pill waits while a greeting pill is up, so two never stack
    if (task?.kind === 'chat' && !sp.pill) sp.chat ??= this.makePill(CHAT_TEXT, at.x, at.y + HEAD_TOP)
    else if (sp.chat) {
      sp.chat.destroy()
      sp.chat = null
    }
    sp.chat?.setPosition(at.x, at.y + HEAD_TOP)
    sp.pill?.setPosition(at.x, at.y + HEAD_TOP)
    sp.sweat?.setPosition(at.x + SWEAT_SIDE_PX, at.y + HEAD_TOP)
  }

  private dropPills(sp: StaffSprite): void {
    sp.pill?.destroy()
    sp.pill = null
    sp.chat?.destroy()
    sp.chat = null
  }

  private makePill(text: string, x: number, y: number): Phaser.GameObjects.Container {
    const label = this.scene.add.text(0, -PILL_H / 2, text, textStyle(30, '800')).setOrigin(0.5)
    const w = Math.max(label.width + 44, PILL_H)
    const bg = this.scene.add
      .graphics()
      .fillStyle(hex(C.cream), 1)
      .fillRoundedRect(-w / 2, -PILL_H, w, PILL_H, PILL_H / 2)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(-w / 2, -PILL_H, w, PILL_H, PILL_H / 2)
    // over a level-up's sparks, which come with a greeting
    return this.scene.add.container(x, y, [bg, label]).setDepth(FX_DEPTH + 20)
  }

  /** A sweat drop pops in beside the head and fades; it follows them. */
  private sweat(staffId: number): void {
    const sp = this.sprites.get(staffId)
    if (!sp || !sp.view.container.visible) return
    sp.sweat?.destroy()
    const { x, y } = sp.view.container
    const drop = this.scene.add.image(x + SWEAT_SIDE_PX, y + HEAD_TOP, 'icon-sweat').setOrigin(0.5, 1).setDepth(FX_DEPTH + 20).setScale(0)
    sp.sweat = drop
    this.scene.tweens.chain({
      targets: drop,
      tweens: [
        { scale: 1, duration: POP_MS, ease: 'Back.easeOut' },
        { alpha: 0, delay: SWEAT_MS - 2 * POP_MS, duration: POP_MS },
      ],
      onComplete: () => {
        drop.destroy()
        if (sp.sweat === drop) sp.sweat = null
      },
    })
  }

  /** A studious person's level-up: a coin pops over the head, hops and fades. */
  private coin(sim: SpaSim, staffId: number): void {
    const person = sim.staff.find(s => s.id === staffId)
    if (!person || !this.sprites.has(staffId) || isHidden(sim, person) || !this.room.onFloor(person.pos.y)) return
    const { x, y: feet } = this.room.tileToWorld(person.pos)
    const top = feet + HEAD_TOP
    const coin = this.scene.add.image(x, top, 'coin').setOrigin(0.5, 1).setDepth(FX_DEPTH + 10).setScale(0)
    this.scene.tweens.add({ targets: coin, scale: COIN_SCALE, duration: POP_MS, ease: 'Back.easeOut' })
    this.scene.tweens.add({ targets: coin, y: top - COIN_HOP_PX, duration: POP_MS, yoyo: true, ease: 'Quad.easeOut' })
    this.scene.tweens.add({ targets: coin, alpha: 0, duration: LEVEL_UP_MS, ease: 'Cubic.easeIn', onComplete: () => coin.destroy() })
  }

  /** A "Xin chào!" pill over the receptionist's head for a moment; it follows them if they walk off. */
  private greet(staffId: number): void {
    const sp = this.sprites.get(staffId)
    if (!sp) return
    if (!sp.view.container.visible) return
    sp.pill?.destroy()
    const { x, y } = sp.view.container
    const pill = this.makePill(t('staffGreet'), x, y + HEAD_TOP).setScale(0)
    sp.pill = pill
    this.scene.tweens.chain({
      targets: pill,
      tweens: [
        { scale: 1, duration: POP_MS, ease: 'Back.easeOut' },
        { alpha: 0, delay: GREET_MS - 2 * POP_MS, duration: POP_MS },
      ],
      onComplete: () => {
        pill.destroy()
        if (sp.pill === pill) sp.pill = null
      },
    })
  }

  /** Sparks burst from the head while the label ("Lên cấp!", "Giỏi lên!") rises and fades. */
  private celebrate(sim: SpaSim, staffId: number, text: string): void {
    const person = sim.staff.find(s => s.id === staffId)
    if (!person) return
    if (isHidden(sim, person)) {
      // a late technician's morning: wait until she walks in from the door
      this.pendingCelebration.set(staffId, text)
      return
    }
    if (!this.sprites.has(staffId) || !this.room.onFloor(person.pos.y)) return
    const { x, y: feet } = this.room.tileToWorld(person.pos)
    const y = feet + HEAD_MID
    for (let i = 0; i < SPARKS; i++) {
      const a = (i / SPARKS) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.25, 0.25)
      const r = Phaser.Math.Between(80, 120)
      const spark = this.scene.add
        .image(x, y, 'spark')
        .setTint(hex(SPARK_TINTS[i % SPARK_TINTS.length]))
        .setScale(2.2)
        .setDepth(FX_DEPTH + 10)
      this.scene.tweens.add({ targets: spark, x: x + r * Math.cos(a), y: y + r * Math.sin(a), scale: 1.2, duration: SPARK_MS, ease: 'Cubic.easeOut' })
      this.scene.tweens.add({ targets: spark, alpha: 0, duration: SPARK_MS, ease: 'Cubic.easeIn', onComplete: () => spark.destroy() })
    }
    // starts over where a greeting pill would be, and clear of the money rising over the bed beside
    const label = this.scene.add
      .text(x, feet + HEAD_TOP - PILL_H - 8, text, { ...textStyle(46), stroke: C.cream, strokeThickness: 10 })
      .setOrigin(0.5, 1)
      .setDepth(FX_DEPTH + 10)
    this.scene.tweens.add({ targets: label, y: label.y - 80, duration: LEVEL_UP_MS, ease: 'Cubic.easeOut' })
    this.scene.tweens.add({ targets: label, alpha: 0, duration: LEVEL_UP_MS, ease: 'Cubic.easeIn', onComplete: () => label.destroy() })
  }
}
