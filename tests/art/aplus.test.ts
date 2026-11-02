import { describe, expect, it } from 'vitest'
import { GROUND, HIGHLIGHT, TINT_SHADE, ink, shade } from '../../src/art/aplus'
import { C } from '../../src/art/palette'

describe('A+ art rules', () => {
  it('darkens a colour toward warm brown, 16% by default', () => {
    expect(shade('#FFFFFF')).toBe('#DFDCDA')
    expect(shade('#FFFFFF', 0)).toBe('#FFFFFF')
    expect(shade('#FFFFFF', 1)).toBe('#3A2418')
    expect(TINT_SHADE).toBe(shade('#FFFFFF'))
  })

  it('makes a shaded colour darker overall, its strong channels pulled toward brown', () => {
    const rgb = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
    const sum = (h: string) => rgb(h).reduce((a, v) => a + v, 0)
    for (const c of [C.teal, C.terracotta, C.cream, C.mustard]) expect(sum(shade(c))).toBeLessThan(sum(c))
    const [, g, b] = rgb(C.teal)
    const [, sg, sb] = rgb(shade(C.teal))
    expect(sg).toBeLessThan(g)
    expect(sb).toBeLessThan(b)
  })

  it('draws the highlight white without a line, the ground shadow and lines in the ink brown', () => {
    expect(HIGHLIGHT).toContain('#FFFFFF')
    expect(HIGHLIGHT).not.toContain('stroke')
    expect(GROUND).toContain(C.ink)
    expect(ink(6)).toBe(`stroke="${C.ink}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"`)
  })
})
