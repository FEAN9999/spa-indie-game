import { describe, expect, it } from 'vitest'
import { TILE } from '../../src/config'
import { lieAngle, liePoint } from '../../src/view/lying'

const UP = { x: 0, y: -1 }
const LEFT = { x: -1, y: 0 }
const RIGHT = { x: 1, y: 0 }
const feet = { x: 300, y: 500 }

describe('lying on a bed', () => {
  it('leaves a figure on a bed standing up the floor exactly where it was', () => {
    expect(lieAngle(UP)).toBe(0)
    expect(liePoint(feet, 0, UP)).toEqual(feet)
    expect(liePoint(feet, 0.78 * TILE, UP)).toEqual({ x: 300, y: 500 - 0.78 * TILE })
  })

  it('turns a quarter back for a head on the left and forward for one on the right', () => {
    expect(lieAngle(LEFT)).toBe(-Math.PI / 2)
    expect(lieAngle(RIGHT)).toBe(Math.PI / 2)
  })

  it('turns about the bed tile centre, half a tile over the feet, the head toward the bed head', () => {
    const centre = { x: 300, y: 500 - TILE / 2 }
    // the feet go half a tile the other way, the head lies toward the head
    expect(liePoint(feet, 0, LEFT)).toEqual({ x: centre.x + TILE / 2, y: centre.y })
    expect(liePoint(feet, 0, RIGHT)).toEqual({ x: centre.x - TILE / 2, y: centre.y })
    expect(liePoint(feet, 1.45 * TILE, LEFT).x).toBeCloseTo(centre.x - 0.95 * TILE)
    expect(liePoint(feet, 1.45 * TILE, RIGHT).x).toBeCloseTo(centre.x + 0.95 * TILE)
    expect(liePoint(feet, 1.45 * TILE, RIGHT).y).toBeCloseTo(centre.y)
    // the centre itself stays put
    expect(liePoint(feet, TILE / 2, LEFT)).toEqual(centre)
  })

  it('puts each point where the turned figure carries it, as a container turns its children', () => {
    for (const head of [UP, LEFT, RIGHT])
      for (const up of [0, 20, 0.78 * TILE, 1.45 * TILE]) {
        const origin = liePoint(feet, 0, head)
        const a = lieAngle(head)
        // the child at (0, -up) turned by `a` about the container's origin
        const at = liePoint(feet, up, head)
        expect(at.x).toBeCloseTo(origin.x + up * Math.sin(a))
        expect(at.y).toBeCloseTo(origin.y - up * Math.cos(a))
      }
  })
})
