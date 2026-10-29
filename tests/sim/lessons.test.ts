import { describe, expect, it } from 'vitest'
import { Chain } from '../../src/sim/chain'
import { dayProfit, serviceArrivalFactor } from '../../src/sim/economy'
import { drawService } from '../../src/sim/customers'
import { rankPrice } from '../../src/sim/rank'
import { createRng } from '../../src/sim/rng'
import { parseSave } from '../../src/sim/save'
import { SERVICES } from '../../src/sim/services'
import type { SimEvent } from '../../src/sim/types'
import { catalogPage } from '../../src/view/catalog'
import { advanceUntil, hireStaff, placeFirst, starShop } from './helpers'

const TUITION = SERVICES.scrub.openCost

describe('who can learn', () => {
  it('needs 3 stars, massage open, no debt, the tuition and the main shop', () => {
    expect(starShop(2).lessonProblem('scrub')).toBe('stars')
    const noMassage = starShop(3)
    noMassage.services = ['shampoo', 'mask']
    expect(noMassage.lessonProblem('scrub')).toBe('order')
    expect(starShop(3).lessonProblem('scrub')).toBeNull()
    expect(starShop(3, 699_999).lessonProblem('scrub')).toBe('money')
    expect(starShop(3, -1).lessonProblem('scrub')).toBe('debt')
    const chain = new Chain(starShop(3), 11)
    chain.open('beach')
    expect(chain.shop('beach')!.lessonProblem('scrub')).toBe('main')
  })

  it('keeps the lesson open after the tuition is paid even if the stars drop', () => {
    const sim = starShop(3)
    sim.payLesson('scrub')
    sim.rank.stars = 2
    expect(sim.lessonProblem('scrub')).toBeNull()
    expect(sim.lessonState('scrub')).toBe('paid')
    sim.passLesson('scrub')
    expect(sim.lessonState('scrub')).toBe('yes')
  })
})

describe('paying once', () => {
  it('takes the tuition once and never touches the day stats', () => {
    const sim = starShop(3)
    const stats = structuredClone(sim.stats)
    const profit = dayProfit(sim.stats)
    expect(sim.payLesson('scrub')).toBeNull()
    expect(sim.money).toBe(20_000_000 - TUITION)
    expect(sim.lessonState('scrub')).toBe('paid')
    expect(sim.stats).toEqual(stats)
    expect(dayProfit(sim.stats)).toBe(profit)
    expect(sim.payLesson('scrub')).toBeNull()
    expect(sim.money).toBe(20_000_000 - TUITION)
  })

  it('takes nothing and stays "no" when short', () => {
    const sim = starShop(3, 699_999)
    expect(sim.payLesson('scrub')).toBe('money')
    expect(sim.money).toBe(699_999)
    expect(sim.lessonState('scrub')).toBe('no')
  })
})

describe('passing', () => {
  it('opens scrub, empties lessonsPaid and gives the bed', () => {
    const sim = starShop(3)
    sim.payLesson('scrub')
    const money = sim.money
    sim.passLesson('scrub')
    expect(sim.lessonState('scrub')).toBe('yes')
    expect(sim.services[sim.services.length - 1]).toBe('scrub')
    expect(sim.lessonsPaid).toEqual([])
    expect(sim.book.gifts.filter(g => g === 'scrubBed')).toHaveLength(1)
    expect(sim.stock.salt).toBe(20)
    expect(sim.payLesson('scrub')).toBeNull()
    expect(sim.money).toBe(money)
  })

  it('throws in state "no"', () => {
    expect(() => starShop(3).passLesson('scrub')).toThrow()
  })
})

describe('the beach', () => {
  it('cannot pay the lesson: main only, no money taken', () => {
    const chain = new Chain(starShop(3), 11)
    chain.open('beach')
    const beach = chain.shop('beach')!
    const money = beach.money
    expect(beach.payLesson('scrub')).toBe('main')
    expect(beach.money).toBe(money)
    expect(beach.lessonsPaid).toEqual([])
  })
})

describe('retry and reload', () => {
  it('keeps paid across a failed lesson and a reload without paying again', () => {
    const chain = new Chain(starShop(3), 11)
    chain.main.payLesson('scrub')
    expect(chain.main.lessonState('scrub')).toBe('paid')
    const back = Chain.fromSave(parseSave(JSON.parse(JSON.stringify(chain.toSave()))), 8)
    expect(back.main.lessonState('scrub')).toBe('paid')
    expect(back.main.money).toBe(chain.main.money)
    expect(back.main.payLesson('scrub')).toBeNull()
    expect(back.main.money).toBe(chain.main.money)
    back.main.passLesson('scrub')
    expect(back.main.lessonState('scrub')).toBe('yes')
  })
})

