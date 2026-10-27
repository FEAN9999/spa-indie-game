import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { GAME_W, STEAM_LIMIT_MS, STEAM_NEED } from '../config'
import type { Stars } from '../sim/economy'
import { createRng } from '../sim/rng'
import { SteamGame, type Falling, type SteamThing } from '../sim/steam'
import { INGREDIENT_NAME, t } from '../strings/vi'
import { addMiniGameCard, drawBars, revealStars, type MiniGameData, setInstruction } from '../view/miniGame'
import { textStyle } from '../view/text'

/** Where a falling thing's icon centre runs on the card: the rules' x 0..1 across, y 0..1 from under the progress bar down to the pot. */
const FIELD = { left: 170, right: 910, top: 540, bottom: 1470 }
/** The ingredient art is drawn at 156 px; it falls a little smaller, with its name under it. */
const ICON_PX = 130
const LABEL = { dy: 88, size: 38, stroke: 10 }
/** The tap box round an icon centre: wider than the icon, and down over the name. */
const HIT = { halfW: 85, top: -85, bottom: 120 }
/** The pot at the card's foot, its bottom just over the time bar; a caught thing drops into its leaves. */
const POT = { x: GAME_W / 2, bottom: 1592, scale: 2, mouthY: 1462, bumpScale: 1.06, bumpMs: 90 }
/** Things drift side to side as they fall, and fade in and out over this share of the fall at each end. */
const SWAY = { px: 14, perMs: 1 / 450 }
const FADE = 0.08
const FLY = { ms: 380, scale: 0.35 }
const WRONG = { y: 495, size: 40, stroke: 10, showMs: 900, fadeMs: 250 }
const DEMO = { alpha: 0.6, hoverPx: 50, dipMs: 160, holdMs: 120, pauseMs: 500, pressScale: 0.92 }
const DEPTH = { thing: 5, flying: 6, wrong: 10, hand: 20 }

interface Shown {
  box: Phaser.GameObjects.Container
  thing: SteamThing
  good: boolean
}

/** Close-up Xông lá mini-game over the frozen spa: leaves fall towards the pot, and the three of the recipe are tapped into it. */
export class SteamScene extends Phaser.Scene {
  private params!: MiniGameData
  private rules!: SteamGame
  /** Each falling thing on screen, by its id, in the order they fell. */
  private things = new Map<number, Shown>()
  private pot!: Phaser.GameObjects.Image
  private wrong!: Phaser.GameObjects.Text
  private instruction!: Phaser.GameObjects.Text
  private bars!: Phaser.GameObjects.Graphics
  private revealed = false
  /** The faint hand tapping the first good thing until the first touch, and how far into its tap it is. */
  private demoHand: Phaser.GameObjects.Image | null = null
  private press = { k: 0 }

  constructor() {
    super('SteamScene')
  }

  init(data: MiniGameData) {
    this.params = data
  }

