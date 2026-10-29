import { describe, expect, it, vi } from 'vitest'
import { PART_ANCHORS } from '../../src/art/chibi'
import { WORN } from '../../src/view/CharacterView'

// CharacterView needs only a base class and DegToRad from Phaser to load
vi.mock('phaser', () => ({
  Math: { DegToRad: (d: number) => (d * Math.PI) / 180 },
  GameObjects: { Container: class {}, Image: class {} },
}))

describe('worn pieces', () => {
  it('has a registered front texture for every piece each kind wears', () => {
    for (const [kind, pieces] of Object.entries(WORN))
      for (const { key } of pieces) expect(PART_ANCHORS[`${key}-down`], `${kind} ${key}`).toBeDefined()
  })
})
