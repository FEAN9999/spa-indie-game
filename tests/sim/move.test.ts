import { describe, expect, it } from 'vitest'
import { Chain } from '../../src/sim/chain'
import { parseSave } from '../../src/sim/save'
import type { SpaSim } from '../../src/sim/spa'
import type { Candidate, Staff } from '../../src/sim/staff'
import { hireStaff, starShop } from './helpers'

/** A chain with the main shop at 3 stars and the beach open. */
function withBeach() {
  const main = starShop()
  const chain = new Chain(main, 7)
  expect(chain.open('beach')).toBeNull()
  return { chain, main, beach: chain.shop('beach')! }
}

/** What a move must keep. */
const kept = (s: Staff) => ({ name: s.name, look: s.look, wage: s.wage, stats: s.stats, tiers: s.tiers, trait: s.trait, level: s.level, xp: s.xp })

const hireTech = (shop: SpaSim) => hireStaff(shop, 'technician', { skill: 4, speed: 2, friendly: 5, stamina: 3 }, { massage: 2 }, 'quick')

const techCandidate = (): Candidate => ({
  name: 'Ung vien',
  role: 'technician',
  look: { skin: 0, hair: 0, hairStyle: 0, shirt: 0 },
  stats: { skill: 3, speed: 3, friendly: 3, stamina: 3 },
  wage: 30_000,
  rare: false,
  tiers: { shampoo: 1, mask: 0, massage: 0, stone: 0, steam: 0, mud: 0 } as Candidate['tiers'],
  trait: 'quick',
})

describe('moving staff', () => {
  it('books a move, keeps her here until the morning, then carries her over whole', () => {
    const { chain, main, beach } = withBeach()
    const her = hireTech(main)
    her.level = 2
    her.xp = 7
    const before = structuredClone(kept(her))
    expect(chain.moveProblem(null, her.id, 'beach')).toBeNull()
    expect(chain.move(null, her.id, 'beach')).toBeNull()
    expect(her.moveTo).toBe('beach')
    expect(main.staff).toContain(her)
    chain.startDay()
    expect(main.staff).toEqual([])
    expect(beach.staff.length).toBe(1)
    expect(kept(beach.staff[0])).toEqual(before)
    expect(beach.staff[0].moveTo).toBeNull()
  })

  it('pays off a course booked at the old shop at the new one, with no tuition back', () => {
    const { chain, main, beach } = withBeach()
    const her = hireTech(main)
    expect(main.study(her.id, 'shampoo')).toBeNull()
    const tier = her.tiers.shampoo
    const money = main.money
    chain.move(null, her.id, 'beach')
    chain.startDay()
    expect(beach.staff[0].tiers.shampoo).toBe(tier + 1)
    expect(beach.staff[0].study).toBeNull()
    expect(main.money).toBe(money)
  })

  it('carries a branch technician back to the main shop', () => {
    const { chain, main, beach } = withBeach()
    const her = hireTech(beach)
    expect(chain.move('beach', her.id, null)).toBeNull()
    expect(her.moveTo).toBe('main')
    chain.startDay()
    expect(beach.staff).toEqual([])
    expect(main.staff.map(s => s.name)).toEqual([her.name])
  })

  it('cancels with stay', () => {
    const { chain, main, beach } = withBeach()
    const her = hireTech(main)
    chain.move(null, her.id, 'beach')
    chain.stay(null, her.id)
    expect(her.moveTo).toBeNull()
    chain.startDay()
    expect(main.staff).toContain(her)
    expect(beach.staff).toEqual([])
  })

  it('leaves no room for a third beach technician, and firing a mover frees hers', () => {
    const { chain, main, beach } = withBeach()
    hireTech(beach)
    hireTech(beach)
    const first = hireTech(main)
    const second = hireTech(main)
    expect(chain.move(null, first.id, 'beach')).toBeNull()
    beach.candidates.push(techCandidate())
    expect(beach.hireProblem(beach.candidates.length - 1)).toBe('full')
    expect(chain.moveProblem(null, second.id, 'beach')).toBe('full')
    expect(chain.moveProblem(null, first.id, 'beach')).toBeNull()
    main.fire(first.id)
    expect(first.moveTo).toBeNull()
    expect(chain.moveProblem(null, second.id, 'beach')).toBeNull()
  })

  it('names what is wrong', () => {
    const { chain, main } = withBeach()
    const her = hireTech(main)
    expect(chain.moveProblem(null, 999, 'beach')).toBe('staff')
    expect(chain.moveProblem('beach', her.id, null)).toBe('staff')
    expect(chain.moveProblem(null, her.id, null)).toBe('place')
    expect(chain.moveProblem(null, her.id, 'oldTown')).toBe('place')
    main.fire(her.id)
    expect(chain.moveProblem(null, her.id, 'beach')).toBe('staff')
  })

  it('keeps her where she is when the place filled up by morning', () => {
    const { chain, main, beach } = withBeach()
    for (let i = 0; i < 3; i++) hireTech(beach)
    const her = hireTech(main)
    her.moveTo = 'beach'
    chain.startDay()
    expect(main.staff).toContain(her)
    expect(her.moveTo).toBeNull()
    expect(beach.staff.length).toBe(3)
  })

  it('gives the newcomer the next id of the new shop', () => {
    const { chain, main, beach } = withBeach()
    hireTech(beach)
    hireTech(beach)
    expect(beach.staff.map(s => s.id)).toEqual([1, 2])
    const her = hireTech(main)
    chain.move(null, her.id, 'beach')
    chain.startDay()
    expect(beach.staff.map(s => s.id)).toEqual([1, 2, 3])
    hireStaff(beach, 'receptionist')
    expect(beach.staff.map(s => s.id)).toEqual([1, 2, 3, 4])
  })

  it('keeps a booked move over a reload and applies it the next morning', () => {
    const { chain, main } = withBeach()
    const her = hireTech(main)
    chain.move(null, her.id, 'beach')
    const back = Chain.fromSave(parseSave(JSON.parse(JSON.stringify(chain.toSave()))), 7)
    expect(back.main.staff[0].moveTo).toBe('beach')
    back.startDay()
    expect(back.main.staff).toEqual([])
    expect(back.shop('beach')!.staff.map(s => s.name)).toEqual([her.name])
  })
})
