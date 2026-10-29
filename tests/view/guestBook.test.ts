import { describe, expect, it } from 'vitest'
import { CELEB_FROM_DAY } from '../../src/config'
import { KINDS, MAIN_KINDS } from '../../src/sim/customers'
import { REGULAR_IDS, emptyBook } from '../../src/sim/regulars'
import { IDOL_IDS, emptyIdolBook } from '../../src/sim/idols'
import { VIP_IDS, emptyVipBook } from '../../src/sim/vips'
import { IDOL_TEXT } from '../../src/strings/idols'
import { REGULAR_TEXT } from '../../src/strings/regulars'
import { VIP_TEXT } from '../../src/strings/vips'
import { bookTabs, detailLines, firstTab, idolDetailLines, idolRows, kindRows, regularRows, toldLines, vipDetailLines, vipRows } from '../../src/view/guestBook'

describe('guest book rows', () => {
  it("shows a new shop's book with six soon and two by introduction", () => {
    const rows = regularRows(emptyBook())
    expect(rows.map(r => r.id)).toEqual(REGULAR_IDS)
    expect(rows.filter(r => r.shown === 'soon')).toHaveLength(6)
    expect(rows.filter(r => r.shown === 'friend')).toEqual([
      { id: 'thao', shown: 'friend', by: 'hanh' },
      { id: 'lan', shown: 'friend', by: 'thao' },
    ])
  })

  it("shows a met regular's hearts and card", () => {
    const book = emptyBook()
    book.regulars.hanh = { meetDay: 7, met: true, points: 8, hearts: 2, visitAt: null }
    book.regulars.vy = { meetDay: 9, met: true, points: 12, hearts: 3, visitAt: null }
    const rows = regularRows(book)
    expect(rows[0]).toEqual({ id: 'hanh', shown: 'met', hearts: 2, member: false })
    expect(rows[1]).toEqual({ id: 'vy', shown: 'met', hearts: 3, member: true })
  })

  it('keeps a regular with a meeting day but not yet come as soon or friend', () => {
    const book = emptyBook()
    book.regulars.sau.meetDay = 11
    book.regulars.thao.meetDay = 12
    const rows = regularRows(book)
    expect(rows[2]).toEqual({ id: 'sau', shown: 'soon' })
    expect(rows[6]).toEqual({ id: 'thao', shown: 'friend', by: 'hanh' })
  })

  it('counts the lines told', () => {
    const book = emptyBook()
    expect(toldLines(book, 'hanh')).toBe(0)
    book.regulars.hanh.hearts = 3
    expect(toldLines(book, 'hanh')).toBe(3)
  })

  it('shows the first words, then the story told so far', () => {
    const book = emptyBook()
    expect(detailLines(book, 'hanh')).toEqual([REGULAR_TEXT.hanh.intro])
    book.regulars.hanh.hearts = 2
    expect(detailLines(book, 'hanh')).toEqual([REGULAR_TEXT.hanh.intro, ...REGULAR_TEXT.hanh.story.slice(0, 2)])
  })

  it('marks kinds met and their counts', () => {
    const book = emptyBook()
    book.kindsMet = ['student', 'office']
    book.served.student = 4
    const rows = kindRows(book)
    expect(rows.map(r => r.kind)).toEqual(MAIN_KINDS)
    expect(rows[0]).toMatchObject({ kind: 'student', met: true, served: 4 })
    expect(rows[2]).toMatchObject({ kind: 'picky', met: false, served: 0 })
  })

  it('gives each kind its first day', () => {
    const rows = kindRows(emptyBook())
    for (const r of rows) expect(r.fromDay).toBe(KINDS[r.kind].fromDay)
    expect(rows.find(r => r.kind === 'celeb')!.fromDay).toBe(CELEB_FROM_DAY)
  })

  it('lists the four VIPs in book order, unmet at first', () => {
    const rows = vipRows(emptyVipBook())
    expect(rows.map(r => r.id)).toEqual(VIP_IDS)
    expect(rows.every(r => !r.met && r.visits === 0 && r.best === 0 && !r.photo)).toBe(true)
  })

  it("shows a met VIP's visits, best stars and photo", () => {
    const vip = emptyVipBook()
    vip.vips.miss = { visits: 2, best: 3, photo: true }
    const rows = vipRows(vip)
    expect(rows[1]).toEqual({ id: 'miss', met: true, visits: 2, best: 3, photo: true })
    expect(rows[0].met).toBe(false)
  })

  it("shows a VIP's words only once said: none unmet, her arrival after a visit, her thanks after 3 stars", () => {
    expect(vipDetailLines('chef', { visits: 0, best: 0, photo: false })).toEqual([])
    expect(vipDetailLines('chef', { visits: 1, best: 2, photo: false })).toEqual([VIP_TEXT.chef.arrive])
    expect(vipDetailLines('chef', { visits: 2, best: 3, photo: true })).toEqual([VIP_TEXT.chef.arrive, VIP_TEXT.chef.thanks])
  })

  it('shows the VIP tab only once a VIP has been booked', () => {
    const vip = emptyVipBook()
    expect(bookTabs(vip, emptyIdolBook())).toEqual(['regulars', 'kinds'])
    vip.everBooked = true
    expect(bookTabs(vip, emptyIdolBook())).toEqual(['regulars', 'kinds', 'vip'])
  })

  it('shows the star tab once a star has been booked, last', () => {
    const vip = emptyVipBook()
    const idol = emptyIdolBook()
    idol.everBooked = true
    expect(bookTabs(vip, idol)).toEqual(['regulars', 'kinds', 'idol'])
    vip.everBooked = true
    expect(bookTabs(vip, idol)).toEqual(['regulars', 'kinds', 'vip', 'idol'])
  })

  it('lists the nine stars in book order, unmet at first', () => {
    const rows = idolRows(emptyIdolBook())
    expect(rows.map(r => r.id)).toEqual(IDOL_IDS)
    for (const r of rows) expect(r).toMatchObject({ met: false, visits: 0, best: 0, photo: false })
  })

  it("shows a met star's visits, best stars and photo, and a 2-star one without a photo", () => {
    const idol = emptyIdolBook()
    idol.idols.taylor = { visits: 2, best: 3, photo: true, thanked: true }
    idol.idols.gd = { visits: 1, best: 2, photo: false, thanked: false }
    const rows = idolRows(idol)
    expect(rows[1]).toEqual({ id: 'taylor', met: true, visits: 2, best: 3, photo: true })
    expect(rows[2]).toEqual({ id: 'gd', met: true, visits: 1, best: 2, photo: false })
    expect(rows[0].met).toBe(false)
  })

  it("shows a star's words only once said", () => {
    expect(idolDetailLines('jennie', { visits: 0, best: 0, photo: false, thanked: false })).toEqual([])
    expect(idolDetailLines('jennie', { visits: 1, best: 2, photo: false, thanked: false })).toEqual([IDOL_TEXT.jennie.arrive])
    expect(idolDetailLines('jennie', { visits: 2, best: 3, photo: true, thanked: true })).toEqual([IDOL_TEXT.jennie.arrive, IDOL_TEXT.jennie.thanks])
  })

  it('opens on the VIP tab only when a VIP is all there is to see', () => {
    const book = emptyBook()
    const vip = emptyVipBook()
    expect(firstTab(book, vip)).toBe('regulars')
    vip.everBooked = true
    expect(firstTab(book, vip)).toBe('vip')
    book.regulars.hanh.met = true
    expect(firstTab(book, vip)).toBe('regulars')
  })
})
