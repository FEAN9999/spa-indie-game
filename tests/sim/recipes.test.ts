import { describe, expect, it } from 'vitest'
import { emptyRecipes, isMix, pickHint, rightCount, RECIPE_IDS, RECIPES, sameMix } from '../../src/sim/recipes'
import type { Rng } from '../../src/sim/rng'
import { RECIPE_HINT_TEXT } from '../../src/strings/vi'

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

  it('knows the stone and mud recipes and their hints, and an empty book holds all three', () => {
    expect(RECIPE_IDS).toEqual(['steam', 'stone', 'mud'])
    expect(RECIPES.stone).toEqual({ ingredients: ['coconut', 'cajeput', 'ginger'], hints: ['coconut', 'cajeput'] })
    expect(RECIPES.mud).toEqual({ ingredients: ['mineralMud', 'salt', 'honey'], hints: ['mineralMud', 'salt'] })
    expect(emptyRecipes()).toEqual({
      steam: { solved: false, tries: [], heard: [] },
      stone: { solved: false, tries: [], heard: [] },
      mud: { solved: false, tries: [], heard: [] },
    })
  })

  it('has the four stone and mud hint lines word for word', () => {
    expect(RECIPE_HINT_TEXT.stone).toEqual({
      coconut: 'Chỗ tui hay đi, người ta thoa dầu dừa lên lưng trước rồi mới đặt đá.',
      cajeput: 'Nhỏ vài giọt dầu tràm lên đá, hít vô là thông mũi liền.',
    })
    expect(RECIPE_HINT_TEXT.mud).toEqual({
      mineralMud: 'Bùn phải là bùn khoáng nghen, bùn ao là ngứa cả tuần.',
      salt: 'Bùn mà không bỏ chút muối hột thì ngâm chẳng đã gì hết.',
    })
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
      for (const id of RECIPE_IDS) book[id].solved = true
      const c = counting()
      expect(pickHint(book, c.rng)).toBeNull()
      expect(c.calls).toBe(0)
    })

    it('returns null without drawing when every hint is heard', () => {
      const book = emptyRecipes()
      book.steam.heard = ['pomelo', 'lemongrass']
      book.stone.heard = ['coconut', 'cajeput']
      book.mud.heard = ['mineralMud', 'salt']
      const c = counting()
      expect(pickHint(book, c.rng)).toBeNull()
      expect(c.calls).toBe(0)
    })

    it('returns null when the first draw misses the chance', () => {
      expect(pickHint(emptyRecipes(), queued(0.5))).toBeNull()
    })

    it('picks from the list with the second draw', () => {
      expect(pickHint(emptyRecipes(), queued(0.1, 0.1))).toEqual({ recipe: 'steam', ingredient: 'pomelo' })
      expect(pickHint(emptyRecipes(), queued(0.1, 0.99))).toEqual({ recipe: 'mud', ingredient: 'salt' })
    })

    it('only returns mud once steam is solved and both stone hints are heard', () => {
      const book = emptyRecipes()
      book.steam.solved = true
      book.stone.heard = ['coconut', 'cajeput']
      for (const d of [0, 0.5, 0.99]) expect(pickHint(book, queued(0.1, d))?.recipe).toBe('mud')
    })

    it('never returns a heard ingredient', () => {
      const book = emptyRecipes()
      book.steam.heard = ['pomelo']
      for (const d of [0, 0.5, 0.99]) {
        expect(pickHint(book, queued(0.1, d))?.ingredient).not.toBe('pomelo')
      }
      expect(pickHint(book, queued(0.1, 0))).toEqual({ recipe: 'steam', ingredient: 'lemongrass' })
    })
  })
})