describe('learnable', () => {
  it('offers the lesson until paid, whatever the money', () => {
    expect(starShop(3).learnable()).toBe('scrub')
    expect(starShop(3, 0).learnable()).toBe('scrub')
    expect(starShop(3, -5).learnable()).toBe('scrub')
    const paid = starShop(3)
    paid.payLesson('scrub')
    expect(paid.learnable()).toBeNull()
  })

  it('is null at 2 stars, without massage and at a branch', () => {
    expect(starShop(2).learnable()).toBeNull()
    const noMassage = starShop(3)
    noMassage.services = ['shampoo', 'mask']
    expect(noMassage.learnable()).toBeNull()
    const chain = new Chain(starShop(3), 11)
    chain.open('beach')
    expect(chain.shop('beach')!.learnable()).toBeNull()
  })
})

describe('the old open path', () => {
  it('never opens scrub for money', () => {
    const sim = starShop(3)
    expect(sim.serviceProblem('scrub')).toBe('lesson')
    expect(sim.openService('scrub')).toBe('lesson')
    expect(sim.money).toBe(20_000_000)
    sim.payLesson('scrub')
    sim.passLesson('scrub')
    expect(sim.serviceProblem('scrub')).toBeNull()
  })
})

describe('customers and branches', () => {
  it('opens scrub at the beach, with the bed bought there', () => {
    const chain = new Chain(starShop(3), 11)
    chain.open('beach')
    const beach = chain.shop('beach')!
    const rng = createRng(5)
    for (let i = 0; i < 300; i++) expect(drawService('tourist', beach.availableServices(), rng)).not.toBe('scrub')
    expect(beach.lessonProblem('scrub')).toBe('main')

    chain.main.payLesson('scrub')
    chain.main.passLesson('scrub')
    chain.sync()
    expect(beach.services).toContain('scrub')
    expect(beach.lessonState('scrub')).toBe('yes')
    expect(beach.book.gifts).not.toContain('scrubBed')
    expect(catalogPage('bed', 0, beach.services, beach.book.gifts).entries.some(e => e.kind === 'scrubBed')).toBe(true)
    chain.startDay()
    expect(beach.services).toContain('scrub')

    const before = serviceArrivalFactor(beach.availableServices())
    placeFirst(beach, 'scrubBed')
    let seen = false
    for (let i = 0; i < 300; i++) if (drawService('tourist', beach.availableServices(), rng) === 'scrub') seen = true
    expect(seen).toBe(true)
    expect(serviceArrivalFactor(beach.availableServices())).toBe(before)
  })
})

describe('served by staff', () => {
  it('pays the ranked price and uses salt and a towel', () => {
    const main = starShop(3)
    main.payLesson('scrub')
    main.passLesson('scrub')
    placeFirst(main, 'scrubBed')
    hireStaff(main, 'technician', undefined, {})
    const salt = main.stock.salt
    const towel = main.stock.towel
    main.drainEvents()
    const c = main.spawnCustomer({ kind: 'student', service: 'scrub' })
    const events: SimEvent[] = []
    advanceUntil(main, () => events.some(e => e.type === 'paid'), 120_000, events)
    const paid = events.find(e => e.type === 'paid')
    expect(c.service).toBe('scrub')
    expect(paid?.type === 'paid' && paid.amount).toBe(rankPrice(170_000, 3))
    expect(main.stock.salt).toBe(salt - 1)
    expect(main.stock.towel).toBe(towel - 1)
  })
})

