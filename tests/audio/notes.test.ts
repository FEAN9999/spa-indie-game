import { describe, expect, it } from 'vitest'
import { noteFreq, PHRASE_EIGHTHS, phrase, pluckSamples } from '../../src/audio/notes'
import { createRng } from '../../src/sim/rng'

describe('đàn tranh notes', () => {
  it('tunes the scale to Hò Xự Xang Xê Cống from C4', () => {
    expect(noteFreq(0)).toBeCloseTo(261.63, 1)
    expect(noteFreq(1)).toBeCloseTo(293.66, 1)
    expect(noteFreq(2)).toBeCloseTo(349.23, 1)
    expect(noteFreq(5)).toBeCloseTo(523.25, 1)
    expect(noteFreq(-1)).toBeCloseTo(220.0, 1)
  })
  it('plucks a string that starts loud and dies away', () => {
    const s = pluckSamples(noteFreq(0), 44100, 2, createRng(1))
    expect(s.length).toBe(88200)
    const peak = (a: Float32Array) => a.reduce((m, v) => Math.max(m, Math.abs(v)), 0)
    expect(peak(s)).toBeLessThanOrEqual(0.9)
    expect(peak(s)).toBeGreaterThan(0.5)
    expect(peak(s.subarray(79380))).toBeLessThan(peak(s.subarray(0, 8820)) * 0.2)
  })
  it('writes the same phrase for the same seed', () => {
    expect(phrase(createRng(7), 0)).toEqual(phrase(createRng(7), 0))
  })
  it('keeps every phrase singable and resolved', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const p = phrase(createRng(seed), seed % 5)
      expect(p.length).toBeGreaterThanOrEqual(10)
      expect(p.length).toBeLessThanOrEqual(24)
      p.forEach((n, i) => {
        expect(n.eighth).toBeGreaterThanOrEqual(0)
        expect(n.eighth).toBeLessThan(PHRASE_EIGHTHS)
        expect(n.degree).toBeGreaterThanOrEqual(0)
        expect(n.degree).toBeLessThanOrEqual(9)
        expect(n.velocity).toBeGreaterThan(0)
        expect(n.velocity).toBeLessThanOrEqual(1)
        if (i > 0) {
          expect(n.eighth).toBeGreaterThan(p[i - 1].eighth)
          expect(Math.abs(n.degree - p[i - 1].degree)).toBeLessThanOrEqual(3)
        }
      })
      expect([0, 5]).toContain(p[p.length - 1].degree)
    }
  })
})
