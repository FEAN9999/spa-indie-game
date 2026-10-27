import { RECIPE_HINT_CHANCE } from '../config'
import type { Rng } from './rng'

export type Ingredient = 'pomelo' | 'lemongrass' | 'ginger' | 'salt' | 'mineralMud' | 'honey' | 'coconut' | 'cajeput'
/** Shelf order. */
export const INGREDIENTS: readonly Ingredient[] = ['pomelo', 'lemongrass', 'ginger', 'salt', 'mineralMud', 'honey', 'coconut', 'cajeput']

export type RecipeId = 'steam'
export const RECIPE_IDS: readonly RecipeId[] = ['steam']

export interface RecipeSpec {
  ingredients: readonly [Ingredient, Ingredient, Ingredient]
  hints: readonly [Ingredient, Ingredient]
}

export const RECIPES: Record<RecipeId, RecipeSpec> = {
  steam: { ingredients: ['pomelo', 'lemongrass', 'ginger'], hints: ['pomelo', 'lemongrass'] },
}

export interface RecipeTry { mix: Ingredient[]; right: number }
/** `heard` holds the hint ingredients a regular already told. */
export interface RecipeState { solved: boolean; tries: RecipeTry[]; heard: Ingredient[] }
export type RecipeBook = Record<RecipeId, RecipeState>

export const emptyRecipes = (): RecipeBook => ({ steam: { solved: false, tries: [], heard: [] } })

/** Exactly 3 distinct known ingredients. */
export const isMix = (x: unknown): x is Ingredient[] =>
  Array.isArray(x) && x.length === 3 && new Set(x).size === 3 && x.every(i => INGREDIENTS.includes(i))

/** Same ingredients, in any order. */
export const sameMix = (a: readonly Ingredient[], b: readonly Ingredient[]): boolean =>
  a.length === b.length && a.every(i => b.includes(i))

/** How many of the mix's ingredients belong to the recipe. */
export const rightCount = (id: RecipeId, mix: readonly Ingredient[]): number =>
  mix.filter(i => RECIPES[id].ingredients.includes(i)).length

/** A hint a regular might tell: draws the chance first, then which one; null when nothing is left to hear. */
export function pickHint(book: RecipeBook, rng: Rng): { recipe: RecipeId; ingredient: Ingredient } | null {
  const open: { recipe: RecipeId; ingredient: Ingredient }[] = []
  for (const recipe of RECIPE_IDS) {
    if (book[recipe].solved) continue
    for (const ingredient of RECIPES[recipe].hints) if (!book[recipe].heard.includes(ingredient)) open.push({ recipe, ingredient })
  }
  if (open.length === 0) return null
  if (rng() >= RECIPE_HINT_CHANCE) return null
  return open[Math.floor(rng() * open.length)]
}
