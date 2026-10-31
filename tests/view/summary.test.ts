import { describe, expect, it } from 'vitest'
import type { DayStats } from '../../src/sim/types'
import { GAME_H } from '../../src/config'
import { chainSummaryRows, restaurantRows, summaryLayout, summaryRows, type SummaryRow } from '../../src/view/summary'

const stats = (over: Partial<DayStats>): DayStats => ({
  served: 0,
  angry: 0,
  walkedAway: 0,
  income: 0,
  tips: 0,
  wages: 0,
  restock: 0,
  gifts: 0,
  quests: 0,
  ownerServed: 0,
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

  it('shows gift money under Thu and in the profit', () => {
    const s = stats({ income: 400000, tips: 50000, gifts: 300000 })
    expect(labels(s)).toEqual(['served', 'leftUnhappy', 'summaryIn', 'income', 'tips', 'giftMoney', 'profit'])
    expect(row(s, 'giftMoney')).toEqual({ label: 'giftMoney', value: 300000, kind: 'money' })
    expect(row(s, 'profit')?.value).toBe(750000)
  })

  it('shows quest money after the gifts and in the profit, and no row on a day without any', () => {
    const s = stats({ income: 400000, tips: 50000, gifts: 300000, quests: 90000 })
    expect(labels(s)).toEqual(['served', 'leftUnhappy', 'summaryIn', 'income', 'tips', 'giftMoney', 'questReward', 'profit'])
    expect(row(s, 'questReward')).toEqual({ label: 'questReward', value: 90000, kind: 'money' })
    expect(row(s, 'profit')?.value).toBe(840000)
    expect(labels(stats({ income: 400000 }))).not.toContain('questReward')
  })
})

describe('the chain on the summary', () => {
  it('names each shop, then adds a total', () => {
    expect(chainSummaryRows([{ place: null, profit: 1_000_000 }, { place: 'beach', profit: -50_000 }])).toEqual([
      { label: 'Tiệm gốc', value: 1_000_000 },
      { label: 'Bãi biển', value: -50_000 },
      { label: 'Tổng', value: 950_000 },
    ])
  })

  it('lays out exactly as before with no chain shops', () => {
    const kinds: SummaryRow['kind'][] = ['count', 'count', 'heading', 'money', 'money', 'money']
    const l = summaryLayout(kinds, 0, 0)
    expect([l.top, l.nameY, l.titleY, l.rowsTop, l.rowH, l.headingH]).toEqual([420, 485, 565, 650, 90, 64])
    const rowsEnd = 650 + 5 * 90 + 64
    expect(l.buttonY).toBe(rowsEnd + 95)
    expect(l.cardH).toBe(rowsEnd + 95 + 135 - 420)
    expect(summaryLayout(kinds, 0, 100).buttonY).toBe(rowsEnd + 20 + 100 + 95)
  })

  it('goes compact with chain shops and puts the block 24 px under the rows', () => {
    const kinds: SummaryRow['kind'][] = ['count', 'heading', 'money']
    const l = summaryLayout(kinds, 2, 0)
    expect([l.top, l.nameY, l.titleY, l.rowsTop, l.rowH, l.headingH, l.chainRowH]).toEqual([200, 262, 340, 410, 66, 50, 58])
    expect(l.chainTop).toBe(410 + 66 + 50 + 66 + 24)
    expect(l.buttonY).toBeGreaterThan(l.chainTop + 4 * 58)
  })

  it('fits the worst case on the screen, moving up over the top bar', () => {
    const kinds: SummaryRow['kind'][] = ['count', 'count', 'heading', 'money', 'money', 'money', 'money', 'heading', 'money', 'money', 'money', 'money', 'money']
    // the VIP and event notes (330), then the starter chain's goal and a record day: one line of 34 px text (about 50 px) and a 14 px gap each
    const notesH = 330 + 2 * (50 + 14)
    const l = summaryLayout(kinds, 2, notesH)
    expect(l.top + l.cardH).toBeLessThanOrEqual(GAME_H - 40)
    expect(l.top).toBe(100)
    // everything moves up together, the notes and the button too
    const low = summaryLayout(kinds, 2, 0)
    expect(low.top).toBe(200)
    for (const k of ['nameY', 'titleY', 'rowsTop', 'chainTop', 'notesTop'] as const) expect(low[k] - l[k]).toBe(100)
    expect(l.buttonY).toBe(l.notesTop + notesH + 95)
  })

  it('puts the notes under the rows, or under the chain block', () => {
    const kinds: SummaryRow['kind'][] = ['count', 'heading', 'money']
    expect(summaryLayout(kinds, 0, 120).notesTop).toBe(650 + 90 + 64 + 90 + 20)
    const l = summaryLayout(kinds, 2, 120)
    expect(l.notesTop).toBe(l.chainTop + 4 * 58 + 20 + 20)
    expect(l.buttonY).toBe(l.notesTop + 120 + 95)
  })
})

