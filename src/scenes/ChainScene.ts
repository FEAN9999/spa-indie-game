import * as Phaser from 'phaser'
import { C, customerColors, ownerColors } from '../art/palette'
import { sound } from '../audio/engine'
import { GAME_H, GAME_W, PLACES } from '../config'
import type { Chain } from '../sim/chain'
import type { CustomerKind } from '../sim/customers'
import type { PlaceId } from '../sim/places'
import type { Look } from '../sim/types'
import { formatMoney } from '../strings/format'
import { t } from '../strings/vi'
import { mapSub, pinLabel, pinState, placeName, sheetOf, type PinState } from '../view/chain'
import { CharacterView } from '../view/CharacterView'
import { textStyle } from '../view/text'
import { TOP_BAR } from '../view/topBar'
import { addCard, addToast } from '../view/ui'

export interface ChainData {
  chain: Chain
  /** Opens a branch at the place; the map then shows it open. */
  onOpen: (place: PlaceId) => void
  /** Goes to the shop at the place, null for the main one; the map is left to the caller to stop. */
  onGo: (place: PlaceId | null) => void
  onClose: () => void
}

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const V = Phaser.Math.Vector2
const MID = GAME_W / 2
const CARD = { x: 40, y: 230, w: 1000, h: 1770 }
const TITLE_Y = 296
const SUB_Y = 345
const CLOSE = { x: 970, y: 300, r: 40, arm: 14 }
/** The map's picture, at one canvas pixel per unit. */
const MAP = { x: 70, y: 380, w: 940, h: 1040, r: 30 }
/** Where each pin's tip touches the map: the main shop, then the places. */
const PINS: { place: PlaceId | null; x: number; y: number }[] = [
  { place: null, x: 440, y: 880 },
  { place: 'beach', x: 760, y: 1170 },
  { place: 'oldTown', x: 230, y: 610 },
  { place: 'uptown', x: 850, y: 560 },
]
/** A pin's round head: its middle this far over the tip, its outer and its window radius. */
const HEAD = { dy: 84, r: 44, window: 31 }
/** The sign under a pin's tip; the shop's own name on the main pin is drawn smaller to fit `nameW`. */
const SIGN = { dy: 12, h: 88, r: 22, pad: 44, nameDy: 40, subDy: 76, nameW: 360 }
/** What a tap on a pin counts: its head and its sign, at least `minW` wide. */
const PIN_TAP = { top: 140, h: 240, minW: 100 }
/** The selected pin stands on a gold glow. */
const GLOW = { dy: 2, rx: 54, ry: 16 }
/** The owner in the head of the pin she is at, her feet this far under its middle: her head and shoulders show in the window. */
const OWNER_HEAD = { scale: 0.95, feet: 81 }
const PIN_FILL: Record<PinState, string> = { here: C.teal, open: C.teal, can: C.mustard, lock: C.cream, soon: C.cream }
/** The sheet under the map, from y 1440: a figure in a disc at the left, the words right of it. */
const SHEET = { y: 1440, discX: 170, discDy: 110, discR: 92, textX: 290, textW: 720, rowsW: 680, titleDy: 30, statusDy: 84, rowsDy: 120, gap: 14 }
const FIGURE = { scale: 1.3, feet: 80, lock: 2 }
/** Who stands in the sheet's disc: someone off the street at the main shop, a place's own customer at a branch. The places of the next release show a lock until then. */
const FIGURE_OF: Partial<Record<PlaceId | 'main', { kind: CustomerKind; look: Look }>> = {
  main: { kind: 'student', look: { skin: 0, hair: 2, hairStyle: 0, shirt: 1 } },
  beach: { kind: 'tourist', look: { skin: 1, hair: 1, hairStyle: 0, shirt: 0 } },
}
const WARN = { x: 100, y: 1790, w: 880, h: 60, size: 27 }
const BUTTON = { y: 1915, w: 640, wide: 720, h: 116, size: 44 }
const TOAST_Y = 2080
/** The price taken, floated by the top bar's money over the dim. */
const FLOAT = { x: TOP_BAR.moneyX + 120, y: 200, rise: 60, ms: 1000 }
const DASH = { on: 12, off: 8 }

/** Points along a cubic curve from a to d. */
const cubic = (a: Phaser.Math.Vector2, b: Phaser.Math.Vector2, c: Phaser.Math.Vector2, d: Phaser.Math.Vector2) => new Phaser.Curves.CubicBezier(a, b, c, d).getPoints(12)

