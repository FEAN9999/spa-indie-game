import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { GAME_H, GAME_W } from '../config'
import type { SpaSim } from '../sim/spa'
import { formatMoney } from '../strings/format'
import { t, type StringKey } from '../strings/vi'
import { textStyle } from './text'

const DEPTH = 10000
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

const NAV: { key: StringKey; icon: string }[] = [
  { key: 'navBuild', icon: 'icon-build' },
  { key: 'navStaff', icon: 'icon-staff' },
  { key: 'navServices', icon: 'icon-services' },
  { key: 'navQuests', icon: 'icon-quests' },
]

/** Top bar, pause overlay, bottom nav, first-customer hint and toasts. Every element swallows its taps. */
export class Hud {
  private readonly money: Phaser.GameObjects.Text
  private readonly rating: Phaser.GameObjects.Text
  private readonly dayTime: Phaser.GameObjects.Text
  private readonly overlay: Phaser.GameObjects.Container
  private readonly hint: Phaser.GameObjects.Container
  private toastBox: Phaser.GameObjects.Container | null = null

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly sim: SpaSim,
  ) {
    const add = scene.add

    // top bar
    add
      .graphics()
      .setDepth(DEPTH)
      .fillStyle(hex(C.paper), 1)
      .fillRoundedRect(24, 40, GAME_W - 48, 110, 55)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(24, 40, GAME_W - 48, 110, 55)
    add.zone(24, 40, GAME_W - 48, 110).setOrigin(0).setInteractive().setDepth(DEPTH)
    add.image(95, 95, 'coin').setScale(1.15).setDepth(DEPTH)
    this.money = add.text(135, 95, '', textStyle(44)).setOrigin(0, 0.5).setDepth(DEPTH)
    add.image(460, 95, 'star').setScale(0.42).setDepth(DEPTH)
    this.rating = add.text(495, 95, '', textStyle(36)).setOrigin(0, 0.5).setDepth(DEPTH)
    this.dayTime = add.text(935, 95, '', textStyle(32, '600')).setOrigin(1, 0.5).setDepth(DEPTH)

    const pause = add.container(995, 95).setDepth(DEPTH)
    pause.add(add.circle(0, 0, 40, hex(C.teal)).setStrokeStyle(4, hex(C.ink)))
    pause.add(add.rectangle(-10, 0, 9, 32, hex(C.paper)).setOrigin(0.5))
    pause.add(add.rectangle(10, 0, 9, 32, hex(C.paper)).setOrigin(0.5))
    // thumb-sized hit area, larger than the drawn circle
    pause.setSize(130, 130).setInteractive().on('pointerup', () => this.setPaused(true))

    // pause overlay
    this.overlay = add.container(0, 0).setDepth(DEPTH + 100).setVisible(false)
    this.overlay.add(add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive())
    this.overlay.add(add.text(GAME_W / 2, GAME_H / 2 - 50, t('paused'), textStyle(96, '800', C.paper)).setOrigin(0.5))
    this.overlay.add(add.text(GAME_W / 2, GAME_H / 2 + 60, t('tapToResume'), textStyle(48, '600', C.paper)).setOrigin(0.5))
    this.overlay.list[0].on('pointerup', () => this.setPaused(false))

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
    this.hint = add.container(GAME_W / 2, 1880, [hintBg, hintText]).setDepth(DEPTH)
    scene.tweens.add({ targets: this.hint, y: 1870, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
  }

  update(): void {
    this.money.setText(formatMoney(this.sim.money))
    const r = this.sim.rating()
    this.rating.setText(r === null ? t('noRating') : r.toFixed(1))
    this.dayTime.setText(`${t('dayLabel', { day: this.sim.day })} · ${this.sim.clock.label()}`)
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

  private setPaused(paused: boolean): void {
    this.sim.paused = paused
    this.overlay.setVisible(paused)
  }
}
