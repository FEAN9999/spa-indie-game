import { describe, expect, it } from 'vitest'
import { STAFF_STAR_ODDS } from '../../src/config'
import { createRng } from '../../src/sim/rng'
import { SERVICE_IDS } from '../../src/sim/services'
import { drawTiers, gainXp, greetPatience, levelFor, makeCandidate, noTiers, restAfter, staffStars, tipFactor, walkSpeed, wageFor, workMs, type Staff } from '../../src/sim/staff'
import { STAFF_NAMES } from '../../src/strings/vi'

const all = (n: number) => ({ skill: n, speed: n, friendly: n, stamina: n })

describe('staff rules', () => {
  it('pays 20 000 to 60 000 a day by stats', () => {
    expect(wageFor(all(1))).toBe(20000)
    expect(wageFor(all(5))).toBe(60000)
    expect(wageFor({ skill: 3, speed: 2, friendly: 1, stamina: 4 })).toBe(35000)
  })

  it('draws candidates', () => {
    const rng = createRng(7)
    const n = 2000
    const list = Array.from({ length: n }, () => makeCandidate(rng, ['Lan']))
    const receptionists = list.filter(c => c.role === 'receptionist').length / n
    const rare = list.filter(c => c.rare).length / n
    expect(receptionists).toBeGreaterThan(0.28)
    expect(receptionists).toBeLessThan(0.39)
    expect(rare).toBeGreaterThan(0.07)
    expect(rare).toBeLessThan(0.13)
    for (const c of list) {
      const [lo, hi] = c.rare ? [4, 5] : [1, 3]
      for (const v of Object.values(c.stats)) expect(v >= lo && v <= hi).toBe(true)
      expect(c.wage).toBe(wageFor(c.stats))
      expect(STAFF_NAMES).toContain(c.name)
      expect(c.name).not.toBe('Lan')
    }
  })

  it('works 24 s at speed 1 and 12 s at speed 5, and walks 3.5 to 5.5 tiles a second', () => {
    expect([workMs(1), workMs(5)]).toEqual([24000, 12000])
    expect([walkSpeed(1), walkSpeed(5)]).toEqual([3.5, 5.5])
  })

  it('rests after stamina + 2 customers, a receptionist after twice as many', () => {
    expect(restAfter({ role: 'technician', stats: all(1) })).toBe(3)
    expect(restAfter({ role: 'technician', stats: all(5) })).toBe(7)
    expect(restAfter({ role: 'receptionist', stats: all(1) })).toBe(6)
  })

  it('turns skill into stars', () => {
    expect(staffStars(1, 0)).toBe(2)
    expect(staffStars(1, 0.7)).toBe(1)
    expect(staffStars(5, 0.5)).toBe(3)
    expect(staffStars(5, 0.99)).toBe(2)
    const mean = (skill: number) => {
      let sum = 0
      for (let i = 0; i < 1000; i++) sum += staffStars(skill, i / 1000)
      return sum / 1000
    }
    const means = [1, 2, 3, 4, 5].map(mean)
    for (let i = 1; i < means.length; i++) expect(means[i]).toBeGreaterThan(means[i - 1])
    expect(means[4]).toBeLessThan(2.7)
    expect(STAFF_STAR_ODDS.three).toHaveLength(5)
  })

  it('levels by experience', () => {
    expect([0, 2, 3, 8, 15, 25, 99].map(levelFor)).toEqual([1, 1, 2, 3, 4, 5, 5])
  })

  it('raises the only stat below 5 and the wage on a level up', () => {
    const s = { level: 1, xp: 2, stats: { skill: 5, speed: 5, friendly: 5, stamina: 1 }, wage: 100000 } as Staff
    const rng = createRng(1)
    expect(gainXp(s, rng)).toBe(true)
    expect([s.level, s.xp, s.stats.stamina, s.wage]).toEqual([2, 3, 2, 102500])
    expect(gainXp(s, rng)).toBe(false)
    expect(s.wage).toBe(102500)
  })

  it('greets and tips by friendliness', () => {
    expect(greetPatience(1)).toBeCloseTo(1.17)
    expect(greetPatience(5)).toBeCloseTo(1.25)
    expect(tipFactor(0, null)).toBe(1)
    expect(tipFactor(4, null)).toBeCloseTo(1.2)
    expect(tipFactor(0, 3)).toBeCloseTo(1.1)
  })
})

describe('staff tiers', () => {
  const draw = () => {
    const rng = createRng(7)
    return Array.from({ length: 300 }, () => makeCandidate(rng, []))
  }

  it('gives a new technician tier 1 in exactly one service, drawn from every service', () => {
    const techs = draw().filter(c => c.role === 'technician')
    for (const c of techs) {
      const set = Object.values(c.tiers).filter(v => v !== 0)
      expect(set).toEqual([c.rare ? 2 : 1])
    }
    const seen = new Set(techs.map(c => SERVICE_IDS.find(id => c.tiers[id] !== 0)))
    expect([...seen].sort()).toEqual([...SERVICE_IDS].sort())
  })

  it('gives a receptionist candidate no tiers', () => {
    for (const c of draw().filter(c => c.role === 'receptionist')) expect(c.tiers).toEqual(noTiers())
  })

  it('draws a tier from the pool it is given', () => {
    expect(drawTiers(createRng(3), 'technician', 1, ['mask'])).toEqual({ ...noTiers(), mask: 1 })
  })
})