  create() {
    // the leaf game takes no day-ease time
    this.rules = new SteamGame(createRng(Date.now()), this.params.hard)
    this.things = new Map()
    this.revealed = false
    this.demoHand = null
    this.press = { k: 0 }

    this.instruction = addMiniGameCard(this, t('steamTap'))
    this.pot = this.add.image(POT.x, POT.bottom, 'st-pot').setOrigin(0.5, 1).setScale(POT.scale)
    this.wrong = this.add
      .text(GAME_W / 2, WRONG.y, '', textStyle(WRONG.size, '800', C.lantern))
      .setOrigin(0.5)
      .setStroke(C.cream, WRONG.stroke)
      .setDepth(DEPTH.wrong)
      .setAlpha(0)
    this.bars = this.add.graphics()
    if (this.params.demo) this.showDemo()

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onDown(p))
  }

  update(time: number, delta: number) {
    if (this.revealed) return
    this.rules.tick(delta)
    // the rules still list what fell on the last tick; a finished game draws none of it
    if (this.rules.phase === 'done') {
      this.reveal(this.rules.stars() ?? 1)
      return
    }
    this.drawThings(this.rules.falling(), time)
    this.moveDemo()
    drawBars(this.bars, this.rules.got / STEAM_NEED, this.timeLeft())
  }

  /** Dev builds only: jump to the star reveal so headless checks can finish a service. */
  __finishForTest(stars: Stars): void {
    if (!import.meta.env.DEV || this.revealed) return
    this.reveal(stars)
  }

  private drawThings(falling: Falling[], time: number): void {
    const ids = new Set<number>()
    for (const f of falling) {
      ids.add(f.id)
      const { box } = this.things.get(f.id) ?? this.addThing(f)
      const sway = Math.sin(f.id + time * SWAY.perMs) * SWAY.px
      box.setPosition(Phaser.Math.Linear(FIELD.left, FIELD.right, f.x) + sway, Phaser.Math.Linear(FIELD.top, FIELD.bottom, f.y))
      box.setAlpha(Math.min(1, f.y / FADE, (1 - f.y) / FADE))
    }
    // what reached the bottom is gone
    for (const [id, s] of this.things) {
      if (ids.has(id)) continue
      s.box.destroy()
      this.things.delete(id)
    }
  }

  private addThing(f: Falling): Shown {
    const icon = this.add.image(0, 0, `ing-${f.thing}`).setDisplaySize(ICON_PX, ICON_PX)
    const label = this.add.text(0, LABEL.dy, INGREDIENT_NAME[f.thing], textStyle(LABEL.size)).setOrigin(0.5).setStroke(C.cream, LABEL.stroke)
    const shown = { box: this.add.container(0, 0, [icon, label]).setDepth(DEPTH.thing), thing: f.thing, good: f.good }
    this.things.set(f.id, shown)
    return shown
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (this.revealed) return
    this.hideDemo()
    // the latest to fall is drawn on top, so it takes the tap
    const hit = [...this.things].reverse().find(([, s]) => {
      const dy = p.y - s.box.y
      return Math.abs(p.x - s.box.x) <= HIT.halfW && dy >= HIT.top && dy <= HIT.bottom
    })
    if (!hit) return
    const [id, shown] = hit
    const result = this.rules.tap(id)
    if (!result) return
    this.things.delete(id)
    if (result === 'good') this.dropInPot(shown.box)
    else this.showWrong(shown)
  }

  /** A caught thing shrinks into the pot's leaves, and the pot bobs as it lands. */
  private dropInPot(box: Phaser.GameObjects.Container): void {
    box.setDepth(DEPTH.flying).setAlpha(1)
    this.tweens.add({
      targets: box,
      x: POT.x,
      y: POT.mouthY,
      scale: FLY.scale,
      alpha: { value: 0, ease: 'Cubic.easeIn' },
      duration: FLY.ms,
      ease: 'Quad.easeIn',
      onComplete: () => {
        box.destroy()
        this.tweens.killTweensOf(this.pot)
        this.pot.setScale(POT.scale)
        this.tweens.add({ targets: this.pot, scale: POT.scale * POT.bumpScale, duration: POT.bumpMs, yoyo: true, ease: 'Sine.easeOut' })
      },
    })
  }

  /** A wrong thing fades where it was tapped, and a red line says it is not in the recipe. */
  private showWrong(shown: Shown): void {
    this.tweens.add({ targets: shown.box, alpha: 0, duration: WRONG.fadeMs, onComplete: () => shown.box.destroy() })
    this.tweens.killTweensOf(this.wrong)
    this.wrong.setText(t('steamWrong', { name: INGREDIENT_NAME[shown.thing] })).setAlpha(1)
    this.tweens.add({ targets: this.wrong, alpha: 0, delay: WRONG.showMs, duration: WRONG.fadeMs })
  }

  /** The hand dips onto its target over and over; `moveDemo` keeps it over the first good thing still falling. */
  private showDemo(): void {
    // the fingertip is at the bottom centre of the texture
    this.demoHand = this.add.image(0, 0, 'hand').setOrigin(0.5, 1).setAlpha(DEMO.alpha).setDepth(DEPTH.hand).setVisible(false)
    this.tweens.add({ targets: this.press, k: 1, duration: DEMO.dipMs, yoyo: true, hold: DEMO.holdMs, repeat: -1, repeatDelay: DEMO.pauseMs, ease: 'Quad.easeIn' })
  }

  private moveDemo(): void {
    if (!this.demoHand) return
    const target = [...this.things.values()].find(s => s.good)
    this.demoHand.setVisible(target !== undefined)
    if (!target) return
    const k = this.press.k
    this.demoHand.setPosition(target.box.x, target.box.y - DEMO.hoverPx * (1 - k)).setScale(Phaser.Math.Linear(1, DEMO.pressScale, k))
  }

  private hideDemo(): void {
    if (!this.demoHand) return
    this.tweens.killTweensOf(this.press)
    this.demoHand.destroy()
    this.demoHand = null
  }

  private reveal(stars: Stars): void {
    this.revealed = true
    this.hideDemo()
    for (const s of this.things.values()) s.box.destroy()
    this.things.clear()
    setInstruction(this.instruction, t('shampooDone'))
    drawBars(this.bars, this.rules.got / STEAM_NEED, this.timeLeft())
    revealStars(this, stars, () => {
      this.params.onDone(stars)
      this.scene.stop()
    })
  }

  private timeLeft(): number {
    return Math.max(0, 1 - this.rules.elapsedMs / STEAM_LIMIT_MS)
  }
}
