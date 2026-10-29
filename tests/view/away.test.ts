import { describe, expect, it } from 'vitest'
import type { AwayResult } from '../../src/sim/away'
import { awayLines, awayTime, awayTip } from '../../src/view/away'

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR
const result = (over: Partial<AwayResult> = {}): AwayResult => ({ paid: 1_000_000, ms: 5 * HOUR, profit: 1_000_000, days: 3, places: [null], capped: false, tip: false, ...over })

describe('awayTime', () => {
  it('reads hours and minutes, rounding minutes down', () => {
    expect(awayTime(5 * HOUR + 20 * MIN)).toBe('5 giờ 20 phút')
    expect(awayTime(3 * HOUR)).toBe('3 giờ')
    expect(awayTime(25 * MIN + 59_000)).toBe('25 phút')
  })
  it('reads days and hours from one day', () => {
    expect(awayTime(3 * DAY + 2 * HOUR + 10 * MIN)).toBe('3 ngày 2 giờ')
    expect(awayTime(2 * DAY)).toBe('2 ngày')
  })
})

describe('awayLines', () => {
  const rule = 'Mỗi giờ vắng bằng 1/4 lãi một ngày (lãi trung bình 3 ngày gần nhất: 1.000.000 đ).'
  const still = 'Lịch, giờ trong ngày, nhiệm vụ và kho vẫn như lúc tắt game.'
  it('gives the rule line and the still line', () => {
    expect(awayLines(result())).toEqual([rule, still])
  })
  it('counts the shops when two paid', () => {
    expect(awayLines(result({ places: [null, 'beach'], profit: 500_000 }))).toEqual([
      'Cả 2 tiệm',
      'Mỗi giờ vắng bằng 1/4 lãi một ngày của mỗi tiệm (cộng lãi trung bình các tiệm: 500.000 đ).',
      still,
    ])
  })
  it('names a branch that paid alone', () => {
    expect(awayLines(result({ places: ['uptown'], days: 2, profit: 400_000 }))).toEqual([
      'Từ chi nhánh Khu cao cấp',
      'Mỗi giờ vắng bằng 1/4 lãi một ngày (lãi trung bình 2 ngày gần nhất: 400.000 đ).',
      still,
    ])
  })
  it('puts the capped line between them', () => {
    expect(awayLines(result({ capped: true }))).toEqual([rule, 'Vắng hơn 8 giờ thì vẫn tính 8 giờ.', still])
  })
  it('words the rule for fewer days', () => {
    expect(awayLines(result({ days: 1 }))[0]).toBe('Mỗi giờ vắng bằng 1/4 lãi một ngày (lãi ngày gần nhất: 1.000.000 đ).')
    expect(awayLines(result({ days: 2 }))[0]).toContain('lãi trung bình 2 ngày gần nhất')
  })
  it('rounds the mean to 1.000', () => {
    expect(awayLines(result({ profit: 333_333 }))[0]).toContain('333.000 đ')
  })
})

describe('awayTip', () => {
  it('is a quiet coins card', () => {
    const c = awayTip()
    expect(c.head).toBe('Mẹo · tiền khi vắng')
    expect(c.name).toBe('Tắt game mà tiền vẫn vào')
    expect(c.line).toBe('Ngày nào nhân viên làm hết khách (khách VIP thì chủ tiệm làm), tắt game tiền vẫn vào.')
    expect(c.quiet).toBe(true)
    expect(c.icon.texture).toBe('badge-coins')
  })
})
