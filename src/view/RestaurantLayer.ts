import * as Phaser from 'phaser'
import { itemTexture } from '../art/furniture'
import { SCOOTER_BOX } from '../art/fx'
import { C, customerColors, ownerColors, staffColors } from '../art/palette'
import { RESTAURANT_LAMP, ROOF_LANTERNS } from '../art/restaurant'
import { ARRIVE_MS, FLOOR_ROWS, HOUSE_COLS, HOUSES_PER_SIDE, MAP_Y, SHOP_X0, TILE } from '../config'
import type { Chain } from '../sim/chain'
import type { Chef } from '../sim/chefs'
import type { Item } from '../sim/items'
import type { DishId } from '../sim/menu'
import type { Diner, RestaurantSim } from '../sim/restaurant'
import { floorOf } from '../sim/floors'
import type { Facing, Tile, Vec } from '../sim/types'
import { CHARACTER_HEIGHT_PX, CharacterView, drawPatienceBar, PATIENCE_BAR_TOP } from './CharacterView'
import { daylight } from './daylight'
import { climbPose } from './floors'
import { houseRect } from './houses'
import { LAMPS } from './lamps'
import { addGlow, DOOR_LIGHT, frontmostAt, LAMP_DEPTH, placeItemBody, WASH_ALPHA } from './RoomView'
import { DOOR_X, doorWalk, restaurantTileAt, restaurantX, rideX, walkerX, type StreetPlacement } from './street'

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
/** The restaurant's block: its 13 columns from SHOP_X0 of its own grid, like the spa's old shop. */
const BLOCK = { x: restaurantX(SHOP_X0), w: 13 * TILE }
/** The bottom-centre of the restaurant's door on floor 1, and the sidewalk's row under it, where walkers and the bike go. */
const DOOR: Vec = { x: DOOR_X.restaurant, y: MAP_Y + FLOOR_ROWS * TILE }
const WALK_Y = DOOR.y + 0.9 * TILE
/** The shop fronts lie on the ground with the rooms; the closed upper floor over the restaurant's room. */
const FRONT_DEPTH = 0
const UPPER_DEPTH = 0.1
/** The ticket and the patience bar sit over everyone on the map, like the spa's waiting marks. */
const MARK_DEPTH = 9000
/** The bottom of the ticket, just above the patience bar. */
const TICKET_BOTTOM = PATIENCE_BAR_TOP - 4
/** The ticket held up: a paper slip this size in pixels. */
const TICKET = { w: 40, h: 50 }
/** Each dish's ticket texture and the colour of its header. */
const ticketKey = (dish: DishId): string => `rest-ticket-${dish}`
const TICKET_HEADER: Record<DishId, string> = { pho: C.terracotta, banhXeo: C.mustard, che: C.leaf }
/** The bike beside the owner as on the choice card, where she is drawn 2.4 times bigger; she sits this far behind its middle and over the ground. */
const BIKE = { scale: 1 / 2.4, seatX: 7, seatY: -27 }
/** Each stove picture's lit burner, in its own tiles from its top-left, and how far the cover over it reaches. */
const FLAME: Record<string, { x: number; y: number; rx: number; ry: number }> = {
  'decor-stove': { x: 0.55, y: 0.57, rx: 0.17, ry: 0.06 },
  'decor-stove-turned': { x: 0.69, y: 1.55, rx: 0.13, ry: 0.045 },
}
const STOVE_GLOW_SCALE = 0.7
/** The glow over each of the rooftop's lanterns. */
const ROOF_GLOW_SCALE = 0.5

interface DinerSprite {
  view: CharacterView
  bar: Phaser.GameObjects.Graphics
  ticket: Phaser.GameObjects.Image
}

interface ItemSprite {
  body: Phaser.GameObjects.Image
  /** A stove's dark burner drawn over its flame in a power cut, and its warm glow at night; null for other pieces. */
  off: Phaser.GameObjects.Ellipse | null
  glow: Phaser.GameObjects.Image | null
  /** One glow per lamp of a lamp piece, lit at night like the spa's. */
  lamps: Phaser.GameObjects.Image[]
  /** The floor the piece stands on. */
  floor: number
}

