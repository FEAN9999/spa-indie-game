import { LOOK_COUNTS } from '../config'
import type { Look } from './types'

export type Rng = () => number

/** mulberry32: small, fast, deterministic per seed. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let x = Math.imul(a ^ (a >>> 15), 1 | a)
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

const pick = (rng: Rng, count: number) => Math.floor(rng() * count)

export function randomLook(rng: Rng): Look {
  return {
    skin: pick(rng, LOOK_COUNTS.skin),
    hair: pick(rng, LOOK_COUNTS.hair),
    hairStyle: pick(rng, LOOK_COUNTS.hairStyle),
    shirt: pick(rng, LOOK_COUNTS.shirt),
  }
}
