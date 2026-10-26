import { describe, expect, it, vi } from 'vitest'
import { SoundEngine } from '../../src/audio/engine'
import { loadPrefs } from '../../src/audio/prefs'
import { MemStorage } from '../save/memStorage'

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
    const { sound } = await import('../../src/audio/engine')
    expect(sound.state).toBe('locked')
  })
})
