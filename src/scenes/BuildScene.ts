import * as Phaser from 'phaser'
import { itemTexture } from '../art/furniture'
import { C } from '../art/palette'
import { sound } from '../audio/engine'
import { FLOOR_ROWS, GAME_H, GAME_W, MAP_X, TILE } from '../config'
import { nearestSpot, PROBLEM_TEXT, type BuildProblem } from '../sim/build'
import { floorOf } from '../sim/floors'
import { tileEq } from '../sim/grid'
import { footprint, ITEMS, setProgress, workTile, type Item, type ItemGroup, type ItemKind, type SetId } from '../sim/items'
import type { SpaSim } from '../sim/spa'
import type { Tile } from '../sim/types'
import { formatMoney } from '../strings/format'
import { t, type StringKey } from '../strings/vi'
import { catalogPage, type CatalogEntry } from '../view/catalog'
import { FloorBar } from '../view/FloorBar'
import { carryTo, FLOOR_PILLS, pills, showPills } from '../view/floors'
import type { RoomView } from '../view/RoomView'
import { textStyle } from '../view/text'
import { addButton, addCard, addToast } from '../view/ui'

export interface BuildData {
  sim: SpaSim
  room: RoomView
  /** The first time build mode opens: the panel says what it is for. */
  intro: boolean
  /** After a buy, a move or a sale: redraw the room and save. */
  onChange: () => void
  onClose: () => void
  /** SpaScene's showFloor: the only way build mode changes the floor in view. */
  showFloor: (floor: number) => void
}

/** The piece on the finger: a new one to buy or a gift to put down, or one of the shop's items, whose sprite is hidden meanwhile. */
interface Held {
  item: Item
  buying: boolean
}

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const MID = GAME_W / 2
/** New pieces start on the free spot nearest the middle of the floor in view. */
const centre = (floor: number): Tile => ({ x: 6, y: 9 + (floor - 1) * FLOOR_ROWS })
const TAP_SLOP_PX = 20
/** The catalogue or the hold row that just took the other's place ignores presses this long, so the second tap of a double tap cannot land on it. */
const SETTLE_MS = 300
const GHOST_LIFT_PX = 16
const GHOST_ALPHA = 0.9
const TINT_ALPHA = 0.35
const FADED_ALPHA = 0.45
const PANEL_DEPTH = 10
const TOAST_DEPTH = 20

// the full panel covers the street and the bottom nav; without the first-time note, everything above the cards moves up into its room
const PANEL_TOP = 1640
const NOTE_Y = 1676
const NOTE_ROOM = 40
const ROW_H = 120
const TAB_Y = 1762
const TAB_W = 260
const TAB_STEP = 272
const DONE_W = 204
const INFO_Y = 1854
const CARD_TOP = 1886
const CARD_BOTTOM = 2144
const CARD_W = 211
const CARD_STEP = 223
const CARD_PAD = 14
/** However many lines a card's words take, its picture keeps this much height, so it is never flattened or flipped. */
const PIC_MIN_H = 32
const ARROW_W = 64
const ARROW_H = 130
// while a piece is held the panel shrinks to one row of buttons
const HOLD_TOP = 1940
const HOLD_Y = 2050
const HOLD_H = 130
const HOLD_GAP = 16
// the floor pills' band, above the hold row: a press there is a pill's, not the floor's
const PILL_BAND = { top: 1807, bottom: 1903 }
/** Where a toast sits while a piece is held, clear of the pill band. */
const HOLD_TOAST_Y = 1690
const EDGE = 24

const TABS: { group: ItemGroup; label: StringKey }[] = [
  { group: 'bed', label: 'tabBeds' },
  { group: 'seat', label: 'tabSeats' },
  { group: 'decor', label: 'tabDecor' },
]
const SETS: { id: SetId; name: StringKey }[] = [
  { id: 'saigon', name: 'setSaigon' },
  { id: 'bamboo', name: 'setBamboo' },
]

const cardText = (size: number, weight: '600' | '800') => ({
  ...textStyle(size, weight),
  align: 'center',
  wordWrap: { width: CARD_W - 2 * CARD_PAD },
  lineSpacing: -8,
})

/**
 * Build mode over the frozen shop: a grid on the floor and a panel of furniture to buy.
 * A piece in hand follows the finger tile by tile; every change goes through the sim's buy, placeGift, move and sell.
 * Every tap stays in this scene, so the shop, its top bar and its buttons wait underneath.
 */
