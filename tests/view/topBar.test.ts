import { describe, expect, it } from 'vitest'
import { layoutTopBar, TOP_BAR } from '../../src/view/topBar'

// widths in canvas px, measured in the game at the HUD's font sizes
const gaps = (moneyW: number, ratingW: number, dayW: number) => {
  const l = layoutTopBar(moneyW, ratingW, dayW)
  return {
    moneyToStar: l.starX - TOP_BAR.starW / 2 - (TOP_BAR.moneyX + moneyW * l.moneyScale),
    ratingToDay: TOP_BAR.dayRight - dayW - (l.ratingX + ratingW),
    moneyScale: l.moneyScale,
  }
}

describe('top bar layout', () => {
  it('keeps the star where the board has it while the money is short', () => {
    expect(layoutTopBar(232, 150, 226)).toEqual({ moneyScale: 1, starX: 460, ratingX: 495 }) // 100.000 đ, Chưa có, Ngày 1
  })

  it('moves the star and rating right of money in the tens of millions', () => {
    const g = gaps(321, 55, 270) // 99.999.999 đ, 4.5, Ngày 100
    expect(g.moneyScale).toBe(1)
    expect(g.moneyToStar).toBeGreaterThanOrEqual(16)
    expect(g.ratingToDay).toBeGreaterThanOrEqual(24)
  })

  it('shrinks the money only when the row would reach the day and time', () => {
    const g = gaps(400, 150, 270)
    expect(g.moneyScale).toBeLessThan(1)
    expect(g.moneyToStar).toBeGreaterThanOrEqual(16)
    expect(g.ratingToDay).toBeGreaterThanOrEqual(24 - 1e-9)
  })
})
