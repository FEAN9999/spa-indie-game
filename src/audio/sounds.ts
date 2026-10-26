import type { OneShot } from './cues'
import { noteFreq, pluckSamples } from './notes'

/** Length of each plucked-string buffer, in seconds. */
const PLUCK_SECONDS = 2.5
/** The end of each buffer fades to zero over this long, so cutting it never clicks. */
const PLUCK_FADE = 0.3
/** Where an exponential fall stops: about -80 dB, silent to the ear. */
const QUIET = 0.0001

/** One plucked-string buffer per degree 0..9, indexed by degree. */
export function makePlucks(ctx: BaseAudioContext, rng: () => number): AudioBuffer[] {
  const rate = ctx.sampleRate
  const fade = Math.round(rate * PLUCK_FADE)
  return Array.from({ length: 10 }, (_, degree) => {
    const samples = pluckSamples(noteFreq(degree), rate, PLUCK_SECONDS, rng)
    for (let i = 0; i < fade; i++) samples[samples.length - 1 - i] *= i / fade
    const buffer = ctx.createBuffer(1, samples.length, rate)
    buffer.getChannelData(0).set(samples)
    return buffer
  })
}

/** The pitch a pluckSamples buffer really rings at: its loop is a whole number of samples, less half a sample for the averaging. */
const ringsAt = (freq: number, sampleRate: number) => sampleRate / (Math.max(2, Math.round(sampleRate / freq)) - 0.5)

/** The đàn tranh "nhấn": just after the pluck, press the string a whole tone sharp, hold, and let it back. */
function nhan(detune: AudioParam, at: number): void {
  detune.setValueAtTime(0, at + 0.08)
  detune.linearRampToValueAtTime(200, at + 0.2)
  detune.setValueAtTime(200, at + 0.5)
  detune.linearRampToValueAtTime(0, at + 0.7)
}

/** A plucked note of any degree, in tune; degrees beyond the buffers are pitched from the nearest one. */
export function pluck(ctx: BaseAudioContext, out: AudioNode, plucks: AudioBuffer[], degree: number, at: number, level: number, bend = false): AudioBufferSourceNode {
  const near = Math.min(plucks.length - 1, Math.max(0, degree))
  const src = ctx.createBufferSource()
  src.buffer = plucks[near]
  src.playbackRate.value = noteFreq(degree) / ringsAt(noteFreq(near), plucks[near].sampleRate)
  if (bend) nhan(src.detune, at)
  const gain = ctx.createGain()
  gain.gain.value = level
  src.connect(gain).connect(out)
  src.start(at)
  return src
}

/** The closing tune: plucks run up the scale, then a high pair rings with the top note pressed sharp. Returns when it has died away. */
export function playJingle(ctx: BaseAudioContext, out: AudioNode, at: number, plucks: AudioBuffer[]): number {
  const fader = ctx.createGain()
  fader.connect(out)
  const notes: AudioBufferSourceNode[] = []
  for (let degree = 0; degree <= 5; degree++) notes.push(pluck(ctx, fader, plucks, degree, at + degree * 0.13, 0.42))
  const top = at + 0.86
  notes.push(pluck(ctx, fader, plucks, 5, top, 0.36), pluck(ctx, fader, plucks, 7, top, 0.36, true))
  const end = top + 1.6
  fader.gain.setValueAtTime(1, end - 0.6)
  fader.gain.linearRampToValueAtTime(0, end)
  for (const note of notes) note.stop(end)
  return end
}

/** White noise, made in code. */
function noise(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const buffer = ctx.createBuffer(1, Math.max(1, Math.round(ctx.sampleRate * seconds)), ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}

/** A gain into `out` that rises to `peak` in `attack` s, then falls away exponentially until `end`. */
function strike(ctx: BaseAudioContext, out: AudioNode, at: number, peak: number, end: number, attack: number): GainNode {
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, at)
  gain.gain.linearRampToValueAtTime(peak, at + attack)
  gain.gain.exponentialRampToValueAtTime(QUIET, end)
  gain.connect(out)
  return gain
}

