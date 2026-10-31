import * as Phaser from 'phaser'
import { itemTexture } from '../art/furniture'
import { houseKey } from '../art/houses'
import { C } from '../art/palette'
import { FLOOR_ROWS, GAME_W, HOUSE_PRICE, MAP_X, MAP_Y, SHOP_X0, TILE } from '../config'
import { FESTIVALS, type FestivalId } from '../sim/festivals'
import { floorOf } from '../sim/floors'
import { isUpright, layerOf, size, workTile, type Item } from '../sim/items'
import { NO_HOUSES, type House, type Houses } from '../sim/layout'
import type { PlaceId } from '../sim/places'
import type { Stars } from '../sim/rank'
import type { Tile, Vec } from '../sim/types'
import { formatMoney } from '../strings/format'
import { t } from '../strings/vi'
import { mapBounds } from './camera'
import { FESTIVAL_COLORS } from './festivals'
import { deskCandle, retagFloors } from './floors'
import { forSale, houseImageX, houseRect, housesBetween, houseTextureKey, innerFloor, saleTextureKey } from './houses'
import { starPoints } from './rankDraw'
import { textStyle } from './text'
import { daylight } from './daylight'

/** Rugs lie on the floor and the bought houses, under the mats, the bed slots and the stairs. */
const RUG_DEPTH = 0.8
/** Lanterns, mats and bed slots lie on the room, under everything standing on it. */
const PART_DEPTH = 1
/** Wall pieces hang over the wall and its mats and slots, under the beds' lanterns. */
const WALL_DEPTH = 1.2
/** A bed's lantern hangs in front of any wall piece behind it. */
const LANTERN_DEPTH = 1.3
/** A festival's bunting and sign hang on the back wall, over the bed slots and under everything standing in the room. */
const FESTIVAL_DEPTH = 1.5
/** The sign's centre and top in tiles: on floor 1's wall over the third and fourth bed spots, hung low enough to cover the clock. */
const SIGN = { x: 19.8, top: 0.5, h: 0.72, pad: 0.36 }
/** Where the bunting starts and ends on a wall, in tiles. */
const WALL = { left: 12.3, right: 24.7, top: 0.1 }
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
/** An item draws just under a character whose feet are on its bottom row, however late it was bought. */
const ITEM_DEPTH_BIAS = -0.5
/** The neighbour houses lie over the room's edges and under its lanterns, mats and bed slots. */
const HOUSE_DEPTH = 0.5
/** A house for sale's sign: its middle row in tiles, and its size in pixels. */
const SALE_SIGN = { y: 14, w: 300, h: 170 }
/** How far buying a house lifts its roof, and how long the roof, the dust and the new house take, in ms. */
const PURCHASE = { rise: 60, roofMs: 400, dustMs: 500, fadeInMs: 300 }
/** A house for sale's roof or its sign. */
type SalePart = Phaser.GameObjects.Image | Phaser.GameObjects.Container

/** The grade plaque beside the door: its middle in tiles, and the board's half-height, which sets its depth. */
const PLAQUE = { x: 16.3, y: 17.5, bottom: 28 }
/**
 * The rival's sign stands on floor 1's sidewalk against the right edge, its board clear of today's line in the middle of the same band:
 * its right edge and board in pixels, its middle row in tiles.
 */