/** A map pin's outline with its tip on (x, y): two curves up to a round head, from the sketch. */
function pinOutline(x: number, y: number): Phaser.Math.Vector2[] {
  const hy = y - HEAD.dy
  const top: Phaser.Math.Vector2[] = []
  for (let i = 1; i < 24; i++) top.push(new V(x + HEAD.r * Math.cos(Math.PI + (i * Math.PI) / 24), hy + HEAD.r * Math.sin(Math.PI + (i * Math.PI) / 24)))
  const left = cubic(new V(x, y), new V(x - 26, y - 36), new V(x - 44, y - 56), new V(x - HEAD.r, hy))
  const right = cubic(new V(x + HEAD.r, hy), new V(x + 44, y - 56), new V(x + 26, y - 36), new V(x, y))
  return [...left, ...top, ...right.slice(0, -1)]
}

/** A rounded rectangle's outline as points, the corners in quarter turns. */
function roundRect(x: number, y: number, w: number, h: number, r: number): Phaser.Math.Vector2[] {
  const pts: Phaser.Math.Vector2[] = []
  const corner = (cx: number, cy: number, from: number) => {
    for (let i = 0; i <= 6; i++) pts.push(new V(cx + r * Math.cos(from + (i * Math.PI) / 12), cy + r * Math.sin(from + (i * Math.PI) / 12)))
  }
  corner(x + w - r, y + r, -Math.PI / 2)
  corner(x + w - r, y + h - r, 0)
  corner(x + r, y + h - r, Math.PI / 2)
  corner(x + r, y + r, Math.PI)
  return pts
}

/** Strokes a closed outline as dashes, as Phaser has no dashed line: what is locked or off. */
function dashed(g: Phaser.GameObjects.Graphics, pts: Phaser.Math.Vector2[], width: number, color: string): void {
  g.lineStyle(width, hex(color))
  let phase = 0
  pts.forEach((a, i) => {
    const b = pts[(i + 1) % pts.length]
    const len = Phaser.Math.Distance.BetweenPoints(a, b)
    for (let at = 0; at < len; ) {
      const step = Math.min(phase < DASH.on ? DASH.on - phase : DASH.on + DASH.off - phase, len - at)
      if (phase < DASH.on) g.lineBetween(a.x + ((b.x - a.x) * at) / len, a.y + ((b.y - a.y) * at) / len, a.x + ((b.x - a.x) * (at + step)) / len, a.y + ((b.y - a.y) * (at + step)) / len)
      at += step
      phase = (phase + step) % (DASH.on + DASH.off)
    }
  })
}

/** Shrinks a text to fit `w`, never grows it. */
const fit = <T extends Phaser.GameObjects.Text>(text: T, w: number): T => text.setScale(Math.min(1, w / text.width))

/**
 * The chain's map over the frozen shop: a painted Saigon with a pin for the main shop and each place, styled by how it
 * stands, and a sheet under it for the pin tapped, whose button opens a branch there or goes to that shop.
 */
export class ChainScene extends Phaser.Scene {
  private params!: ChainData
  /** The pin whose sheet shows. */
  private picked: PlaceId | null = null
  /** What draw() puts up, taken down on the next draw. */
  private shown: Phaser.GameObjects.GameObject[] = []
  private toastBox: Phaser.GameObjects.Container | null = null

  constructor() {
    super('ChainScene')
  }

  init(data: ChainData) {
    this.params = data
    this.picked = data.chain.at
    this.shown = []
    this.toastBox = null
  }

