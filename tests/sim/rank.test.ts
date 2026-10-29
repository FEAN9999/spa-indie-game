import { describe, expect, it } from 'vitest'
import { emptyRankBook, isJudgeDay, isYearEnd, judgeMonth, judgeYear, monthInput, rankParts, rankPrice, rivalsFor, standings, starsFor, yearSoFar, type RankInput } from '../../src/sim/rank'

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
const input = (o: Partial<RankInput> = {}): RankInput => ({ rating: 4.8, beauty: 60, services: 6, servedPerDay: 25, lostShare: 0, ...o })

describe('scoring the shop', () => {
  it("scores the sketch's two shops", () => {
    const a = rankParts({ rating: 4.2, beauty: 40, services: 4, servedPerDay: 14, lostShare: 0.09 })
    expect(a).toEqual([13, 13, 13, 11, 11])
    expect(sum(a)).toBe(61)
    const b = rankParts({ rating: 4.4, beauty: 48, services: 4, servedPerDay: 14, lostShare: 0.1 })
    expect(b).toEqual([16, 16, 13, 11, 10])
    expect(sum(b)).toBe(66)
  })

  it('keeps every part a whole number from 0 to 20', () => {
    const part = (i: number, o: Partial<RankInput>) => rankParts(input(o))[i]
    expect([null, 2.5, 5].map(rating => part(0, { rating }))).toEqual([0, 0, 20])
    expect([0, 90].map(beauty => part(1, { beauty }))).toEqual([0, 20])
    expect([1, 6].map(services => part(2, { services }))).toEqual([3, 20])
    expect([0, 30].map(servedPerDay => part(3, { servedPerDay }))).toEqual([0, 20])
    expect([0, 0.25, null].map(lostShare => part(4, { lostShare }))).toEqual([20, 0, 0])
  })

  it('turns points into stars', () => {
    const cases: [number, number][] = [[29, 1], [30, 2], [49, 2], [50, 3], [69, 3], [70, 4], [84, 4], [85, 5], [100, 5]]
    for (const [total, stars] of cases) expect(starsFor(total)).toBe(stars)
  })

  it('raises prices 5% a star from 2 stars, to the nearest 1.000 đ', () => {
    expect(rankPrice(40000, 1)).toBe(40000)
    expect(rankPrice(40000, 2)).toBe(42000)
    expect(rankPrice(90000, 2)).toBe(95000)
    expect(rankPrice(160000, 5)).toBe(192000)
  })
})

describe('the calendar of judging', () => {
  it('judges on the last day of each month from day 9, and the year on day 36, 72', () => {
    for (const d of [3, 6, 8, 10]) expect(isJudgeDay(d)).toBe(false)
    for (const d of [9, 12, 36]) expect(isJudgeDay(d)).toBe(true)
    for (const d of [36, 72]) expect(isYearEnd(d)).toBe(true)
    for (const d of [35, 37]) expect(isYearEnd(d)).toBe(false)
  })

  it('reads the month from its snapshot', () => {
    const book = emptyRankBook(13, 100, 5)
    const i = monthInput(book, 15, 4, 30, 3, { served: 145, lost: 10 })
    expect([i.servedPerDay, i.lostShare]).toEqual([15, 0.1])
    const quiet = monthInput(book, 15, 4, 30, 3, { served: 100, lost: 5 })
    expect([quiet.servedPerDay, quiet.lostShare]).toEqual([0, null])
  })

  it('counts no more than six services, so the part is full and the card reads 6/6', () => {
    const i = monthInput(emptyRankBook(13, 100, 5), 15, 4, 30, 7, { served: 145, lost: 10 })
    expect(i.services).toBe(6)
    expect(rankParts(i)[2]).toBe(20)
  })
})

describe('the monthly grade', () => {
  it('climbs one star a month and never falls', () => {
    const book = emptyRankBook(1, 0, 0)
    const first = judgeMonth(book, input(), 9)
    expect([first.before, first.after, first.reward, book.stars, book.scores]).toEqual([1, 2, 200000, 2, [100]])
    expect(book.last).toBe(first)
    const second = judgeMonth(book, input(), 12)
    expect([second.after, second.reward]).toEqual([3, 400000])
    const bad = judgeMonth(book, input({ rating: null, beauty: 0, services: 0, servedPerDay: 0, lostShare: 0.2 }), 15)
    expect([bad.total, bad.after, bad.reward, book.stars]).toEqual([0, 3, 0, 3])
  })
})

describe('the year', () => {
  it('rivals climb 4 a year up to 86', () => {
    const pts = (y: number) => rivalsFor(y).map(r => r.pts)
    expect(pts(1)).toEqual([48, 58, 66, 74])
    expect(pts(2)).toEqual([52, 62, 70, 78])
    expect(pts(5)).toEqual([64, 74, 82, 86])
    expect(pts(11)).toEqual([86, 86, 86, 86])
  })

  it('ranks the shop first on a tie', () => {
    const place = (mine: number) => standings(mine, 1).findIndex(r => r.rival === null) + 1
    expect([place(74), place(66), place(40)]).toEqual([1, 2, 5])
  })

  it('pays the year by place, the cup and the certificate once each', () => {
    const book = emptyRankBook(1, 0, 0)
    book.scores = [70, 76]
    const a = judgeYear(book, 36)!
    expect([a.year, a.score, a.place, a.reward, a.gifts, book.meritGiven, book.scores, book.lastYear]).toEqual([1, 73, 2, 1000000, ['merit'], true, [], a])
    book.scores = [70, 76]
    expect(judgeYear(book, 72)!.gifts).toEqual([])
    book.scores = [80]
    const c = judgeYear(book, 72)!
    expect([c.place, c.reward, c.gifts, book.wins]).toEqual([1, 3000000, ['trophy'], 1])
    book.scores = [90]
    const d = judgeYear(book, 72)!
    expect([d.gifts, book.wins]).toEqual([[], 2])
    expect(judgeYear(book, 72)).toBeNull()
  })

  it('projects the year with this month so far', () => {
    const book = emptyRankBook(1, 0, 0)
    book.scores = [55, 58]
    expect(yearSoFar(book, 61)).toBe(58)
  })
})