export class BuildScene extends Phaser.Scene {
  private params!: BuildData
  private tab: ItemGroup = 'bed'
  private page = 0
  private held: Held | null = null
  /** Where the finger went down above the panel and the held piece's tile then; `pick` while nothing is held and the press may still pick something up. */
  private drag: { x: number; y: number; from: Tile | null; pick: boolean } | null = null
  /** When the finger last went down, on the page's clock: the game's only moves on each frame. */
  private pressAt = 0
  /** Panel presses count from this time on; see SETTLE_MS. */
  private readyAt = 0
  /** Everything drawn for the panel on screen, destroyed when the panel changes. */
  private shown: Phaser.GameObjects.GameObject[] = []
  private ghost: Phaser.GameObjects.Image | null = null
  private tint!: Phaser.GameObjects.Graphics
  private grid: Phaser.GameObjects.Graphics | null = null
  private floorBar!: FloorBar
  private toastBox: Phaser.GameObjects.Container | null = null

  constructor() {
    super('BuildScene')
  }

  init(data: BuildData) {
    this.params = data
    // a regular's gift waits first on the decor tab
    this.tab = data.sim.book.gifts.length > 0 ? 'decor' : 'bed'
    this.page = 0
    this.held = null
    this.drag = null
    this.pressAt = 0
    this.readyAt = 0
    this.shown = []
    this.ghost = null
    this.grid = null
    this.toastBox = null
  }

  create() {
    // under everything else here: swallows every tap the panel does not take
    this.add.zone(0, 0, GAME_W, GAME_H).setOrigin(0).setInteractive()
    this.floorBar = new FloorBar(this, PANEL_DEPTH, floor => this.panelTap() && this.carry(floor))
    this.drawGrid()
    this.tint = this.add.graphics().setDepth(1)
    this.input.on('pointerdown', this.onDown, this)
    this.input.on('pointermove', this.onMove, this)
    this.input.on('pointerup', this.onUp, this)
    this.showCatalog()
  }

  /** A faint line round every floor tile of the bare floor in view, each edge drawn once. */
  private drawGrid(): void {
    const { sim, room } = this.params
    const shell = sim.shellGrid()
    const floor = (x: number, y: number) => floorOf(y) === room.floor && shell.cells[y]?.[x] === 'floor'
    this.grid?.destroy()
    const g = (this.grid = this.add.graphics().lineStyle(2, hex(C.ink), 0.15))
    for (let y = 0; y < shell.rows; y++) {
      for (let x = 0; x < shell.cols; x++) {
        if (!floor(x, y)) continue
        const left = MAP_X + x * TILE
        const top = room.rowY(y)
        g.lineBetween(left, top, left + TILE, top)
        g.lineBetween(left, top, left, top + TILE)
        if (!floor(x, y + 1)) g.lineBetween(left, top + TILE, left + TILE, top + TILE)
        if (!floor(x + 1, y)) g.lineBetween(left + TILE, top, left + TILE, top + TILE)
      }
    }
  }

  private keep<T extends Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Depth>(obj: T): T {
    this.shown.push(obj)
    return obj.setDepth(PANEL_DEPTH)
  }

  private clearPanel(): void {
    for (const obj of this.shown) obj.destroy()
    this.shown = []
  }

  /** A panel button that ignores a finger let go on it at the end of a drag, or pressed just after the panel changed. */
  private button(x: number, y: number, w: number, h: number, label: string, kind: 'primary' | 'plain', onTap: () => void, size?: number): void {
    this.keep(addButton(this, x, y, w, h, label, kind, () => this.panelTap() && onTap(), size))
  }

  /** The press began on the panel, not above it, and after the panel settled. */
  private panelTap(): boolean {
    return this.drag === null && this.pressAt >= this.readyAt
  }

