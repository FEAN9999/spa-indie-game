import { noteFreq, phrase, PHRASE_EIGHTHS } from './notes'
import { pluck } from './sounds'

/** One eighth note, in seconds. */
const EIGHTH = 0.42
/** The pad's roots, in turn: C3, F3, D3. */
const PAD_ROOTS = [-5, -3, -4]
const PAD_LEVEL = 0.06
const PAD_ATTACK = 2
const PAD_RELEASE = 2.5
/** The breath some phrases take before the next one. */
const REST = 0.84

/**
 * The background tune, made as it plays: whole phrases of plucked melody with a soft echo, over a pad
 * that crossfades from phrase to phrase. It is queued ahead, so there is never a loop seam.
 */
export class MusicPlayer {
  private nextPhraseAt: number
  private lastDegree = 5
  private padCount = 0
  /** Notes and pad voices with their start times, so stop() can cancel the ones still to come. */
  private queued: { node: AudioScheduledSourceNode; at: number }[] = []
  /** Everything the player makes passes through here, so stop() can fade it all. */
  private readonly fader: GainNode
  private readonly melody: GainNode

  constructor(
    private readonly ctx: BaseAudioContext,
    out: AudioNode,
    private readonly plucks: AudioBuffer[],
    private readonly rng: () => number,
  ) {
    this.fader = ctx.createGain()
    this.fader.connect(out)
    this.melody = ctx.createGain()
    this.melody.connect(this.fader)
    // the echo: each repeat comes 0.3 s later, a quarter as loud and a little duller
    const delay = ctx.createDelay(1)
    delay.delayTime.value = 0.3
    const dull = ctx.createBiquadFilter()
    dull.type = 'lowpass'
    dull.frequency.value = 2500
    const feedback = ctx.createGain()
    feedback.gain.value = 0.25
    this.melody.connect(delay).connect(dull).connect(feedback).connect(delay)
    feedback.connect(this.fader)
    this.nextPhraseAt = ctx.currentTime + 0.1
  }

  /** Queues whole phrases until `time` is covered. */
  scheduleUntil(time: number): void {
    const now = this.ctx.currentTime
    // after a long stall, pick up from now rather than crowding the missed notes together
    this.nextPhraseAt = Math.max(this.nextPhraseAt, now + 0.1)
    this.queued = this.queued.filter(q => q.at >= now)
    while (this.nextPhraseAt < time) this.queuePhrase()
  }

  /** Silences the player from `at`: notes and pads still to come never start, and what still rings fades out. A stopped player stays silent. */
  stop(at: number): void {
    for (const q of this.queued) if (q.at >= at) q.node.stop(at)
    this.queued = []
    this.fader.gain.setTargetAtTime(0, at, 0.1)
  }

  private queuePhrase(): void {
    const start = this.nextPhraseAt
    const length = PHRASE_EIGHTHS * EIGHTH + (this.rng() < 0.3 ? REST : 0)
    // moved on before any node is made, so a failure part way loses only this phrase and never queues it again
    this.nextPhraseAt = start + length
    this.queuePad(start, start + length)
    const notes = phrase(this.rng, this.lastDegree)
    for (const n of notes) {
      const at = start + n.eighth * EIGHTH
      this.queued.push({ node: pluck(this.ctx, this.melody, this.plucks, n.degree, at, n.velocity * 0.5, n.bend), at })
    }
    this.lastDegree = notes[notes.length - 1].degree
  }

  /** A root and the pure fifth above it, swelling in over 2 s and fading over 2.5 s under the next phrase's pad. */
  private queuePad(start: number, end: number): void {
    const root = noteFreq(PAD_ROOTS[this.padCount++ % PAD_ROOTS.length])
    const soft = this.ctx.createBiquadFilter()
    soft.type = 'lowpass'
    soft.frequency.value = 700
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(PAD_LEVEL, start + PAD_ATTACK)
    gain.gain.setValueAtTime(PAD_LEVEL, end)
    gain.gain.linearRampToValueAtTime(0, end + PAD_RELEASE)
    soft.connect(gain).connect(this.fader)
    for (const freq of [root, root * 1.5]) {
      const osc = this.ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = freq
      osc.connect(soft)
      osc.start(start)
      osc.stop(end + PAD_RELEASE)
      this.queued.push({ node: osc, at: start })
    }
  }
}
