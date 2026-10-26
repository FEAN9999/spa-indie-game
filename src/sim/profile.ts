import { OWNER_LOOK_COUNTS } from '../config'
import { SHOP_NAME_IDEAS } from '../strings/vi'
import type { Rng } from './rng'
import type { Look } from './types'

export const SHOP_NAME_MAX = 24

export const DEFAULT_OWNER_LOOK: Look = { skin: 0, hair: 0, hairStyle: 0, shirt: 0 }

/** A shop name as stored: composed letters, single spaces, at most SHOP_NAME_MAX letters; `fallback` when nothing is left. */
export function cleanShopName(raw: string, fallback: string): string {
  const squeezed = raw.normalize('NFC').replace(/\s+/g, ' ').trim()
  return [...squeezed].slice(0, SHOP_NAME_MAX).join('').trim() || fallback
}

export function isOwnerLook(x: unknown): x is Look {
  if (typeof x !== 'object' || x === null) return false
  const o = x as Record<string, unknown>
  return (Object.keys(OWNER_LOOK_COUNTS) as (keyof Look)[]).every(k => Number.isInteger(o[k]) && (o[k] as number) >= 0 && (o[k] as number) < OWNER_LOOK_COUNTS[k])
}

/** An idea from SHOP_NAME_IDEAS other than `current`. */
export function suggestShopName(rng: Rng, current?: string): string {
  const others = SHOP_NAME_IDEAS.filter(n => n !== current)
  return others[Math.floor(rng() * others.length)]
}
