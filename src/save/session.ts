import type { SaveData } from '../sim/save'
import type { SaveStore, SlotId } from './store'

/**
 * The only thing that writes the shop. Every reload goes through it and closes it first,
 * so a save that fires during the reload (pagehide, the autosave timer) cannot overwrite
 * the slot just switched to or the shop just imported. It also never writes over a shop
 * that another page (a second tab, the installed app sharing storage) saved since this
 * page last read or wrote the slot: it opens that newer shop instead.
 */
export class SaveSession {
  readonly slot: SlotId
  private closed = false
  /** The slot as this page last read or wrote it. */
  private known: string | null

  constructor(
    private readonly store: SaveStore,
    private readonly current: () => SaveData,
    private readonly reload: () => void,
  ) {
    this.slot = store.currentSlot()
    this.known = store.raw(this.slot)
  }

  /** The shop in the slot in use, or null; a save that cannot be read is set aside first. */
  load(): SaveData | null {
    const data = this.store.load(this.slot)
    this.known = this.store.raw(this.slot)
    return data
  }

  saveNow(): void {
    if (this.closed) return
    if (!this.write()) this.leave()
  }

  switchTo(slot: SlotId): void {
    if (this.closed) return
    this.write()
    this.store.setCurrentSlot(slot)
    this.leave()
  }

  replaceWith(data: SaveData): void {
    if (this.closed) return
    this.store.save(this.slot, data)
    this.leave()
  }

  reloadForUpdate(): void {
    if (this.closed) return
    this.write()
    this.leave()
  }

  /** For coming back to the game: open the newer shop if another page saved this slot meanwhile. */
  reloadIfChangedElsewhere(): void {
    if (!this.closed && this.store.raw(this.slot) !== this.known) this.leave()
  }

  /** Saves unless another page has written the slot since; false when it has. */
  private write(): boolean {
    if (this.store.raw(this.slot) !== this.known) return false
    this.store.save(this.slot, this.current())
    this.known = this.store.raw(this.slot)
    return true
  }

  private leave(): void {
    this.closed = true
    this.reload()
  }
}
