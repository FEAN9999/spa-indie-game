import type { SaveData } from '../sim/save'
import type { SaveStore, SlotId } from './store'

/**
 * The only thing that writes the shop. Every reload goes through it and closes it first,
 * so a save that fires during the reload (pagehide, the autosave timer) cannot overwrite
 * the slot just switched to or the shop just imported.
 */
export class SaveSession {
  readonly slot: SlotId
  private closed = false

  constructor(
    private readonly store: SaveStore,
    private readonly current: () => SaveData,
    private readonly reload: () => void,
  ) {
    this.slot = store.currentSlot()
  }

  saveNow(): void {
    if (!this.closed) this.store.save(this.slot, this.current())
  }

  switchTo(slot: SlotId): void {
    if (this.closed) return
    this.saveNow()
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
    this.saveNow()
    this.leave()
  }

  private leave(): void {
    this.closed = true
    this.reload()
  }
}
