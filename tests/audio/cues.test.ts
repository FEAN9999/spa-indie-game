import { describe, expect, it } from 'vitest'
import { cueFor, Throttle } from '../../src/audio/cues'

describe('sound cues', () => {
  it('maps shop events to sounds', () => {
    expect(cueFor({ type: 'customerArrived', id: 1 })).toBe('chime')
    expect(cueFor({ type: 'paid', customerId: 1, amount: 50000, tip: 0, tile: { x: 1, y: 1 } })).toBe('coin')
    expect(cueFor({ type: 'customerLeft', id: 1, angry: true })).toBe('huff')
    expect(cueFor({ type: 'levelUp', staffId: 1, level: 2 })).toBe('levelUp')
    expect(cueFor({ type: 'studied', staffId: 1, course: 'mask', level: 2 })).toBe('levelUp')
    expect(cueFor({ type: 'heart', customerId: 1, regular: 'hanh', hearts: 1, member: false })).toBe('star')
    expect(cueFor({ type: 'vipArrived', customerId: 1, vip: 'singer', first: true })).toBe('vip')
    expect(cueFor({ type: 'questDone', quest: { kind: 'serve', period: 'day', service: null, target: 8, reward: 30000, base: 0, state: 'done' } })).toBe('coin')
  })
  it('stays quiet for a calm leave and other events', () => {
    expect(cueFor({ type: 'customerLeft', id: 1, angry: false })).toBeNull()
    expect(cueFor({ type: 'roomChanged' })).toBeNull()
    expect(cueFor({ type: 'stockLow', item: 'towel' })).toBeNull()
    expect(cueFor({ type: 'monthStarted', month: 4 })).toBeNull()
  })
  it('throttles each sound on its own', () => {
    const th = new Throttle()
    expect(th.allow('chime', 0)).toBe(true)
    expect(th.allow('chime', 499)).toBe(false)
    expect(th.allow('coin', 499)).toBe(true)
    expect(th.allow('chime', 500)).toBe(true)
    expect(th.allow('star', 500)).toBe(true)
    expect(th.allow('star', 500)).toBe(true)
  })
  it('six arrivals in one second make two chimes', () => {
    const th = new Throttle()
    expect([0, 100, 200, 300, 600, 700].filter(t => th.allow('chime', t)).length).toBe(2)
  })
})
