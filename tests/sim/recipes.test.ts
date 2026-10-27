import { describe, expect, it } from 'vitest'
import { emptyRecipes, isMix, pickHint, rightCount, RECIPES, sameMix } from '../../src/sim/recipes'
import type { Rng } from '../../src/sim/rng'

const queued = (...draws: number[]): Rng => () => draws.shift() ?? 0
const counting = () => {
  const c = { calls: 0, rng: (() => { c.calls++; return 0 }) as Rng }
  return c
}

describe('recipes', () => {
  it('knows the steam recipe and its hints', () => {
    expect(RECIPES.steam.ingredients).toEqual(['pomelo', 'lemongrass', 'ginger'])
    expect(RECIPES.steam.hints).toEqual(['pomelo', 'lemongrass'])
  })

  it('counts right ingredients', () => {
    expect(rightCount('steam', ['ginger', 'salt', 'pomelo'])).toBe(2)
    expect(rightCount('steam', ['honey', 'salt', 'coconut'])).toBe(0)
  })

  it('compares mixes without order', () => {
    expect(sameMix(['salt', 'pomelo', 'ginger'], ['ginger', 'salt', 'pomelo'])).toBe(true)
  })

  it('validates a mix', () => {
    expect(isMix(['pomelo', 'salt', 'ginger'])).toBe(true)
    expect(isMix(['pomelo', 'salt'])).toBe(false)
    expect(isMix(['pomelo', 'pomelo', 'ginger'])).toBe(false)
    expect(isMix(['pomelo', 'sa', 'ginger'])).toBe(false)
  })

  describe('pickHint', () => {
    it('returns null without drawing when everything is solved', () => {
      const book = emptyRecipes()
      book.steam.solved = true
      const c = counting()
      expect(pickHint(book, c.rng)).toBeNull()
      expect(c.calls).toBe(0)
    })

    it('returns null without drawing when every hint is heard', () => {
      const book = emptyRecipes()
      book.steam.heard = ['pomelo', 'lemongrass']
      const c = counting()
      expect(pickHint(book, c.rng)).toBeNull()
      expect(c.calls).toBe(0)
    })

    it('returns null when the first draw misses the chance', () => {
      expect(pickHint(emptyRecipes(), queued(0.5))).toBeNull()
    })

    it('picks from the list with the second draw', () => {
      expect(pickHint(emptyRecipes(), queued(0.1, 0.9))).toEqual({ recipe: 'steam', ingredient: 'lemongrass' })
    })

    it('never returns a heard ingredient', () => {
      const book = emptyRecipes()
      book.steam.heard = ['pomelo']
      for (const d of [0, 0.5, 0.99]) {
        expect(pickHint(book, queued(0.1, d))).toEqual({ recipe: 'steam', ingredient: 'lemongrass' })
      }
    })
  })
})
