import { describe, expect, it, vi } from 'vitest'
import { GROUND, HIGHLIGHT, shade } from '../../src/art/aplus'
import { beachRoomTexture } from '../../src/art/beach'
import { branchFloorTextures } from '../../src/art/branchFloors'
import { branchHouseTextures } from '../../src/art/branchHouses'
import { bustleTextures } from '../../src/art/bustle'
import { floorTextures } from '../../src/art/floors'
import { furnitureTextures } from '../../src/art/furniture'
import { houseTextures } from '../../src/art/houses'
import { liftPiece, liftScene } from '../../src/art/lift'
import { mapTexture } from '../../src/art/map'
import { menuTextures } from '../../src/art/menuArt'
import { oldTownRoomTexture } from '../../src/art/oldTown'
import { C } from '../../src/art/palette'
import { restaurantTextures } from '../../src/art/restaurant'
import { roomTexture } from '../../src/art/room'
import { uptownRoomTexture } from '../../src/art/uptown'
import { parseLayout } from '../../src/sim/grid'
import { SPA_LAYOUT_1A } from '../../src/sim/layout'
import { BRANCH_ROOM } from '../../src/sim/places'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

const ink = (w: number) => `stroke="${C.ink}" stroke-width="${w}"`
const urlsResolve = (doc: string) => [...doc.matchAll(/url\(#([^)]+)\)/g)].every(m => doc.includes(`id="${m[1]}"`))

describe('A+ pass for flat pieces', () => {
  it('shades an inked shape at its lower right and keeps its outline on top', () => {
    const out = liftPiece(`<rect x="0" y="0" width="1" height="0.5" fill="${C.teal}" ${ink(0.05)}/>`, 78)
    expect(out).toContain(`fill="${shade(C.teal)}"`)
    expect(out).toMatch(/<g clip-path="url\(#l[\w-]+\)"><path d="[^"]+" transform="translate\(-[\d.]+ -[\d.]+\)" fill="#2F7D6E"\/>/)
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

describe('A+ pass for rooms, houses and the street', () => {
  it('leaves floors and walls flat and gives each thing on them a shade, a shine and a cast shadow', () => {
    const wall = `<rect x="0" y="0" width="12" height="2" fill="${C.wall}" ${ink(0.05)}/>`
    expect(liftScene(wall, 78)).toBe(wall)
    const out = liftScene(`<rect x="1" y="0.3" width="1.5" height="1" fill="${C.tealLight}" ${ink(0.04)}/>`, 78)
    expect(out.startsWith(`<path d="M1,0.3 H2.5 V1.3 H1Z" transform="translate(0.051 0.051)" ${GROUND}/>`)).toBe(true)
    expect(out).toContain(`fill="${shade(C.tealLight)}"`)
    expect(out).toContain(HIGHLIGHT)
    expect(out).not.toContain('stroke-dasharray')
  })

  it('deepens the thin band under a back wall into an 18% shadow', () => {
    expect(liftScene(`<rect x="0.5" y="2" width="11" height="0.1" fill="${C.ink}" opacity="0.14"/>`, 78)).toBe(
      `<rect x="0.5" y="2" width="11" height="0.218" fill="${C.ink}" opacity=".18"/>`,
    )
  })

  it('lifts the rooms, floors, houses, street and map with clip ids that resolve inside their own texture', () => {
    const room = parseLayout(BRANCH_ROOM)
    const all: Record<string, string> = {
      room: roomTexture(parseLayout(SPA_LAYOUT_1A)),
      'room-beach': beachRoomTexture(room),
      'room-oldTown': oldTownRoomTexture(room),
      'room-uptown': uptownRoomTexture(room),
      'chain-map': mapTexture(),
      ...floorTextures(),
      ...branchFloorTextures(),
      ...houseTextures(),
      ...branchHouseTextures(room),
      ...restaurantTextures(),
      ...bustleTextures(),
    }
    for (const key of ['room', 'room-oldTown', 'chain-map']) expect(all[key], key).toContain('clip-path=')
    for (const [key, doc] of Object.entries(all)) expect(urlsResolve(doc), key).toBe(true)
  })
})
