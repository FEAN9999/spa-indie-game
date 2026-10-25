import { parseSave, type SaveData } from '../sim/save'

export type SlotId = 1 | 2 | 3
export const SLOTS: SlotId[] = [1, 2, 3]

export interface SlotInfo {
  day: number
  money: number
}

export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
type Flag = 'installCardSeen'

const CURRENT = 'spa.current'
const slotKey = (slot: SlotId) => `spa.slot.${slot}`
const flagKey = (name: Flag) => `spa.${name}`

/** Three save slots and a few flags in browser storage. Never throws: a storage that fails reads as empty. */
export class SaveStore {
  constructor(private readonly storage: KeyValueStorage) {}

  currentSlot(): SlotId {
    const n = Number(this.read(CURRENT))
    return SLOTS.find(s => s === n) ?? 1
  }

  setCurrentSlot(slot: SlotId): void {
    this.write(CURRENT, String(slot))
  }

  /** The slot's shop, or null when empty. A save that cannot be read is moved aside to `.broken`. */
  load(slot: SlotId): SaveData | null {
    const raw = this.read(slotKey(slot))
    if (raw === null) return null
    try {
      return parseSave(JSON.parse(raw))
    } catch {
      this.write(`${slotKey(slot)}.broken`, raw)
      this.remove(slotKey(slot))
      return null
    }
  }

  save(slot: SlotId, data: SaveData): boolean {
    return this.write(slotKey(slot), JSON.stringify(data))
  }

  info(slot: SlotId): SlotInfo | null {
    const d = this.load(slot)
    return d && { day: d.day, money: d.money }
  }

  flag(name: Flag): boolean {
    return this.read(flagKey(name)) === '1'
  }

  setFlag(name: Flag): void {
    this.write(flagKey(name), '1')
  }

  private read(key: string): string | null {
    try {
      return this.storage.getItem(key)
    } catch {
      return null
    }
  }

  private write(key: string, value: string): boolean {
    try {
      this.storage.setItem(key, value)
      return true
    } catch {
      return false
    }
  }

  private remove(key: string): void {
    try {
      this.storage.removeItem(key)
    } catch {
      // nothing to do: the slot reads as empty either way
    }
  }
}

/** The browser's storage, or memory when the browser refuses it, so the game still runs. */
export function openStore(getStorage: () => KeyValueStorage = () => localStorage): SaveStore {
  try {
    return new SaveStore(getStorage())
  } catch {
    const mem = new Map<string, string>()
    return new SaveStore({
      getItem: k => mem.get(k) ?? null,
      setItem: (k, v) => void mem.set(k, v),
      removeItem: k => void mem.delete(k),
    })
  }
}
