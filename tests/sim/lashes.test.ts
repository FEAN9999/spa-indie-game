import { describe, expect, it } from 'vitest'
import { LASHES_LIMIT_MS, LASHES_REACH, LASHES_REACH_HARD, LASHES_SLOTS, LASHES_SLOTS_HARD } from '../../src/config'
import { LashesGame, lashesStars, lashPattern, lashSlots, type LashLen } from '../../src/sim/lashes'
import { createRng } from '../../src/sim/rng'

/** An rng that always gives `v`: the style is the one at that share of the list. */
const fixed = (v: number) => () => v

describe('the Nối mi patterns', () => {
  it('lays out the three styles on seven dots', () => {
    expect(lashPattern('natural', 7).join('')).toBe('smmmmms')
    expect(lashPattern('cat', 7).join('')).toBe('ssmmlll')
    expect(lashPattern('doll', 7).join('')).toBe('smlllms')
  })

  it('lays out the three styles on nine dots', () => {
    expect(lashPattern('natural', 9).join('')).toBe('smmmmmmms')
    expect(lashPattern('cat', 9).join('')).toBe('sssmmmlll')
    expect(lashPattern('doll', 9).join('')).toBe('ssmlllmss')
  })

  it('runs the dots evenly across the lid, sagging in the middle and level at the ends', () => {
    const slots = lashSlots(7)
    expect(slots[0].y).toBeCloseTo(slots[6].y)
    expect(slots[3].y).toBeGreaterThan(slots[0].y)
    const gaps = slots.slice(1).map((s, i) => s.x - slots[i].x)
    for (const gap of gaps) expect(gap).toBeCloseTo(gaps[0])
  })

  it('gives 3 stars for every dot right with at most one stuck, 2 for two dots off with at most three stuck', () => {
    expect([lashesStars(7, 7, 0), lashesStars(7, 7, 1), lashesStars(7, 7, 2), lashesStars(5, 7, 3), lashesStars(5, 7, 4), lashesStars(4, 7, 0)]).toEqual([3, 3, 2, 2, 1, 1])
  })
})

describe('the Nối mi game', () => {
  it('draws one of the three styles for a plain customer, and never the natural one for a picky one', () => {
    const plain = new Set<string>()
    const picky = new Set<string>()
    for (let seed = 1; seed <= 60; seed++) {
      plain.add(new LashesGame(createRng(seed)).style)
      picky.add(new LashesGame(createRng(seed), true).style)
    }
    expect([...plain].sort()).toEqual(['cat', 'doll', 'natural'])
    expect([...picky].sort()).toEqual(['cat', 'doll'])
    expect(new LashesGame(createRng(1)).lashes).toHaveLength(LASHES_SLOTS)
    expect(new LashesGame(createRng(1), true).lashes).toHaveLength(LASHES_SLOTS_HARD)
  })

  it('sticks a dropped lash to the nearest free dot within reach, and judges its length', () => {
    const g = new LashesGame(fixed(0.5))
    expect(g.style).toBe('cat')
    const [a, b] = g.slots
    expect(g.drop('s', a.x + 10, a.y - LASHES_REACH + 15)).toBe('right')
    expect(g.drop('l', b.x - 5, b.y + 5)).toBe('wrong')
    expect(g.lashes.slice(0, 3)).toEqual(['s', 'l', null])
    expect(g.right()).toBe(1)
    expect(g.nextBare()).toBe(2)
  })

  it('does nothing for a lash dropped out of reach', () => {
    const g = new LashesGame(fixed(0))
    const s = g.slots[0]
    expect(g.drop('s', s.x, s.y + LASHES_REACH + 1)).toBeNull()
    expect(g.drop('s', 0, 0)).toBeNull()
    expect(g.stuck).toBe(0)
    expect(g.progress()).toBe(0)
  })

  it('loses a lash dropped on a dot that has one, counting it stuck', () => {
    const g = new LashesGame(fixed(0))
    const s = g.slots[2]
    g.drop('m', s.x, s.y)
    expect(g.drop('m', s.x + 3, s.y)).toBe('stuck')
    expect(g.stuck).toBe(1)
    expect(g.lashes[2]).toBe('m')
  })

  it('has a shorter reach for a picky customer', () => {
    const g = new LashesGame(fixed(0), true)
    const s = g.slots[0]
    expect(g.slotAt(s.x, s.y + LASHES_REACH_HARD + 5)).toBeNull()
    expect(new LashesGame(fixed(0)).slotAt(s.x, s.y + LASHES_REACH_HARD + 5)).not.toBeNull()
  })

  it('ends once every dot has a lash, with its stars', () => {
    const g = new LashesGame(fixed(0.99))
    expect(g.style).toBe('doll')
    g.slots.forEach((s, i) => {
      expect(g.stars()).toBeNull()
      g.drop(g.pattern[i], s.x, s.y)
    })
    expect(g.phase).toBe('done')
    expect(g.stars()).toBe(3)
    expect(g.drop('s', g.slots[0].x, g.slots[0].y)).toBeNull()
  })

  it('ends at the time limit with the bare dots not right', () => {
    const g = new LashesGame(fixed(0))
    g.slots.slice(0, 5).forEach((s, i) => g.drop(g.pattern[i], s.x, s.y))
    g.tick(LASHES_LIMIT_MS - 1)
    expect(g.phase).toBe('play')
    g.tick(1)
    expect(g.phase).toBe('done')
    expect(g.stars()).toBe(2)
  })

  it('gives every seed 3 stars to a player who follows the card, plain and picky', () => {
    for (const hard of [false, true])
      for (let seed = 1; seed <= 30; seed++) {
        const g = new LashesGame(createRng(seed), hard)
        g.slots.forEach((s, i) => g.drop(g.pattern[i] as LashLen, s.x + 8, s.y - 8))
        expect(g.stars(), `seed ${seed}`).toBe(3)
      }
  })
})
