import { describe, expect, it } from 'vitest'
import { restaurantStockText, stockLowText } from '../../src/view/stockText'

describe('stockLowText', () => {
  it('joins the names, keeping the first one capitalised', () => {
    expect(stockLowText(['shampoo', 'towel'])).toBe('Dầu gội, khăn sắp hết')
  })
  it('names a single item', () => {
    expect(stockLowText(['towel'])).toBe('Khăn sắp hết')
  })
})

describe('restaurantStockText', () => {
  it('names one item running low', () => {
    expect(restaurantStockText([{ item: 'herbs', out: false }])).toBe('Rau thơm sắp hết')
  })
  it('joins the items that ran low at once', () => {
    expect(restaurantStockText([{ item: 'phoKit', out: false }, { item: 'herbs', out: false }])).toBe('Nguyên liệu phở, rau thơm sắp hết')
  })
  it('names the items that ran out, and lets them win over one only running low', () => {
    expect(restaurantStockText([{ item: 'batter', out: true }])).toBe('Hết bột bánh xèo. Nhập thêm ở Thực đơn')
    expect(restaurantStockText([{ item: 'batter', out: true }, { item: 'herbs', out: true }])).toBe('Hết bột bánh xèo, rau thơm. Nhập thêm ở Thực đơn')
    expect(restaurantStockText([{ item: 'cheKit', out: false }, { item: 'herbs', out: true }])).toBe('Hết rau thơm. Nhập thêm ở Thực đơn')
  })
  it('says nothing when nothing ran low', () => {
    expect(restaurantStockText([])).toBeNull()
  })
})
