import { describe, expect, it } from 'vitest'
import { loadPrefs, PREFS_KEY, savePrefs } from '../../src/audio/prefs'
import { MemStorage } from '../save/memStorage'

describe('sound preferences', () => {
  it('defaults to music and effects on', () => expect(loadPrefs(new MemStorage())).toEqual({ music: true, sfx: true }))
  it('remembers both choices', () => {
    const s = new MemStorage()
    savePrefs(s, { music: false, sfx: true })
    expect(s.getItem(PREFS_KEY)).toBe('{"music":false,"sfx":true}')
    expect(loadPrefs(s)).toEqual({ music: false, sfx: true })
  })
  it('falls back to on for corrupt or partial values', () => {
    const s = new MemStorage()
    s.setItem(PREFS_KEY, '{not json')
    expect(loadPrefs(s)).toEqual({ music: true, sfx: true })
    s.setItem(PREFS_KEY, '{"music":false}')
    expect(loadPrefs(s)).toEqual({ music: false, sfx: true })
    s.setItem(PREFS_KEY, '{"music":"no","sfx":0}')
    expect(loadPrefs(s)).toEqual({ music: true, sfx: true })
  })
  it('survives storage that throws or is missing', () => {
    const bad = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('full') }, removeItem: () => {} }
    expect(loadPrefs(bad)).toEqual({ music: true, sfx: true })
    expect(() => savePrefs(bad, { music: false, sfx: false })).not.toThrow()
    expect(loadPrefs(null)).toEqual({ music: true, sfx: true })
  })
})