describe('the restaurant on the summary', () => {
  it("lists the restaurant's diners, dish money and tips", () => {
    expect(restaurantRows({ served: 4, income: 240_000, tips: 35_000, walkedAway: 1, wages: 0, restock: 0, ownerCooked: 0, chefCooked: 0 })).toEqual([
      { label: 'restaurantServed', value: 4, kind: 'count' },
      { label: 'restaurantIncome', value: 240_000, kind: 'money' },
      { label: 'restaurantTips', value: 35_000, kind: 'money' },
    ])
  })

  it("adds the cooks' wages and the restock to the restaurant block when there are any", () => {
    const stats = { served: 4, income: 240_000, tips: 35_000, walkedAway: 0, wages: 30_000, restock: 0, ownerCooked: 0, chefCooked: 0 }
    expect(restaurantRows(stats).map(r => r.label)).toEqual(['restaurantServed', 'restaurantIncome', 'restaurantTips', 'restaurantWages'])
    expect(restaurantRows({ ...stats, wages: 0, restock: 200_000 }).map(r => r.label)).toEqual(['restaurantServed', 'restaurantIncome', 'restaurantTips', 'restockCost'])
    expect(restaurantRows({ ...stats, restock: 200_000 }).slice(3)).toEqual([
      { label: 'restaurantWages', value: 30_000, kind: 'money' },
      { label: 'restockCost', value: 200_000, kind: 'money' },
    ])
  })

  it('lays out a card with the restaurant block below the chain block', () => {
    const kinds: SummaryRow['kind'][] = ['count', 'count', 'heading', 'money', 'money', 'money']
    const l = summaryLayout(kinds, 1, 0, 3)
    expect(l.restaurantTop).toBeGreaterThanOrEqual(l.chainTop + 3 * l.chainRowH)
    expect(l.buttonY - l.restaurantTop).toBeGreaterThanOrEqual(4 * l.chainRowH)
    expect(l.top + l.cardH).toBeLessThanOrEqual(GAME_H - 40)
    expect(l.restaurantOneLine).toBe(false)
    const alone = summaryLayout(kinds, 0, 0, 3)
    expect([alone.top, alone.rowH, alone.headingH, alone.chainRowH]).toEqual([200, 66, 50, 58])
    expect(alone.top + alone.cardH).toBeLessThanOrEqual(GAME_H - 40)
  })

  it('keeps the card as it was with no restaurant', () => {
    const kinds: SummaryRow['kind'][] = ['count', 'heading', 'money']
    expect(summaryLayout(kinds, 0, 0, 0)).toEqual(summaryLayout(kinds, 0, 0))
    expect(summaryLayout(kinds, 2, 120, 0)).toEqual(summaryLayout(kinds, 2, 120))
  })

  it('falls back to a one-line block in the worst case, keeping the card on the screen', () => {
    // every optional row (11 rows, 2 headings), 3 branches, the restaurant and 400 px of notes
    const kinds: SummaryRow['kind'][] = ['count', 'count', 'heading', 'money', 'money', 'money', 'money', 'heading', 'money', 'money', 'money', 'money', 'money']
    const l = summaryLayout(kinds, 3, 400, 3)
    expect(l.restaurantOneLine).toBe(true)
    expect(l.top).toBeGreaterThanOrEqual(0)
    expect(l.top + l.cardH).toBeLessThanOrEqual(GAME_H - 40)
    expect(l.restaurantTop).toBeGreaterThanOrEqual(l.chainTop + 5 * l.chainRowH)
    expect(l.buttonY - l.restaurantTop).toBeGreaterThanOrEqual(l.chainRowH)
    // without the restaurant it is the layout it always was
    expect(summaryLayout(kinds, 3, 400, 0).restaurantOneLine).toBe(false)
  })
})