const RIVAL_SIGN = { right: GAME_W - 16, y: 19.1, w: 230, h: 100, top: -60 }
/** The dark of a power cut lies over the room and everyone in it, under the floating money and the HUD; the candles and off marks over it. */
const DARK_DEPTH = 5000
const DARK = { color: 0x1e2440, alpha: 0.48 }
/** The candles' places in tiles, the same on every floor: on the desk (where the oldest desk stands today, moved in sync), on the tea table under the waiting bench, in the corner by the first bed's foot, by the stairs. */
const CANDLES = [
  { x: 21.5, y: 13.9 },
  { x: 16, y: 15.3 },
  { x: 13.5, y: 5.6 },
  { x: 23.2, y: 11.1 },
]
/** The day's light lies over the room and everyone in it, under the power cut's dark; the lamps' glows and the shop's warm light over it. */
const NIGHT_DEPTH = DARK_DEPTH - 3
const LAMP_DEPTH = DARK_DEPTH - 2
/** At night the lit shop's rows are lifted by this much warm light over the street's. */
const WASH_ALPHA = 0.07
/** Each texture's lamps, in its own tiles from its top-left (mirrored when it is flipped), with the glow's scale. */
const LAMPS: Record<string, { x: number; y: number; s: number }[]> = {
  lantern: [{ x: 0.5, y: 0.55, s: 0.6 }],
  nailDesk: [{ x: 0.42, y: 1.42, s: 0.5 }],
  'nailDesk-turned': [{ x: 1.84, y: 1.44, s: 0.5 }],
  bambooLamp: [{ x: 0.5, y: 0.56, s: 0.7 }],
  'decor-lanternString': [0.51, 1.31, 2.11].map(y => ({ x: 0.62, y, s: 0.4 })),
}
/** Floor 2's lantern on the back wall, in tiles. */
const WALL_LANTERN = { x: SHOP_X0 + 6.5, y: 0.74, s: 0.7 }
/** The door's light spilling onto floor 1's sidewalk: its row in tiles, and the glow's scale. */
const DOOR_LIGHT = { y: FLOOR_ROWS + 0.4, s: 1.2 }

/** How far over a machine's footprint its off mark sits, in tiles. */
const OFF_MARK_LIFT = 0.3

/** The stairs' top-left tile, where the 1 × 3 'stairs' texture goes; the rope hangs on its bottom tile. */
const STAIRS_TILE = { x: 23, y: 7 }

/** One item on screen, with a bed's lantern or a rattan bench's mat. */
interface ItemSprite {
  body: Phaser.GameObjects.Image
  part: Phaser.GameObjects.Image | null
  /** The floor the item stands on. */
  floor: number
  /** The item is stood on its side; a bench's mat is not drawn then. */
  turned: boolean
  /** The part is a bed's lantern, which hangs on floor 1's wall only. */
  lantern: boolean
}

/** Draws one floor of the room at a time: the stairs, and one sprite per item on it; converts between tiles and world pixels. */
export class RoomView {
  /** The floor on view, from 1. */
  floor = 1
  private readonly room: Phaser.GameObjects.Image
  private readonly stairs: Phaser.GameObjects.Image
  private readonly rope: Phaser.GameObjects.Image
  /** The pigeon coop over the rooftop's stairs cells. */
  private readonly coop: Phaser.GameObjects.Image
  private readonly items = new Map<number, ItemSprite>()
  private readonly slots = new Map<string, Phaser.GameObjects.Image>()
  /** The item build mode is carrying, kept hidden across syncs. */
  private hidden: number | null = null
  private festival: FestivalId | null = null
  private readonly bunting: Phaser.GameObjects.Graphics
  private readonly sign: Phaser.GameObjects.Text
  private readonly rival: Phaser.GameObjects.Container
  private rivalOn = false
  private readonly plaque: Phaser.GameObjects.Container
  private readonly plaqueStars: Phaser.GameObjects.Graphics
  private readonly dark: Phaser.GameObjects.Rectangle
  private readonly candles: Phaser.GameObjects.Image[] = []
  private offMarks: Phaser.GameObjects.Image[] = []
  /** The day's light over the map, the lit shop's warm light, and one glow per lamp shown, on the floor in view. */
  private readonly night: Phaser.GameObjects.Rectangle
  private readonly wash: Phaser.GameObjects.Rectangle
  private readonly wallLantern: Phaser.GameObjects.Image
  private readonly doorLight: Phaser.GameObjects.Image
  private lampGlows: Phaser.GameObjects.Image[] = []
  /** The power cut's floor and machine tiles as last drawn, or 'off', so a frame without a change draws nothing. */
  private powerKey = ''
  /** The neighbour houses bought, whose floors are drawn over the room's edges. */
  private houses: Houses = NO_HOUSES
  /** One image per bought house, by its key. */
  private readonly houseImages = new Map<string, Phaser.GameObjects.Image>()
  /** The roof and sign of each house for sale, by its key. */
  private readonly sales = new Map<string, SalePart[]>()

