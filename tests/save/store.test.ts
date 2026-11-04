import { describe, expect, it } from 'vitest'
import { openStore, SaveStore } from '../../src/save/store'
import { SaveTooNewError } from '../../src/sim/save'
import { MemStorage, shop } from './memStorage'

describe('save slots', () => {
  it('starts in slot 1 and remembers the slot in use', () => {
    const mem = new MemStorage()
    expect(new SaveStore(mem).currentSlot()).toBe(1)
    new SaveStore(mem).setCurrentSlot(3)
    expect(new SaveStore(mem).currentSlot()).toBe(3)
    mem.setItem('spa.current', '7')
    expect(new SaveStore(mem).currentSlot()).toBe(1)
  })

  it('keeps three separate shops', () => {
    const s = new SaveStore(new MemStorage())
    expect(s.save(1, shop(1))).toBe(true)
    s.save(2, shop(2))
    expect([s.load(1)?.money, s.load(2)?.money, s.load(3)]).toEqual([1, 2, null])
    expect([s.info(2), s.info(3)]).toEqual([{ day: 1, money: 2, name: 'Tiệm Spa' }, null])
  })

  it('sets aside a save it cannot read and treats the slot as empty', () => {
    const mem = new MemStorage()
    mem.setItem('spa.slot.2', '{oops')
    expect(new SaveStore(mem).load(2)).toBeNull()
    expect([mem.getItem('spa.slot.2.broken'), mem.getItem('spa.slot.2')]).toEqual(['{oops', null])
  })

  it('keeps a save in its slot when it cannot be set aside', () => {
    const mem = new MemStorage()
    const full = {
      getItem: (k: string) => mem.getItem(k),
      setItem: (k: string, v: string) => {
        if (k.endsWith('.broken')) throw new Error('full')
        mem.setItem(k, v)
      },
      removeItem: (k: string) => mem.removeItem(k),
    }
    mem.setItem('spa.slot.2', '{oops')
    const s = new SaveStore(full)
    expect(s.load(2)).toBeNull()
    expect([mem.getItem('spa.slot.2'), mem.getItem('spa.slot.2.broken')]).toEqual(['{oops', null])
    s.setAside(2)
    expect([mem.getItem('spa.slot.2'), mem.getItem('spa.slot.2.broken')]).toEqual(['{oops', null])
  })

  it('never moves aside or reads a save from a newer version', () => {
    const mem = new MemStorage()
    const raw = JSON.stringify({ ...shop(1), v: 99 })
    mem.setItem('spa.slot.1', raw)
    const s = new SaveStore(mem)
    expect(() => s.load(1)).toThrow(SaveTooNewError)
    expect([mem.getItem('spa.slot.1'), mem.getItem('spa.slot.1.broken')]).toEqual([raw, null])
    expect([s.isTooNew(1), s.isTooNew(2), s.info(1)]).toEqual([true, false, null])
    expect(mem.getItem('spa.slot.1')).toBe(raw)
  })

  it('asks only the version whether a save is too new', () => {
    const mem = new MemStorage()
    // what parseSave would throw on is not too new
    mem.setItem('spa.slot.1', '{oops')
    mem.setItem('spa.slot.2', JSON.stringify({ v: 1, day: 'broken' }))
    mem.setItem('spa.slot.3', JSON.stringify({ v: 99, day: 'broken' }))
    const s = new SaveStore(mem)
    expect([s.isTooNew(1), s.isTooNew(2), s.isTooNew(3)]).toEqual([false, false, true])
  })

  it('keeps playing when the storage refuses to work', () => {
    const s = new SaveStore({
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('full')
      },
      removeItem: () => {
        throw new Error('denied')
      },
    })
    expect([s.currentSlot(), s.save(1, shop(1)), s.load(1), s.flag('installCardSeen')]).toEqual([1, false, null, false])
    expect(() => s.setFlag('installCardSeen')).not.toThrow()
    expect(() => s.setCurrentSlot(2)).not.toThrow()
    const fallback = openStore(() => {
      throw new Error('SecurityError')
    })
    fallback.save(1, shop(5))
    expect(fallback.load(1)?.money).toBe(5)
  })

  it('remembers that the install card was shown', () => {
    const mem = new MemStorage()
    expect(new SaveStore(mem).flag('installCardSeen')).toBe(false)
    new SaveStore(mem).setFlag('installCardSeen')
    expect(new SaveStore(mem).flag('installCardSeen')).toBe(true)
  })
})

describe("friends' shops met on a visit", () => {
  it('keeps them per slot, the latest first and each once, until the shop takes them', () => {
    const s = new SaveStore(new MemStorage())
    s.addMet(1, { code: 'B2KCG2', name: 'Spa Sen' })
    s.addMet(1, { code: 'WHUURP', name: 'Tiệm Lan' })
    s.addMet(1, { code: 'B2KCG2', name: 'Spa Sen Hồng' })
    s.addMet(2, { code: 'K7P2QX', name: 'Ô hai' })
    expect(s.takeMet(1)).toEqual([
      { code: 'B2KCG2', name: 'Spa Sen Hồng' },
      { code: 'WHUURP', name: 'Tiệm Lan' },
    ])
    expect(s.takeMet(1)).toEqual([])
    expect(s.takeMet(2)).toEqual([{ code: 'K7P2QX', name: 'Ô hai' }])
  })

  it('never touches the shop in the slot', () => {
    const mem = new MemStorage()
    const s = new SaveStore(mem)
    s.save(1, shop(5))
    const before = mem.getItem('spa.slot.1')
    s.addMet(1, { code: 'B2KCG2', name: 'Spa Sen' })
    expect(mem.getItem('spa.slot.1')).toBe(before)
  })

  it('reads a damaged list as empty or skips its bad entries', () => {
    const mem = new MemStorage()
    mem.setItem('spa.slot.1.met', '{oops')
    mem.setItem('spa.slot.2.met', JSON.stringify([{ code: 'B2KCG2', name: 'Spa Sen' }, 'x', { code: 3 }]))
    const s = new SaveStore(mem)
    expect(s.takeMet(1)).toEqual([])
    expect(s.takeMet(2)).toEqual([{ code: 'B2KCG2', name: 'Spa Sen' }])
  })
})
