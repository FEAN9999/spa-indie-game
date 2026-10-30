import * as Phaser from 'phaser'
import { itemTexture } from '../art/furniture'
import { C } from '../art/palette'
import { PET_ORIGIN, petKey } from '../art/pets'
import { sound } from '../audio/engine'
import { EDGE_SCROLL, EDGE_SCROLL_SPEED, GAME_H, GAME_W, MAP_X, MAX_PETS, TAP_SLOP_PX, TILE } from '../config'
import { claimed, nearestSpot, PROBLEM_TEXT, type BuildProblem } from '../sim/build'
import { floorOf } from '../sim/floors'
import { tileEq } from '../sim/grid'
import { footprint, ITEMS, nextFacing, setProgress, size, type Item, type ItemGroup, type ItemKind, type SetId } from '../sim/items'
import { BREEDS, type BreedId, type Pet } from '../sim/pets'
import type { SpaSim } from '../sim/spa'
import type { Tile, Vec } from '../sim/types'
import { formatMoney } from '../strings/format'
import { BREED_NAME, t, type StringKey } from '../strings/vi'
import { buildArea, dragTile, MAP_VIEW } from '../view/camera'
import { catalogPage, petPage, type CatalogEntry } from '../view/catalog'
import { FloorBar } from '../view/FloorBar'
import { carryTo, clampToFloor, pills, showPills } from '../view/floors'
import type { MapCamera } from '../view/MapCamera'
import { MapGestures } from '../view/MapGestures'
import type { RoomView } from '../view/RoomView'
import { textStyle } from '../view/text'
import { addButton, addCard, addToast } from '../view/ui'
import { ZoomButtons } from '../view/ZoomButtons'
import type { PetGiveData } from './PetGiveScene'
import type { PetNameData } from './PetNameScene'

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
  /** The shop's scene, whose map camera draws the grid, the tint and the held piece. */
  map: Phaser.Scene
  cam: MapCamera
}

/** The piece on the finger: a new one to buy or a gift to put down, or one of the shop's items, whose sprite is hidden meanwhile. */
interface Held {
  item: Item
  buying: boolean
}

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const MID = GAME_W / 2
/** The catalogue or the hold row that just took the other's place ignores presses this long, so the second tap of a double tap cannot land on it. */
const SETTLE_MS = 300
const GHOST_LIFT_PX = 16
const GHOST_ALPHA = 0.9
const TINT_ALPHA = 0.35
const FADED_ALPHA = 0.45
const PANEL_DEPTH = 10
const TOAST_DEPTH = 20
// on the map, over everything there
const GRID_DEPTH = 9500
const TINT_DEPTH = 9501
const GHOST_DEPTH = 9502

// the full panel covers the street and the bottom nav; without the first-time note, everything above the cards moves up into its room
const PANEL_TOP = 1640
const NOTE_Y = 1676
const NOTE_ROOM = 40
const ROW_H = 120
const TAB_Y = 1762
const TAB_W = 196
const TAB_STEP = 204
const TAB_SIZE = 38
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

/** A furniture group, or the shop's pets. */
type Tab = ItemGroup | 'pets'

