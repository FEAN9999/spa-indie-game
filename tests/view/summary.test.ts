import { describe, expect, it } from 'vitest'
import type { DayStats } from '../../src/sim/types'
import { summaryRows } from '../../src/view/summary'

const stats = (over: Partial<DayStats>): DayStats => ({
  served: 0,
  angry: 0,
  walkedAway: 0,
  income: 0,
  tips: 0,
  wages: 0,
  restock: 0,
  ...over,
})
const labels = (s: DayStats) => summaryRows(s).map(r => r.label)
const row = (s: DayStats, label: string) => summaryRows(s).find(r => r.label === label)

describe('end-of-day rows', () => {
  it('has no Chi heading on a day without wages or restocking, and the profit is income plus tips', () => {
    const s = stats({ served: 3, angry: 1, walkedAway: 1, income: 400000, tips: 50000 })
    expect(labels(s)).toEqual(['served', 'leftUnhappy', 'summaryIn', 'income', 'tips', 'profit'])
    expect(row(s, 'leftUnhappy')?.value).toBe(2)
    expect(row(s, 'profit')?.value).toBe(450000)
  })

  it('lists wages and restocking as negative money and takes both off the profit', () => {
    const s = stats({ income: 400000, tips: 50000, wages: 120000, restock: 140000 })
    expect(labels(s)).toEqual(['served', 'leftUnhappy', 'summaryIn', 'income', 'tips', 'summaryOut', 'wages', 'restockCost', 'profit'])
    expect(row(s, 'wages')?.value).toBe(-120000)
    expect(row(s, 'restockCost')?.value).toBe(-140000)
    expect(row(s, 'profit')?.value).toBe(190000)
  })

  it('shows restocking without wages on a day that only restocked', () => {
    const s = stats({ restock: 80000 })
    expect(labels(s)).toContain('restockCost')
    expect(labels(s)).not.toContain('wages')
    expect(row(s, 'profit')?.value).toBe(-80000)
  })
})