/** The restaurant on the main shop's street: the old house or the bought room with its furniture, the closed lots, the diners and their tickets, the owner in it or on her bike, and its lights. */
export class RestaurantLayer {
  private readonly front: Phaser.GameObjects.Image
  private readonly upper: Phaser.GameObjects.Image
  /** The spa's right lots, nearest first, shown while the spa does not show its house there. */
  private readonly spaLots: Phaser.GameObjects.Image[] = []
  private readonly restLots: Phaser.GameObjects.Image[] = []
  private readonly items = new Map<number, ItemSprite>()
  private readonly diners = new Map<number, DinerSprite>()
  private readonly chefs = new Map<number, CharacterView>()
  private owner: CharacterView | null = null
  private ownerKey = ''
  private readonly bike: Phaser.GameObjects.Image
  private readonly wash: Phaser.GameObjects.Rectangle
  private readonly doorLight: Phaser.GameObjects.Image
  /** One glow per lantern strung over the rooftop, lit at night while it is on view. */
  private readonly roofGlows: Phaser.GameObjects.Image[]
  /** What the last sync drew from, for the hit tests. */
  private restaurant: RestaurantSim | null = null
  /** The piece build mode is carrying, kept hidden across syncs. */
  private hidden: number | null = null
  /** The floor on view, from 1; only setFloor changes it. */
  floor = 1

  constructor(private readonly scene: Phaser.Scene) {
    const add = scene.add
    this.front = add.image(BLOCK.x, MAP_Y, 'rest-old').setOrigin(0, 0).setDepth(FRONT_DEPTH)
    this.upper = add.image(BLOCK.x, MAP_Y, 'rest-upper').setOrigin(0, 0).setDepth(UPPER_DEPTH).setVisible(false)
    for (let n = 1; n <= HOUSES_PER_SIDE; n++) this.spaLots.push(add.image(houseRect({ side: 'right', n: n as 1 | 2 }).x, MAP_Y, 'lot-front').setOrigin(0, 0).setDepth(FRONT_DEPTH))
    for (let n = 0; n < HOUSES_PER_SIDE; n++) this.restLots.push(add.image(restaurantX(n * HOUSE_COLS), MAP_Y, 'lot-front').setOrigin(0, 0).setDepth(FRONT_DEPTH))
    const [bx, by, bw, bh] = SCOOTER_BOX
    this.bike = add.image(0, WALK_Y, 'fx-bike').setOrigin(-bx / bw, -by / bh).setScale(BIKE.scale).setDepth(WALK_Y).setVisible(false)
    this.wash = add.rectangle(BLOCK.x, MAP_Y, BLOCK.w, FLOOR_ROWS * TILE, hex(C.glow)).setOrigin(0, 0).setDepth(LAMP_DEPTH).setBlendMode(Phaser.BlendModes.ADD).setVisible(false)
    this.doorLight = addGlow(scene, DOOR.x, MAP_Y + DOOR_LIGHT.y * TILE, DOOR_LIGHT.s)
    this.roofGlows = ROOF_LANTERNS.map(l => addGlow(scene, BLOCK.x + l.x * TILE, MAP_Y + l.y * TILE, ROOF_GLOW_SCALE).setTint(hex(RESTAURANT_LAMP)))
    for (const dish of Object.keys(TICKET_HEADER) as DishId[]) {
      const key = ticketKey(dish)
      if (scene.textures.exists(key)) continue
      const { w, h } = TICKET
      const g = scene.make.graphics({}, false)
      g.fillStyle(hex(C.paper), 1).fillRoundedRect(2, 2, w - 4, h - 4, 6).lineStyle(3, hex(C.ink)).strokeRoundedRect(2, 2, w - 4, h - 4, 6)
      g.fillStyle(hex(TICKET_HEADER[dish]), 1).fillRect(5, 5, w - 10, 9)
      g.lineStyle(3, hex(C.soft))
      for (const y of [22, 30, 38]) g.lineBetween(9, y, y === 38 ? w - 18 : w - 9, y)
      g.generateTexture(key, w, h)
      g.destroy()
    }
  }

  /** Shows `floor`: its room, and the pieces standing on it; the people on it follow on the next sync. */
  setFloor(floor: number): void {
    this.floor = floor
    this.syncRoom()
    this.syncItems(this.restaurant?.items ?? [])
  }

  /** Draws the street's restaurant as the chain has it, on the floor in view, in the light of `minutes`; `dt` moves the figures' legs. */
  sync(chain: Chain, minutes: number, powerOut: boolean, dt: number): void {
    const r = chain.restaurant
    this.restaurant = r
    const shown = chain.main.shownHouses()
    this.spaLots.forEach((lot, i) => lot.setVisible(i + 1 > shown.right))
    this.syncRoom()
    this.syncItems(r?.items ?? [])
    this.syncDiners(r?.diners ?? [], dt)
    this.syncChefs(r?.chefs ?? [], dt)
    this.syncOwner(chain, dt)
    this.syncLight(r, minutes, powerOut)
  }