/** An oscillator struck at `at` that dies away by `end`. Its frequency can still be swept after. */
function tone(ctx: BaseAudioContext, out: AudioNode, type: OscillatorType, freq: number, at: number, peak: number, end: number, attack = 0.004): OscillatorNode {
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freq, at)
  osc.connect(strike(ctx, out, at, peak, end, attack))
  osc.start(at)
  osc.stop(end)
  return osc
}

/** A burst of filtered noise struck at `at` that dies away by `end`. */
function hiss(ctx: BaseAudioContext, out: AudioNode, type: BiquadFilterType, freq: number, q: number, at: number, peak: number, end: number, attack: number): void {
  const src = ctx.createBufferSource()
  src.buffer = noise(ctx, end - at)
  const filter = ctx.createBiquadFilter()
  filter.type = type
  filter.frequency.value = freq
  filter.Q.value = q
  src.connect(filter).connect(strike(ctx, out, at, peak, end, attack))
  src.start(at)
}

/** Wind chime at the door: a few pentatonic bars (G6 to F7) struck in a loose run, each with inharmonic overtones. */
function chime(ctx: BaseAudioContext, out: AudioNode, at: number): void {
  const strikes = 4 + Math.floor(Math.random() * 3)
  let t = at
  let bar = -1
  for (let i = 0; i < strikes; i++) {
    // never the same bar twice in a row
    bar = (bar + 1 + Math.floor(Math.random() * 4)) % 5
    const f = noteFreq(13 + bar)
    const ring = Math.min(1.2 + Math.random() * 0.6, at + 1.95 - t)
    const level = 0.07 + Math.random() * 0.05
    tone(ctx, out, 'sine', f, t, level, t + ring, 0.002)
    tone(ctx, out, 'sine', f * 2.76, t, level * 0.3, t + ring * 0.45, 0.002)
    tone(ctx, out, 'sine', f * 5.4, t, level * 0.1, t + ring * 0.2, 0.002)
    t += 0.04 + Math.random() * 0.12
  }
}

/** Coins: two quick bright blips a fourth apart on the scale (C6, F6), the second longer. */
function coin(ctx: BaseAudioContext, out: AudioNode, at: number): void {
  tone(ctx, out, 'triangle', noteFreq(10), at, 0.28, at + 0.09)
  tone(ctx, out, 'triangle', noteFreq(12), at + 0.07, 0.28, at + 0.33)
}

/** Foam crackle: a few tiny high ticks at random moments, like bubbles popping. */
function foam(ctx: BaseAudioContext, out: AudioNode, at: number): void {
  const ticks = 3 + Math.floor(Math.random() * 4)
  for (let i = 0; i < ticks; i++) {
    const t = at + Math.random() * 0.12
    hiss(ctx, out, 'highpass', 2500 + Math.random() * 2500, 1, t, 0.2 + Math.random() * 0.15, t + 0.005 + Math.random() * 0.01, 0.001)
  }
}

/** "Ting" for a revealed star; each later star rings higher on the scale: D6, G6, then C7. */
function star(ctx: BaseAudioContext, out: AudioNode, at: number, step: number): void {
  const f = noteFreq(11 + 2 * step)
  tone(ctx, out, 'sine', f, at, 0.3, at + 0.62)
  tone(ctx, out, 'sine', f * 2, at, 0.07, at + 0.3)
}

/** Soft click for a button press: a short falling blip. */
function tap(ctx: BaseAudioContext, out: AudioNode, at: number): void {
  tone(ctx, out, 'sine', 700, at, 0.25, at + 0.07, 0.002).frequency.exponentialRampToValueAtTime(350, at + 0.05)
}

