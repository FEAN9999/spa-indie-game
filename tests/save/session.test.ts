import { describe, expect, it } from 'vitest'
import { SaveSession } from '../../src/save/session'
import { SaveStore } from '../../src/save/store'
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

  it('saves before reloading for a new version, and not after', () => {
    const { store, session, reloads, play } = setup()
    play(7)
    session.reloadForUpdate()
    play(9)
    session.saveNow()
    expect([store.load(1)?.money, reloads.length]).toEqual([7, 1])
  })
})