const TABS: { group: Tab; label: StringKey }[] = [
  { group: 'bed', label: 'tabBeds' },
  { group: 'seat', label: 'tabSeats' },
  { group: 'decor', label: 'tabDecor' },
  { group: 'pets', label: 'tabPets' },
]
/** On a pet card, up from its bottom: the feet of the picture, the name, the breed, the rename button and "Cho đi"; on a breed card, the feet, the name and the price button. */
const OWNED = { feet: 164, name: 118, breed: 86, rename: 60, give: 20 }
const SALE = { feet: 134, name: 88, price: 50 }
/** The pet on its own card, a little smaller to leave room for the buttons. */
const OWNED_SCALE = 0.9
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
  private tab: Tab = 'bed'
  private page = 0
  private held: Held | null = null
  /** The finger that went down above the panel, where it went down on screen and on the map, and the held piece's tile then; `pick` while nothing is held and the press may still pick something up. */
  private drag: { p: Phaser.Input.Pointer; x: number; y: number; down: Vec; from: Tile | null; pick: boolean } | null = null
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
  /** The floor in view when the held piece was taken, which Thôi goes back to after a carry. */
  private pickedOn = 1
  private toastBox: Phaser.GameObjects.Container | null = null
  /** The zone under everything here: a press above the panel on anything else is a button's, not the map's. */
  private catcher!: Phaser.GameObjects.Zone
  private gestures!: MapGestures
  private zoomButtons!: ZoomButtons

  constructor() {
    super('BuildScene')
  }

  init(data: BuildData) {
    this.params = data
    // the oldest gift waits first on its own tab
    const gift = data.sim.book.gifts[0]
    this.tab = gift ? ITEMS[gift].group : 'bed'
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
    this.catcher = this.add.zone(0, 0, GAME_W, GAME_H).setOrigin(0).setInteractive()
    this.floorBar = new FloorBar(this, PANEL_DEPTH, floor => this.panelTap() && this.carry(floor))
    this.drawGrid()
    this.tint = this.params.map.add.graphics().setDepth(TINT_DEPTH)
    this.input.on('pointerdown', this.onDown, this)
    this.input.on('pointermove', this.onMove, this)
    this.input.on('pointerup', this.onUp, this)
    // with nothing held, a press on the bare map swipes and pinches it; one on a piece still picks it up, and taps go through onUp
    const { cam } = this.params
    this.gestures = new MapGestures(this.input, cam, { allow: (p, over) => !this.held && this.onMap(p, over) && !this.itemUnder(cam.toWorld(p.x, p.y)), onTap: () => {} })
    this.zoomButtons = new ZoomButtons(this, PANEL_DEPTH, dir => cam.zoomStep(dir))
    this.fitArea()
    this.showCatalog()
  }

  /** The map's area ends at the panel's top, with + and − just above that end. */
  private fitArea(): void {
    const { cam } = this.params
    cam.setArea(buildArea(this.panelTop()))
    const bottom = cam.area.y + cam.area.h
    this.zoomButtons.show(1010, bottom - 180, bottom - 70)
  }

  /** A faint line round every floor tile of the bare floor in view, each edge drawn once. */
  private drawGrid(): void {
    const { sim, room } = this.params
    const shell = sim.shellGrid()
    const floor = (x: number, y: number) => floorOf(y) === room.floor && shell.cells[y]?.[x] === 'floor'
    this.grid?.destroy()
    const g = (this.grid = this.params.map.add.graphics().setDepth(GRID_DEPTH).lineStyle(2, hex(C.ink), 0.15))
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
  private button(x: number, y: number, w: number, h: number, label: string, kind: 'primary' | 'plain', onTap: () => void, size?: number): Phaser.GameObjects.Container {
    return this.keep(addButton(this, x, y, w, h, label, kind, () => this.panelTap() && onTap(), size))
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
      this.button(EDGE + TAB_W / 2 + i * TAB_STEP, TAB_Y - lift, TAB_W, ROW_H, t(tab.label), kind, () => this.openTab(tab.group), TAB_SIZE)
    })
    this.button(GAME_W - EDGE - DONE_W / 2, TAB_Y - lift, DONE_W, ROW_H, t('done'), 'plain', () => this.close())

    const top = CARD_TOP - lift
    const { sim } = this.params
    const cardX = (i: number, n: number) => MID + (i - (n - 1) / 2) * CARD_STEP
    let pages: number
    if (this.tab === 'pets') {
      this.showPetCount(INFO_Y - lift)
      const shown = petPage(sim.pets.owned, this.page)
      this.page = shown.page
      pages = shown.pages
      shown.entries.forEach((entry, i) => ('pet' in entry ? this.petCard(entry.pet, cardX(i, shown.entries.length), top) : this.breedCard(entry.breed, cardX(i, shown.entries.length), top)))
    } else {
      this.showScore(INFO_Y - lift)
      const shown = catalogPage(this.tab, this.page, sim.services, sim.book.gifts)
      this.page = shown.page
      pages = shown.pages
      shown.entries.forEach((entry, i) => this.card(entry, cardX(i, shown.entries.length), top))
    }
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

  /** How many pets the shop keeps, out of MAX_PETS; red once full. */
  private showPetCount(y: number): void {
    const n = this.params.sim.pets.owned.length
    const full = n >= MAX_PETS
    this.keep(this.add.text(MID, y, t(full ? 'petsCountFull' : 'petsCount', { n, max: MAX_PETS }), textStyle(32, '800', full ? C.terracotta : C.soft)).setOrigin(0.5))
  }

  /** A card of the given fill, from `top` to the cards' bottom. */
  private petBox(x: number, top: number, fill: string): void {
    this.keep(this.add.graphics().fillStyle(hex(fill), 1).fillRoundedRect(x - CARD_W / 2, top, CARD_W, CARD_BOTTOM - top, 24).lineStyle(4, hex(C.ink)).strokeRoundedRect(x - CARD_W / 2, top, CARD_W, CARD_BOTTOM - top, 24))
  }

  /** A name or a breed on a card, shrunk to fit its width. */
  private cardLine(x: number, y: number, text: string, size: number, weight: '600' | '800', color: string = C.ink): void {
    const line = this.keep(this.add.text(x, y, text, textStyle(size, weight, color)).setOrigin(0.5, 1))
    line.setScale(Math.min(1, (CARD_W - 24) / line.width))
  }

  /** One of the shop's pets, on gold: its name and breed, a rename button and "Cho đi". */
  private petCard(pet: Pet, x: number, top: number): void {
    this.petBox(x, top, C.goldPale)
    this.keep(this.add.image(x, CARD_BOTTOM - OWNED.feet, petKey(pet.breed, 'sit')).setOrigin(PET_ORIGIN.x, PET_ORIGIN.y).setScale(OWNED_SCALE))
    this.cardLine(x, CARD_BOTTOM - OWNED.name, pet.name, 30, '800')
    this.cardLine(x, CARD_BOTTOM - OWNED.breed, BREED_NAME[pet.breed], 22, '600', C.soft)
    this.button(x, CARD_BOTTOM - OWNED.rename, 176, 46, t('petRename'), 'plain', () => this.namePet(pet.breed, pet), 26)
    const give = this.keep(this.add.text(x, CARD_BOTTOM - OWNED.give, t('petGive'), textStyle(24, '800', C.lanternDark)).setOrigin(0.5))
    // a little bigger than the words, for a finger
    give.setInteractive(new Phaser.Geom.Rectangle(-20, -10, give.width + 40, give.height + 20), Phaser.Geom.Rectangle.Contains).on('pointerup', () => {
      if (!this.panelTap()) return
      sound.play('tap')
      this.givePet(pet)
    })
  }

  /** A breed for sale: its price on a button, faded when the shop is full or short of money. */
  private breedCard(breed: BreedId, x: number, top: number): void {
    const { sim } = this.params
    const { price } = BREEDS[breed]
    const full = sim.pets.owned.length >= MAX_PETS
    const can = !full && sim.money >= price
    this.petBox(x, top, C.cream)
    this.keep(this.add.image(x, CARD_BOTTOM - SALE.feet, petKey(breed, 'sit')).setOrigin(PET_ORIGIN.x, PET_ORIGIN.y))
    this.cardLine(x, CARD_BOTTOM - SALE.name, BREED_NAME[breed], 28, '800')
    const buy = () => {
      if (full) this.toast(t('petsFull', { max: MAX_PETS }))
      else if (!can) this.toast(t(PROBLEM_TEXT.money, { money: formatMoney(price - sim.money) }))
      else this.namePet(breed)
    }
    this.button(x, CARD_BOTTOM - SALE.price, 186, 64, formatMoney(price), can ? 'primary' : 'plain', buy, 28).setAlpha(can ? 1 : FADED_ALPHA)
  }

  /** The name card over build mode: a new pet of `breed` to pay for, or a new name for `pet`. */
  private namePet(breed: BreedId, pet?: Pet): void {
    const { sim } = this.params
    const data: PetNameData = {
      breed,
      current: pet?.name,
      price: BREEDS[breed].price,
      onCancel: () => {},
      onDone: name => {
        if (pet) {
          sim.renamePet(pet.id, name)
          this.toast(t('petRenamed', { name: pet.name }))
        } else {
          const problem = sim.adoptPet(breed, name)
          if (problem) return this.toast(problem === 'full' ? t('petsFull', { max: MAX_PETS }) : t(PROBLEM_TEXT.money, { money: formatMoney(BREEDS[breed].price - sim.money) }))
          this.toast(t('petHome', { name: sim.pets.owned[sim.pets.owned.length - 1].name }))
        }
        this.params.onChange()
        this.showCatalog()
      },
    }
    this.scene.launch('PetNameScene', data)
  }

  /** Asks first; a pet given away is gone, with nothing paid back. */
  private givePet(pet: Pet): void {
    const data: PetGiveData = {
      pet,
      onKeep: () => {},
      onGive: () => {
        this.params.sim.giveAwayPet(pet.id)
        this.toast(t('petGone', { name: pet.name }))
        this.params.onChange()
        this.showCatalog()
      },
    }
    this.scene.launch('PetGiveScene', data)
  }

  private openTab(group: Tab): void {
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
    const start = this.centre()
    const spot = nearestSpot(sim.grid, start, s => floorOf(s.y + ITEMS[kind].h - 1) === floor && sim.canPlace(kind, s.x, s.y, false) === null) ?? start
    // not in the shop yet, so it has no id of its own
    this.hold({ item: { id: 0, kind, ...spot, flip: false, gift }, buying: true })
  }

  /** New pieces start on the free spot nearest the middle of the map's area, on the floor in view. */
  private centre(): Tile {
    const { view } = this.params.cam
    return this.params.room.worldToTile(view.cx, view.cy)
  }

  /** The item standing on the map point, or else the one drawn over it; none off view. */
  private itemUnder(w: Vec): Item | undefined {
    const { sim, room, cam } = this.params
    if (!cam.isVisible(w.x, w.y)) return undefined
    const tile = room.worldToTile(w.x, w.y)
    // the top of a tall piece covers the tile behind it
    const drawn = room.itemAt(w.x, w.y)
    // a point above or below the floor in view would land on the rows of the next floor
    return (room.onFloor(tile.y) ? sim.items.find(i => footprint(i).some(f => tileEq(f, tile))) : undefined) ?? sim.items.find(i => i.id === drawn)
  }

  /** A tap or a drag on the map: picks up the item under the point, unless a customer is using it. */
  private pickUp(w: Vec): void {
    const { sim, room } = this.params
    const item = this.itemUnder(w)
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
    this.pickedOn = this.params.room.floor
    this.ghost = this.params.map.add.image(0, 0, itemTexture(held.item.kind, held.item.turned)).setOrigin(0.5, 1).setAlpha(GHOST_ALPHA).setDepth(GHOST_DEPTH)
    this.drawGhost()
    this.readyAt = performance.now() + SETTLE_MS
    this.fitArea()
    this.showHoldRow()
  }

  /** The held piece a little above its tiles, which are teal where it can stand and red where it cannot. */
  private drawGhost(): void {
    const { item, buying } = this.held!
    const { w, h } = size(item)
    const { room } = this.params
    this.ghost!.setTexture(itemTexture(item.kind, item.turned)).setPosition(MAP_X + (item.x + w / 2) * TILE, room.rowY(item.y + h) - GHOST_LIFT_PX).setFlipX(item.flip)
    const fits = this.params.sim.canPlace(item.kind, item.x, item.y, item.flip, buying ? undefined : item.id, item.turned ?? false) === null
    this.tint.clear().fillStyle(hex(fits ? C.teal : C.lantern), TINT_ALPHA)
    for (const s of claimed(item)) this.tint.fillRect(MAP_X + s.x * TILE, room.rowY(s.y), TILE, TILE)
  }

  /** "Thôi", "Xoay", "Bán" for a piece the shop owns, and "Đặt". */
  private showHoldRow(): void {
    this.clearPanel()
    const { item, buying } = this.held!
    this.keep(addCard(this, 0, HOLD_TOP, GAME_W, GAME_H - HOLD_TOP + 60))
    const refund = formatMoney(Math.floor(ITEMS[item.kind].price / 2))
    const row: { label: string; kind: 'primary' | 'plain'; w: number; onTap: () => void }[] = buying
      ? [
          { label: t('cancel'), kind: 'plain', w: 310, onTap: () => this.cancel() },
          { label: t('turn'), kind: 'plain', w: 310, onTap: () => this.turn() },
          { label: t('place'), kind: 'primary', w: 380, onTap: () => this.place() },
        ]
      : [
          { label: t('cancel'), kind: 'plain', w: 180, onTap: () => this.cancel() },
          { label: t('turn'), kind: 'plain', w: 180, onTap: () => this.turn() },
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
    if (showPills(sim) && sim.floors > 1) this.floorBar.show(pills(sim, room.floor).filter(p => p.floor <= sim.floors), sim.ownerLook)
  }

  /** A pill tapped: the floor comes into view and the held piece moves onto it, to the nearest free spot there when its own does not fit. */
  private carry(floor: number): void {
    const { sim, room } = this.params
    const held = this.held
    if (!held || floor === room.floor || floor > sim.floors) return
    this.params.showFloor(floor)
    this.drawGrid()
    const { item, buying } = held
    const { h } = size(item)
    const moved = carryTo(item, floor)
    const fits = (s: Tile) => floorOf(s.y + h - 1) === floor && sim.canPlace(item.kind, s.x, s.y, item.flip, buying ? undefined : item.id, item.turned ?? false) === null
    const spot = fits(moved) ? moved : nearestSpot(sim.grid, moved, fits) ?? moved
    item.x = spot.x
    item.y = spot.y
    this.drawGhost()
    this.showFloorBar()
  }

  /** "Thôi": a piece of the shop stays where it was, so the view goes back to that floor. */
  private cancel(): void {
    if (!this.held?.buying && this.params.room.floor !== this.pickedOn) {
      this.params.showFloor(this.pickedOn)
      this.drawGrid()
    }
    this.letGo()
  }

  private turn(): void {
    const { held } = this
    const { room, sim } = this.params
    held!.item = clampToFloor(nextFacing(held!.item), room.floor, sim.grid.cols)
    this.drawGhost()
  }

  private place(): void {
    const { sim } = this.params
    const { item, buying } = this.held!
    const problem = !buying
      ? sim.move(item.id, item.x, item.y, item.flip, item.turned ?? false)
      : item.gift
        ? sim.placeGift(item.kind, item.x, item.y, item.flip, item.turned ?? false)
        : sim.buy(item.kind, item.x, item.y, item.flip, item.turned ?? false)
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
    this.fitArea()
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

  /** The press is above the panel and on nothing but the map, not on + or −. */
  private onMap(p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): boolean {
    return p.y < this.panelTop() && over.every(o => o === this.catcher)
  }

  private onDown(p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): void {
    this.pressAt = performance.now()
    // a second finger while the first may still pick something up: the touch is a pinch, which the map's gestures run
    if (this.drag?.pick && this.drag.p !== p) {
      this.drag = null
      return
    }
    const held = this.held?.item
    const onPill = held !== undefined && this.floorBar.shown && p.y >= PILL_BAND.top && p.y <= PILL_BAND.bottom
    this.drag = this.onMap(p, over) && !onPill ? { p, x: p.x, y: p.y, down: this.params.cam.toWorld(p.x, p.y), from: held ? { x: held.x, y: held.y } : null, pick: !held } : null
  }

  /**
   * The held piece moves by whole map tiles as far as the finger has gone on the map since it went down, and stays on the grid.
   * With nothing held, a drag that starts on an item picks it up and carries it in the same gesture.
   */
  private onMove(p: Phaser.Input.Pointer): void {
    const { drag } = this
    if (!p.isDown || !drag) return
    if (drag.pick) {
      if (Phaser.Math.Distance.Between(drag.x, drag.y, p.x, p.y) <= TAP_SLOP_PX) return
      drag.pick = false
      this.pickUp(drag.down)
      const picked = this.held?.item
      if (picked) {
        drag.from = { x: picked.x, y: picked.y }
        // picking up shortened the panel and refitted the map: the finger's travel counts from its press on the map as it now is
        drag.down = this.params.cam.toWorld(drag.x, drag.y)
      }
    }
    this.carryHeld(p)
  }

  /** Puts the held piece where the finger has carried it on the map. */
  private carryHeld(p: Phaser.Input.Pointer): void {
    const { drag, held } = this
    if (!drag?.from || !held) return
    const { cam, room, sim } = this.params
    const { x, y } = clampToFloor({ ...held.item, ...dragTile(drag.from, drag.down, cam.toWorld(p.x, p.y)) }, room.floor, sim.grid.cols)
    if (x === held.item.x && y === held.item.y) return
    held.item.x = x
    held.item.y = y
    this.drawGhost()
  }

  /** A held piece dragged near the map's left or right edge scrolls the map that way, and stays under the finger. */
  update(_: number, delta: number): void {
    const { drag, held } = this
    if (!drag?.from || !held || !drag.p.isDown) return
    const { cam } = this.params
    const { x, w } = cam.area
    const dir = drag.p.x < x + EDGE_SCROLL ? 1 : drag.p.x > x + w - EDGE_SCROLL ? -1 : 0
    if (dir === 0) return
    cam.pan(dir * EDGE_SCROLL_SPEED * delta, 0)
    this.carryHeld(drag.p)
  }

  /** A tap with nothing held picks up what stands there; the end of a drag only lets go of the finger. */
  private onUp(p: Phaser.Input.Pointer): void {
    const drag = this.drag
    this.drag = null
    if (!drag?.pick || Phaser.Math.Distance.Between(drag.x, drag.y, p.x, p.y) > TAP_SLOP_PX) return
    this.pickUp(this.params.cam.toWorld(p.x, p.y))
  }

  /** Takes down what was drawn on the map and gives the map back its full area, where it was. */
  private close(): void {
    this.gestures.destroy()
    this.grid?.destroy()
    this.tint.destroy()
    this.ghost?.destroy()
    this.params.cam.setArea(MAP_VIEW)
    this.params.onClose()
    this.scene.stop()
  }
}
