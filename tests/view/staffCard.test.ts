import { describe, expect, it } from 'vitest'
import { Chain } from '../../src/sim/chain'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import { noTiers, TRAIT_IDS } from '../../src/sim/staff'
import { formatMoney } from '../../src/strings/format'
import { t } from '../../src/strings/vi'
import { courseName, moveOptions, specialtyOf, studyButton, traitLines } from '../../src/view/staffCard'
import { hireStaff, starShop } from '../sim/helpers'

const newSim = () => new SpaSim({ rng: createRng(1), autoSpawn: false })

describe('staff card', () => {
  it('lists the services a person has a tier in, dimming the closed ones', () => {
    const person = { tiers: { shampoo: 0, mask: 2, massage: 1, steam: 0, stone: 0, mud: 0 } }
    expect(specialtyOf(person, ['shampoo', 'mask'])).toEqual([
      { service: 'mask', tier: 2, dim: false },
      { service: 'massage', tier: 1, dim: true },
    ])
    expect(specialtyOf({ tiers: noTiers() }, ['shampoo'])).toEqual([])
  })

  it('names a course in lower case', () => {
    expect(courseName('massage')).toBe('massage')
    expect(courseName('mask')).toBe('đắp mặt nạ')
    expect(courseName('greet')).toBe('tiếp khách')
  })

  it("shows the study button's state", () => {
    const sim = newSim()
    sim.services = ['shampoo', 'mask']
    const tech = hireStaff(sim, 'technician', undefined, { shampoo: 1 }, 'calm')
    sim.money = 500000
    expect(studyButton(sim, tech)).toEqual({ kind: 'open', courses: ['shampoo', 'mask'] })

    sim.money = 99999
    expect(studyButton(sim, tech)).toEqual({ kind: 'noMoney' })
    sim.money = -1
    expect(studyButton(sim, tech)).toEqual({ kind: 'noMoney' })

    sim.money = 500000
    tech.study = { course: 'mask', paid: 100000 }
    expect(studyButton(sim, tech)).toEqual({ kind: 'booked', course: 'mask' })
    tech.study = null

    tech.tiers = { shampoo: 3, mask: 3, massage: 0, steam: 0, stone: 0, mud: 0 }
    expect(studyButton(sim, tech)).toEqual({ kind: 'best' })

    const rec = hireStaff(sim, 'receptionist', { skill: 3, speed: 3, friendly: 5, stamina: 3 })
    expect(studyButton(sim, rec)).toEqual({ kind: 'best' })
  })

  it('fills the confirm line from the spec', () => {
    expect(t('studyConfirm', { name: 'Lan', course: courseName('massage'), money: formatMoney(200000) })).toBe('Cho Lan đi học massage tối nay?\n200.000 đ')
  })

  it("names each trait's good side and flaw", () => {
    expect(traitLines('deft')).toEqual(['Khéo tay', 'hay đi trễ'])
    expect(traitLines('studious')).toEqual(['Ham học', 'hay đòi lương'])
    for (const id of TRAIT_IDS) {
      const [good, flaw] = traitLines(id)
      expect(good.length).toBeGreaterThan(0)
      expect(flaw.length).toBeGreaterThan(0)
    }
  })
})

/** A chain with the main shop at 5 stars and the beach and uptown open. */
const withTwoBranches = () => {
  const chain = new Chain(starShop(5, 50_000_000), 7)
  expect(chain.open('beach')).toBeNull()
  expect(chain.open('uptown')).toBeNull()
  return { chain, main: chain.main, beach: chain.shop('beach')!, uptown: chain.shop('uptown')! }
}

describe('move options', () => {
  it('lists every open shop but their own, the main shop first', () => {
    const { chain, beach } = withTwoBranches()
    const tech = hireStaff(beach, 'technician')
    expect(moveOptions(chain, 'beach', tech.id)).toEqual([
      { place: null, full: false },
      { place: 'uptown', full: false },
    ])
  })

  it('marks a shop full when its technicians are three', () => {
    const { chain, main, uptown } = withTwoBranches()
    for (let i = 0; i < 3; i++) hireStaff(uptown, 'technician')
    const tech = hireStaff(main, 'technician')
    expect(moveOptions(chain, null, tech.id)).toEqual([
      { place: 'beach', full: false },
      { place: 'uptown', full: true },
    ])
  })

  it('counts a booked mover against the room', () => {
    const { chain, main, uptown } = withTwoBranches()
    hireStaff(uptown, 'technician')
    hireStaff(uptown, 'technician')
    const first = hireStaff(main, 'technician')
    const second = hireStaff(main, 'technician')
    expect(chain.move(null, first.id, 'uptown')).toBeNull()
    expect(moveOptions(chain, null, second.id).find(o => o.place === 'uptown')).toEqual({ place: 'uptown', full: true })
  })

  it('marks the main shop full for a receptionist when it has one', () => {
    const { chain, main, beach } = withTwoBranches()
    hireStaff(main, 'receptionist')
    const rec = hireStaff(beach, 'receptionist')
    expect(moveOptions(chain, 'beach', rec.id)[0]).toEqual({ place: null, full: true })
  })
})
