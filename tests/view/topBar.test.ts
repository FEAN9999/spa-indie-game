import { describe, expect, it } from 'vitest'
import { layoutTopBar, TOP_BAR } from '../../src/view/topBar'

// widths in canvas px, measured in the game at the HUD's font sizes
describe('top bar layout', () => {
  it('keeps the star where the board has it while the money is short', () => {
    expect(layoutTopBar(260, 170)).toEqual({ moneyScale: 1, starX: 463.5, ratingX: 502 })
  })

  it('moves the star right of money in the hundreds of millions', () => {
    const l = layoutTopBar(415, 78) // 999.999.999 đ at 52 px, 4.5 at 44 px
    expect(l.moneyScale).toBe(1)
    expect(l.starX - TOP_BAR.starW / 2 - (TOP_BAR.moneyX + 415)).toBe(16)
  })

  it('shrinks the money only when the rating would pass the pause button', () => {
    const l = layoutTopBar(800, 170)
    expect(l.moneyScale).toBeLessThan(1)
    expect(l.ratingX + 170).toBeCloseTo(TOP_BAR.rowRight)
    expect(l.starX - TOP_BAR.starW / 2 - (TOP_BAR.moneyX + 800 * l.moneyScale)).toBeCloseTo(16)
  })
})
