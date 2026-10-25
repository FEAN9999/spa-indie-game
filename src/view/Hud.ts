import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { GAME_W } from '../config'
import type { SpaSim } from '../sim/spa'
import { formatMoney } from '../strings/format'
import { t, type StringKey } from '../strings/vi'
import { textStyle } from './text'
import { layoutTopBar, TOP_BAR } from './topBar'

const DEPTH = 10000
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

const NAV: { key: StringKey; icon: string }[] = [
  { key: 'navBuild', icon: 'icon-build' },
  { key: 'navStaff', icon: 'icon-staff' },
  { key: 'navServices', icon: 'icon-services' },
  { key: 'navQuests', icon: 'icon-quests' },
]

/** Top bar, pause button, bottom nav, first-customer hint and toasts. Every element swallows its taps. */
export class Hud {
  private readonly money: Phaser.GameObjects.Text
  private readonly star: Phaser.GameObjects.Image
  private readonly rating: Phaser.GameObjects.Text
  private readonly dayTime: Phaser.GameObjects.Text
  private readonly hint: Phaser.GameObjects.Container
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
      btn.add(add.image(0, 0, n.icon).setScale(1.3))
      btn.setSize(130, 130).setInteractive().on('pointerup', () => this.toast(t('comingSoon')))
      add.text(x, 2112, t(n.key), textStyle(34, '600')).setOrigin(0.5).setDepth(DEPTH)
    })

    // first-customer hint
    const hintText = add.text(0, 0, t('hintFirstCustomer'), textStyle(38, '600')).setOrigin(0.5)
    const hintBg = add
      .graphics()
      .fillStyle(hex(C.paper), 1)
      .fillRoundedRect(-hintText.width / 2 - 36, -38, hintText.width + 72, 76, 12)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(-hintText.width / 2 - 36, -38, hintText.width + 72, 76, 12)
    // only until the first service ever, not again on a reopened shop
    this.hint = add.container(GAME_W / 2, 1880, [hintBg, hintText]).setDepth(DEPTH).setVisible(sim.day === 1 && sim.stats.served === 0)
    scene.tweens.add({ targets: this.hint, y: 1870, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
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
  }

  hideHint(): void {
    this.hint.setVisible(false)
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
