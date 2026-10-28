import { describe, expect, it } from 'vitest'
import { SaveSession } from '../../src/save/session'
import { SaveStore } from '../../src/save/store'
import { SaveTooNewError } from '../../src/sim/save'
import type { SaveData } from '../../src/sim/save'
import { MemStorage, shop } from './memStorage'

const setup = () => {
  const store = new SaveStore(new MemStorage())
  let current: SaveData = shop(1)
  const reloads: string[] = []
  const session = new SaveSession(store, () => current, () => reloads.push('reload'))
  return { store, session, reloads, play: (money: number) => (current = shop(money)) }
}

describe('save session', () => {
  it('saves the shop into the slot in use', () => {
    const { store, session } = setup()
    store.setCurrentSlot(1)
    session.saveNow()
    expect(store.load(1)?.money).toBe(1)
    expect(session.slot).toBe(1)
  })

  it('switching slots saves this shop, then never writes again', () => {
    const { store, session, reloads, play } = setup()
    session.switchTo(2)
    expect([store.load(1)?.money, store.currentSlot(), reloads.length]).toEqual([1, 2, 1])
    play(9)
    session.saveNow()
    expect([store.load(2), store.load(1)?.money]).toEqual([null, 1])
  })

  it('an imported shop cannot be overwritten by a later save', () => {
    const { store, session, reloads, play } = setup()
    session.replaceWith(shop(5))
    play(9)
    session.saveNow()
    expect([store.load(1)?.money, reloads.length]).toEqual([5, 1])
  })

  it('never writes over a shop another page saved, and opens that one instead', () => {
    const store = new SaveStore(new MemStorage())
    const reloads: string[] = []
    const old = new SaveSession(store, () => shop(1), () => reloads.push('old'))
    old.load()
    new SaveSession(store, () => shop(9), () => reloads.push('new')).saveNow()
    old.saveNow()
    old.switchTo(2)
    old.reloadForUpdate()
    expect([store.load(1)?.money, store.currentSlot(), reloads]).toEqual([9, 1, ['old']])
  })

  it('a page that falls behind still switches slots without writing its old shop', () => {
    const store = new SaveStore(new MemStorage())
    const reloads: string[] = []
    const old = new SaveSession(store, () => shop(1), () => reloads.push('old'))
    old.load()
    new SaveSession(store, () => shop(9), () => reloads.push('new')).saveNow()
    old.switchTo(2)
    expect([store.load(1)?.money, store.currentSlot(), reloads]).toEqual([9, 2, ['old']])
  })

  it('on coming back, opens the newer shop only when another page saved meanwhile', () => {
    const store = new SaveStore(new MemStorage())
    const reloads: string[] = []
    const page = new SaveSession(store, () => shop(1), () => reloads.push('page'))
    page.load()
    page.saveNow()
    page.reloadIfChangedElsewhere()
    expect(reloads).toEqual([])
    new SaveSession(store, () => shop(9), () => reloads.push('other')).saveNow()
    page.reloadIfChangedElsewhere()
    expect([store.load(1)?.money, reloads]).toEqual([9, ['page']])
  })

  it('loads the slot in use, setting aside a save it cannot read without reloading over it', () => {
    const mem = new MemStorage()
    mem.setItem('spa.slot.1', '{oops')
    const store = new SaveStore(mem)
    const reloads: string[] = []
    const session = new SaveSession(store, () => shop(3), () => reloads.push('reload'))
    expect(session.load()).toBeNull()
    session.saveNow()
    expect([store.load(1)?.money, reloads]).toEqual([3, []])
  })

  it('sets aside a shop the game cannot rebuild, then saves the new shop there without reloading', () => {
    const mem = new MemStorage()
    const raw = JSON.stringify(shop(1))
    mem.setItem('spa.slot.1', raw)
    const store = new SaveStore(mem)
    const reloads: string[] = []
    const session = new SaveSession(store, () => shop(3), () => reloads.push('reload'))
    session.load()
    session.setAside()
    expect([mem.getItem('spa.slot.1'), mem.getItem('spa.slot.1.broken')]).toEqual([null, raw])
    session.saveNow()
    expect([store.load(1)?.money, mem.getItem('spa.slot.1.broken'), reloads]).toEqual([3, raw, []])
  })

  it('saves before reloading for a new version, and not after', () => {
    const { store, session, reloads, play } = setup()
    play(7)
    session.reloadForUpdate()
    play(9)
    session.saveNow()
    expect([store.load(1)?.money, reloads.length]).toEqual([7, 1])
  })

  it('never writes over a shop saved by a newer version', () => {
    const mem = new MemStorage()
    const raw = JSON.stringify({ ...shop(1), v: 99 })
    mem.setItem('spa.slot.1', raw)
    const store = new SaveStore(mem)
    const reloads: string[] = []
    const session = new SaveSession(store, () => shop(5), () => reloads.push('reload'))
    expect(() => session.load()).toThrow(SaveTooNewError)
    session.saveNow()
    session.reloadForUpdate()
    expect([mem.getItem('spa.slot.1'), mem.getItem('spa.slot.1.broken')]).toEqual([raw, null])
  })

  describe('stamps the real time', () => {
    const stamped = () => {
      const store = new SaveStore(new MemStorage())
      const reloads: string[] = []
      let t = 0
      const now = () => (t += 1000)
      const session = new SaveSession(store, () => shop(1), () => reloads.push('reload'), now)
      return { store, session, reloads }
    }

    it('saveNow stamps whatever the shop carried', () => {
      const { store, session } = stamped()
      session.saveNow()
      expect(store.load(1)?.savedAt).toBe(1000)
    })

    it('switching slots stamps the shop it leaves', () => {
      const { store, session } = stamped()
      session.switchTo(2)
      expect(store.load(1)?.savedAt).toBe(1000)
    })

    it('reloading for an update stamps', () => {
      const { store, session } = stamped()
      session.reloadForUpdate()
      expect(store.load(1)?.savedAt).toBe(1000)
    })

    it('an imported shop gets the moment it came in, not the one it carried', () => {
      const { store, session } = stamped()
      session.replaceWith({ ...shop(5), savedAt: 5 })
      expect(store.load(1)?.savedAt).toBe(1000)
    })

    it('is open until a change made elsewhere closes it', () => {
      const { store, session } = stamped()
      session.saveNow()
      expect(session.open).toBe(true)
      store.save(1, shop(9))
      session.reloadIfChangedElsewhere()
      expect(session.open).toBe(false)
    })
  })
})
