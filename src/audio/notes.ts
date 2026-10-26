/** Đàn tranh tuning "Hò Xự Xang Xê Cống": semitone offsets from C4. */
export const SCALE = [0, 2, 5, 7, 9] as const
export const C4 = 261.63

/** Frequency of a scale degree: octave floor(d/5), step d mod 5. Negative degrees go below C4. */
export function noteFreq(degree: number): number {
  const octave = Math.floor(degree / SCALE.length)
  const step = degree - octave * SCALE.length
  return C4 * 2 ** (octave + SCALE[step] / 12)
}

/** Karplus-Strong plucked string: a ring of noise that loses a little energy each lap. Peak is 0.85. */
export function pluckSamples(freq: number, sampleRate: number, seconds: number, rng: () => number): Float32Array {
  const out = new Float32Array(Math.round(sampleRate * seconds))
  const line = new Float32Array(Math.max(2, Math.round(sampleRate / freq)))
  for (let i = 0; i < line.length; i++) line[i] = rng() * 2 - 1
  let head = 0
  let peak = 0
  for (let i = 0; i < out.length; i++) {
    const a = line[head]
    const b = line[(head + 1) % line.length]
    out[i] = a
    line[head] = 0.996 * 0.5 * (a + b)
    head = (head + 1) % line.length
    peak = Math.max(peak, Math.abs(a))
  }
  if (peak > 0) for (let i = 0; i < out.length; i++) out[i] = (out[i] / peak) * 0.85
  return out
}

export interface NoteEvent {
  eighth: number
  degree: number
  /** The đàn tranh "nhấn": press the string to bend the pitch up and back. */
  bend: boolean
  velocity: number
}

export const PHRASE_EIGHTHS = 32

const TOP = 9
const clampDegree = (d: number) => {
  // reflect inside 0..TOP
  if (d < 0) return -d
  if (d > TOP) return 2 * TOP - d
  return d
}

function walk(rng: () => number, startDegree: number): NoteEvent[] {
  const notes: NoteEvent[] = []
  let degree = startDegree
  // notes stop at eighth 26 so the closing passing note (27) and the last note (28-30) always have room
  for (let eighth = 0; eighth <= 26; eighth++) {
    const downbeat = eighth % 8 === 0
    if (rng() >= (downbeat ? 0.9 : 0.45)) continue
    if (notes.length > 0) {
      const r = rng()
      const size = r < 0.75 ? 1 : r < 0.9 ? 2 : 3
      degree = clampDegree(degree + (rng() < 0.5 ? -size : size))
    }
    notes.push({ eighth, degree, bend: rng() < 1 / 6, velocity: downbeat ? 0.75 + rng() * 0.15 : 0.5 + rng() * 0.25 })
  }
  return notes
}

/** One four-bar tune as a random walk on the scale that always ends on degree 0 or 5. */
export function phrase(rng: () => number, startDegree: number): NoteEvent[] {
  let notes = walk(rng, startDegree)
  for (let tries = 0; tries < 20 && (notes.length < 9 || notes.length > 21); tries++) notes = walk(rng, startDegree)
  const prev = notes[notes.length - 1]
  const target = Math.abs(prev.degree - 0) <= Math.abs(prev.degree - 5) ? 0 : 5
  if (Math.abs(prev.degree - target) > 3) {
    const toward = Math.sign(target - prev.degree)
    notes.push({ eighth: 27, degree: prev.degree + toward * 2, bend: false, velocity: 0.55 })
  }
  notes.push({ eighth: 28 + Math.floor(rng() * 3), degree: target, bend: rng() < 1 / 6, velocity: 0.8 })
  return notes
}
