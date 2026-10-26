import type { KeyValueStorage } from '../save/store'
import { Throttle, type OneShot, type Sfx } from './cues'
import { MusicPlayer } from './music'
import { loadPrefs, savePrefs, type SoundPrefs } from './prefs'
import { makePlucks, playJingle, playSfx, startWater } from './sounds'

export type EngineState = 'locked' | 'running' | 'suspended' | 'off'

const MASTER_LEVEL = 0.8
const MUSIC_LEVEL = 0.35
const SFX_LEVEL = 0.7
const JINGLE_LEVEL = 0.35
/** setTargetAtTime time constant for the toggles: settled in about 0.3 s. */
const TOGGLE_FADE = 0.1
/** How far ahead the music is queued, in seconds, and how often the queue is topped up, in ms. */
const LOOKAHEAD = 1.5
const TICK_MS = 250
const PLAYED_KEEP = 30
/** The gestures that may start sound, on a phone or a desktop browser. */
const FIRST_TOUCH = ['pointerdown', 'touchend', 'click', 'keydown']

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext }

/** A new AudioContext, or null where the browser has none. */
function newContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Context = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext
  return Context ? new Context() : null
}

/** Glides a bus to `value`; with the default time constant it settles in about 0.3 s. */
function fadeTo(bus: GainNode, value: number, timeConstant = TOGGLE_FADE): void {
  bus.gain.setTargetAtTime(value, bus.context.currentTime, timeConstant)
}

/** A gain node at `value` feeding `out`. */
function bus(ctx: BaseAudioContext, value: number, out: AudioNode): GainNode {
  const gain = ctx.createGain()
  gain.gain.value = value
  gain.connect(out)
  return gain
}

/** The live audio graph, made at the first touch. */
interface Graph {
  ctx: AudioContext
  musicBus: GainNode
  sfxBus: GainNode
  jingleBus: GainNode
  plucks: AudioBuffer[]
  music: MusicPlayer
}

/**
 * All of the game's sound. It stays silent until the first touch, follows the iPhone silent switch,
 * and quietly does nothing where Web Audio is missing. Scenes only call it.
 */
export class SoundEngine {
  /** The last names actually played, newest last, for browser checks. */
  readonly played: (Sfx | 'jingle')[] = []
  private current: EngineState = 'locked'
  private loadedPrefs: SoundPrefs | null = null
  private graph: Graph | null = null
  private stopWater: (() => void) | null = null
  private ended = false
  private readonly throttle = new Throttle()

  constructor(
    private readonly getStorage: () => KeyValueStorage | null,
    private readonly makeContext: () => AudioContext | null = newContext,
  ) {}

  get state(): EngineState {
    return this.current
  }

  /** Read on first use, so importing the engine never touches storage. */
  get prefs(): SoundPrefs {
    return (this.loadedPrefs ??= loadPrefs(this.storage()))
  }

  get waterOn(): boolean {
    return this.stopWater !== null
  }

  get dayOver(): boolean {
    return this.ended
  }

  /** Unlocks sound at the first gesture, and stops listening once it runs or turns out to be unavailable. */
  listenForFirstTouch(target: EventTarget): void {
    const onGesture = () => {
      this.unlock()
      if (this.current !== 'running' && this.current !== 'off') return
      for (const type of FIRST_TOUCH) target.removeEventListener(type, onGesture, { capture: true })
    }
    for (const type of FIRST_TOUCH) target.addEventListener(type, onGesture, { capture: true })
  }

  /** Makes the audio graph on the first call and asks the browser to run it. Call it inside a user gesture. */
  unlock(): void {
    if (this.current === 'locked') {
      this.graph = this.build()
      if (!this.graph) this.current = 'off'
    }
    const ctx = this.graph?.ctx
    if (!ctx) return
    // outside a gesture the browser may refuse; the next gesture asks again
    if (ctx.state !== 'running') ctx.resume().catch(() => {})
    this.sync()
  }

  /** Plays one effect now, unless effects are off, sound is not running, or the same effect has just played. */
  play(name: OneShot, step?: number): void {
    const graph = this.graph
    if (!graph || !this.allowed(name)) return
    playSfx(graph.ctx, graph.sfxBus, name, graph.ctx.currentTime, step)
    this.remember(name)
  }

