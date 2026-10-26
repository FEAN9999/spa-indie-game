import * as Phaser from 'phaser'
import { C, staffColors } from '../art/palette'
import type { SpaSim } from '../sim/spa'
import type { Staff } from '../sim/staff'
import type { SimEvent } from '../sim/types'
import { t } from '../strings/vi'
import { CHARACTER_HEIGHT_PX, CharacterView } from './CharacterView'
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
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

interface StaffSprite {
  view: CharacterView
  bar: Phaser.GameObjects.Graphics
  cup: Phaser.GameObjects.Image
  pill: Phaser.GameObjects.Container | null
}

/** One chibi per staff member: a tea cup over a resting head, a work bar while serving, the receptionist's greeting and a level-up burst. */
export class StaffLayer {
  private readonly sprites = new Map<number, StaffSprite>()
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
      sp.pill?.destroy()
      this.sprites.delete(id)
    }
    for (const s of sim.staff) this.sync(sim, s, this.sprites.get(s.id) ?? this.add(s), dt)
  }

  handle(e: SimEvent): void {
    if (e.type === 'greeted') this.greet(e.staffId)
    else if (e.type === 'levelUp') this.levelUp(e.staffId)
  }

  private add(s: Staff): StaffSprite {
    const sp: StaffSprite = {
      view: new CharacterView(this.scene, staffColors(s.look)),
      bar: this.scene.add.graphics().setDepth(FX_DEPTH),
      cup: this.scene.add.image(0, 0, 'tea-cup').setOrigin(0.5, 1).setDepth(FX_DEPTH).setVisible(false),
      pill: null,
    }
    this.sprites.set(s.id, sp)
    return sp
  }

  private sync(sim: SpaSim, s: Staff, sp: StaffSprite, dt: number): void {
    const at = this.room.tileToWorld(s.pos)
    const task = s.task
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

    sp.pill?.setPosition(at.x, at.y + HEAD_TOP)
  }

  /** A "Xin chào!" pill over the receptionist's head for a moment; it follows them if they walk off. */
  private greet(staffId: number): void {
    const sp = this.sprites.get(staffId)
    if (!sp) return
    const label = this.scene.add.text(0, -PILL_H / 2, t('staffGreet'), textStyle(30, '800')).setOrigin(0.5)
    const w = label.width + 44
    const bg = this.scene.add
      .graphics()
      .fillStyle(hex(C.cream), 1)
      .fillRoundedRect(-w / 2, -PILL_H, w, PILL_H, PILL_H / 2)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(-w / 2, -PILL_H, w, PILL_H, PILL_H / 2)
    sp.pill?.destroy()
    const { x, y } = sp.view.container
    const pill = this.scene.add
      .container(x, y + HEAD_TOP, [bg, label])
      // over a level-up's sparks, which come with a greeting
      .setDepth(FX_DEPTH + 20)
      .setScale(0)
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

  /** Sparks burst from the head while "Lên cấp!" rises and fades. */
  private levelUp(staffId: number): void {
    const sp = this.sprites.get(staffId)
    if (!sp) return
    const { x, y: feet } = sp.view.container
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
      .text(x, feet + HEAD_TOP - PILL_H - 8, t('levelUp'), { ...textStyle(46), stroke: C.cream, strokeThickness: 10 })
      .setOrigin(0.5, 1)
      .setDepth(FX_DEPTH + 10)
    this.scene.tweens.add({ targets: label, y: label.y - 80, duration: LEVEL_UP_MS, ease: 'Cubic.easeOut' })
    this.scene.tweens.add({ targets: label, alpha: 0, duration: LEVEL_UP_MS, ease: 'Cubic.easeIn', onComplete: () => label.destroy() })
  }
}
