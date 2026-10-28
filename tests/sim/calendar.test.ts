import { describe, expect, it } from 'vitest'
import { dayOfMonth, daysLeftInMonth, monthOf, monthStart, yearOf } from '../../src/sim/calendar'

describe('the in-game calendar', () => {
  it('runs three days to a month and twelve months to a year', () => {
    expect([1, 3, 4, 11, 36, 37].map(monthOf)).toEqual([1, 1, 2, 4, 12, 1])
    expect([36, 37].map(yearOf)).toEqual([1, 2])
    expect([1, 3, 4].map(dayOfMonth)).toEqual([1, 3, 1])
  })

  it('counts the days left in the month with today, and finds the first day', () => {
    expect([8, 9, 10].map(daysLeftInMonth)).toEqual([2, 1, 3])
    expect([8, 10].map(monthStart)).toEqual([7, 10])
  })
})
