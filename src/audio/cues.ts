import type { SimEvent } from '../sim/types'

export type Sfx = 'chime' | 'coin' | 'water' | 'foam' | 'star' | 'tap' | 'huff' | 'thud' | 'levelUp' | 'vip'
export type OneShot = Exclude<Sfx, 'water'>

/** Shortest gap between two plays of the same sound, in ms. 0 means no limit. */
export const SFX_THROTTLE_MS: Record<Sfx, number> = {
  chime: 500,
  coin: 60,
  water: 0,
  foam: 80,
  star: 0,
  tap: 50,
  huff: 300,
  thud: 80,
  levelUp: 500,
  vip: 500,
}

/** The sound a shop event makes, or null when it stays quiet. */
export function cueFor(e: SimEvent): OneShot | null {
  switch (e.type) {
    case 'customerArrived': return 'chime'
    case 'paid':
    case 'questDone': return 'coin'
    case 'customerLeft': return e.angry ? 'huff' : null
    case 'levelUp':
    case 'studied': return 'levelUp'
    case 'vipArrived': return 'vip'
    case 'heart': return 'star'
    default: return null
  }
}

/** Keeps a burst of the same event from becoming a wall of noise. */
export class Throttle {
  private readonly last = new Map<Sfx, number>()

  allow(name: Sfx, nowMs: number): boolean {
    const gap = SFX_THROTTLE_MS[name]
    const prev = this.last.get(name)
    if (gap > 0 && prev !== undefined && nowMs - prev < gap) return false
    this.last.set(name, nowMs)
    return true
  }
}