  /** The old house is still for sale and the point is on it. */
  oldHouseHit(world: Vec): boolean {
    return this.restaurant === null && world.x >= BLOCK.x && world.x < BLOCK.x + BLOCK.w && world.y >= MAP_Y && world.y < MAP_Y + this.front.height
  }

  /** The diner holding a ticket up whose figure covers the point, on the floor in view; null when none does. */
  dinerAt(world: Vec): Diner | null {
    if (!this.restaurant) return null
    return (
      this.restaurant.diners.find(d => {
        if (d.state !== 'ordering' || floorOf(d.pos.y) !== this.floor) return false
        const at = this.tileToWorld(d.pos)
        return Math.abs(world.x - at.x) <= TILE / 2 && world.y <= at.y && world.y >= at.y - CHARACTER_HEIGHT_PX
      }) ?? null
    )
  }

  // build mode's room, as RoomView has it for the spa
  /** World x of the left edge of restaurant column `x`. */
  colX(x: number): number {
    return restaurantX(x)
  }

  /** World y of the top of grid row `y`, on the floor in view. */
  rowY(y: number): number {
    return MAP_Y + (y - (this.floor - 1) * FLOOR_ROWS) * TILE
  }

  /** Whether grid row `y` is on the floor in view. */
  onFloor(y: number): boolean {
    return floorOf(y) === this.floor
  }

  /** Bottom-centre of the tile, in world pixels. */
  tileToWorld(t: Vec): Vec {
    return { x: restaurantX(t.x + 0.5), y: this.rowY(t.y + 1) }
  }

  worldToTile(x: number, y: number): Tile {
    return restaurantTileAt({ x, y }, this.floor)
  }

  /** Hides one piece while build mode carries it; null shows every piece. */
  hide(id: number | null): void {
    this.hidden = id
    for (const [key, s] of this.items) s.body.setVisible(s.floor === this.floor && key !== id)
  }

  /** The piece whose picture covers the point, the one drawn in front where several do, among those `allow` lets through; null when none does. */
  itemAt(x: number, y: number, allow: (id: number) => boolean = () => true): number | null {
    return frontmostAt(this.items, x, y, id => this.items.get(id)!.floor === this.floor && allow(id))
  }

  destroy(): void {
    for (const img of [this.front, this.upper, ...this.spaLots, ...this.restLots, this.bike, this.wash, this.doorLight, ...this.roofGlows]) img.destroy()
    for (const s of this.items.values()) for (const p of [s.body, s.off, s.glow, ...s.lamps]) p?.destroy()
    for (const s of this.diners.values()) this.dropDiner(s)
    for (const v of this.chefs.values()) v.container.destroy()
    this.owner?.container.destroy()
    this.items.clear()
    this.diners.clear()
    this.chefs.clear()
  }

  /** The room of the floor in view: floor 1's bought room or the old house, an open upper floor's own room, or the closed upper floor over floor 1's front. */
  private syncRoom(): void {
    const r = this.restaurant
    const open = r !== null && this.floor > 1 && this.floor <= r.floors
    const key = open ? `rest-room-${this.floor}` : r ? 'rest-room' : 'rest-old'
    if (this.front.texture.key !== key) this.front.setTexture(key)
    this.upper.setVisible(this.floor > 1 && !open)
  }

