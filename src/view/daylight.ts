/** The light over the shop at a minute of the day: the overlay's colour and alpha, and how lit the lamps are, from 0 to 1. */
export interface Daylight {
  color: number
  alpha: number
  lamps: number
}

/** [minute, colour, alpha], in time order: a pale morning gone by 9:00, plain day, a warm late afternoon, night from 19:30. */
const KEYS: [number, number, number][] = [
  [480, 0x9fb8d8, 0.12],
  [540, 0x9fb8d8, 0],
  [960, 0xf2a65a, 0],
  [1080, 0xf2a65a, 0.28],
  [1170, 0x1e2440, 0.58],
]
/** The lamps light between 18:30 and 19:00. */
const LAMPS = { from: 1110, to: 1140 }

const mix = (a: number, b: number, k: number) => a + (b - a) * k
const mixColor = (a: number, b: number, k: number) => [16, 8, 0].reduce((c, s) => c | (Math.round(mix((a >> s) & 255, (b >> s) & 255, k)) << s), 0)

export function daylight(minutes: number): Daylight {
  const lamps = Math.min(1, Math.max(0, (minutes - LAMPS.from) / (LAMPS.to - LAMPS.from)))
  const next = KEYS.findIndex(([m]) => m > minutes)
  if (next <= 0) {
    const [, color, alpha] = next === 0 ? KEYS[0] : KEYS[KEYS.length - 1]
    return { color, alpha, lamps }
  }
  const [m0, c0, a0] = KEYS[next - 1]
  const [m1, c1, a1] = KEYS[next]
  const k = (minutes - m0) / (m1 - m0)
  return { color: mixColor(c0, c1, k), alpha: mix(a0, a1, k), lamps }
}
