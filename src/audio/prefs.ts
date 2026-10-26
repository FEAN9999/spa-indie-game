import type { KeyValueStorage } from '../save/store'

export interface SoundPrefs {
  music: boolean
  sfx: boolean
}

export const PREFS_KEY = 'spa.sound'

const flag = (v: unknown) => (typeof v === 'boolean' ? v : true)

/** Per-device music and effects choices. A missing, corrupt or failing storage reads as everything on. */
export function loadPrefs(storage: KeyValueStorage | null): SoundPrefs {
  let raw: unknown = null
  try {
    const text = storage?.getItem(PREFS_KEY)
    if (text) raw = JSON.parse(text)
  } catch {
    raw = null
  }
  const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>
  return { music: flag(o.music), sfx: flag(o.sfx) }
}

export function savePrefs(storage: KeyValueStorage | null, prefs: SoundPrefs): void {
  try {
    storage?.setItem(PREFS_KEY, JSON.stringify({ music: prefs.music, sfx: prefs.sfx }))
  } catch {
    // a full or blocked storage just means the choice is not remembered
  }
}
