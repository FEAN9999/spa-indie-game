import { describe, expect, it } from 'vitest'
import { rivalsFor, type MonthResult, type YearResult } from '../../src/sim/rank'
import { RANK_PART_ICON, judgeDayOf, monthOutcome, partRows, starsLine, totalLine, yearLines } from '../../src/view/rank'

const input = { rating: 4.2, beauty: 40, services: 4, servedPerDay: 14, lostShare: 0.09 }

describe('partRows', () => {
  it('names, values and points', () => {
    const rows = partRows(input, [1, 2, 3, 4, 5])
    expect(rows.map(r => r.name)).toEqual(['Điểm đánh giá', 'Điểm đẹp', 'Số dịch vụ', 'Khách mỗi ngày', 'Khách bỏ về'])
    expect(rows.map(r => r.value)).toEqual(['4,2', '40', '4/6 món', '14 khách', '9%'])
    expect(rows.map(r => r.pts)).toEqual([1, 2, 3, 4, 5])
    expect(rows.map(r => r.icon)).toEqual(RANK_PART_ICON)
  })
  it('has words for no rating and no customers', () => {
    const rows = partRows({ ...input, rating: null, lostShare: null }, [0, 0, 0, 0, 0])
    expect(rows[0].value).toBe('chưa có')
    expect(rows[4].value).toBe('0%')
  })
})

describe('lines', () => {
  it('starsLine', () => {
    expect(starsLine(1)).toBe('Tiệm 1 sao')
    expect(starsLine(3)).toBe('Tiệm 3 sao · khách trả thêm 10%')
  })
  it('totalLine', () => {
    expect(totalLine(46, 2, 15)).toBe('Tổng 46 điểm · cần 50 để lên 3 sao')
    expect(totalLine(61, 2, 15)).toBe('Tổng 61 điểm · đủ lên 3 sao tối ngày 15')
    expect(totalLine(88, 5, 15)).toBe('Tổng 88 điểm')
  })
  it('judgeDayOf', () => {
    expect(judgeDayOf(8)).toBe(9)
    expect(judgeDayOf(13)).toBe(15)
  })
})

describe('monthOutcome', () => {
  const m = (total: number, before: 1 | 2 | 3 | 4 | 5, after: 1 | 2 | 3 | 4 | 5, reward: number): MonthResult =>
    ({ day: 9, input, parts: [0, 0, 0, 0, 0], total, before, after, reward })
  it('up', () => {
    expect(monthOutcome(m(55, 2, 3, 400_000))).toEqual({ head: 'Lên 3 sao!', sub: 'Thưởng 400.000 đ. Từ mai khách trả thêm 10%, biển cạnh cửa đổi theo.' })
  })
  it('up with room to climb', () => {
    expect(monthOutcome(m(75, 2, 3, 400_000)).sub).toBe('Thưởng 400.000 đ. Từ mai khách trả thêm 10%, biển cạnh cửa đổi theo. Điểm đủ cao hơn nữa: tháng sau lên tiếp.')
  })
  it('kept', () => {
    expect(monthOutcome(m(46, 2, 2, 0))).toEqual({ head: 'Giữ 2 sao', sub: 'Còn 4 điểm nữa là lên 3 sao. Hạng không bao giờ tụt.' })
    expect(monthOutcome(m(90, 5, 5, 0))).toEqual({ head: 'Giữ 5 sao', sub: 'Tiệm đã ở hạng cao nhất.' })
  })
})

describe('yearLines', () => {
  const y = (place: number, gifts: YearResult['gifts'], year = 1, reward = 0): YearResult =>
    ({ day: 36, year, score: 68, table: [], place, reward, gifts })
  it('first with a trophy', () => {
    const r = yearLines(y(1, ['trophy'], 1, 3_000_000), 'Tiệm')
    expect(r.lines.slice(0, 2)).toEqual(['Tiệm đoạt Spa của năm! Thưởng 3.000.000 đ.', 'Lần đầu nên có thêm cúp vàng (vào Xây dựng).'])
    expect(r.button).toBe('Nhận thưởng')
  })
  it('second, third, fourth', () => {
    expect(yearLines(y(2, ['merit'], 1, 1_000_000), 'T').lines[0]).toBe('Hạng nhì. Thưởng 1.000.000 đ và bằng khen.')
    expect(yearLines(y(2, [], 1, 1_000_000), 'T').lines[0]).toBe('Hạng nhì. Thưởng 1.000.000 đ.')
    expect(yearLines(y(3, [], 1, 500_000), 'T').lines[0]).toBe('Hạng ba. Thưởng 500.000 đ.')
    const four = yearLines(y(4, []), 'T')
    expect(four.lines[0]).toBe('Năm sau cố lên. Không mất gì.')
    expect(four.button).toBe('Đóng')
  })
  it('closing lines', () => {
    expect(yearLines(y(4, []), 'T').lines.slice(-2)).toEqual(['Năm 2 các tiệm kia lên thêm 4 điểm.', 'Điểm của tiệm năm nay: 68, trung bình các tháng.'])
    expect(yearLines(y(4, [], 12), 'T').lines).toEqual(['Năm sau cố lên. Không mất gì.', 'Điểm của tiệm năm nay: 68, trung bình các tháng.'])
  })
  it('says the rivals rise only while one of them still does', () => {
    const next = (year: number) => yearLines(y(4, [], year), 'T').lines.some(l => l.includes('lên thêm'))
    expect(next(1)).toBe(true)
    expect(next(4)).toBe(true)
    expect(next(10)).toBe(true)
    expect(next(11)).toBe(false)
  })
  it('rows', () => {
    const r = yearLines({ ...y(5, []), table: [...rivalsFor(1), { rival: null, pts: 68 }] }, 'Spa Của Tôi')
    expect(r.rows.map(x => x.name)).toEqual(['Tiệm gội Cô Ba', 'Ngọc Lan Spa', 'Spa Hoa Sen', 'SPA MỚI', 'Spa Của Tôi'])
    expect(r.rows[3]).toEqual({ name: 'SPA MỚI', pts: '74 điểm', me: false })
    expect(r.rows[4].me).toBe(true)
  })
})