  /** The tabs, the shop's beauty and sets, a page of cards and "Xong". */
  private showCatalog(): void {
    this.clearPanel()
    this.floorBar.hide()
    this.keep(addCard(this, 0, PANEL_TOP, GAME_W, GAME_H - PANEL_TOP + 60))
    const { intro } = this.params
    if (intro) {
      this.keep(this.add.text(MID, NOTE_Y, t('buildIntro'), { ...textStyle(30, '600'), align: 'center', wordWrap: { width: GAME_W - 2 * EDGE } }).setOrigin(0.5))
    }
    const lift = intro ? 0 : NOTE_ROOM
    TABS.forEach((tab, i) => {
      const kind = tab.group === this.tab ? 'primary' : 'plain'
      this.button(EDGE + TAB_W / 2 + i * TAB_STEP, TAB_Y - lift, TAB_W, ROW_H, t(tab.label), kind, () => this.openTab(tab.group), 44)
    })
    this.button(GAME_W - EDGE - DONE_W / 2, TAB_Y - lift, DONE_W, ROW_H, t('done'), 'plain', () => this.close())
    this.showScore(INFO_Y - lift)

    const top = CARD_TOP - lift
    const { sim } = this.params
    const { entries, page, pages } = catalogPage(this.tab, this.page, sim.services, sim.book.gifts)
    this.page = page
    entries.forEach((entry, i) => this.card(entry, MID + (i - (entries.length - 1) / 2) * CARD_STEP, top))
    if (pages > 1) {
      const y = (top + CARD_BOTTOM) / 2
      this.button(EDGE + ARROW_W / 2, y, ARROW_W, ARROW_H, t('prevPage'), 'plain', () => this.turnPage(-1), 64)
      this.button(GAME_W - EDGE - ARROW_W / 2, y, ARROW_W, ARROW_H, t('nextPage'), 'plain', () => this.turnPage(1), 64)
    }
  }

  /** One line: the beauty on the left, the old Saigon set in the middle, the bamboo set on the right. */
  private showScore(y: number): void {
    const { sim } = this.params
    const sets = SETS.map(s => {
      const have = setProgress(sim.items, s.id)
      return have === 6 ? t('setDone', { name: t(s.name) }) : t('setProgress', { name: t(s.name), have })
    })
    this.keep(this.add.text(EDGE + 16, y, t('beautyTotal', { n: Math.round(sim.beauty()) }), textStyle(32)).setOrigin(0, 0.5))
    this.keep(this.add.text(MID, y, sets[0], textStyle(32, '600')).setOrigin(0.5))
    this.keep(this.add.text(GAME_W - EDGE - 16, y, sets[1], textStyle(32, '600')).setOrigin(1, 0.5))
  }

  /**
   * The words stack up from the card's bottom; the picture fills what is left above them. One the shop cannot afford is faded and says what is missing.
   * A gift says so where the price goes and is never faded.
   */
  private card({ kind, gift }: CatalogEntry, x: number, top: number): void {
    const { price, beauty, name } = ITEMS[kind]
    const short = gift ? 0 : price - this.params.sim.money
    const box = this.add.container(0, 0, [addCard(this, x - CARD_W / 2, top, CARD_W, CARD_BOTTOM - top)])
    const lines = [
      this.add.text(x, 0, t(name), cardText(28, '800')),
      this.add.text(x, 0, gift ? t('giftLabel') : short > 0 ? t(PROBLEM_TEXT.money, { money: formatMoney(short) }) : formatMoney(price), cardText(28, '800')),
      this.add.text(x, 0, t('beautyPlus', { n: beauty }), cardText(26, '600')),
    ]
    let y = CARD_BOTTOM - CARD_PAD
    for (const line of lines.reverse()) {
      line.setOrigin(0.5, 1).setY(y)
      y -= line.height
    }
    const picH = Math.max(PIC_MIN_H, y - top - CARD_PAD)
    const pic = this.add.image(x, top + CARD_PAD + picH / 2, itemTexture(kind))
    pic.setScale(Math.min(1, (CARD_W - 2 * CARD_PAD) / pic.width, picH / pic.height))
    box.add([pic, ...lines])
    this.keep(box.setAlpha(short > 0 ? FADED_ALPHA : 1))
    this.keep(this.add.zone(x, (top + CARD_BOTTOM) / 2, CARD_W, CARD_BOTTOM - top).setInteractive()).on('pointerup', () => {
      sound.play('tap')
      if (this.panelTap()) this.takeNew(kind, gift)
    })
  }

  private openTab(group: ItemGroup): void {
    this.tab = group
    this.page = 0
    this.showCatalog()
  }

  private turnPage(by: number): void {
    this.page += by
    this.showCatalog()
  }

  /** A card tapped: the new piece appears on the free spot nearest the middle, or on the middle when none is free. */
  private takeNew(kind: ItemKind, gift: boolean): void {
    const { sim } = this.params
    if (!gift && sim.money < ITEMS[kind].price) {
      this.toast(this.problemText('money', kind))
      return
    }
    const { floor } = this.params.room
    const start = centre(floor)
    const spot = nearestSpot(sim.grid, start, s => floorOf(s.y + ITEMS[kind].h - 1) === floor && sim.canPlace(kind, s.x, s.y, false) === null) ?? start
    // not in the shop yet, so it has no id of its own
    this.hold({ item: { id: 0, kind, ...spot, flip: false, gift }, buying: true })
  }

