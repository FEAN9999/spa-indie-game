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
    private readonly now: () => number = () => Date.now(),
  ) {
    this.slot = store.currentSlot()
    this.known = store.raw(this.slot)
  }

  /** False once the session has closed for a reload. */
  get open(): boolean {
    return !this.closed
  }

  /** The shop in the slot in use, or null; a save that cannot be read is set aside first. Throws SaveTooNewError, leaving the slot alone, for one from a newer version. */
  load(): SaveData | null {
    this.known = this.store.raw(this.slot)
    const data = this.store.load(this.slot)
    this.known = this.store.raw(this.slot)
    return data
  }

  /** The shop in the slot cannot be rebuilt: set it aside, like one that cannot be read, so the new shop can be saved there. */
  setAside(): void {
    if (this.closed) return
    this.store.setAside(this.slot)
    this.known = this.store.raw(this.slot)
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
    this.store.save(this.slot, this.stamp(data))
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
    if (this.store.raw(this.slot) !== this.known || this.store.isTooNew(this.slot)) return false
    this.store.save(this.slot, this.stamp(this.current()))
    this.known = this.store.raw(this.slot)
    return true
  }

  /** The shop as written now: the sim never knows the real time, so it is put on at the write. */
  private stamp(data: SaveData): SaveData {
    return { ...data, savedAt: this.now() }
  }

  private leave(): void {
    this.closed = true
    this.reload()
  }
}