  /** One picture per piece, made once and moved; a stove also gets its flame cover and glow. */
  private syncItems(items: Item[]): void {
    const ids = new Set(items.map(i => i.id))
    for (const [id, s] of this.items) {
      if (ids.has(id)) continue
      for (const p of [s.body, s.off, s.glow, ...s.lamps]) p?.destroy()
      this.items.delete(id)
    }
    for (const item of items) {
      let s = this.items.get(item.id)
      if (!s) {
        const body = this.scene.add.image(0, 0, itemTexture(item.kind, item.turned)).setOrigin(0.5, 1)
        const stove = item.kind === 'stove'
        s = {
          body,
          off: stove ? this.scene.add.ellipse(0, 0, 1, 1, hex(C.deepBrown)).setVisible(false) : null,
          glow: stove ? addGlow(this.scene, 0, 0, STOVE_GLOW_SCALE).setTint(hex(RESTAURANT_LAMP)) : null,
          lamps: [],
          floor: 1,
        }
        this.items.set(item.id, s)
      }
      s.floor = floorOf(item.y)
      placeItemBody(s.body, item, restaurantX, y => this.rowY(y))
      s.body.setVisible(s.floor === this.floor && item.id !== this.hidden)
      const spots = LAMPS[s.body.texture.key] ?? []
      while (s.lamps.length > spots.length) s.lamps.pop()!.destroy()
      while (s.lamps.length < spots.length) s.lamps.push(addGlow(this.scene, 0, 0, 1))
      spots.forEach((spot, i) => {
        const top = s.body.getTopLeft()
        s.lamps[i].setPosition(top.x + (s.body.flipX ? s.body.width / TILE - spot.x : spot.x) * TILE, top.y + spot.y * TILE).setScale(spot.s)
      })
      const flame = FLAME[s.body.texture.key]
      if (flame && s.off && s.glow) {
        const top = s.body.getTopLeft()
        const x = top.x + (s.body.flipX ? s.body.width / TILE - flame.x : flame.x) * TILE
        const y = top.y + flame.y * TILE
        if (s.off.width !== 2 * flame.rx * TILE) s.off.setSize(2 * flame.rx * TILE, 2 * flame.ry * TILE)
        s.off.setPosition(x, y).setDepth(s.body.depth + 0.01)
        s.glow.setPosition(x, y)
      }
    }
  }

  /** Each diner's figure, made when they come and gone when they leave: on the sidewalk, coming in, at their chair with a ticket up and a patience bar, or going. */
  private syncDiners(diners: Diner[], dt: number): void {
    const ids = new Set(diners.map(d => d.id))
    for (const [id, s] of this.diners) {
      if (ids.has(id)) continue
      this.dropDiner(s)
      this.diners.delete(id)
    }
    for (const d of diners) {
      let s = this.diners.get(d.id)
      if (!s) {
        s = {
          view: new CharacterView(this.scene, customerColors(d.look, d.kind)),
          bar: this.scene.add.graphics().setDepth(MARK_DEPTH),
          ticket: this.scene.add.image(0, 0, ticketKey(d.dish)).setOrigin(0.5, 1).setDepth(MARK_DEPTH).setVisible(false),
        }
        this.diners.set(d.id, s)
      }
      const p = this.placeDiner(d)
      const seated = d.state === 'ordering' || d.state === 'waitingFood' || d.state === 'eating'
      const walking = d.state === 'street' || d.state === 'arriving' || d.state === 'exiting' || d.path.length > 0
      s.view.setFacing(p.facing)
      s.view.setPose(seated ? 'sit' : walking ? 'walk' : 'stand')
      const shown = this.dinerFloor(d) === this.floor
      s.view.container.setPosition(p.x, p.y).setDepth(seated ? p.y + 1 : p.y).setAlpha(p.alpha).setVisible(shown)
      s.view.update(dt)
      const ordering = d.state === 'ordering' && shown
      s.bar.clear()
      if (ordering) drawPatienceBar(s.bar, p.x, p.y, d.patienceMs / d.patienceMaxMs)
      s.ticket.setTexture(ticketKey(d.dish)).setVisible(ordering && d.chefId === null).setPosition(p.x, p.y + TICKET_BOTTOM)
    }
  }

  /** Each cook's figure, made when they are hired and gone when they leave; they walk like the owner and face the stove while they cook. */
  private syncChefs(chefs: Chef[], dt: number): void {
    const ids = new Set(chefs.map(c => c.id))
    for (const [id, view] of this.chefs) {
      if (ids.has(id)) continue
      view.container.destroy()
      this.chefs.delete(id)
    }
    for (const c of chefs) {
      let view = this.chefs.get(c.id)
      if (!view) {
        view = new CharacterView(this.scene, staffColors(c.look))
        this.chefs.set(c.id, view)
      }
      const at = this.tileToWorld(c.pos)
      // on the stairs, they rise toward the next floor and fade, here on the floor they are leaving
      const climb = climbPose(c)
      if (climb) at.y -= climb.lift * TILE
      const facing: Facing = c.task?.kind === 'cook' && c.path.length === 0 ? 'up' : c.facing
      view.setFacing(facing)
      view.setPose(c.path.length > 0 ? 'walk' : 'stand')
      view.container.setPosition(at.x, at.y).setDepth(at.y).setAlpha(climb?.alpha ?? 1).setVisible(floorOf(c.pos.y) === this.floor)
      view.update(dt)
    }
  }

