import { describe, expect, it } from 'vitest'
import { SHOP_X0 } from '../../src/config'
import { beautyOf, canTurn, isUpright, ITEMS, type Item, type ItemKind } from '../../src/sim/items'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'

const shop = () => {
  const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
  sim.money = 20_000_000
  return sim
}

describe('wall pieces', () => {
  it('hang only on the second wall row of an open floor', () => {
    const sim = shop()
    expect(sim.canPlace('rattanMirror', 15, 1, false)).toBeNull()
    expect(sim.canPlace('rattanMirror', 15, 0, false)).toBe('overlap')
    expect(sim.canPlace('rattanMirror', 15, 2, false)).toBe('overlap')
    // the side wall's corner: the tile below is wall
    expect(sim.canPlace('rattanMirror', 12, 1, false)).toBe('overlap')
    expect(sim.canPlace('rattanMirror', 15, 19, false)).toBe('overlap')
    sim.floors = 2
    expect(sim.canPlace('rattanMirror', 15, 19, false)).toBeNull()
    sim.floors = 3
    expect(sim.canPlace('rattanMirror', 15, 37, false)).toBe('overlap')
  })
  it('hang on a house wall only once the house is bought', () => {
    const sim = shop()
    sim.day = 200
    expect(sim.canPlace('rattanMirror', SHOP_X0 - 2, 1, false)).toBe('overlap')
    expect(sim.buyHouse('left')).toBeNull()
    expect(sim.canPlace('rattanMirror', SHOP_X0 - 2, 1, false)).toBeNull()
  })
  it('cannot share a tile, and leave the beds below them alone', () => {
    const sim = shop()
    expect(sim.buy('inkBamboo', 14, 1, false)).toBeNull()
    expect(sim.canPlace('rattanMirror', 15, 1, false)).toBe('overlap')
    expect(sim.canPlace('rattanMirror', 16, 1, false)).toBeNull()
    expect(sim.canPlace('bed', 18, 2, false)).toBeNull()
  })
  it('never turn', () => {
    expect(canTurn('inkBamboo')).toBe(false)
  })
})

describe('rugs', () => {
  it('lie under beds, the tile inside the door and the stairs foot, and leave the grid alone', () => {
    const sim = shop()
    const cells = JSON.stringify(sim.grid.cells)
    expect(sim.buy('brocadeRug', 14, 2, false)).toBeNull()
    expect(sim.buy('runnerRug', 18, 14, false)).toBeNull()
    expect(sim.buy('roundRug', 22, 10, false)).toBeNull()
    expect(JSON.stringify(sim.grid.cells)).toBe(cells)
    expect(sim.canPlace('bed', 18, 2, false)).toBeNull()
  })
  it('do not lie on another rug or a wall', () => {
    const sim = shop()
    expect(sim.buy('brocadeRug', 14, 2, false)).toBeNull()
    expect(sim.canPlace('roundRug', 14, 3, false)).toBe('overlap')
    expect(sim.canPlace('roundRug', 13, 0, false)).toBe('overlap')
  })
  it('turn and stay flat', () => {
    expect(canTurn('redRug')).toBe(true)
    const rug: Item = { id: 1, kind: 'redRug', x: 14, y: 5, flip: false, turned: true }
    expect(isUpright(rug)).toBe(false)
  })
})

describe('the new sets', () => {
  it('count half again when a set is full', () => {
    const zen = (Object.keys(ITEMS) as ItemKind[]).filter(k => ITEMS[k].set === 'zen')
    expect(zen).toHaveLength(6)
    const items = zen.map((kind, i): Item => ({ id: i + 1, kind, x: 0, y: 0, flip: false }))
    const sum = zen.reduce((s, k) => s + ITEMS[k].beauty, 0)
    expect(sum).toBe(19)
    expect(beautyOf(items)).toBe(sum * 1.5)
    expect(beautyOf(items.slice(1))).toBe(sum - ITEMS[zen[0]].beauty)
  })
})