describe('Ngâm chân thảo mộc', () => {
  it('needs 4 stars, massage open and 850.000 đ', () => {
    expect(starShop(3).lessonProblem('foot')).toBe('stars')
    expect(starShop(4).lessonProblem('foot')).toBeNull()
    expect(starShop(4, 849_999).lessonProblem('foot')).toBe('money')
  })

  it('takes the tuition once, gives a Ghế ngâm chân and leaves the herbs alone', () => {
    const sim = starShop(4)
    const herbs = sim.stock.herbs
    const money = sim.money
    sim.payLesson('foot')
    expect(money - sim.money).toBe(850_000)
    sim.passLesson('foot')
    expect(sim.book.gifts.filter(g => g === 'footChair')).toHaveLength(1)
    expect(sim.stock.herbs).toBe(herbs)
  })

  it('is learned in either order with Chà muối biển', () => {
    const sim = starShop(4)
    expect(sim.learnable()).toBe('scrub')
    sim.payLesson('foot')
    sim.passLesson('foot')
    expect(sim.services).toEqual(['shampoo', 'mask', 'massage', 'foot'])
    expect(sim.learnable()).toBe('scrub')
    sim.payLesson('scrub')
    sim.passLesson('scrub')
    expect(sim.services.slice(-2)).toEqual(['scrub', 'foot'])
  })

  it('opens at the old town only with its chair there, and never brings more customers', () => {
    const chain = new Chain(starShop(4), 11)
    chain.open('oldTown')
    const oldTown = chain.shop('oldTown')!
    chain.main.payLesson('foot')
    chain.main.passLesson('foot')
    chain.sync()
    const rng = createRng(5)
    for (let i = 0; i < 300; i++) expect(drawService('backpacker', oldTown.availableServices(), rng)).not.toBe('foot')
    const before = serviceArrivalFactor(oldTown.availableServices())
    placeFirst(oldTown, 'footChair')
    let seen = false
    for (let i = 0; i < 300; i++) if (drawService('backpacker', oldTown.availableServices(), rng) === 'foot') seen = true
    expect(seen).toBe(true)
    expect(serviceArrivalFactor(oldTown.availableServices())).toBe(before)
    placeFirst(chain.main, 'footChair')
    let elder = false
    for (let i = 0; i < 300; i++) if (drawService('elder', chain.main.availableServices(), rng) === 'foot') elder = true
    expect(elder).toBe(true)
  })

  it('is served by staff for the ranked price, using herbs and a towel', () => {
    const main = starShop(4)
    main.payLesson('foot')
    main.passLesson('foot')
    placeFirst(main, 'footChair')
    hireStaff(main, 'technician', undefined, {})
    const herbs = main.stock.herbs
    const towel = main.stock.towel
    main.drainEvents()
    main.spawnCustomer({ kind: 'elder', service: 'foot' })
    const events: SimEvent[] = []
    advanceUntil(main, () => events.some(e => e.type === 'paid'), 120_000, events)
    const paid = events.find(e => e.type === 'paid')
    expect(paid?.type === 'paid' && paid.amount).toBe(rankPrice(190_000, 4))
    expect(main.stock.herbs).toBe(herbs - 1)
    expect(main.stock.towel).toBe(towel - 1)
  })
})

describe('Sơn móng', () => {
  it('needs 5 stars, massage open and 1.000.000 đ', () => {
    expect(starShop(4).lessonProblem('nails')).toBe('stars')
    expect(starShop(5).lessonProblem('nails')).toBeNull()
    expect(starShop(5, 999_999).lessonProblem('nails')).toBe('money')
  })

  it('takes the tuition once, gives a Bàn làm móng and starts the polish at 20', () => {
    const sim = starShop(5)
    const money = sim.money
    expect(sim.payLesson('nails')).toBeNull()
    expect(money - sim.money).toBe(1_000_000)
    sim.passLesson('nails')
    expect(sim.book.gifts.filter(g => g === 'nailDesk')).toHaveLength(1)
    expect(sim.stock.polish).toBe(20)
  })

  it('is learned in any order with Chà muối biển and Ngâm chân', () => {
    const sim = starShop(5)
    expect(sim.learnable()).toBe('scrub')
    sim.payLesson('nails')
    sim.passLesson('nails')
    expect(sim.services).toEqual(['shampoo', 'mask', 'massage', 'nails'])
    expect(sim.learnable()).toBe('scrub')
    sim.payLesson('scrub')
    sim.passLesson('scrub')
    sim.payLesson('foot')
    sim.passLesson('foot')
    expect(sim.services.slice(-3)).toEqual(['scrub', 'foot', 'nails'])
  })

  it('opens at the uptown branch only with its desk there, and never brings more customers', () => {
    const chain = new Chain(starShop(5), 11)
    chain.open('uptown')
    const uptown = chain.shop('uptown')!
    chain.main.payLesson('nails')
    chain.main.passLesson('nails')
    chain.sync()
    const rng = createRng(5)
    for (let i = 0; i < 300; i++) expect(drawService('lady', uptown.availableServices(), rng)).not.toBe('nails')
    const before = serviceArrivalFactor(uptown.availableServices())
    placeFirst(uptown, 'nailDesk')
    let seen = false
    for (let i = 0; i < 300; i++) if (drawService('lady', uptown.availableServices(), rng) === 'nails') seen = true
    expect(seen).toBe(true)
    expect(serviceArrivalFactor(uptown.availableServices())).toBe(before)
    placeFirst(chain.main, 'nailDesk')
    let office = false
    for (let i = 0; i < 300; i++) if (drawService('office', chain.main.availableServices(), rng) === 'nails') office = true
    expect(office).toBe(true)
  })

  it('is served by staff for the ranked price, using polish and a towel', () => {
    const main = starShop(5)
    main.payLesson('nails')
    main.passLesson('nails')
    placeFirst(main, 'nailDesk')
    hireStaff(main, 'technician', undefined, {})
    const polish = main.stock.polish
    const towel = main.stock.towel
    main.drainEvents()
    main.spawnCustomer({ kind: 'office', service: 'nails' })
    const events: SimEvent[] = []
    advanceUntil(main, () => events.some(e => e.type === 'paid'), 120_000, events)
    const paid = events.find(e => e.type === 'paid')
    expect(paid?.type === 'paid' && paid.amount).toBe(rankPrice(220_000, 5))
    expect(main.stock.polish).toBe(polish - 1)
    expect(main.stock.towel).toBe(towel - 1)
  })
})