  /** A tap or a drag on the floor: picks up the item standing there, or else the one drawn over the point, unless a customer is using it. */
  private pickUp(x: number, y: number): void {
    const { sim, room } = this.params
    const tile = room.worldToTile(x, y)
    // the top of a tall piece covers the tile behind it
    const drawn = room.itemAt(x, y)
    const item = sim.items.find(i => footprint(i).some(f => tileEq(f, tile))) ?? sim.items.find(i => i.id === drawn)
    if (!item) return
    if (sim.isBusy(item.id)) {
      this.toast(t(PROBLEM_TEXT.busy))
      return
    }
    room.hide(item.id)
    this.hold({ item: { ...item }, buying: false })
  }

  private hold(held: Held): void {
    this.held = held
    this.ghost = this.add.image(0, 0, itemTexture(held.item.kind)).setOrigin(0.5, 1).setAlpha(GHOST_ALPHA).setDepth(2)
    this.drawGhost()
    this.readyAt = performance.now() + SETTLE_MS
    this.showHoldRow()
  }

  /** The held piece a little above its tiles, which are teal where it can stand and red where it cannot. */
  private drawGhost(): void {
    const { item, buying } = this.held!
    const { w, h } = ITEMS[item.kind]
    const { room } = this.params
    this.ghost!.setPosition(MAP_X + (item.x + w / 2) * TILE, room.rowY(item.y + h) - GHOST_LIFT_PX).setFlipX(item.flip)
    const fits = this.params.sim.canPlace(item.kind, item.x, item.y, item.flip, buying ? undefined : item.id) === null
    const work = workTile(item)
    this.tint.clear().fillStyle(hex(fits ? C.teal : C.lantern), TINT_ALPHA)
    for (const s of work ? [...footprint(item), work] : footprint(item)) this.tint.fillRect(MAP_X + s.x * TILE, room.rowY(s.y), TILE, TILE)
  }

  /** "Thôi", "Lật", "Bán" for a piece the shop owns, and "Đặt". */
  private showHoldRow(): void {
    this.clearPanel()
    const { item, buying } = this.held!
    this.keep(addCard(this, 0, HOLD_TOP, GAME_W, GAME_H - HOLD_TOP + 60))
    const refund = formatMoney(Math.floor(ITEMS[item.kind].price / 2))
    const row: { label: string; kind: 'primary' | 'plain'; w: number; onTap: () => void }[] = buying
      ? [
          { label: t('cancel'), kind: 'plain', w: 310, onTap: () => this.letGo() },
          { label: t('flip'), kind: 'plain', w: 310, onTap: () => this.flip() },
          { label: t('place'), kind: 'primary', w: 380, onTap: () => this.place() },
        ]
      : [
          { label: t('cancel'), kind: 'plain', w: 180, onTap: () => this.letGo() },
          { label: t('flip'), kind: 'plain', w: 180, onTap: () => this.flip() },
          // on a gift, tapping it only says gifts are not sold
          { label: item.gift ? t('sellGiftButton') : t('sell', { money: refund }), kind: 'plain', w: 404, onTap: () => this.sell() },
          { label: t('place'), kind: 'primary', w: 220, onTap: () => this.place() },
        ]
    let left = EDGE
    for (const b of row) {
      this.button(left + b.w / 2, HOLD_Y, b.w, HOLD_H, b.label, b.kind, b.onTap)
      left += b.w + HOLD_GAP
    }
    this.showFloorBar()
  }

  /** While a piece is held and the shop has another floor open, the pills carry it there. */
  private showFloorBar(): void {
    const { sim, room } = this.params
    if (showPills(sim) && sim.floors > 1) this.floorBar.show(pills(sim, room.floor).filter(p => p.floor <= Math.min(FLOOR_PILLS, sim.floors)), sim.ownerLook)
  }

