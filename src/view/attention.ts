import type { AwayResult } from '../sim/away'
import type { BadgeId } from '../sim/badges'
import type { SimEvent } from '../sim/types'
import type { GoldCard } from './festivals'

/** What can lie over the shop and hold it still: a card or panel, the shutter of a switch of shops, the welcome-back card, or the wait for a newer version. */
export type Cover = 'panel' | 'shutter' | 'away' | 'update'

/** What the shop under the covers is doing, read whenever a card asks. */
export interface ShopState {
  paused: boolean
  dayOver: boolean
  /** A service or a bowl is being played. */
  playing: boolean
  /** A lesson is open over the services panel, with or without its practice game. */
  lesson: boolean
  /** The spot under the top bar is taken: a gold card, the morning banner or a Phây notice is up, or the first day's tour points there. */
  topBusy: boolean
}

export type Inspected = Extract<SimEvent, { type: 'inspected' }>
export type StairsCleared = Extract<SimEvent, { type: 'stairsCleared' }>

/** Something waiting for the player until the shop is free for it. */
export type Held =
  | { kind: 'away'; back: AwayResult }
  | { kind: 'wear'; text: string }
  | { kind: 'stairs'; note: StairsCleared }
  | { kind: 'inspection'; note: Inspected }
  | { kind: 'found'; text: string }
  | { kind: 'gold'; card: BadgeId | GoldCard }

/** The order things are let out in; within a kind, first held first. */
const ORDER: readonly Held['kind'][] = ['away', 'wear', 'stairs', 'inspection', 'found', 'gold']
/** Kinds of which only the latest waits: a later one replaces it. */
const LATEST_ONLY: readonly Held['kind'][] = ['wear', 'stairs', 'inspection', 'found']
/** What the main shop keeps for the owner while she is at a branch; the rest stays with the shop it came from. */
const MAIN_ONLY: readonly Held['kind'][] = ['gold', 'inspection']

/**
 * Who may have the player's attention: the covers over the shop, and the cards and toasts waiting for it to be free.
 * The welcome-back card shows over a panel, the pause card and the summary, though not over a game, a lesson, the shutter or the update check;
 * everything else waits until nothing covers the shop and it is neither paused, over for the day nor being played, and a gold card also for the top spot.
 */
export class Attention {
  private readonly covers: { cover: Cover }[] = []
  private readonly held: Held[] = []
  /** At a branch: the main shop's cards, kept untouched until the owner is back there. */
  private readonly aside: Held[] = []

  /** `carried` is what the last scene's `carry` handed over; `shop` is read each time a card asks. */
  constructor(
    private readonly atMain: boolean,
    carried: readonly Held[],
    private readonly shop: () => ShopState,
  ) {
    for (const h of carried) {
      if (!atMain && MAIN_ONLY.includes(h.kind)) this.aside.push(h)
      else this.hold(h)
    }
  }

  /** Lays `cover` over the shop until the returned release is called; covers nest, and a second release does nothing. */
  cover(cover: Cover): () => void {
    const token = { cover }
    this.covers.push(token)
    return () => {
      const i = this.covers.indexOf(token)
      if (i >= 0) this.covers.splice(i, 1)
    }
  }

  /** Something covers the shop: one of `covers` when any are given. */
  covered(...covers: Cover[]): boolean {
    return covers.length === 0 ? this.covers.length > 0 : this.covers.some(c => covers.includes(c.cover))
  }

  hold(h: Held): void {
    const i = LATEST_ONLY.includes(h.kind) ? this.held.findIndex(x => x.kind === h.kind) : -1
    if (i >= 0) this.held[i] = h
    else this.held.push(h)
  }

  holds(kind: Held['kind']): boolean {
    return this.held.some(h => h.kind === kind)
  }

  /** The next thing that may show now, taken out of the wait; null when nothing may. */
  next(): Held | null {
    for (const kind of ORDER) {
      const i = this.held.findIndex(h => h.kind === kind)
      if (i >= 0 && this.mayShow(kind)) return this.held.splice(i, 1)[0]
    }
    return null
  }

  /** The map can be swiped, zoomed and tapped: nothing covers it, and the shop is neither paused, over for the day nor being played. */
  mapFree(): boolean {
    const s = this.shop()
    return !this.covered() && !s.paused && !s.dayOver && !s.playing
  }

  /** Nothing else is asking for the player: the map is free, nothing waits and the top spot is clear. */
  shopFree(): boolean {
    return this.mapFree() && this.held.length === 0 && !this.shop().topBusy
  }

  /** What a switch of shops hands the next scene: the welcome-back cards, and the main shop's gold cards and inspection, whether waiting here or kept aside. */
  carry(): Held[] {
    const main = this.atMain ? this.held.filter(h => MAIN_ONLY.includes(h.kind)) : this.aside
    return [...this.held.filter(h => h.kind === 'away'), ...main]
  }

  private mayShow(kind: Held['kind']): boolean {
    if (kind === 'away') {
      const s = this.shop()
      return !s.playing && !s.lesson && !this.covered('shutter', 'away', 'update')
    }
    return this.mapFree() && (kind !== 'gold' || !this.shop().topBusy)
  }
}
