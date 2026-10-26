import { describe, expect, it } from 'vitest'
import { formatMoney } from '../../src/strings/format'
import { t } from '../../src/strings/vi'

describe('strings', () => {
  it('formats money with dot separators', () => {
    expect(formatMoney(0)).toBe('0 đ')
    expect(formatMoney(40000)).toBe('40.000 đ')
    expect(formatMoney(1234567)).toBe('1.234.567 đ')
  })

  it('fills params into strings', () => {
    expect(t('summaryTitle', { day: 3 })).toBe('Tổng kết ngày 3')
    expect(t('newDay')).toBe('Ngày mới')
  })

  it('fills the save screen strings', () => {
    expect(t('slotSummary', { n: 2, day: 5, money: formatMoney(340000) })).toBe('Ô 2 · Ngày 5 · 340.000 đ')
    expect(t('morningBanner', { name: 'Spa Sen', day: 3 })).toBe('Spa Sen · Ngày 3 · Mở cửa!')
    expect(t('importConfirm', { n: 2, day: 5 })).toBe('Tiệm trong ô 2 (Ngày 5) sẽ bị thay bằng tiệm trong mã. Tiếp tục?')
  })
})
