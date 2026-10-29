import { describe, expect, it } from 'vitest'
import { Chain } from '../../src/sim/chain'
import { parseSave } from '../../src/sim/save'
import { SERVICE_IDS } from '../../src/sim/services'
import { stockItemsFor } from '../../src/sim/stock'
import { lessonAction, panelPage, rowPage, servicesOpening } from '../../src/view/servicesPanel'
import { starShop } from '../sim/helpers'

const SIX = SERVICE_IDS.slice(0, 6)

describe('panelPage', () => {
  it('puts six services on the first page and scrub on the second', () => {
    const p0 = panelPage(SERVICE_IDS, 0)
    expect(p0.pages).toBe(2)
    expect(p0.rows).toEqual(SIX)
    expect(panelPage(SERVICE_IDS, 1).rows).toEqual(['scrub', 'foot', 'nails'])
  })
  it('wraps the page both ways', () => {
    expect(panelPage(SERVICE_IDS, 2).page).toBe(0)
    expect(panelPage(SERVICE_IDS, 2).rows).toEqual(SIX)
    expect(panelPage(SERVICE_IDS, -1).page).toBe(1)
    expect(panelPage(SERVICE_IDS, -1).rows).toEqual(['scrub', 'foot', 'nails'])
  })
  it('keeps six rows on one page', () => {
    expect(panelPage(SIX, 0).pages).toBe(1)
  })
  it('pages the stock list: salt on the second page once scrub is open', () => {
    expect(panelPage(stockItemsFor([...SIX, 'scrub']), 1).rows).toEqual(['salt'])
    expect(panelPage(stockItemsFor([...SIX, 'scrub', 'nails']), 1).rows).toEqual(['salt', 'polish'])
    expect(panelPage(stockItemsFor(SIX), 0).pages).toBe(1)
  })
  it('rowPage', () => {
    expect(rowPage(5)).toBe(0)
    expect(rowPage(6)).toBe(1)
  })
})

describe('servicesOpening', () => {
  it('opens on the page of the service to learn', () => {
    expect(servicesOpening(starShop(3), true, false)).toEqual({ tab: 'services', page: 1 })
    const low = starShop(3)
    low.stock.shampoo = 2
    expect(servicesOpening(low, true, false)).toEqual({ tab: 'services', page: 1 })
  })
  it('opens on the stock once the tuition is paid and stock is low', () => {
    const sim = starShop(3)
    sim.payLesson('scrub')
    sim.stock.shampoo = 2
    expect(servicesOpening(sim, true, false)).toEqual({ tab: 'stock', page: 0 })
  })
  it('opens Kho on the page of the first low item', () => {
    const sim = starShop(3)
    sim.services = [...SIX]
    sim.payLesson('scrub')
    sim.passLesson('scrub')
    sim.stock.salt = 1
    expect(servicesOpening(sim, true, false)).toEqual({ tab: 'stock', page: 1 })
    sim.stock.shampoo = 1
    expect(servicesOpening(sim, true, false)).toEqual({ tab: 'stock', page: 0 })
  })
  it('opens on the page of a paid, unpassed lesson', () => {
    const sim = starShop(3)
    sim.payLesson('scrub')
    expect(servicesOpening(sim, true, false)).toEqual({ tab: 'services', page: 1 })
  })
  it('the stock intro wins', () => {
    expect(servicesOpening(starShop(3), true, true).tab).toBe('stock')
  })
  it('opens on page 0 with nothing to learn or restock', () => {
    expect(servicesOpening(starShop(2), true, false)).toEqual({ tab: 'services', page: 0 })
  })
})

describe('lessonAction', () => {
  it('says what is missing', () => {
    expect(lessonAction(starShop(2), 'scrub')).toEqual({ kind: 'note', text: 'Đạt 3★' })
    const noMassage = starShop(3)
    noMassage.services = ['shampoo', 'mask']
    expect(lessonAction(noMassage, 'scrub')).toEqual({ kind: 'note', text: 'Mở Massage trước' })
    const chain = new Chain(starShop(3), 11)
    chain.open('beach')
    expect(lessonAction(chain.shop('beach')!, 'scrub')).toEqual({ kind: 'note', text: 'Mở ở tiệm gốc' })
  })
  it('offers the lesson with the tuition, faded when it cannot be paid', () => {
    expect(lessonAction(starShop(3), 'scrub')).toEqual({ kind: 'learn', label: 'Học nghề\n700.000 đ', faded: false })
    expect(lessonAction(starShop(3, 100), 'scrub')).toMatchObject({ kind: 'learn', faded: true })
    expect(lessonAction(starShop(3, -1), 'scrub')).toMatchObject({ kind: 'learn', faded: true })
  })
  it('offers the Ngâm chân lesson at 4 stars', () => {
    expect(lessonAction(starShop(3), 'foot')).toEqual({ kind: 'note', text: 'Đạt 4★' })
    expect(lessonAction(starShop(4), 'foot')).toEqual({ kind: 'learn', label: 'Học nghề\n850.000 đ', faded: false })
    expect(servicesOpening(starShop(4), true, false)).toEqual({ tab: 'services', page: 1 })
  })
  it('offers the Sơn móng lesson at 5 stars', () => {
    expect(lessonAction(starShop(4), 'nails')).toEqual({ kind: 'note', text: 'Đạt 5★' })
    expect(lessonAction(starShop(5), 'nails')).toEqual({ kind: 'learn', label: 'Học nghề\n1.000.000 đ', faded: false })
    expect(servicesOpening(starShop(5), true, false)).toEqual({ tab: 'services', page: 1 })
  })
  it('goes on once paid, also after a reload', () => {
    const chain = new Chain(starShop(3), 11)
    chain.main.payLesson('scrub')
    expect(lessonAction(chain.main, 'scrub')).toEqual({ kind: 'goOn', label: 'Học tiếp' })
    const back = Chain.fromSave(parseSave(JSON.parse(JSON.stringify(chain.toSave()))), 8)
    expect(lessonAction(back.main, 'scrub')).toEqual({ kind: 'goOn', label: 'Học tiếp' })
  })
  it('goes on even when the stars have dropped since paying', () => {
    const sim = starShop(3)
    sim.payLesson('scrub')
    sim.rank.stars = 2
    expect(lessonAction(sim, 'scrub')).toEqual({ kind: 'goOn', label: 'Học tiếp' })
  })
  it('is learned after the pass', () => {
    const sim = starShop(3)
    sim.payLesson('scrub')
    sim.passLesson('scrub')
    expect(lessonAction(sim, 'scrub')).toEqual({ kind: 'learned' })
  })
})