  /** The floor a diner is drawn on: the street, where they walk over and in or out by the door, counts as floor 1. */
  private dinerFloor(d: Diner): number {
    return d.state === 'street' || d.state === 'arriving' || d.state === 'exiting' ? 1 : floorOf(d.pos.y)
  }

  /** Where a diner is drawn: walking over from the spa, in or out by the door, or on their tile inside, rising and fading on the stairs. */
  private placeDiner(d: Diner): StreetPlacement {
    if (d.state === 'street') return { x: walkerX(d), y: WALK_Y, facing: 'right', alpha: 1 }
    // one who walked over from the spa is at the door already, and only goes up through it
    if (d.state === 'arriving' && d.fromSpa) return { x: DOOR.x, y: WALK_Y + (DOOR.y - WALK_Y) * Math.min(1, d.stateMs / ARRIVE_MS), facing: 'up', alpha: 1 }
    if (d.state === 'arriving' || d.state === 'exiting') return doorWalk(d.state, d.stateMs, DOOR, d.id % 2 === 1)
    const p = { ...this.tileToWorld(d.pos), facing: d.facing, alpha: 1 }
    const climb = climbPose(d)
    if (climb) {
      p.y -= climb.lift * TILE
      p.alpha = climb.alpha
    }
    return p
  }

  private dropDiner(s: DinerSprite): void {
    s.view.container.destroy()
    s.bar.destroy()
    s.ticket.destroy()
  }

  /** The owner in the restaurant while she is in, or on her bike on the sidewalk while she rides between the doors. */
  private syncOwner(chain: Chain, dt: number): void {
    const main = chain.main
    const key = `${JSON.stringify(main.ownerLook)}|${main.ownerOutfit}`
    if (!this.owner || key !== this.ownerKey) {
      this.owner?.container.destroy()
      this.owner = new CharacterView(this.scene, ownerColors(main.ownerLook, main.ownerOutfit))
      this.ownerKey = key
    }
    const owner = this.owner
    const r = chain.restaurant
    const ride = chain.street?.rideProgress() ?? null
    this.bike.setVisible(ride !== null && this.floor === 1)
    if (ride) {
      const dir = ride.to === 'restaurant' ? 1 : -1
      const x = rideX(ride.to, ride.k)
      this.bike.setX(x).setFlipX(dir < 0)
      owner.setFacing(dir > 0 ? 'right' : 'left')
      owner.setPose('sit')
      owner.container.setPosition(x - BIKE.seatX * dir, WALK_Y + BIKE.seatY).setDepth(WALK_Y + 1).setAlpha(1).setVisible(this.floor === 1)
    } else if (r?.ownerIn) {
      const o = r.owner
      const at = this.tileToWorld(o.pos)
      const climb = climbPose(o)
      if (climb) at.y -= climb.lift * TILE
      // at the stove she faces it while she cooks
      const facing: Facing = o.task?.kind === 'cook' && o.path.length === 0 ? 'up' : o.facing
      owner.setFacing(facing)
      owner.setPose(o.path.length > 0 ? 'walk' : 'stand')
      owner.container.setPosition(at.x, at.y).setDepth(at.y).setAlpha(climb?.alpha ?? 1).setVisible(floorOf(o.pos.y) === this.floor)
    } else owner.container.setVisible(false)
    owner.update(dt)
  }

  /**
   * At night the bought restaurant's warm wash and the door's light on floor 1, a glow over each stove and lamp on the floor in view,
   * and one over each of the rooftop's lanterns while it is open and on view, unless the power is out; in a power cut every stove's flame is out.
   */
  private syncLight(r: RestaurantSim | null, minutes: number, powerOut: boolean): void {
    const lamps = daylight(minutes).lamps
    const lit = r !== null && lamps > 0 && !powerOut
    this.wash.setAlpha(WASH_ALPHA * lamps).setVisible(lit && this.floor === 1)
    this.doorLight.setAlpha(lamps).setVisible(lit && this.floor === 1)
    const roof = lit && this.floor === 3 && r.floors >= 3
    for (const g of this.roofGlows) g.setAlpha(lamps).setVisible(roof)
    for (const s of this.items.values()) {
      s.glow?.setAlpha(lamps).setVisible(lit && s.body.visible)
      for (const g of s.lamps) g.setAlpha(lamps).setVisible(lit && s.body.visible)
      s.off?.setVisible(powerOut && s.body.visible)
    }
  }
}
