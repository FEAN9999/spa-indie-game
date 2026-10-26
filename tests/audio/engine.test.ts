import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SoundEngine } from '../../src/audio/engine'
import { loadPrefs } from '../../src/audio/prefs'
import { MemStorage } from '../save/memStorage'
import { FakeAudioContext } from './fakeAudio'

describe('sound engine without Web Audio', () => {
  it('stays off and silent without Web Audio', () => {
    const s = new SoundEngine(() => new MemStorage(), () => null)
    expect(s.state).toBe('locked')
    s.unlock()
    expect(s.state).toBe('off')
    expect(() => { s.play('coin'); s.water(true); s.water(false); s.endOfDay(); s.startOfDay() }).not.toThrow()
    expect(s.played).toEqual([])
  })
  it('stays off when the context cannot be made', () => {
    const s = new SoundEngine(() => new MemStorage(), () => { throw new Error('blocked') })
    s.unlock()
    expect(s.state).toBe('off')
  })
  it('saves the toggles even with no sound', () => {
    const storage = new MemStorage()
    const s = new SoundEngine(() => storage, () => null)
    s.setMusic(false)
    s.setSfx(false)
    expect(loadPrefs(storage)).toEqual({ music: false, sfx: false })
    expect(new SoundEngine(() => storage, () => null).prefs).toEqual({ music: false, sfx: false })
  })
  it('stops listening for the first touch once sound turns out to be unavailable', () => {
    const s = new SoundEngine(() => new MemStorage(), () => null)
    const unlock = vi.spyOn(s, 'unlock')
    const target = new EventTarget()
    s.listenForFirstTouch(target)
    target.dispatchEvent(new Event('pointerdown'))
    target.dispatchEvent(new Event('click'))
    target.dispatchEvent(new Event('keydown'))
    expect(unlock).toHaveBeenCalledTimes(1)
    expect(s.state).toBe('off')
  })
  it('the default singleton loads in node without touching localStorage', async () => {
    const before = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
    const read = vi.fn(() => { throw new Error('localStorage read on import') })
    Object.defineProperty(globalThis, 'localStorage', { get: read, configurable: true })
    try {
      vi.resetModules()
      const { sound } = await import('../../src/audio/engine')
      expect(sound.state).toBe('locked')
      expect(read).not.toHaveBeenCalled()
    } finally {
      if (before) Object.defineProperty(globalThis, 'localStorage', before)
      else delete (globalThis as { localStorage?: unknown }).localStorage
    }
  })
})

