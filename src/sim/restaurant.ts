import { beautyOf, ITEMS, type Item, type ItemKind } from './items'
import { placementProblem, sellRefund, type BuildProblem } from './build'
import { DINING_SHELL, DINING_START } from './dining'
import { buildGrid, parseLayout, type Grid } from './grid'
import { towerOf } from './floors'
import { NO_HOUSES, widen, withHouses, type Houses } from './layout'
import type { Rng } from './rng'
import type { SpaSim } from './spa'

/** What the restaurant takes from the spa: the purse, the clock, the day and the power cut. */
export type RestaurantHost = Pick<SpaSim, 'purse' | 'clock' | 'day' | 'powerOut'>

/** What the view hears from the restaurant; it grows with the diners and the cooking. */
export type RestaurantEvent = { type: 'roomChanged' }

/** The restaurant beside the spa: its own room, grid, furniture and stream, paid from the spa's purse. */
export class RestaurantSim {
  items: Item[]
  grid: Grid
  readonly floors = 1
  readonly houses: Houses = NO_HOUSES
  private readonly host: RestaurantHost
  private readonly rng: Rng
  private readonly autoSpawn: boolean
  private shell: Grid | null = null
  private nextItemId: number
  private events: RestaurantEvent[] = []

  constructor({ host, rng, autoSpawn }: { host: RestaurantHost; rng: Rng; autoSpawn: boolean }) {
    this.host = host
    this.rng = rng
    this.autoSpawn = autoSpawn
    this.items = DINING_START.map((it, i) => ({ ...it, id: i + 1 }))
    this.nextItemId = this.items.length + 1
    this.grid = buildGrid(this.shellGrid(), this.items, this.floors)
  }

  get money(): number {
    return this.host.purse.money
  }

  get day(): number {
    return this.host.day
  }

  /** The bare room, walls and door and stairs, parsed once. */
  shellGrid(): Grid {
    return (this.shell ??= parseLayout(towerOf(withHouses(widen(DINING_SHELL), NO_HOUSES))))
  }

  beauty(): number {
    return beautyOf(this.items)
  }

  canPlace(kind: ItemKind, x: number, y: number, flip: boolean, movingId?: number, turned = false): BuildProblem | null {
    const item = { id: movingId ?? this.nextItemId, kind, x, y, flip, ...(turned && { turned }) }
    return placementProblem('restaurant', this.shellGrid(), this.items, item, { door: this.grid.door, floors: this.floors })
  }

  buy(kind: ItemKind, x: number, y: number, flip: boolean, turned = false): BuildProblem | null {
    const price = ITEMS[kind].price
    if (this.money < price) return 'money'
    const problem = this.canPlace(kind, x, y, flip, undefined, turned)
    if (problem) return problem
    this.host.purse.money -= price
    this.items.push({ id: this.nextItemId++, kind, x, y, flip, ...(turned && { turned }) })
    this.changeRoom()
    return null
  }

  /** Free; the item keeps its id. */
  move(id: number, x: number, y: number, flip: boolean, turned = false): BuildProblem | null {
    const item = this.itemById(id)
    if (this.isBusy(id)) return 'busy'
    const problem = this.canPlace(item.kind, x, y, flip, id, turned)
    if (problem) return problem
    Object.assign(item, { x, y, flip })
    if (turned) item.turned = true
    else delete item.turned
    this.changeRoom()
    return null
  }

  /** Refunds half the price; the restaurant always keeps one stove, one table and one chair. */
  sell(id: number): BuildProblem | null {
    const { kind } = this.itemById(id)
    if (this.isBusy(id)) return 'busy'
    if ((kind === 'stove' || kind === 'diningTable' || kind === 'diningChair') && this.items.filter(i => i.kind === kind).length === 1) return 'lastDining'
    this.host.purse.money += sellRefund(kind)
    this.items = this.items.filter(i => i.id !== id)
    this.changeRoom()
    return null
  }

  /** Nobody uses a piece yet; the owner's cooking and the diners fill this in. */
  isBusy(id: number): boolean {
    this.itemById(id)
    return false
  }

  drainEvents(): RestaurantEvent[] {
    const out = this.events
    this.events = []
    return out
  }

  private itemById(id: number): Item {
    const item = this.items.find(i => i.id === id)
    if (!item) throw new Error(`No item ${id}`)
    return item
  }

  private changeRoom(): void {
    this.grid = buildGrid(this.shellGrid(), this.items, this.floors)
    this.events.push({ type: 'roomChanged' })
  }
}
