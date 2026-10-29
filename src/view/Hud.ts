import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { sound } from '../audio/engine'
import { GAME_W } from '../config'
import type { SpaSim } from '../sim/spa'
import type { HintId } from '../sim/types'
import { placeName } from './chain'
import { navX, type NavId } from './nav'
import type { Feature } from '../sim/unlocks'
import { formatMoney } from '../strings/format'
import { t, type StringKey } from '../strings/vi'
import { textStyle } from './text'
import { todayShown } from './today'
import { dayTimeText, layoutTopBar, TOP_BAR } from './topBar'
import { lockedText } from './starter'
import { addToast } from './ui'
import { clockStar } from './vip'

export const DEPTH = 10000
const BANNER_Y = 300
/** How long the morning banner is on screen, fades included. */
export const BANNER_MS = 2500
const BANNER_H = 110
const BANNER_TEXT_W = 900
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const NAV_Y = 2020
/** Today's line sits where the toasts go, over the floor buttons, so it never hides the shop's wall; a toast covers it while it shows. */
const TODAY = { y: 1690, h: 66, discR: 26, pad: 12, gap: 14, icon: 46 }
const PLATE_R = 62
/** Radius of the red low-stock dot: about 30 px across with its outline. */
const DOT_R = 13
/** Five plates are a little smaller, to fit the width; four are as they were. */
const plateR = (n: number) => (n === 5 ? 56 : PLATE_R)
/** The branch ribbon: its top and height; the pill is the text's width plus `pad`, with the pin at its left and the text 27 px right of centre. */
const RIBBON = { y: 198, h: 64, font: 31, pad: 90, textX: 27, textW: 860 }

/** The guest-book button, in the top bar's second row. */
export const BOOK_BUTTON = { x: 870, y: 152 }
const BOOK_R = 38

/** Each button opens with its feature's day. A button with a hint wears "Mới" until that hint is done; `later` is a second hint of a feature that opens on a later day. */
const NAV: Record<NavId, { key: StringKey; icon: string; feature?: Feature; hint?: HintId; later?: { feature: Feature; hint: HintId } }> = {
  build: { key: 'navBuild', icon: 'icon-build', feature: 'build', hint: 'openBuild' },
  staff: { key: 'navStaff', icon: 'icon-staff', feature: 'staff', hint: 'openStaff' },
  services: { key: 'navServices', icon: 'icon-services', feature: 'services', hint: 'openServices', later: { feature: 'stock', hint: 'openStock' } },
  quests: { key: 'navQuests', icon: 'icon-quests', feature: 'quests', hint: 'openQuests' },
  chain: { key: 'navChain', icon: 'icon-chain', hint: 'openChain' },
}
const LOCKED_ALPHA = 0.45

interface NavPlate {
  id: NavId
  feature?: Feature
  hint?: HintId
  later?: { feature: Feature; hint: HintId }
  icon: Phaser.GameObjects.Image
  label: Phaser.GameObjects.Text
  lock: Phaser.GameObjects.Image
  badge: Phaser.GameObjects.Container | null
  /** The red dot: on the services plate while something runs low, on the quests plate while new quests wait. */
  dot: Phaser.GameObjects.Arc | null
  /** Everything the plate is made of, to take it down when the row changes. */
  parts: Phaser.GameObjects.GameObject[]
  /** Where the hand points: the top of the plate. */
  top: { x: number; y: number }
}