/** "Hừm": a breath, then a short low grumble that sinks, for an angry customer walking out. */
function huff(ctx: BaseAudioContext, out: AudioNode, at: number): void {
  hiss(ctx, out, 'bandpass', 1400, 0.8, at, 0.12, at + 0.2, 0.02)
  const start = at + 0.03
  const end = at + 0.38
  const voice = ctx.createOscillator()
  voice.type = 'sawtooth'
  voice.frequency.setValueAtTime(140, start)
  voice.frequency.exponentialRampToValueAtTime(95, end)
  const muffle = ctx.createBiquadFilter()
  muffle.type = 'lowpass'
  muffle.frequency.value = 900
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(0.3, start + 0.06)
  gain.gain.linearRampToValueAtTime(0.22, start + 0.2)
  gain.gain.linearRampToValueAtTime(0, end)
  voice.connect(muffle).connect(gain).connect(out)
  voice.start(start)
  voice.stop(end)
}

/** "Cộp": a low knock with a wooden edge and a short click, for furniture set down. */
function thud(ctx: BaseAudioContext, out: AudioNode, at: number): void {
  tone(ctx, out, 'sine', 150, at, 0.6, at + 0.22, 0.003).frequency.exponentialRampToValueAtTime(55, at + 0.12)
  // the low body is lost on a phone speaker, so a higher knock carries it there
  tone(ctx, out, 'triangle', 320, at, 0.12, at + 0.07, 0.002).frequency.exponentialRampToValueAtTime(200, at + 0.06)
  hiss(ctx, out, 'lowpass', 2000, 1, at, 0.25, at + 0.015, 0.001)
}

/** A cheerful run up the scale for a staff level-up, finished with a soft chime. */
function levelUp(ctx: BaseAudioContext, out: AudioNode, at: number): void {
  for (const [i, degree] of [5, 6, 7, 10].entries()) {
    const t = at + i * 0.09
    const f = noteFreq(degree)
    tone(ctx, out, 'triangle', f, t, 0.25, t + (i === 3 ? 0.75 : 0.35))
    // the bright edge of a pluck
    tone(ctx, out, 'sine', f * 2, t, 0.06, t + 0.12)
  }
  for (const [i, degree] of [15, 17, 19].entries()) {
    const t = at + 0.34 + i * 0.07
    tone(ctx, out, 'sine', noteFreq(degree), t, 0.05, t + 0.7, 0.002)
  }
}

type Recipe = (ctx: BaseAudioContext, out: AudioNode, at: number, step: number) => void
const RECIPES: Record<OneShot, Recipe> = { chime, coin, foam, star, tap, huff, thud, levelUp }

/** Plays one effect at `at` into `out`; each ends by itself. `step` (0..2) raises the star's pitch. */
export function playSfx(ctx: BaseAudioContext, out: AudioNode, name: OneShot, at: number, step = 0): void {
  RECIPES[name](ctx, out, at, step)
}

/** Running water for the rinse: a band of noise whose centre wanders slowly. Plays until the returned stop, which fades it out over 0.15 s. */
export function startWater(ctx: BaseAudioContext, out: AudioNode): () => void {
  const at = ctx.currentTime
  const src = ctx.createBufferSource()
  src.buffer = noise(ctx, 2)
  src.loop = true
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 1250
  band.Q.value = 0.9
  // two slow wobbles at unrelated, slightly random rates never line up, so the stream never audibly repeats
  const wobbles = [[0.37, 230], [1.13, 120]].map(([rate, depth]) => {
    const lfo = ctx.createOscillator()
    lfo.frequency.value = rate * (0.8 + Math.random() * 0.4)
    const amount = ctx.createGain()
    amount.gain.value = depth
    lfo.connect(amount).connect(band.frequency)
    lfo.start(at)
    return lfo
  })
  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.gain.setTargetAtTime(0.3, at, 0.04)
  src.connect(band).connect(gain).connect(out)
  src.start(at)
  return () => {
    const now = ctx.currentTime
    gain.gain.setTargetAtTime(0, now, 0.035)
    for (const node of [src, ...wobbles]) node.stop(now + 0.15)
  }
}
