/**
 * The light over the shop at a minute of the day, as colours the map is multiplied by (white leaves it as it is): `sky` over the street
 * and whatever is outdoors, `indoor` over a room whose lamps are on, `rooftop` over an open rooftop under its strings of lights; and how
 * lit the lamps are, from 0 to 1.
 */
export interface Daylight {
  sky: number
  indoor: number
  rooftop: number
  lamps: number
}

/**
 * [minute, sky], in time order: a pale morning gone by 9:00, plain day, a warm late afternoon, night from 19:30. Multiplying by these
 * darkens the street without greying it, as a dusk does, where a colour laid over it would wash it out like fog.
 */
const KEYS: [number, number][] = [
  [480, 0xf3f6fa],
  [540, 0xffffff],
  [960, 0xffffff],
  [1080, 0xf9dfc4],
  [1170, 0x4a5688],
]
/** The lamps light between 18:30 and 19:00. */
const LAMPS = { from: 1110, to: 1140 }
/** A lit room at night: the lamps' warm white. */
const LAMPLIGHT = 0xfff0dc
/** A rooftop's strings of lights take it this far from the sky towards a lit room, so who is up there still shows. */
const ROOFTOP_LIGHT = 0.5

const mix = (a: number, b: number, k: number) => a + (b - a) * k
const mixColor = (a: number, b: number, k: number) => [16, 8, 0].reduce((c, s) => c | (Math.round(mix((a >> s) & 255, (b >> s) & 255, k)) << s), 0)

function sky(minutes: number): number {
  const next = KEYS.findIndex(([m]) => m > minutes)
  if (next === 0) return KEYS[0][1]
  if (next < 0) return KEYS[KEYS.length - 1][1]
  const [m0, c0] = KEYS[next - 1]
  const [m1, c1] = KEYS[next]
  return mixColor(c0, c1, (minutes - m0) / (m1 - m0))
}

export function daylight(minutes: number): Daylight {
  const lamps = Math.min(1, Math.max(0, (minutes - LAMPS.from) / (LAMPS.to - LAMPS.from)))
  const s = sky(minutes)
  // a room is as dim as the street until its lamps come on, then as warm as they are
  return { sky: s, indoor: mixColor(s, LAMPLIGHT, lamps), rooftop: mixColor(s, LAMPLIGHT, lamps * ROOFTOP_LIGHT), lamps }
}

/** A stretch of the map's x in world pixels, from its left edge to its right. */
export type Span = [number, number]

/** One piece of a street cut by litBands. */
export interface Band {
  from: number
  to: number
  lit: boolean
}

/** The street `street` cut where the `lit` spans begin and end, left to right, each piece lit or not; the lit spans are clipped to the street and may overlap. */
export function litBands(street: Span, lit: readonly Span[]): Band[] {
  const [x0, x1] = street
  const spans = lit
    .map(([a, b]): Span => [Math.max(a, x0), Math.min(b, x1)])
    .filter(([a, b]) => b > a)
    .sort((p, q) => p[0] - q[0])
  const out: Band[] = []
  let x = x0
  for (const [a, b] of spans) {
    if (b <= x) continue
    if (a > x) out.push({ from: x, to: a, lit: false })
    const last = out[out.length - 1]
    // a span touching or overlapping the lit piece before it lengthens that piece
    if (last?.lit) last.to = b
    else out.push({ from: Math.max(a, x), to: b, lit: true })
    x = b
  }
  if (x < x1) out.push({ from: x, to: x1, lit: false })
  return out
}
