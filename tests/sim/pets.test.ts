import { describe, expect, it } from 'vitest'
import { MAX_PETS } from '../../src/config'
import { BREED_IDS, BREEDS, cleanPetName, repairPets } from '../../src/sim/pets'

describe('pets', () => {
  it('has four cats and four dogs, the litter breeds the cheapest', () => {
    expect(BREED_IDS.filter(b => BREEDS[b].kind === 'cat')).toEqual(['muop', 'mun', 'tamthe', 'xiem'])
    expect(BREED_IDS.filter(b => BREEDS[b].kind === 'dog')).toEqual(['chota', 'phuquoc', 'corgi', 'poodle'])
    expect([BREEDS.muop.price, BREEDS.chota.price, BREEDS.poodle.price]).toEqual([300_000, 300_000, 2_000_000])
  })

  it('cleans a name like the shop name, at most 12 letters', () => {
    expect(cleanPetName('  Bánh   Mì ', 'Bơ')).toBe('Bánh Mì')
    expect(cleanPetName('   ', 'Bơ')).toBe('Bơ')
    expect(cleanPetName('Một hai ba bốn năm', 'Bơ')).toBe('Một hai ba b')
    expect(cleanPetName('Mướp'.normalize('NFD'), 'Bơ')).toBe('Mướp')
  })

  it('reads a missing book as empty with the litter to come', () => {
    expect(repairPets(undefined)).toEqual({ owned: [], nextId: 1, litter: false })
    expect(repairPets({ owned: 'x', nextId: -3, litter: 'yes' })).toEqual({ owned: [], nextId: 1, litter: false })
  })

  it('keeps the first six pets, and counts the litter as taken then', () => {
    const owned = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, breed: 'mun', name: `Mun ${i}` }))
    const book = repairPets({ owned, nextId: 9, litter: false })
    expect(book.owned.map(p => p.id)).toEqual([1, 2, 3, 4, 5, 6].slice(0, MAX_PETS))
    expect([book.nextId, book.litter]).toEqual([9, true])
  })
})