describe('sound engine on a fake AudioContext', () => {
  let page: EventTarget & { hidden: boolean }

  beforeEach(() => {
    vi.useFakeTimers()
    page = Object.assign(new EventTarget(), { hidden: false })
    vi.stubGlobal('document', page)
    vi.stubGlobal('navigator', {})
    // the warning a failing Web Audio call gives is expected here; the tests count it
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  /** An engine on a fake context, its first touch made, so sound is running. */
  function running(storage = new MemStorage()) {
    const ctx = new FakeAudioContext()
    const s = new SoundEngine(() => storage, () => ctx as unknown as AudioContext)
    const target = new EventTarget()
    s.listenForFirstTouch(target)
    target.dispatchEvent(new Event('pointerdown'))
    expect(s.state).toBe('running')
    return { s, ctx, target, storage }
  }

  const tick = (n = 1) => vi.advanceTimersByTime(250 * n)
  const setHidden = (hidden: boolean) => {
    page.hidden = hidden
    page.dispatchEvent(new Event('visibilitychange'))
  }

  it('comes back by itself after an iOS interruption while the page stays visible', () => {
    const { s, ctx } = running()
    ctx.changeState('interrupted')
    expect(s.state).toBe('suspended')
    const resume = vi.spyOn(ctx, 'resume')
    tick()
    expect(resume).toHaveBeenCalled()
    expect(ctx.state).toBe('running')
    expect(s.state).toBe('running')
  })

  it('never resumes while the page is hidden', () => {
    const { s, ctx } = running()
    setHidden(true)
    expect(s.state).toBe('suspended')
    const resume = vi.spyOn(ctx, 'resume')
    ctx.changeState('interrupted')
    tick(10)
    expect(resume).not.toHaveBeenCalled()
    setHidden(false)
    expect(s.state).toBe('running')
  })

  it('lets the next tap resume when the browser wants a gesture, listening only once and only until it runs', () => {
    const { s, ctx, target } = running()
    const unlock = vi.spyOn(s, 'unlock')
    const add = vi.spyOn(target, 'addEventListener')
    ctx.refuseResume = true
    ctx.changeState('interrupted')
    tick(3)
    ctx.changeState('suspended')
    expect(s.state).toBe('suspended')
    // once for each of the four gestures, however often the interruption is seen
    expect(add).toHaveBeenCalledTimes(4)
    ctx.refuseResume = false
    target.dispatchEvent(new Event('touchend'))
    expect(unlock).toHaveBeenCalledTimes(1)
    expect(s.state).toBe('running')
    target.dispatchEvent(new Event('pointerdown'))
    expect(unlock).toHaveBeenCalledTimes(1)
  })

  it('keeps a failing Web Audio call out of the game, saves the toggles anyway, and warns once', () => {
    const { s, ctx, storage } = running()
    for (const method of ['createOscillator', 'createBufferSource', 'createGain', 'setTargetAtTime']) ctx.failing.add(method)
    expect(() => {
      s.play('coin')
      s.water(true)
      s.endOfDay()
      s.startOfDay()
      s.setMusic(true)
      tick(4)
      s.setMusic(false)
    }).not.toThrow()
    expect(loadPrefs(storage)).toEqual({ music: false, sfx: true })
    expect(console.warn).toHaveBeenCalledTimes(1)
    // the engine is still usable once Web Audio works again
    ctx.failing.clear()
    s.play('tap')
    expect(s.played).toContain('tap')
  })

  it('loses only the phrase that failed, so a throwing music tick never stacks pads', () => {
    const { ctx } = running()
    ctx.failing.add('createOscillator')
    const osc = vi.spyOn(ctx, 'createOscillator')
    tick(10)
    // each try at a phrase makes its pad's first oscillator, which throws: one try for the one phrase due
    expect(osc).toHaveBeenCalledTimes(1)
    expect(console.warn).toHaveBeenCalledTimes(1)
  })

  it('closes a half-made context and stays off, never opening a second one', () => {
    const ctx = new FakeAudioContext()
    ctx.failing.add('createBuffer')
    const make = vi.fn(() => ctx as unknown as AudioContext)
    const s = new SoundEngine(() => new MemStorage(), make)
    expect(() => s.unlock()).not.toThrow()
    expect(s.state).toBe('off')
    expect(ctx.state).toBe('closed')
    s.unlock()
    expect(make).toHaveBeenCalledTimes(1)
    expect(console.warn).toHaveBeenCalledTimes(1)
  })

  it('ends and starts the day once each, however often it is asked', () => {
    const { s, ctx } = running()
    // each music player makes one echo delay
    const players = vi.spyOn(ctx, 'createDelay')
    s.endOfDay()
    s.endOfDay()
    expect(s.played.filter(n => n === 'jingle')).toHaveLength(1)
    s.startOfDay()
    s.startOfDay()
    expect(players).toHaveBeenCalledTimes(1)
    s.setMusic(false)
    s.setMusic(true)
    expect(players).toHaveBeenCalledTimes(2)
  })

  it('holds one water loop however often it is asked, and stops it', () => {
    const { s, ctx } = running()
    s.water(true)
    s.water(true)
    const loops = ctx.nodes.filter(n => n.kind === 'bufferSource' && n.loop)
    expect(loops).toHaveLength(1)
    expect(s.waterOn).toBe(true)
    s.water(false)
    expect(s.waterOn).toBe(false)
    expect(loops[0].stoppedAt).not.toBeNull()
  })
})
