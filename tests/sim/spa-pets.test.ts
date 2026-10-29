import { describe, expect, it } from 'vitest'
import { MAX_PETS } from '../../src/config'
import { createRng } from '../../src/sim/rng'
import { parseSave } from '../../src/sim/save'
import { SpaSim } from '../../src/sim/spa'

const shop = (day = 2) => {
  const sim = new SpaSim({ rng: createRng(4), autoSpawn: false })
  sim.day = day
  sim.profileDone = true
  return sim
}

describe('the shop pets', () => {
  it('waits for Chú Sáu from day 2, once the profile is done', () => {
    expect(shop(1).litterDue()).toBe(false)
    const sim = shop()
    expect(sim.litterDue()).toBe(true)
    sim.profileDone = false
    expect(sim.litterDue()).toBe(false)
  })

  it('takes the litter free, only a mướp or a chó ta, and only once', () => {
    const sim = shop()
    const money = sim.money
    expect(sim.takeLitter('corgi', 'Bơ')).toBeNull()
    expect(sim.takeLitter('muop', '  Miu ')).toEqual({ id: 1, breed: 'muop', name: 'Miu' })
    expect([sim.money, sim.pets.litter, sim.litterDue()]).toEqual([money, true, false])
    expect(sim.takeLitter('chota', 'Ki')).toBeNull()
    expect(sim.pets.owned).toHaveLength(1)
  })

  it('names an empty name after the breed', () => {
    const sim = shop()
    sim.takeLitter('chota', '   ')
    expect(sim.pets.owned[0].name).toBe('Vàng')
  })

  it('sells a pet for its price, while there is money and room', () => {
    const sim = shop()
    sim.money = 1_500_000
    expect(sim.adoptPet('poodle', 'Kẹo')).toBe('money')
    expect(sim.adoptPet('xiem', 'Sữa')).toBeNull()
    expect(sim.money).toBe(300_000)
    expect(sim.pets.owned).toEqual([{ id: 1, breed: 'xiem', name: 'Sữa' }])
    sim.money = 100_000_000
    for (let i = 1; i < MAX_PETS; i++) expect(sim.adoptPet('mun', 'Mun')).toBeNull()
    expect(sim.adoptPet('mun', 'Mun')).toBe('full')
    // a full shop has no room for the litter
    expect([sim.pets.litter, sim.litterDue()]).toEqual([true, false])
  })

  it('still offers the litter to a shop with bought pets and room', () => {
    const sim = shop()
    sim.money = 10_000_000
    sim.adoptPet('corgi', 'Bơ')
    expect(sim.litterDue()).toBe(true)
    expect(sim.takeLitter('chota', 'Ki')!.id).toBe(2)
  })

  it('renames and gives away, nothing paid back', () => {
    const sim = shop()
    sim.takeLitter('muop', 'Miu')
    expect(sim.renamePet(1, ' Cam ')).toBe(true)
    expect(sim.pets.owned[0].name).toBe('Cam')
    expect(sim.renamePet(9, 'X')).toBe(false)
    const money = sim.money
    expect(sim.giveAwayPet(9)).toBe(false)
    expect(sim.giveAwayPet(1)).toBe(true)
    expect([sim.pets.owned, sim.money, sim.pets.nextId]).toEqual([[], money, 2])
  })

  it('sells no pet at a branch', () => {
    const main = shop()
    main.money = 10_000_000
    const branch = SpaSim.newBranch('beach', main, createRng(5))
    expect(branch.pets).toEqual({ owned: [], nextId: 1, litter: true })
    expect(branch.litterDue()).toBe(false)
    expect(branch.adoptPet('mun', 'Mun')).toBe('main')
  })

  it('keeps the pets through a save', () => {
    const sim = shop()
    sim.takeLitter('chota', 'Lu')
    const back = SpaSim.fromSave(parseSave(JSON.parse(JSON.stringify(sim.toSave()))), { rng: createRng(4), autoSpawn: false })
    expect(back.pets).toEqual(sim.pets)
  })
})
