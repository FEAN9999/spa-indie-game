import { describe, expect, it } from 'vitest'
import { STAFF_WORK_MS_SLOW, WORK_FLOOR_MS } from '../../src/config'
import { chefCap, chefSkill, chefWage, cookMs, makeChefCandidate, type ChefCandidate } from '../../src/sim/chefs'
import { DISH_IDS } from '../../src/sim/menu'
import { createRng } from '../../src/sim/rng'
import { STAFF_NAMES } from '../../src/strings/vi'

const cook = (skill: number, speed: number, pho = 0): ChefCandidate => ({
  name: 'Mai',
  look: {} as ChefCandidate['look'],
  stats: { skill, speed },
  wage: chefWage({ skill, speed }),
  rare: false,
  tiers: { pho, banhXeo: 0, che: 0 },
})

describe('chefs', () => {
  it('pays a cook like a technician', () => {
    expect(chefWage({ skill: 2, speed: 2 })).toBe(30_000)
    expect(chefWage({ skill: 1, speed: 1 })).toBe(20_000)
  })

  it('allows two cooks in a one-floor restaurant and never more than ten', () => {
    expect(chefCap(1, 0)).toBe(2)
    expect(chefCap(3, 4)).toBe(10)
    expect(chefCap(2, 1)).toBe(5)
    expect(chefCap(9, 9)).toBe(10)
  })

  it('gives a candidate one specialty and a free name', () => {
    const taken = STAFF_NAMES.slice(0, 15)
    for (let seed = 1; seed <= 50; seed++) {
      const c = makeChefCandidate(createRng(seed), [...taken])
      expect(DISH_IDS.filter(d => c.tiers[d] > 0)).toHaveLength(1)
      expect(taken).not.toContain(c.name)
      expect(c.stats.skill).toBeGreaterThanOrEqual(1)
      expect(c.stats.skill).toBeLessThanOrEqual(5)
      expect(c.stats.speed).toBeGreaterThanOrEqual(1)
      expect(c.stats.speed).toBeLessThanOrEqual(5)
      expect(c.wage).toBe(chefWage(c.stats))
    }
  })

  it('cooks faster with speed and specialty, never under the floor', () => {
    expect(cookMs(cook(1, 1), 'pho')).toBe(STAFF_WORK_MS_SLOW)
    expect(cookMs(cook(1, 1, 1), 'pho')).toBeLessThan(STAFF_WORK_MS_SLOW)
    expect(cookMs(cook(1, 1, 1), 'che')).toBe(STAFF_WORK_MS_SLOW)
    expect(cookMs(cook(1, 5, 3), 'pho')).toBeGreaterThanOrEqual(WORK_FLOOR_MS)
    expect(cookMs(cook(1, 5, 10), 'pho')).toBe(WORK_FLOOR_MS)
  })

  it('adds the specialty to the skill for the star roll', () => {
    expect(chefSkill({ ...cook(3, 1), tiers: { pho: 2, banhXeo: 0, che: 0 } }, 'pho')).toBe(5)
    expect(chefSkill({ ...cook(4, 1), tiers: { pho: 3, banhXeo: 0, che: 0 } }, 'pho')).toBe(5)
    expect(chefSkill({ ...cook(3, 1), tiers: { pho: 2, banhXeo: 0, che: 0 } }, 'che')).toBe(3)
  })
})
