import type { SaveData } from '../../src/sim/save'
import type { KeyValueStorage } from '../../src/save/store'
import { busyShop } from '../sim/helpers'

export class MemStorage implements KeyValueStorage {
  readonly map = new Map<string, string>()
  getItem(key: string): string | null {
    return this.map.get(key) ?? null
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value)
  }
  removeItem(key: string): void {
    this.map.delete(key)
  }
}

/** A busy shop's save with the given money, so tests can tell shops apart. */
export const shop = (money: number): SaveData => ({ ...busyShop().toSave(), money })