/** Top bar, pause button, bottom nav and toasts. Every element swallows its taps. */
export class Hud {
  private readonly money: Phaser.GameObjects.Text
  private readonly star: Phaser.GameObjects.Image
  private readonly rating: Phaser.GameObjects.Text
  private readonly dayTime: Phaser.GameObjects.Text
  /** The gold star after the time while a VIP's booking is near. */
  private readonly clockStar: Phaser.GameObjects.Image
  private plates: NavPlate[] = []
  /** The buttons the bar was last built with. */
  private navKey = ''
  /** The branch ribbon, and the words it was drawn with. */
  private ribbon: Phaser.GameObjects.Container | null = null
  private ribbonKey = ''
  private toastBox: Phaser.GameObjects.Container | null = null
  /** When the last toast went up, in scene time. */
  lastToastAt = -Infinity
  /** When the morning banner last went up, so a badge banner waits for it to go. */
  lastBannerAt = -Infinity
  private readonly book: Phaser.GameObjects.Container
  private readonly bookBadge: Phaser.GameObjects.Container
  /** Today's line, and what it was last drawn with. */
  private readonly today: Phaser.GameObjects.Container
  private todayKey = ''

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly sim: SpaSim,
    onPause: () => void,
    private readonly onBuild: () => void,
    private readonly onStaff: () => void,
    private readonly onServices: () => void,
    onBook: () => void,
    private readonly onQuests: () => void,
    private readonly onChain: () => void,
    private readonly nav: () => NavId[],
  ) {
    const add = scene.add

    // top bar on two rows: money, star and rating, then the day, month and time; it ends above the room (MAP_Y 210)
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
    this.clockStar = add.image(0, 152, 'star').setScale(0.4).setDepth(DEPTH).setVisible(false)

    const pause = add.container(995, 115).setDepth(DEPTH)
    pause.add(add.circle(0, 0, 44, hex(C.teal)).setStrokeStyle(4, hex(C.ink)))
    pause.add(add.rectangle(-11, 0, 10, 35, hex(C.paper)).setOrigin(0.5))
    pause.add(add.rectangle(11, 0, 10, 35, hex(C.paper)).setOrigin(0.5))
    // thumb-sized hit area, larger than the drawn circle
    pause.setSize(130, 130).setInteractive().on('pointerup', () => {
      sound.play('tap')
      onPause()
    })

    this.today = add.container(GAME_W / 2, TODAY.y).setDepth(DEPTH).setVisible(false)

    // the guest book, once the first regular has come; its "Mới" stays until the book is first opened
    this.book = add.container(BOOK_BUTTON.x, BOOK_BUTTON.y).setDepth(DEPTH).setVisible(false)
    this.book.add(add.circle(0, 0, BOOK_R, hex(C.teal)).setStrokeStyle(4, hex(C.ink)))
    this.book.add(add.image(0, 0, 'icon-book').setScale(0.7))
    this.bookBadge = this.badge()
    this.bookBadge.setPosition(-BOOK_R, -BOOK_R)
    this.book.add(this.bookBadge)
    this.book.setSize(120, 110).setInteractive().on('pointerup', () => {
      sound.play('tap')
      onBook()
    })

    // bottom bar
    add
      .graphics()
      .setDepth(DEPTH)
      .fillStyle(hex(C.paper), 1)
      .fillRoundedRect(0, 1940, GAME_W, 260, 48)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(0, 1940, GAME_W, 260, 48)
    add.zone(0, 1940, GAME_W, 220).setOrigin(0).setInteractive().setDepth(DEPTH)
    this.buildNav()
  }

  /** The hand's target on the plate `id`, or null while the bar has no such button. */
  plateTop(id: NavId): { x: number; y: number } | null {
    return this.plates.find(p => p.id === id)?.top ?? null
  }

  /** Builds the plates of the bar from the buttons `nav` gives: five a little smaller, four as they were. */
  private buildNav(): void {
    const add = this.scene.add
    const ids = this.nav()
    this.navKey = ids.join()
    for (const p of this.plates) for (const o of p.parts) o.destroy()
    this.plates = []
    const n = ids.length
    const r = plateR(n)
    const step = GAME_W / n
    ids.forEach((id, i) => {
      const spec = NAV[id]
      const x = navX(i, n)
      const isChain = id === 'chain'
      const btn = add.container(x, NAV_Y).setDepth(DEPTH)
      // a blue-and-white plate: cobalt double ring; the chain's is pale gold with a mustard ring
      btn.add(add.circle(0, 0, r, hex(isChain ? C.goldPale : C.cream)).setStrokeStyle(5, hex(isChain ? C.mustardDark : C.cobalt)))
      if (!isChain) btn.add(add.circle(0, 0, r - 10).setStrokeStyle(2, hex(C.cobalt)))
      const icon = add.image(0, 0, spec.icon).setScale(n === 5 ? 1.2 : 1.3)
      // a padlock on the plate's top-right while the feature waits for its day
      const lock = add.image(r - 18, -(r - 18), 'icon-lock')
      btn.add([icon, lock])
      // and a red "Mới" on its top-left once it opens, until it is first used
      const badge = spec.hint ? this.badge() : null
      if (badge) {
        badge.setPosition(-(r - 18), -(r - 18))
        btn.add(badge)
      }
      // and, on the services and quests plates, a red dot on the top-right
      const dot = spec.feature === 'services' || spec.feature === 'quests' ? add.circle(r - 18, -(r - 18), DOT_R, hex(C.lantern)).setStrokeStyle(4, hex(C.ink)) : null
      if (dot) btn.add(dot)
      const label = add.text(x, 2112, t(spec.key), textStyle(n === 5 ? 30 : 34, '600')).setOrigin(0.5).setDepth(DEPTH)
      // a label never passes its plate's width
      if (label.width > step - 16) label.setScale((step - 16) / label.width)
      const feature = spec.feature
      btn.setSize(130, 130).setInteractive().on('pointerup', () => {
        sound.play('tap')
        if (feature && !this.isOpen(feature)) this.toast(lockedText(this.sim, feature))
        else if (id === 'build') this.onBuild()
        else if (id === 'staff') this.onStaff()
        else if (id === 'services') this.onServices()
        else if (id === 'chain') this.onChain()
        else this.onQuests()
      })
      this.plates.push({ id, feature, hint: spec.hint, later: spec.later, icon, label, lock, badge, dot, parts: [btn, label], top: { x, y: NAV_Y - r } })
    })
  }

  /** Where the star sits now; it moves right when the money grows long. */
  get starX(): number {
    return this.star.x
  }

  /** `covered` is true while a panel is open over the shop. */
  update(covered: boolean): void {
    this.money.setText(formatMoney(this.sim.money))
    // red while in debt; set only on a change, since a new colour redraws the text
    const moneyColor = this.sim.money < 0 ? C.lantern : C.ink
    if (this.money.style.color !== moneyColor) this.money.setColor(moneyColor)
    const r = this.sim.rating()
    this.rating.setText(r === null ? t('noRating') : r.toFixed(1))
    this.dayTime.setText(dayTimeText(this.sim.day, this.sim.clock.label(), this.sim.place === null))
    this.clockStar.setPosition(this.dayTime.x + this.dayTime.width + 34, 152)
    this.clockStar.setVisible(clockStar(this.sim.vip, this.sim.eventBook, this.sim.day, this.sim.clock.minutes))
    const row = layoutTopBar(this.money.width, this.rating.width)
    this.money.setScale(row.moneyScale)
    this.star.x = row.starX
    this.rating.x = row.ratingX
    // an invisible container is not hit-tested, so the book button takes no tap until a regular has come or a VIP is booked
    this.book.setVisible(this.sim.bookShown())
    this.bookBadge.setVisible(!this.sim.hintDone(this.sim.bookHint()))
    this.updateToday(covered)
    // the evening the shop reaches 3 stars, or a switch of shops, changes the buttons
    if (this.nav().join() !== this.navKey) this.buildNav()
    this.updateRibbon()
    // checked every frame, so a new day opens its buttons at once
    for (const p of this.plates) {
      const locked = p.feature !== undefined && !this.isOpen(p.feature)
      p.icon.setAlpha(locked ? LOCKED_ALPHA : 1)
      p.label.setAlpha(locked ? LOCKED_ALPHA : 1)
      p.lock.setVisible(locked)
      // the quest button shows the starter chain until the daily quests open, with a Mới of its own
      const hint = p.feature === 'quests' && !this.sim.questsOpen() ? 'openStarter' : p.hint
      const fresh = hint !== undefined && !this.sim.hintDone(hint)
      const freshLater = p.later !== undefined && this.sim.featureOpen(p.later.feature) && !this.sim.hintDone(p.later.hint)
      p.badge?.setVisible(!locked && (fresh || freshLater))
      p.dot?.setVisible(!locked && (p.feature === 'quests' ? this.sim.questsDot() : this.sim.lowStock().length > 0 || this.sim.learnable() !== null))
    }
  }

  /** At a branch, a teal ribbon under the top bar names the shop and the place; a long shop name shrinks to fit. */
  private updateRibbon(): void {
    const place = this.sim.place
    const key = place === null ? '' : `${this.sim.shopName}|${place}`
    if (key === this.ribbonKey) return
    this.ribbonKey = key
    this.ribbon?.destroy()
    this.ribbon = null
    if (place === null) return
    const add = this.scene.add
    const label = add.text(0, 0, t('ribbonAt', { shop: this.sim.shopName, place: placeName(place) }), textStyle(RIBBON.font, '800', C.cream)).setOrigin(0.5)
    if (label.width > RIBBON.textW) label.setScale(RIBBON.textW / label.width)
    const w = label.displayWidth + RIBBON.pad
    const bg = add
      .graphics()
      .fillStyle(hex(C.teal), 1)
      .fillRoundedRect(-w / 2, 0, w, RIBBON.h, RIBBON.h / 2)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(-w / 2, 0, w, RIBBON.h, RIBBON.h / 2)
    const pin = add.image(-w / 2 + 40, RIBBON.h / 2, 'icon-chain').setScale(0.7)
    label.setPosition(RIBBON.textX, RIBBON.h / 2)
    this.ribbon = add.container(GAME_W / 2, RIBBON.y, [bg, pin, label]).setDepth(DEPTH)
  }

  /** Whether a button takes a tap: the quest button from the first day of a shop on the starter chain. */
  private isOpen(f: Feature): boolean {
    return f === 'quests' ? this.sim.questsButtonOpen() : this.sim.featureOpen(f)
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
    this.lastBannerAt = this.scene.time.now
    this.scene.tweens.chain({
      targets: box,
      tweens: [
        { y: BANNER_Y, alpha: 1, duration: 250, ease: 'Cubic.easeOut' },
        { alpha: 0, delay: BANNER_MS - 500, duration: 250 },
      ],
      onComplete: () => box.destroy(),
    })
  }

  /** Redraws today's line when its words change; it hides under a toast, under a panel and on the summary. */
  private updateToday(covered: boolean): void {
    const line = todayShown(this.sim, covered)
    const key = line ? `${line.icon.texture}|${line.text}` : ''
    if (key !== this.todayKey) {
      this.todayKey = key
      this.today.removeAll(true)
      if (line) {
        const add = this.scene.add
        const text = add.text(0, 0, line.text, textStyle(30)).setOrigin(0, 0.5)
        const w = TODAY.pad + 2 * TODAY.discR + TODAY.gap + text.width + 2 * TODAY.pad
        const left = -w / 2
        const discX = left + TODAY.pad + TODAY.discR
        text.setX(discX + TODAY.discR + TODAY.gap)
        const bg = add
          .graphics()
          .fillStyle(hex(C.cream), 1)
          .fillRoundedRect(left, -TODAY.h / 2, w, TODAY.h, TODAY.h / 2)
          .lineStyle(4, hex(C.ink))
          .strokeRoundedRect(left, -TODAY.h / 2, w, TODAY.h, TODAY.h / 2)
          .fillStyle(hex(line.icon.disc), 1)
          .fillCircle(discX, 0, TODAY.discR)
          .lineStyle(3, hex(C.ink))
          .strokeCircle(discX, 0, TODAY.discR)
        const icon = add.image(discX, 0, line.icon.texture)
        icon.setScale(TODAY.icon / Math.max(icon.width, icon.height))
        this.today.add([bg, icon, text])
      }
    }
    this.today.setVisible(line !== null && !this.toastBox?.active)
  }

  /** Replaces the toast on screen, if any; destroying one that already faded does nothing. */
  toast(text: string): void {
    this.toastBox?.destroy()
    this.lastToastAt = this.scene.time.now
    this.toastBox = addToast(this.scene, GAME_W / 2, 1690, text).setDepth(DEPTH + 50)
  }
}
