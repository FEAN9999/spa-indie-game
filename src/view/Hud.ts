import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { GAME_W, UNLOCK_DAY } from '../config'
import type { SpaSim } from '../sim/spa'
import { isUnlocked, type Feature } from '../sim/unlocks'
import { formatMoney } from '../strings/format'
import { t, type StringKey } from '../strings/vi'
import { textStyle } from './text'
import { layoutTopBar, TOP_BAR } from './topBar'

export const DEPTH = 10000
const BANNER_Y = 300
const BANNER_H = 110
const BANNER_TEXT_W = 900
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

/** Each button opens with its feature's day; one without a feature is never locked. */
const NAV: { key: StringKey; icon: string; feature?: Feature }[] = [
  { key: 'navBuild', icon: 'icon-build', feature: 'build' },
  { key: 'navStaff', icon: 'icon-staff', feature: 'staff' },
  { key: 'navServices', icon: 'icon-services', feature: 'services' },
  { key: 'navQuests', icon: 'icon-quests' },
]
const LOCKED_ALPHA = 0.45

interface NavPlate {
  feature?: Feature
  icon: Phaser.GameObjects.Image
  label: Phaser.GameObjects.Text
  lock: Phaser.GameObjects.Image
}

/** Top bar, pause button, bottom nav and toasts. Every element swallows its taps. */
export class Hud {
  private readonly money: Phaser.GameObjects.Text
  private readonly star: Phaser.GameObjects.Image
  private readonly rating: Phaser.GameObjects.Text
  private readonly dayTime: Phaser.GameObjects.Text
  private readonly plates: NavPlate[] = []
  private toastBox: Phaser.GameObjects.Container | null = null

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly sim: SpaSim,
    onPause: () => void,
  ) {
    const add = scene.add

    // top bar on two rows: money, star and rating, then the day and time; it ends above the room (MAP_Y 210)
    add
      .graphics()
      .setDepth(DEPTH)
      .fillStyle(hex(C.paper), 1)
      .fillRoundedRect(24, 30, GAME_W - 48, 170, 52)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(24, 30, GAME_W - 48, 170, 52)
    add.zone(24, 30, GAME_W - 48, 170).setOrigin(0).setInteractive().setDepth(DEPTH)
    add.image(95, 84, 'coin').setScale(1.25).setDepth(DEPTH)
    // star and rating x are set each frame by layoutTopBar
    this.money = add.text(TOP_BAR.moneyX, 84, '', textStyle(52)).setOrigin(0, 0.5).setDepth(DEPTH)
    this.star = add.image(0, 84, 'star').setScale(0.5).setDepth(DEPTH)
    this.rating = add.text(0, 84, '', textStyle(44)).setOrigin(0, 0.5).setDepth(DEPTH)
    this.dayTime = add.text(TOP_BAR.moneyX, 152, '', textStyle(40, '600')).setOrigin(0, 0.5).setDepth(DEPTH)

    const pause = add.container(995, 115).setDepth(DEPTH)
    pause.add(add.circle(0, 0, 44, hex(C.teal)).setStrokeStyle(4, hex(C.ink)))
    pause.add(add.rectangle(-11, 0, 10, 35, hex(C.paper)).setOrigin(0.5))
    pause.add(add.rectangle(11, 0, 10, 35, hex(C.paper)).setOrigin(0.5))
    // thumb-sized hit area, larger than the drawn circle
    pause.setSize(130, 130).setInteractive().on('pointerup', onPause)

    // bottom bar
    add
      .graphics()
      .setDepth(DEPTH)
      .fillStyle(hex(C.paper), 1)
      .fillRoundedRect(0, 1940, GAME_W, 260, 48)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(0, 1940, GAME_W, 260, 48)
    add.zone(0, 1940, GAME_W, 220).setOrigin(0).setInteractive().setDepth(DEPTH)
    NAV.forEach((n, i) => {
      const x = 135 + i * 270
      const btn = add.container(x, 2020).setDepth(DEPTH)
      // a blue-and-white plate: cobalt double ring
      btn.add(add.circle(0, 0, 62, hex(C.cream)).setStrokeStyle(5, hex(C.cobalt)))
      btn.add(add.circle(0, 0, 52).setStrokeStyle(2, hex(C.cobalt)))
      const icon = add.image(0, 0, n.icon).setScale(1.3)
      // a padlock on the plate's top-right while the feature waits for its day
      const lock = add.image(44, -44, 'icon-lock')
      btn.add([icon, lock])
      const label = add.text(x, 2112, t(n.key), textStyle(34, '600')).setOrigin(0.5).setDepth(DEPTH)
      const feature = n.feature
      btn.setSize(130, 130).setInteractive().on('pointerup', () => {
        if (feature && !isUnlocked(feature, this.sim.day)) this.toast(t('unlocksOn', { day: UNLOCK_DAY[feature] }))
        else this.toast(t('comingSoon'))
      })
      this.plates.push({ feature, icon, label, lock })
    })
  }

  /** Where the star sits now; it moves right when the money grows long. */
  get starX(): number {
    return this.star.x
  }

  update(): void {
    this.money.setText(formatMoney(this.sim.money))
    const r = this.sim.rating()
    this.rating.setText(r === null ? t('noRating') : r.toFixed(1))
    this.dayTime.setText(`${t('dayLabel', { day: this.sim.day })} · ${this.sim.clock.label()}`)
    const row = layoutTopBar(this.money.width, this.rating.width)
    this.money.setScale(row.moneyScale)
    this.star.x = row.starX
    this.rating.x = row.ratingX
    // checked every frame, so a new day opens its buttons at once
    for (const p of this.plates) {
      const locked = p.feature !== undefined && !isUnlocked(p.feature, this.sim.day)
      p.icon.setAlpha(locked ? LOCKED_ALPHA : 1)
      p.label.setAlpha(locked ? LOCKED_ALPHA : 1)
      p.lock.setVisible(locked)
    }
  }

  /** A card under the top bar that slides in, stays 2 seconds and fades out. */
  banner(text: string): void {
    const label = this.scene.add.text(0, 0, text, textStyle(46)).setOrigin(0.5)
    if (label.width > BANNER_TEXT_W) label.setScale(BANNER_TEXT_W / label.width)
    const w = label.displayWidth + 80
    const bg = this.scene.add
      .graphics()
      .fillStyle(hex(C.paper), 1)
      .fillRoundedRect(-w / 2, -BANNER_H / 2, w, BANNER_H, BANNER_H / 2)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(-w / 2, -BANNER_H / 2, w, BANNER_H, BANNER_H / 2)
    const box = this.scene.add.container(GAME_W / 2, BANNER_Y - 40, [bg, label]).setDepth(DEPTH + 60).setAlpha(0)
    this.scene.tweens.chain({
      targets: box,
      tweens: [
        { y: BANNER_Y, alpha: 1, duration: 250, ease: 'Cubic.easeOut' },
        { alpha: 0, delay: 2000, duration: 250 },
      ],
      onComplete: () => box.destroy(),
    })
  }

  toast(text: string): void {
    this.toastBox?.destroy()
    const label = this.scene.add.text(0, 0, text, textStyle(40, '600', C.paper)).setOrigin(0.5)
    const bg = this.scene.add.graphics().fillStyle(hex(C.ink), 0.92).fillRoundedRect(-label.width / 2 - 40, -40, label.width + 80, 80, 40)
    const box = this.scene.add.container(GAME_W / 2, 1790, [bg, label]).setDepth(DEPTH + 50).setAlpha(0)
    this.toastBox = box
    this.scene.tweens.chain({
      targets: box,
      tweens: [
        { alpha: 1, duration: 150 },
        { alpha: 0, delay: 1700, duration: 150 },
      ],
      onComplete: () => {
        box.destroy()
        if (this.toastBox === box) this.toastBox = null
      },
    })
  }
}
