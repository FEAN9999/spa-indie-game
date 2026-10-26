import { expect, it } from 'vitest'
import { isUnlocked } from '../../src/sim/unlocks'

it('opens building on day 2, staff on day 3, services on day 4 and stock on day 5', () => {
  expect([1, 2].map(d => isUnlocked('build', d))).toEqual([false, true])
  expect([2, 3].map(d => isUnlocked('staff', d))).toEqual([false, true])
  expect([3, 4].map(d => isUnlocked('services', d))).toEqual([false, true])
  expect([4, 5, 40].map(d => isUnlocked('stock', d))).toEqual([false, true, true])
})
