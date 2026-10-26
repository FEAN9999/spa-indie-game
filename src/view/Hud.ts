import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { GAME_W, UNLOCK_DAY } from '../config'
import type { SpaSim } from '../sim/spa'
import type { HintId } from '../sim/types'
import { isUnlocked, type Feature } from '../sim/unlocks'
import { formatMoney } from '../strings/format'
import { t, type StringKey } from '../strings/vi'
import { textStyle } from './text'
import { layoutTopBar, TOP_BAR } from './topBar'
import { addToast } from './ui'

export const DEPTH = 10000
const BANNER_Y = 300
const BANNER_H = 110
const BANNER_TEXT_W = 900
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const NAV_Y = 2020
const PLATE_R = 62
/** Radius of the red low-stock dot: about 30 px across with its outline. */
const DOT_R = 13
const navX = (i: number) => 135 + i * 270
/** The top of the build button's plate, where the hand points. */
export const BUILD_PLATE_TOP = { x: navX(0), y: NAV_Y - PLATE_R }
/** The top of the staff button's plate, where the hand points. */
export const STAFF_PLATE_TOP = { x: navX(1), y: NAV_Y - PLATE_R }
/** The top of the services button's plate, where the hand points. */
export const SERVICES_PLATE_TOP = { x: navX(2), y: NAV_Y - PLATE_R }

/** Each button opens with its feature's day; one without a feature is never locked. A button with a hint wears "Mới" until that hint is done; `later` is a second hint of a feature that opens on a later day. */
const NAV: { key: StringKey; icon: string; feature?: Feature; hint?: HintId; later?: { feature: Feature; hint: HintId } }[] = [
  { key: 'navBuild', icon: 'icon-build', feature: 'build', hint: 'openBuild' },
  { key: 'navStaff', icon: 'icon-staff', feature: 'staff', hint: 'openStaff' },
  { key: 'navServices', icon: 'icon-services', feature: 'services', hint: 'openServices', later: { feature: 'stock', hint: 'openStock' } },
  { key: 'navQuests', icon: 'icon-quests' },
]
const LOCKED_ALPHA = 0.45

interface NavPlate {
  feature?: Feature
  hint?: HintId
  later?: { feature: Feature; hint: HintId }
  icon: Phaser.GameObjects.Image
  label: Phaser.GameObjects.Text
  lock: Phaser.GameObjects.Image
  badge: Phaser.GameObjects.Container | null
  /** The services plate's red dot while something runs low. */
  dot: Phaser.GameObjects.Arc | null
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
    onBuild: () => void,
    onStaff: () => void,
    onServices: () => void,
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
      const x = navX(i)
      const btn = add.container(x, NAV_Y).setDepth(DEPTH)
      // a blue-and-white plate: cobalt double ring
      btn.add(add.circle(0, 0, PLATE_R, hex(C.cream)).setStrokeStyle(5, hex(C.cobalt)))
      btn.add(add.circle(0, 0, 52).setStrokeStyle(2, hex(C.cobalt)))
      const icon = add.image(0, 0, n.icon).setScale(1.3)
      // a padlock on the plate's top-right while the feature waits for its day
      const lock = add.image(44, -44, 'icon-lock')
      btn.add([icon, lock])
      // and a red "Mới" on its top-left once it opens, until it is first used
      const badge = n.hint ? this.badge() : null
      if (badge) btn.add(badge)
      // and, on the services plate, a red dot on the top-right while stock runs low
      const dot = n.feature === 'services' ? add.circle(44, -44, DOT_R, hex(C.lantern)).setStrokeStyle(4, hex(C.ink)) : null
      if (dot) btn.add(dot)
      const label = add.text(x, 2112, t(n.key), textStyle(34, '600')).setOrigin(0.5).setDepth(DEPTH)
      const feature = n.feature
      btn.setSize(130, 130).setInteractive().on('pointerup', () => {
        if (feature && !isUnlocked(feature, this.sim.day)) this.toast(t('unlocksOn', { day: UNLOCK_DAY[feature] }))
        else if (feature === 'build') onBuild()
        else if (feature === 'staff') onStaff()
        else if (feature === 'services') onServices()
        else this.toast(t('comingSoon'))
      })
      this.plates.push({ feature, hint: n.hint, later: n.later, icon, label, lock, badge, dot })
    })
  }

  /** Where the star sits now; it moves right when the money grows long. */
  get starX(): number {
    return this.star.x
  }

  update(): void {
    this.money.setText(formatMoney(this.sim.money))
    // red while in debt; set only on a change, since a new colour redraws the text
    const moneyColor = this.sim.money < 0 ? C.lantern : C.ink
    if (this.money.style.color !== moneyColor) this.money.setColor(moneyColor)
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
      const fresh = p.hint !== undefined && !this.sim.hintDone(p.hint)
      const freshLater = p.later !== undefined && isUnlocked(p.later.feature, this.sim.day) && !this.sim.hintDone(p.later.hint)
      p.badge?.setVisible(!locked && (fresh || freshLater))
      p.dot?.setVisible(!locked && this.sim.lowStock().length > 0)
    }
  }

  /** A lantern-red pill with "Mới", centred where the lock sits mirrored. */
  private badge(): Phaser.GameObjects.Container {
    const add = this.scene.add
    const label = add.text(0, 0, t('newBadge'), textStyle(26, '800', C.paper)).setOrigin(0.5)
    const w = label.width + 28
    const pill = add
      .graphics()
      .fillStyle(hex(C.lantern), 1)
      .fillRoundedRect(-w / 2, -21, w, 42, 21)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(-w / 2, -21, w, 42, 21)
    return add.container(-44, -44, [pill, label])
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

  /** Replaces the toast on screen, if any; destroying one that already faded does nothing. */
  toast(text: string): void {
    this.toastBox?.destroy()
    this.toastBox = addToast(this.scene, GAME_W / 2, 1790, text).setDepth(DEPTH + 50)
  }
}