  /** Holds the running-water loop on or off. Safe to call every frame. */
  water(on: boolean): void {
    if (!on) {
      this.stopWater?.()
      this.stopWater = null
      return
    }
    const graph = this.graph
    if (!graph || this.stopWater || !this.allowed('water')) return
    this.stopWater = startWater(graph.ctx, graph.sfxBus)
    this.remember('water')
  }

  setMusic(on: boolean): void {
    const was = this.prefs.music
    this.prefs.music = on
    savePrefs(this.storage(), this.prefs)
    if (on && !was) this.restartMusic()
    this.fadeMusic()
  }

  setSfx(on: boolean): void {
    this.prefs.sfx = on
    savePrefs(this.storage(), this.prefs)
    if (!on) this.water(false)
    if (this.graph) fadeTo(this.graph.sfxBus, on ? SFX_LEVEL : 0)
  }

  /** The summary card opened: the tune fades away and, with music on, the closing jingle plays. */
  endOfDay(): void {
    if (this.ended) return
    this.ended = true
    const graph = this.graph
    if (!graph) return
    const now = graph.ctx.currentTime
    fadeTo(graph.musicBus, 0, 0.2)
    graph.music.stop(now + 0.6)
    if (this.current !== 'running' || !this.prefs.music) return
    playJingle(graph.ctx, graph.jingleBus, now + 0.4, graph.plucks)
    this.remember('jingle')
  }

  /** "Ngày mới": the tune comes back, fresh from the start of a phrase. */
  startOfDay(): void {
    if (!this.ended) return
    this.ended = false
    if (this.prefs.music) this.restartMusic()
    this.fadeMusic()
  }

  private build(): Graph | null {
    const ctx = this.openContext()
    if (!ctx) return null
    const master = bus(ctx, MASTER_LEVEL, ctx.destination)
    const musicBus = bus(ctx, this.musicLevel(), master)
    const plucks = makePlucks(ctx, Math.random)
    const graph: Graph = {
      ctx,
      musicBus,
      sfxBus: bus(ctx, this.prefs.sfx ? SFX_LEVEL : 0, master),
      jingleBus: bus(ctx, JINGLE_LEVEL, master),
      plucks,
      music: new MusicPlayer(ctx, musicBus, plucks, Math.random),
    }
    setInterval(() => {
      if (this.current === 'running' && this.prefs.music && !this.ended) graph.music.scheduleUntil(ctx.currentTime + LOOKAHEAD)
    }, TICK_MS)
    ctx.addEventListener('statechange', () => this.sync())
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.water(false)
        ctx.suspend().catch(() => {})
      } else {
        // also brings iOS back from 'interrupted' after a call
        ctx.resume().catch(() => {})
      }
    })
    return graph
  }

  /** The audio session goes ambient first, so the iPhone silent switch mutes the game and other apps' audio keeps playing. */
  private openContext(): AudioContext | null {
    try {
      const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
      if (session) session.type = 'ambient'
    } catch {
      // no audio session before Safari 16.4: sound then ignores the silent switch
    }
    try {
      return this.makeContext()
    } catch {
      return null
    }
  }

  /** Mirrors the context's state; iOS's 'interrupted' (a call, Siri) counts as suspended. */
  private sync(): void {
    if (this.graph) this.current = this.graph.ctx.state === 'running' ? 'running' : 'suspended'
  }

  private allowed(name: Sfx): boolean {
    return this.current === 'running' && this.prefs.sfx && this.throttle.allow(name, performance.now())
  }

  private musicLevel(): number {
    return this.prefs.music && !this.ended ? MUSIC_LEVEL : 0
  }

  private fadeMusic(): void {
    if (this.graph) fadeTo(this.graph.musicBus, this.musicLevel())
  }

  /** Starts the tune afresh from now. The old player's queued notes are stopped first, so nothing doubles. */
  private restartMusic(): void {
    const graph = this.graph
    if (!graph) return
    graph.music.stop(graph.ctx.currentTime)
    graph.music = new MusicPlayer(graph.ctx, graph.musicBus, graph.plucks, Math.random)
  }

  private remember(name: Sfx | 'jingle'): void {
    this.played.push(name)
    if (this.played.length > PLAYED_KEEP) this.played.shift()
  }

  /** A storage that cannot even be reached just means the choices are not remembered. */
  private storage(): KeyValueStorage | null {
    try {
      return this.getStorage()
    } catch {
      return null
    }
  }
}

/** The game's one sound engine. Its preferences load on first use, so importing it never touches localStorage. */
export const sound = new SoundEngine(() => (typeof localStorage === 'undefined' ? null : localStorage))
