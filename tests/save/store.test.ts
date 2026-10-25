import { describe, expect, it } from 'vitest'
import { openStore, SaveStore } from '../../src/save/store'
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
    expect([s.info(2), s.info(3)]).toEqual([{ day: 1, money: 2 }, null])
  })

  it('sets aside a save it cannot read and treats the slot as empty', () => {
    const mem = new MemStorage()
    mem.setItem('spa.slot.2', '{oops')
    expect(new SaveStore(mem).load(2)).toBeNull()
    expect([mem.getItem('spa.slot.2.broken'), mem.getItem('spa.slot.2')]).toEqual(['{oops', null])
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