  /** A pill tapped: the floor comes into view and the held piece moves onto it, to the nearest free spot there when its own does not fit. */
  private carry(floor: number): void {
    const { sim, room } = this.params
    const held = this.held
    if (!held || floor === room.floor || floor > sim.floors) return
    this.params.showFloor(floor)
    this.drawGrid()
    const { item, buying } = held
    const { h } = ITEMS[item.kind]
    const moved = carryTo(item, floor)
    const fits = (s: Tile) => floorOf(s.y + h - 1) === floor && sim.canPlace(item.kind, s.x, s.y, item.flip, buying ? undefined : item.id) === null
    const spot = fits(moved) ? moved : nearestSpot(sim.grid, moved, fits) ?? moved
    item.x = spot.x
    item.y = spot.y
    this.drawGhost()
    this.showFloorBar()
  }

  private flip(): void {
    const { item } = this.held!
    item.flip = !item.flip
    this.drawGhost()
  }

  private place(): void {
    const { sim } = this.params
    const { item, buying } = this.held!
    const problem = !buying
      ? sim.move(item.id, item.x, item.y, item.flip)
      : item.gift
        ? sim.placeGift(item.kind, item.x, item.y, item.flip)
        : sim.buy(item.kind, item.x, item.y, item.flip)
    if (problem) this.toast(this.problemText(problem, item.kind))
    else {
      sound.play('thud')
      this.changed()
    }
  }

  private sell(): void {
    const { item } = this.held!
    const problem = this.params.sim.sell(item.id)
    if (problem) this.toast(this.problemText(problem, item.kind))
    else this.changed()
  }

  /** The room is redrawn while the moved piece is still hidden, then shown where it now stands. */
  private changed(): void {
    this.params.onChange()
    this.letGo()
  }

  /** Puts the held piece down: a new one is dropped, one of the shop's comes back into view. */
  private letGo(): void {
    this.held = null
    this.ghost?.destroy()
    this.ghost = null
    this.tint.clear()
    this.params.room.hide(null)
    this.readyAt = performance.now() + SETTLE_MS
    this.showCatalog()
  }

  private problemText(problem: BuildProblem, kind: ItemKind): string {
    return t(PROBLEM_TEXT[problem], { money: formatMoney(ITEMS[kind].price - this.params.sim.money) })
  }

  /** Just above the panel, whichever size it has. */
  private toast(text: string): void {
    this.toastBox?.destroy()
    this.toastBox = addToast(this, MID, this.held ? HOLD_TOAST_Y : this.panelTop() - 60, text).setDepth(TOAST_DEPTH)
  }

  private panelTop(): number {
    return this.held ? HOLD_TOP : PANEL_TOP
  }

  private onDown(p: Phaser.Input.Pointer): void {
    this.pressAt = performance.now()
    const held = this.held?.item
    const onPill = held !== undefined && p.y >= PILL_BAND.top && p.y <= PILL_BAND.bottom
    this.drag = p.y < this.panelTop() && !onPill ? { x: p.x, y: p.y, from: held ? { x: held.x, y: held.y } : null, pick: !held } : null
  }

  /**
   * The held piece moves by whole tiles as far as the finger has gone since it went down, and stays on the grid.
   * With nothing held, a drag that starts on an item picks it up and carries it in the same gesture.
   */
  private onMove(p: Phaser.Input.Pointer): void {
    const { drag } = this
    if (!p.isDown || !drag) return
    if (drag.pick) {
      if (Phaser.Math.Distance.Between(drag.x, drag.y, p.x, p.y) <= TAP_SLOP_PX) return
      drag.pick = false
      this.pickUp(drag.x, drag.y)
      const picked = this.held?.item
      if (picked) drag.from = { x: picked.x, y: picked.y }
    }
    const { held } = this
    if (!drag.from || !held) return
    const { w, h } = ITEMS[held.item.kind]
    const { cols, rows } = this.params.sim.grid
    const x = Phaser.Math.Clamp(drag.from.x + Math.round((p.x - drag.x) / TILE), 0, cols - w)
    const y = Phaser.Math.Clamp(drag.from.y + Math.round((p.y - drag.y) / TILE), 0, rows - h)
    if (x === held.item.x && y === held.item.y) return
    held.item.x = x
    held.item.y = y
    this.drawGhost()
  }

  /** A tap with nothing held picks up what stands there; the end of a drag only lets go of the finger. */
  private onUp(p: Phaser.Input.Pointer): void {
    const drag = this.drag
    this.drag = null
    if (!drag?.pick || Phaser.Math.Distance.Between(drag.x, drag.y, p.x, p.y) > TAP_SLOP_PX) return
    this.pickUp(p.x, p.y)
  }

  private close(): void {
    this.params.onClose()
    this.scene.stop()
  }
}