  create() {
    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    addCard(this, CARD.x, CARD.y, CARD.w, CARD.h)
    this.add.text(MID, TITLE_Y, t('mapTitle'), textStyle(58)).setOrigin(0.5)
    const close = this.add.circle(CLOSE.x, CLOSE.y, CLOSE.r, hex(C.cream)).setStrokeStyle(4, hex(C.ink)).setInteractive()
    close.on('pointerup', () => {
      sound.play('tap')
      this.scene.stop()
      this.params.onClose()
    })
    const { x, y, arm } = CLOSE
    this.add.graphics().lineStyle(5, hex(C.ink)).lineBetween(x - arm, y - arm, x + arm, y + arm).lineBetween(x + arm, y - arm, x - arm, y + arm)
    this.add.image(MAP.x, MAP.y, 'chain-map').setOrigin(0)
    this.add.graphics().lineStyle(5, hex(C.ink)).strokeRoundedRect(MAP.x, MAP.y, MAP.w, MAP.h, MAP.r)
    // the owner's window is made off the display list, so the scene's own shutdown would leave it
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const o of this.shown) o.destroy()
    })
    this.draw()
  }

  private keep<T extends Phaser.GameObjects.GameObject>(o: T): T {
    this.shown.push(o)
    return o
  }

  /** The subtitle, the pins and the sheet, as the chain now stands. */
  private draw(): void {
    for (const o of this.shown) o.destroy()
    this.shown = []
    this.keep(this.add.text(MID, SUB_Y, mapSub(this.params.chain), textStyle(28, '800', C.soft)).setOrigin(0.5))
    for (const pin of PINS) this.pin(pin.place, pin.x, pin.y)
    this.sheet(this.picked)
  }

  /** A pin coloured by how its place stands, the owner's head in the one she is at, and its sign: the name over a short line. */
  private pin(place: PlaceId | null, x: number, y: number): void {
    const { chain } = this.params
    const state = pinState(chain, place)
    const off = state === 'lock' || state === 'soon'
    if (place === this.picked) this.keep(this.add.ellipse(x, y + GLOW.dy, GLOW.rx * 2, GLOW.ry * 2, hex(C.gold), 0.7))
    const outline = pinOutline(x, y)
    const g = this.keep(this.add.graphics()).fillStyle(hex(PIN_FILL[state])).fillPoints(outline, true)
    if (off) dashed(g, outline, 5, C.ink)
    else g.lineStyle(5, hex(C.ink)).strokePoints(outline, true)
    const hy = y - HEAD.dy
    g.fillStyle(hex(C.cream)).fillCircle(x, hy, HEAD.window)
    if (state === 'here') this.ownerHead(x, hy)
    else this.keep(this.add.image(x, hy, state === 'lock' ? 'icon-lock' : `pin-${place ?? 'main'}`))
    this.keep(this.add.graphics()).lineStyle(4, hex(C.ink)).strokeCircle(x, hy, HEAD.window)

    // the sign: drawn under its words once they are measured
    const sign = this.keep(this.add.graphics())
    const name = this.keep(this.add.text(x, y + SIGN.nameDy, place === null ? chain.main.shopName : placeName(place), textStyle(32)).setOrigin(0.5))
    fit(name, SIGN.nameW)
    const label = pinLabel(chain, place)
    const color = off ? C.soft : label === t('pinResting') ? C.lanternDark : state === 'can' ? C.mustardDark : C.teal
    const sub = this.keep(this.add.text(x, y + SIGN.subDy, label, textStyle(24, '800', color)).setOrigin(0.5))
    const w = Math.max(name.displayWidth, sub.displayWidth) + SIGN.pad
    sign.fillStyle(hex(off ? C.paper : C.cream)).fillRoundedRect(x - w / 2, y + SIGN.dy, w, SIGN.h, SIGN.r)
    if (off) dashed(sign, roundRect(x - w / 2, y + SIGN.dy, w, SIGN.h, SIGN.r), 4, C.ink)
    else sign.lineStyle(4, hex(C.ink)).strokeRoundedRect(x - w / 2, y + SIGN.dy, w, SIGN.h, SIGN.r)

    const tapW = Math.max(w, PIN_TAP.minW)
    this.keep(this.add.zone(x, y - PIN_TAP.top + PIN_TAP.h / 2, tapW, PIN_TAP.h).setInteractive()).on('pointerup', () => {
      sound.play('tap')
      this.picked = place
      this.draw()
    })
  }

  /** The owner as she looks now, clipped to the pin's window; Phaser masks only under WebGL. */
  private ownerHead(x: number, hy: number): void {
    const { main } = this.params.chain
    const view = new CharacterView(this, ownerColors(main.ownerLook, main.ownerOutfit))
    this.keep(view.container.setPosition(x, hy + OWNER_HEAD.feet).setScale(OWNER_HEAD.scale).enableFilters())
    // made off the display list, so it is taken down with the pins
    const window = this.keep(this.make.graphics({}, false).fillStyle(0xffffff).fillCircle(x, hy, HEAD.window))
    view.container.filters?.internal.addMask(window)
  }

  /** The sheet for `place`: who comes there, its name, how it stands and what is known of it; a warning or what is missing; and its button. */
  private sheet(place: PlaceId | null): void {
    const { chain } = this.params
    const sheet = sheetOf(chain, place)
    const y0 = SHEET.y
    const cx = SHEET.discX
    const cy = y0 + SHEET.discDy
    this.keep(this.add.circle(cx, cy, SHEET.discR, hex(C.sand)).setStrokeStyle(4, hex(C.ink)))
    const figure = FIGURE_OF[place ?? 'main']
    if (figure) this.keep(new CharacterView(this, customerColors(figure.look, figure.kind)).container.setPosition(cx, cy + FIGURE.feet).setScale(FIGURE.scale))
    else this.keep(this.add.image(cx, cy, 'icon-lock').setScale(FIGURE.lock))

    const left = SHEET.textX
    this.keep(fit(this.add.text(left, y0 + SHEET.titleDy, sheet.title, textStyle(50)).setOrigin(0, 0.5), SHEET.textW))
    const state = pinState(chain, place)
    const statusColor = state === 'lock' || state === 'soon' ? C.soft : sheet.status === t('sheetResting') ? C.lanternDark : state === 'can' ? C.mustardDark : C.teal
    this.keep(fit(this.add.text(left, y0 + SHEET.statusDy, sheet.status, textStyle(30, '800', statusColor)).setOrigin(0, 0.5), SHEET.textW))

    // the rows wrap, and are drawn smaller when they would run into the line or the button under them
    const top = y0 + SHEET.rowsDy
    const bottom = (sheet.warn || sheet.short ? WARN.y : BUTTON.y - BUTTON.h / 2) - SHEET.gap
    const rows = this.keep(this.add.text(left, top, sheet.rows.join('\n'), { ...textStyle(30, '600', C.soft), wordWrap: { width: SHEET.rowsW } }))
    rows.setScale(Math.min(1, (bottom - top) / rows.height))

    if (sheet.warn) {
      const strip = this.keep(this.add.graphics())
      strip.fillStyle(hex(C.lantern), 0.14).fillRoundedRect(WARN.x, WARN.y, WARN.w, WARN.h, WARN.h / 2)
      strip.lineStyle(3, hex(C.lanternDark)).strokeRoundedRect(WARN.x, WARN.y, WARN.w, WARN.h, WARN.h / 2)
      this.keep(fit(this.add.text(MID, WARN.y + WARN.h / 2, sheet.warn, textStyle(WARN.size, '800', C.lanternDark)).setOrigin(0.5), WARN.w - 40))
    } else if (sheet.short) this.keep(this.add.text(MID, WARN.y + WARN.h / 2, sheet.short, textStyle(30, '800', C.lanternDark)).setOrigin(0.5))

    this.button(place, state, sheet.button)
  }

  /** The sheet's button: gold to open a branch, teal to go to a shop, dashed sand when off; only one that is on takes a tap. */
  private button(place: PlaceId | null, state: PinState, button: { text: string; on: boolean }): void {
    const w = state === 'can' ? BUTTON.wide : BUTTON.w
    const { h } = BUTTON
    const bg = this.add.graphics()
    const fill = !button.on ? C.sand : state === 'can' ? C.mustard : C.teal
    bg.fillStyle(hex(fill)).fillRoundedRect(-w / 2, -h / 2, w, h, h / 2)
    if (button.on) bg.lineStyle(4, hex(C.ink)).strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2)
    else dashed(bg, roundRect(-w / 2, -h / 2, w, h, h / 2), 4, C.soft)
    const color = !button.on ? C.soft : state === 'can' ? C.ink : C.paper
    const label = fit(this.add.text(0, 0, button.text, textStyle(BUTTON.size, '800', color)).setOrigin(0.5), w - 60)
    const box = this.keep(this.add.container(MID, BUTTON.y, [bg, label]).setSize(w, h))
    if (!button.on) return
    box.setInteractive().on('pointerup', () => {
      sound.play('tap')
      if (place !== null && state === 'can') this.open(place)
      else this.params.onGo(place)
    })
  }

  /** Opens a branch: the price floats off the money, a toast says where, and the sheet shows it open. */
  private open(place: PlaceId): void {
    const { chain } = this.params
    this.params.onOpen(place)
    if (!chain.shop(place)) return
    this.floatPrice(PLACES[place].price)
    this.toastBox?.destroy()
    this.toastBox = addToast(this, MID, TOAST_Y, t('openedToast', { place: placeName(place) }))
    this.draw()
  }

  private floatPrice(price: number): void {
    const label = this.add.text(0, 0, formatMoney(-price), { ...textStyle(46, '800', C.lanternDark), stroke: C.cream, strokeThickness: 10 }).setOrigin(0, 0.5)
    const coin = this.add.image(-label.width / 2 - 28, 0, 'coin')
    label.x = -label.width / 2 + 4
    const box = this.add.container(FLOAT.x, FLOAT.y, [coin, label])
    this.tweens.add({ targets: box, y: FLOAT.y - FLOAT.rise, duration: FLOAT.ms, ease: 'Cubic.easeOut' })
    this.tweens.add({ targets: box, alpha: 0, duration: FLOAT.ms, ease: 'Cubic.easeIn', onComplete: () => box.destroy() })
  }
}
