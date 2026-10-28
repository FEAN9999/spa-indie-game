import { describe, expect, it } from 'vitest'
import { STARTER_GOAL_IDS, currentGoal, goalProgress, isPast, newStarter, pastStarter, repairStarter, settleStarter, starterRunning, type StarterShop } from '../../src/sim/starter'

const shop = (s: Partial<StarterShop> = {}): StarterShop => ({
  served: 0,
  owner3: 0,
  bought: 0,
  maskBedPlaced: false,
  maskServed: 0,
  technicians: 0,
  massageOpen: false,
  massageServed: 0,
  ...s,
})

const all: StarterShop = { served: 16, owner3: 1, bought: 1, maskBedPlaced: true, maskServed: 2, technicians: 1, massageOpen: true, massageServed: 2 }

describe('the starter chain', () => {
  it('settles nothing for a fresh book and a fresh shop', () => {
    const b = newStarter()
    expect(settleStarter(b, shop(), 1)).toEqual([])
    expect(b.at).toBe(0)
    expect(currentGoal(b)).toBe('firstGuest')
    expect(starterRunning(b)).toBe(true)
  })

  it('finishes firstGuest then threeStars from one snapshot, in order, and stops at serveFew', () => {
    const b = newStarter()
    expect(settleStarter(b, shop({ served: 1, owner3: 1 }), 1)).toEqual(['firstGuest', 'threeStars'])
    expect(b.at).toBe(2)
    expect(currentGoal(b)).toBe('serveFew')
  })

  it('never skips a goal that is not reached, even when later ones are', () => {
    const b = newStarter()
    expect(settleStarter(b, shop({ served: 4 }), 1)).toEqual(['firstGuest'])
    expect(currentGoal(b)).toBe('threeStars')
  })

  it('stamps build opened on the day serveFew finishes, and keeps an earlier stamp', () => {
    const b = newStarter()
    settleStarter(b, shop({ served: 4, owner3: 1 }), 2)
    expect(b.opened).toEqual({ build: 2 })
    const c = { ...newStarter(), opened: { build: 1 } }
    settleStarter(c, shop({ served: 4, owner3: 1 }), 3)
    expect(c.opened.build).toBe(1)
  })

  it('sets doneDay when massageTwice finishes', () => {
    const b = newStarter()
    expect(settleStarter(b, all, 4)).toEqual([...STARTER_GOAL_IDS])
    expect(b.doneDay).toBe(4)
    expect(starterRunning(b)).toBe(false)
    expect(currentGoal(b)).toBeNull()
    expect(b.opened).toEqual({ build: 4, services: 4, staff: 4 })
    expect(settleStarter(b, all, 5)).toEqual([])
  })

  it('goalProgress caps have at need and reads booleans as 0/1', () => {
    expect(goalProgress('serveMore', shop({ served: 14 }))).toEqual({ have: 10, need: 10 })
    expect(goalProgress('serveMore', shop({ served: 6 }))).toEqual({ have: 6, need: 10 })
    expect(goalProgress('placeMaskBed', shop())).toEqual({ have: 0, need: 1 })
    expect(goalProgress('openMassage', shop({ massageOpen: true }))).toEqual({ have: 1, need: 1 })
  })

  it('repairStarter keeps a valid book and turns junk, an out-of-range at or a missing book into pastStarter()', () => {
    const b = { at: 3, doneDay: null, bought: 1, opened: { build: 1 }, maskNext: false }
    expect(repairStarter(structuredClone(b))).toEqual(b)
    expect(repairStarter(undefined)).toEqual(pastStarter())
    expect(repairStarter('x')).toEqual(pastStarter())
    expect(repairStarter({ ...b, at: 99 })).toEqual(pastStarter())
    expect(repairStarter({ ...b, at: -1 })).toEqual(pastStarter())
    expect(repairStarter({ ...b, opened: { build: 'x', bogus: 2 } })).toEqual({ ...b, opened: {} })
  })

  it('isPast is true only for a book that never ran', () => {
    expect(isPast(pastStarter())).toBe(true)
    expect(isPast(newStarter())).toBe(false)
    const done = newStarter()
    settleStarter(done, all, 4)
    expect(isPast(done)).toBe(false)
  })
})