  /** `place` is where the shop is, null for the main shop: the beach has its own floor 1, and a branch has no rank plaque. */
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly place: PlaceId | null,
  ) {
    this.room = scene.add.image(MAP_X + SHOP_X0 * TILE, MAP_Y, this.groundRoom()).setOrigin(0, 0).setDepth(0)
    this.bunting = scene.add.graphics().setDepth(FESTIVAL_DEPTH)
    this.sign = scene.add.text(0, 0, '', textStyle(25)).setOrigin(0.5).setDepth(FESTIVAL_DEPTH)
    this.rival = this.rivalSign()
    this.plaqueStars = scene.add.graphics()
    this.plaque = this.plaqueBoard()
    this.dark = scene.add.rectangle(MAP_X + SHOP_X0 * TILE, MAP_Y, this.room.width, this.room.height, DARK.color, DARK.alpha).setOrigin(0, 0).setDepth(DARK_DEPTH).setVisible(false)
    this.night = scene.add.rectangle(MAP_X + SHOP_X0 * TILE, MAP_Y, this.room.width, this.room.height, 0, 0).setOrigin(0, 0).setDepth(NIGHT_DEPTH).setVisible(false)
    this.wash = scene.add.rectangle(MAP_X + SHOP_X0 * TILE, MAP_Y, this.room.width, FLOOR_ROWS * TILE, hex(C.glow)).setOrigin(0, 0).setDepth(LAMP_DEPTH).setBlendMode(Phaser.BlendModes.ADD).setVisible(false)
    this.wallLantern = this.glow(MAP_X + WALL_LANTERN.x * TILE, MAP_Y + WALL_LANTERN.y * TILE, WALL_LANTERN.s)
    this.doorLight = this.glow(0, MAP_Y + DOOR_LIGHT.y * TILE, DOOR_LIGHT.s)
    for (const c of CANDLES) {
      const at = { x: MAP_X + c.x * TILE, y: MAP_Y + c.y * TILE }
      this.candles.push(scene.add.image(at.x, at.y, 'fx-glow').setDepth(DARK_DEPTH + 1).setVisible(false))
      // the candle's texture has its 0,0 between the flame and the body, on the glow's centre
      this.candles.push(scene.add.image(at.x, at.y, 'fx-candle').setOrigin(0.5, 31 / 54).setDepth(DARK_DEPTH + 2).setVisible(false))
    }
    this.stairs = scene.add.image(MAP_X + STAIRS_TILE.x * TILE, this.rowY(STAIRS_TILE.y), 'stairs').setOrigin(0, 0).setDepth(PART_DEPTH).setVisible(false)
    // under whoever stands on the foot below it, over whoever is on the stairs
    this.rope = scene.add.image(MAP_X + STAIRS_TILE.x * TILE, this.rowY(STAIRS_TILE.y + 2), 'stairsRope').setOrigin(0, 0).setDepth(this.rowY(STAIRS_TILE.y + 3) + ITEM_DEPTH_BIAS).setVisible(false)
    // Over whoever is on the stairs cells or lifted by a climb (they go behind it), one pixel under whoever stands on the foot, whose depth is the foot's bottom edge.
    this.coop = scene.add.image(MAP_X + 22.75 * TILE, this.rowY(6), 'coop').setOrigin(0, 0).setDisplaySize(1.5 * TILE, 4 * TILE).setDepth(this.rowY(STAIRS_TILE.y + 4) - 1).setVisible(false)
  }

  /**
   * Lays each bought house's floor beside the room and each house for sale's roof with its sign, and widens the power cut's dark to the
   * bought houses. `justBought` lifts its roof off in a puff of dust and fades the new house in.
   */
  setHouses(bought: Houses, shown: Houses, justBought: House | null = null): void {
    this.houses = bought
    const b = mapBounds(bought)
    this.dark.setPosition(b.x, b.y).setSize(b.w, this.room.height)
    this.night.setPosition(b.x, b.y).setSize(b.w, this.room.height)
    this.wash.setPosition(b.x, b.y).setSize(b.w, FLOOR_ROWS * TILE)
    const just = justBought && houseKey(justBought)
    for (const h of housesBetween(NO_HOUSES, bought)) {
      const key = houseKey(h)
      if (this.houseImages.has(key)) continue
      const image = this.scene.add.image(houseImageX(h), MAP_Y, houseTextureKey(this.place, h, this.floor)).setOrigin(0, 0).setDepth(HOUSE_DEPTH).setFlipX(h.side === 'left')
      this.houseImages.set(key, image)
      if (key === just) this.purchase(h, image)
    }
    const selling = forSale(bought, shown)
    const keys = new Set<string>(selling.map(houseKey))
    for (const [key, parts] of this.sales) {
      if (keys.has(key)) continue
      this.sales.delete(key)
      if (key === just) this.liftRoof(parts)
      else for (const p of parts) p.destroy()
    }
    for (const h of selling) if (!this.sales.has(houseKey(h))) this.sales.set(houseKey(h), this.saleParts(h))
  }

  /** A house for sale's roof over its six columns, and its sign: BÁN NHÀ, CHÍNH CHỦ and the price. */
  private saleParts(h: House): SalePart[] {
    const r = houseRect(h)
    const roof = this.scene.add.image(r.x, r.y, saleTextureKey(this.place, h)).setOrigin(0, 0).setDepth(HOUSE_DEPTH).setFlipX(h.side === 'left')
    const { w, h: bh } = SALE_SIGN
    const g = this.scene.add.graphics().fillStyle(0xffffff, 1).fillRoundedRect(-w / 2, -bh / 2, w, bh, 16).lineStyle(6, hex(C.lantern)).strokeRoundedRect(-w / 2, -bh / 2, w, bh, 16)
    const big = this.scene.add.text(0, -42, t('saleSign1'), textStyle(46, '800', C.lantern)).setOrigin(0.5)
    const small = this.scene.add.text(0, 8, t('saleSign2'), textStyle(26, '800')).setOrigin(0.5)
    const price = this.scene.add.text(0, 50, formatMoney(HOUSE_PRICE[h.n - 1]), textStyle(28, '800', C.soft)).setOrigin(0.5)
    const sign = this.scene.add.container(r.x + r.w / 2, MAP_Y + SALE_SIGN.y * TILE, [g, big, small, price]).setDepth(HOUSE_DEPTH + 0.1)
    return [roof, sign]
  }

  /** The roof and sign of a house just bought rise and fade, then go. */
  private liftRoof(parts: SalePart[]): void {
    this.scene.tweens.add({
      targets: parts,
      y: `-=${PURCHASE.rise}`,
      alpha: 0,
      duration: PURCHASE.roofMs,
      onComplete: () => parts.forEach(p => p.destroy()),
    })
  }

  /** Sand-coloured dust rises along the old wall column while the new house fades in after the roof is off. */
  private purchase(h: House, image: Phaser.GameObjects.Image): void {
    image.setAlpha(0)
    this.scene.tweens.add({ targets: image, alpha: 1, delay: PURCHASE.roofMs, duration: PURCHASE.fadeInMs })
    // the old wall column's middle: the image's left edge on the right, its right edge on the left
    const x = h.side === 'right' ? image.x : image.x + image.width
    for (let i = 0; i < 8; i++) {
      const puff = this.scene.add.circle(x, MAP_Y + (2.5 + i * 2) * TILE, 14 + ((i * 5) % 9), hex(C.sand)).setDepth(DARK_DEPTH - 1)
      this.scene.tweens.add({ targets: puff, y: `-=${PURCHASE.rise}`, alpha: 0, duration: PURCHASE.dustMs, onComplete: () => puff.destroy() })
    }
  }

  /** Floor 1's room: the place's own at a branch, or the main shop's. */
  private groundRoom(): string {
    return this.place ? `room-${this.place}` : 'room'
  }

  /** Shows `floor`: its room, the stairs, the coop on the rooftop, and the rope when it is the top open floor with another to open. The caller syncs afterwards. */
  setFloor(floor: number, floors: number, maxFloors: number): void {
    this.floor = floor
    this.room.setTexture(floor === 1 ? this.groundRoom() : floor === 2 ? 'room-2' : 'room-3')
    for (const h of housesBetween(NO_HOUSES, this.houses)) this.houseImages.get(houseKey(h))?.setTexture(houseTextureKey(this.place, h, floor))
    // the rooftop has the coop where the stairs are, and no rope
    this.coop.setVisible(floor === 3)
    this.stairs.setVisible(maxFloors > 1 && floor < 3)
    this.rope.setVisible(floors === floor && floor < maxFloors && floor < 3)
    this.drawFestival()
    this.rival.setVisible(this.rivalOn && floor === 1)
    this.plaque.setVisible(floor === 1 && this.place === null)
  }

  /** Stands the rival's SPA MỚI sign on floor 1's sidewalk, or takes it away. */
  setRival(on: boolean): void {
    this.rivalOn = on
    this.rival.setVisible(on && this.floor === 1)
  }

  /** Darkens the room with four candles and marks each machine bed on the floor in view, given as its top-centre tile; or lights it again. */
  setPowerOut(on: boolean, machineBeds: Tile[]): void {
    const key = on ? `${this.floor}:${machineBeds.map(t => `${t.x},${t.y}`).join(' ')}` : 'off'
    if (key === this.powerKey) return
    this.powerKey = key
    this.dark.setVisible(on)
    for (const c of this.candles) c.setVisible(on)
    for (const m of this.offMarks) m.destroy()
    this.offMarks = on
      ? machineBeds.filter(t => this.onFloor(t.y)).map(t => this.scene.add.image(MAP_X + t.x * TILE, this.rowY(t.y - OFF_MARK_LIFT), 'power-off').setDepth(DARK_DEPTH + 3))
      : []
  }

  /**
   * Lays the light of `minutes` over the map: a pale morning, a warm late afternoon, night from 19:30. From 18:30 the lamps on the floor
   * in view glow, the shop's rows are lit warmer than the street and the door's light falls on the sidewalk; not in a power cut.
   */
  setDaylight(minutes: number, powerOut: boolean, door: Tile): void {
    const d = daylight(minutes)
    const lit = powerOut ? 0 : d.lamps
    this.night.setFillStyle(d.color, d.alpha).setVisible(d.alpha > 0)
    this.wash.setAlpha(WASH_ALPHA * lit).setVisible(lit > 0)
    this.wallLantern.setAlpha(lit).setVisible(lit > 0 && this.floor === 2)
    this.doorLight.setX(MAP_X + (door.x + 0.5) * TILE).setAlpha(lit).setVisible(lit > 0 && this.floor === 1)
    for (const g of this.lampGlows) g.setAlpha(lit).setVisible(lit > 0)
  }

  /** A warm glow at (x, y) in world pixels, hidden until setDaylight lights it. */
  private glow(x: number, y: number, scale: number): Phaser.GameObjects.Image {
    return this.scene.add.image(x, y, 'fx-glow').setScale(scale).setDepth(LAMP_DEPTH).setBlendMode(Phaser.BlendModes.ADD).setVisible(false)
  }

  /** One glow per lamp on every item and bed lantern shown; setDaylight lights them. */
  private placeLamps(): void {
    for (const g of this.lampGlows) g.destroy()
    this.lampGlows = []
    for (const s of this.items.values()) {
      for (const img of [s.body, s.part]) {
        const spots = img?.visible && LAMPS[img.texture.key]
        if (!img || !spots) continue
        const top = img.getTopLeft()
        for (const p of spots) this.lampGlows.push(this.glow(top.x + (img.flipX ? img.width / TILE - p.x : p.x) * TILE, top.y + p.y * TILE, p.s))
      }
    }
  }

  /** The sign: a cream board with the new shop's name over its opening, and two balloons on strings. */
  private rivalSign(): Phaser.GameObjects.Container {
    const { w, h, top } = RIVAL_SIGN
    // each balloon's string rises from just inside the board's top corner
    const edge = w / 2
    const v = (x: number, y: number) => new Phaser.Math.Vector2(x, y)
    const string = (side: number) => new Phaser.Curves.QuadraticBezier(v((edge - 22) * side, top + 30), v((edge - 10) * side, top - 30), v((edge - 32) * side, top - 50)).getPoints(12)
    const g = this.scene.add.graphics().lineStyle(3, hex(C.ink)).strokePoints(string(-1)).strokePoints(string(1))
    for (const [side, color] of [[-1, C.lotus], [1, C.water]] as const) {
      g.fillStyle(hex(color), 1).fillEllipse((edge - 32) * side, top - 68, 40, 48).lineStyle(3, hex(C.ink)).strokeEllipse((edge - 32) * side, top - 68, 40, 48)
    }
    g.fillStyle(hex(C.cream), 1).fillRoundedRect(-edge, top, w, h, 18).lineStyle(4, hex(C.ink)).strokeRoundedRect(-edge, top, w, h, 18)
    const name = this.scene.add.text(0, top + 32, t('rivalSignName'), textStyle(36, '800', C.terracotta)).setOrigin(0.5)
    const line = this.scene.add.text(0, top + 72, t('rivalSignLine'), textStyle(24, '600', C.soft)).setOrigin(0.5)
    line.setScale(Math.min(1, (w - 28) / line.width))
    const at = { x: RIVAL_SIGN.right - edge, y: MAP_Y + RIVAL_SIGN.y * TILE }
    // whoever walks the sidewalk passes behind it: its depth is the board's bottom
    return this.scene.add.container(at.x, at.y, [g, name, line]).setDepth(at.y + top + h).setVisible(false)
  }

  /** Lights the first `stars` of the plaque's five stars gold; the rest stay pale. */
  setRank(stars: Stars): void {
    const g = this.plaqueStars.clear()
    for (let i = 0; i < 5; i++) {
      const got = i < stars
      const pts = starPoints(-60 + i * 30, 1, 13, 0.43)
      g.fillStyle(hex(got ? C.gold : C.cream), got ? 1 : 0.55).lineStyle(3, hex(C.ink), got ? 1 : 0.55).fillPoints(pts, true).strokePoints(pts, true)
    }
  }

  /** A light-wood board on two dark-wood hangers with five star slots; setRank fills the stars. */
  private plaqueBoard(): Phaser.GameObjects.Container {
    const g = this.scene.add
      .graphics()
      .lineStyle(4, hex(C.woodDark))
      .lineBetween(-52, -40, -40, -26)
      .lineBetween(52, -40, 40, -26)
      .fillStyle(hex(C.woodLight), 1)
      .fillRoundedRect(-86, -28, 172, 56, 12)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(-86, -28, 172, 56, 12)
      .fillStyle(hex(C.woodDark), 0.35)
      .fillRoundedRect(-78, -20, 156, 40, 8)
    const at = { x: MAP_X + PLAQUE.x * TILE, y: MAP_Y + PLAQUE.y * TILE }
    // whoever walks past stands in front of it: its depth is the board's bottom
    return this.scene.add.container(at.x, at.y, [g, this.plaqueStars]).setDepth(at.y + PLAQUE.bottom)
  }

  /** Hangs the festival's bunting on the walls and its sign on floor 1, or takes them down for null. */
  setFestival(festival: FestivalId | null): void {
    if (festival === this.festival) return
    this.festival = festival
    this.drawFestival()
  }

  /** Bunting along the back wall of a walled floor (not the rooftop); on floor 1 it runs to the sign from both corners. */
  private drawFestival(): void {
    const g = this.bunting.clear()
    const f = this.festival
    this.sign.setVisible(f !== null && this.floor === 1)
    if (!f || this.floor === 3) return
    const colors = FESTIVAL_COLORS[f]
    const x = (tx: number) => MAP_X + tx * TILE
    const y = (ty: number) => MAP_Y + ty * TILE
    const top = y(WALL.top)
    if (this.floor === 1) {
      const [bg, ink] = [colors[0], colors[0] === C.mustard ? C.ink : C.cream]
      this.sign.setText(t(FESTIVALS[f].sign)).setColor(ink)
      const w = this.sign.width + SIGN.pad * TILE
      const cx = x(SIGN.x)
      const signTop = y(SIGN.top)
      this.sign.setPosition(cx, signTop + (SIGN.h * TILE) / 2)
      const hook = signTop + 14
      this.flags(g, x(WALL.left), top, cx - w / 2, hook, 9, colors)
      this.flags(g, cx + w / 2, hook, x(WALL.right), top, 7, colors)
      g.fillStyle(hex(bg), 1).fillRoundedRect(cx - w / 2, signTop, w, SIGN.h * TILE, 10)
      g.lineStyle(4, hex(C.ink)).strokeRoundedRect(cx - w / 2, signTop, w, SIGN.h * TILE, 10)
    } else this.flags(g, x(WALL.left), top, x(WALL.right), top, 16, colors)
  }

  /** One string of `n` triangle flags from (x0, y0) to (x1, y1), sagging between, in the two colours by turns. */
  private flags(g: Phaser.GameObjects.Graphics, x0: number, y0: number, x1: number, y1: number, n: number, colors: [string, string]): void {
    const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(x0, y0), new Phaser.Math.Vector2((x0 + x1) / 2, (y0 + y1) / 2 + 52), new Phaser.Math.Vector2(x1, y1))
    g.lineStyle(4, hex(C.ink)).strokePoints(curve.getPoints(24))
    for (let i = 0; i < n; i++) {
      const p = curve.getPoint((i + 0.5) / n)
      g.fillStyle(hex(colors[i % 2]), 1).fillTriangle(p.x - 14, p.y, p.x + 14, p.y, p.x, p.y + 34)
      g.lineStyle(3, hex(C.ink)).strokeTriangle(p.x - 14, p.y, p.x + 14, p.y, p.x, p.y + 34)
    }
  }

  /** Whether grid row `y` is on the floor in view. */
  onFloor(y: number): boolean {
    return floorOf(y) === this.floor
  }

  /** World y of the top of grid row `y`, on the floor in view. */
  rowY(y: number): number {
    return MAP_Y + (y - (this.floor - 1) * FLOOR_ROWS) * TILE
  }

  /** Creates, moves, turns, flips and removes the item sprites to match `items`, and shows the bed slots that are open. */
  sync(items: Item[], slots: { tile: Tile; open: boolean }[]): void {
    const ids = new Set(items.map(i => i.id))
    for (const [id, s] of this.items) {
      if (ids.has(id)) continue
      s.body.destroy()
      s.part?.destroy()
      this.items.delete(id)
    }
    retagFloors(this.items, items)
    for (const item of items) {
      const s = this.items.get(item.id) ?? this.addItem(item)
      const { w, h } = size(item)
      const bottom = this.rowY(item.y + h)
      const key = itemTexture(item.kind, item.turned)
      if (s.body.texture.key !== key) s.body.setTexture(key)
      s.turned = item.turned === true
      // an upright piece draws on its top row's depth, so whoever stands on its lower rows is in front of it
      const depth = isUpright(item) ? this.rowY(item.y + 1) : bottom
      const layer = layerOf(item.kind)
      s.body.setPosition(MAP_X + (item.x + w / 2) * TILE, bottom).setDepth(layer === 'rug' ? RUG_DEPTH : layer === 'wall' ? WALL_DEPTH : depth + ITEM_DEPTH_BIAS).setFlipX(item.flip)
      const work = workTile(item)
      if (work) s.part?.setPosition(MAP_X + work.x * TILE, this.rowY((floorOf(item.y) - 1) * FLOOR_ROWS))
      else if (s.part) this.placeMat(s.part, item)
    }
    for (const { tile, open } of slots) {
      const key = `${tile.x},${tile.y}`
      let slot = this.slots.get(key)
      if (!slot) {
        // its top-left is half a tile left of and one tile above the head tile
        slot = this.scene.add.image(MAP_X + (tile.x - 0.5) * TILE, this.rowY(tile.y - 1), 'bedSlot').setOrigin(0, 0).setDepth(PART_DEPTH)
        this.slots.set(key, slot)
      }
      slot.setVisible(open && this.floor === 1)
    }
    const desk = items.filter(i => i.kind === 'desk' && floorOf(i.y) === 1).reduce<Item | null>((old, i) => (!old || i.id < old.id ? i : old), null)
    if (desk) {
      const c = deskCandle(desk)
      for (const candle of this.candles.slice(0, 2)) candle.setPosition(MAP_X + c.x * TILE, MAP_Y + c.y * TILE)
    }
    this.hide(this.hidden)
  }

  /** Hides one item, with its lantern or mat, while build mode carries it; null shows every item. */
  hide(id: number | null): void {
    this.hidden = id
    for (const [key, s] of this.items) {
      const shown = key !== id && s.floor === this.floor
      s.body.setVisible(shown)
      s.part?.setVisible(shown && (!s.lantern || s.floor === 1) && !s.turned)
    }
    this.placeLamps()
  }

  /** The item whose picture covers the point, the one drawn in front where several do, among those `allow` lets through; null when none does. */
  itemAt(x: number, y: number, allow: (id: number) => boolean = () => true): number | null {
    let front: { id: number; depth: number } | null = null
    for (const [id, s] of this.items) {
      if (s.floor === this.floor && allow(id) && s.body.getBounds().contains(x, y) && (!front || s.body.depth > front.depth)) front = { id, depth: s.body.depth }
    }
    return front?.id ?? null
  }

  private addItem(item: Item): ItemSprite {
    const add = this.scene.add
    const body = add.image(0, 0, itemTexture(item.kind, item.turned)).setOrigin(0.5, 1)
    const partKey = item.kind === 'bed' ? 'lantern' : item.kind === 'bench' ? 'benchMat' : null
    const part = partKey ? add.image(0, 0, partKey).setOrigin(0, 0).setDepth(partKey === 'lantern' ? LANTERN_DEPTH : PART_DEPTH) : null
    const s = { body, part, floor: floorOf(item.y), turned: item.turned === true, lantern: partKey === 'lantern' }
    this.items.set(item.id, s)
    return s
  }

  /** The mat's top-left is half a tile left of and above the bench; whatever reaches past the floor is cut off. */
  private placeMat(mat: Phaser.GameObjects.Image, bench: Item): void {
    const x = bench.x - 0.5
    const y = bench.y - 0.5
    const floor = innerFloor(this.houses)
    const left = Math.max(x, floor.left)
    const top = Math.max(y, floor.top)
    const right = Math.min(x + mat.width / TILE, floor.right)
    const bottom = Math.min(y + mat.height / TILE, floor.bottom)
    mat.setPosition(MAP_X + x * TILE, this.rowY(y)).setCrop((left - x) * TILE, (top - y) * TILE, (right - left) * TILE, (bottom - top) * TILE)
  }

  /** Bottom-centre of the tile, in world pixels. */
  tileToWorld(t: Vec): { x: number; y: number } {
    return { x: MAP_X + (t.x + 0.5) * TILE, y: this.rowY(t.y + 1) }
  }

  worldToTile(x: number, y: number): Tile {
    return { x: Math.floor((x - MAP_X) / TILE), y: Math.floor((y - MAP_Y) / TILE) + (this.floor - 1) * FLOOR_ROWS }
  }
}
