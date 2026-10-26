import { describe, expect, it } from 'vitest'
import { stockLowText } from '../../src/view/stockText'

describe('stockLowText', () => {
  it('joins the names, keeping the first one capitalised', () => {
    expect(stockLowText(['shampoo', 'towel'])).toBe('Dầu gội, khăn sắp hết')
  })
  it('names a single item', () => {
    expect(stockLowText(['towel'])).toBe('Khăn sắp hết')
  })
})
