import { describe, expect, it, vi } from 'vitest'
import { HIGHLIGHT, shade } from '../../src/art/aplus'
import { furnitureTextures } from '../../src/art/furniture'
import { liftPiece } from '../../src/art/lift'
import { menuTextures } from '../../src/art/menuArt'
import { C } from '../../src/art/palette'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

const ink = (w: number) => `stroke="${C.ink}" stroke-width="${w}"`
const urlsResolve = (doc: string) => [...doc.matchAll(/url\(#([^)]+)\)/g)].every(m => doc.includes(`id="${m[1]}"`))

describe('A+ pass for flat pieces', () => {
  it('shades an inked shape at its lower right and keeps its outline on top', () => {
    const out = liftPiece(`<rect x="0" y="0" width="1" height="0.5" fill="${C.teal}" ${ink(0.05)}/>`, 78)
    expect(out).toContain(`fill="${shade(C.teal)}"`)
    expect(out).toMatch(/<g clip-path="url\(#l\d+\)"><path d="[^"]+" transform="translate\(-[\d.]+ -[\d.]+\)" fill="#2F7D6E"\/>/)
    expect(out.endsWith(`<rect x="0" y="0" width="1" height="0.5" fill="none" ${ink(0.05)}/>`)).toBe(true)
  })

  it('gives wood its grain, a cushion its seam and the highest big shape the shine', () => {
    const wood = liftPiece(`<rect x="0" y="0" width="2" height="1" fill="${C.wood}" ${ink(0.05)}/>`, 78)
    expect(wood).toContain(`stroke="${shade(C.wood, 0.3)}"`)
    expect(wood).toContain(HIGHLIGHT)
    const cushion = liftPiece(`<rect x="0" y="0" width="1" height="1" rx="0.1" fill="${C.terracotta}" ${ink(0.05)}/>`, 78)
    expect(cushion).toContain('stroke-dasharray')
    const two = liftPiece(
      `<rect x="0" y="0.5" width="2" height="1" fill="${C.wood}" ${ink(0.05)}/><rect x="0" y="0" width="2" height="0.6" fill="${C.cream}" ${ink(0.05)}/>`,
      78,
    )
    expect(two.split(HIGHLIGHT)).toHaveLength(2)
    expect(two.indexOf(HIGHLIGHT)).toBeGreaterThan(two.indexOf(`fill="${C.cream}"`))
  })

  it('leaves thin, tiny, see-through, patterned and turned shapes as drawn, and sets old ground shadows to 18%', () => {
    const flat = [
      `<rect x="0" y="0" width="1" height="1" fill="${C.teal}" ${ink(0.02)}/>`,
      `<rect x="0" y="0" width="0.05" height="0.05" fill="${C.teal}" ${ink(0.05)}/>`,
      `<rect x="0" y="0" width="1" height="1" fill="${C.glass}" fill-opacity="0.7" ${ink(0.05)}/>`,
      `<rect x="0" y="0" width="1" height="1" fill="url(#weave)" ${ink(0.05)}/>`,
      `<rect x="0" y="0" width="1" height="1" fill="${C.teal}" transform="rotate(10)" ${ink(0.05)}/>`,
    ].join('')
    expect(liftPiece(flat, 78)).toBe(flat)
    expect(liftPiece(`<rect x="0" y="0" width="1" height="0.2" fill="${C.ink}" opacity="0.15"/>`, 78)).toContain('opacity=".18"')
  })

  it('lifts every furniture piece and menu picture with clip ids that resolve inside their own texture', () => {
    const all = { ...furnitureTextures(), ...menuTextures() }
    for (const key of ['bed', 'desk', 'decor-velvetSofa', 'decor-diningTable', 'decor-stove', 'dish-pho', 'rstock-tamKit']) {
      expect(all[key], key).toContain('clip-path=')
    }
    for (const [key, doc] of Object.entries(all)) expect(urlsResolve(doc), key).toBe(true)
  })
})
