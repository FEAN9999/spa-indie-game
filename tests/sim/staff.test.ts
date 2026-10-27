import { describe, expect, it } from 'vitest'
import { LEVEL_WAGE_RAISE, STAFF_STAR_ODDS, WORK_FLOOR_MS } from '../../src/config'
import { createRng } from '../../src/sim/rng'
import { BASIC_SERVICES, SERVICE_IDS, type ServiceId } from '../../src/sim/services'
import { SpaSim } from '../../src/sim/spa'
import { candidatePool, courses, drawTiers, gainXp, greeterPatience, greetPatience, levelFor, makeCandidate, noTiers, RECEPTIONIST_TRAITS, restAfter, serviceMs, staffStars, starSkill, staffWalkSpeed, tipFactor, TRAIT_IDS, tuition, walkSpeed, wageFor, workMs, type Staff, type TraitId } from '../../src/sim/staff'
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
    const list = Array.from({ length: n }, () => makeCandidate(rng, ['Lan'], ['shampoo']))
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

  it('adds the tier of the service served to the skill for stars, up to 5', () => {
    const s = { stats: { ...all(3) }, tiers: { ...noTiers(), mask: 1 } } as Staff
    expect([starSkill(s, 'mask'), starSkill(s, 'shampoo')]).toEqual([4, 3])
    const top = { stats: { ...all(5) }, tiers: { ...noTiers(), mask: 2 } } as Staff
    expect(starSkill(top, 'mask')).toBe(5)
  })

  it('works a tiered service 15% faster per tier, never under the floor', () => {
    const at = (speed: number, tier: number) => ({ stats: { ...all(1), speed }, tiers: { ...noTiers(), mask: tier } }) as Staff
    expect(serviceMs(at(3, 0), 'mask')).toBe(workMs(3))
    expect(serviceMs(at(3, 1), 'mask')).toBe(Math.round(workMs(3) * 0.85))
    expect(serviceMs(at(1, 3), 'mask')).toBe(Math.round(workMs(1) * 0.85 ** 3))
    expect(WORK_FLOOR_MS).toBe(workMs(5) / 2)
    for (let speed = 1; speed <= 5; speed++) for (let tier = 0; tier <= 3; tier++) expect(serviceMs(at(speed, tier), 'mask')).toBeGreaterThanOrEqual(WORK_FLOOR_MS)
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
  // an empty `taken` each time: there are only so many names
  const draw = (open: ServiceId[] = ['shampoo']) => {
    const rng = createRng(7)
    return Array.from({ length: 300 }, () => makeCandidate(rng, [], open))
  }

  it('gives a new technician tier 1 in exactly one service, drawn from every basic service', () => {
    const techs = draw().filter(c => c.role === 'technician')
    for (const c of techs) {
      const set = Object.values(c.tiers).filter(v => v !== 0)
      expect(set).toEqual([c.rare ? 2 : 1])
    }
    const seen = new Set(techs.map(c => SERVICE_IDS.find(id => c.tiers[id] !== 0)))
    expect([...seen].sort()).toEqual([...BASIC_SERVICES].sort())
  })

  it('gives a receptionist candidate no tiers', () => {
    for (const c of draw().filter(c => c.role === 'receptionist')) expect(c.tiers).toEqual(noTiers())
  })

  it('draws a tier from the pool it is given', () => {
    expect(drawTiers(createRng(3), 'technician', 1, ['mask'])).toEqual({ ...noTiers(), mask: 1 })
  })

  it('pools the basic services and the recipe services the shop has open', () => {
    expect(candidatePool(['shampoo'])).toEqual(['shampoo', 'mask', 'massage'])
    expect(candidatePool(['shampoo', 'mask', 'massage', 'steam'])).toEqual(['shampoo', 'mask', 'massage', 'steam'])
    expect(candidatePool(['shampoo', 'mask', 'massage', 'steam', 'stone', 'mud'])).toEqual(['shampoo', 'mask', 'massage', 'steam', 'stone', 'mud'])
  })

  it('draws a steam specialty only once steam is open', () => {
    expect(draw(['shampoo', 'mask', 'massage']).filter(c => c.tiers.steam > 0)).toEqual([])
    expect(draw(['shampoo', 'mask', 'massage', 'steam']).some(c => c.tiers.steam > 0)).toBe(true)
  })
})

describe('stone and mud specialties', () => {
  it('draws them only once Đá nóng and Tắm bùn are open', () => {
    const closed: ServiceId[] = ['shampoo', 'mask', 'massage', 'steam']
    const open: ServiceId[] = [...closed, 'stone', 'mud']
    const rng = createRng(11)
    const pool = Array.from({ length: 300 }, () => makeCandidate(rng, [], closed))
    expect(pool.filter(c => c.tiers.stone > 0 || c.tiers.mud > 0)).toEqual([])
    const opened = Array.from({ length: 300 }, () => makeCandidate(rng, [], open))
    expect(opened.some(c => c.tiers.stone > 0)).toBe(true)
    expect(opened.some(c => c.tiers.mud > 0)).toBe(true)
  })
})

describe('courses', () => {
  const tech = (tiers: Partial<Record<(typeof SERVICE_IDS)[number], number>>) => ({ role: 'technician', stats: all(3), tiers: { ...noTiers(), ...tiers } }) as Staff
  const reception = (friendly: number) => ({ role: 'receptionist', stats: { ...all(3), friendly }, tiers: noTiers() }) as Staff

  it('offers a technician every open service below tier 3', () => {
    const s = tech({ shampoo: 3, mask: 1, massage: 0 })
    expect(courses(s, ['shampoo', 'mask'])).toEqual(['mask'])
    expect(courses(s, ['shampoo', 'mask', 'massage'])).toEqual(['mask', 'massage'])
  })

  it('offers a receptionist Tiếp khách until 5 dots', () => {
    expect(courses(reception(4), ['shampoo'])).toEqual(['greet'])
    expect(courses(reception(5), ['shampoo'])).toEqual([])
  })

  it('prices a course by the step it climbs', () => {
    expect([0, 1, 2].map(tier => tuition(tech({ mask: tier }), 'mask'))).toEqual([100000, 200000, 400000])
    expect([1, 2, 3, 4].map(f => tuition(reception(f), 'greet'))).toEqual([50000, 100000, 200000, 400000])
  })
})

describe('personalities', () => {
  it('draws one of six traits for a technician and one of three for a receptionist', () => {
    const rng = createRng(11)
    const list = Array.from({ length: 400 }, () => makeCandidate(rng, [], ['shampoo']))
    const techs = list.filter(c => c.role === 'technician').map(c => c.trait)
    const desk = list.filter(c => c.role === 'receptionist').map(c => c.trait)
    expect(techs.every(t => TRAIT_IDS.includes(t))).toBe(true)
    expect(new Set(techs).size).toBe(6)
    expect(desk.every(t => RECEPTIONIST_TRAITS.includes(t))).toBe(true)
    expect(new Set(desk).size).toBe(3)
  })

  it('hires a person with the trait they had as a candidate', () => {
    const sim = new SpaSim({ rng: createRng(3), autoSpawn: false })
    sim.startDay()
    sim.startDay()
    const want = sim.candidates[0].trait
    expect(sim.hire(0)).toBeNull()
    expect(sim.staff[0].trait).toBe(want)
  })
})

describe('personality numbers', () => {
  const with_ = (trait: TraitId, extra: object = {}) => ({ trait, role: 'technician', stats: all(3), tiers: noTiers(), ...extra }) as Staff

  it('adds a dot of skill for a deft technician, still up to 5', () => {
    const at = (trait: TraitId, skill: number, tier: number) => with_(trait, { stats: { ...all(1), skill }, tiers: { ...noTiers(), mask: tier } })
    expect(starSkill(at('deft', 3, 1), 'mask')).toBe(5)
    expect(starSkill(at('deft', 5, 3), 'mask')).toBe(5)
    expect(starSkill(at('calm', 3, 1), 'mask')).toBe(4)
  })

  it('works 20% faster when quick, never under the floor', () => {
    const at = (speed: number, tier: number) => with_('quick', { stats: { ...all(1), speed }, tiers: { ...noTiers(), mask: tier } })
    expect(serviceMs(at(3, 0), 'mask')).toBe(Math.round(workMs(3) * 0.8))
    expect(serviceMs(at(5, 3), 'mask')).toBe(WORK_FLOOR_MS)
  })

  it("cuts a studious person's tuition by 30%, to the thousand", () => {
    const tech = (tier: number) => with_('studious', { tiers: { ...noTiers(), mask: tier } })
    expect([0, 1, 2].map(tier => tuition(tech(tier), 'mask'))).toEqual([70000, 140000, 280000])
    expect(tuition(with_('studious', { role: 'receptionist', stats: { ...all(3), friendly: 1 } }), 'greet')).toBe(35000)
  })

  it('rests a diligent person one customer sooner', () => {
    expect(restAfter({ role: 'technician', stats: all(3), trait: 'diligent' })).toBe(4)
    expect(restAfter({ role: 'receptionist', stats: all(3), trait: 'diligent' })).toBe(9)
    expect(restAfter({ role: 'technician', stats: all(1), trait: 'diligent' })).toBe(2)
    expect(restAfter({ role: 'technician', stats: { ...all(1), stamina: 0 }, trait: 'diligent' })).toBe(1)
  })

  it('gives a diligent person 1.5 experience and a studious one a double raise', () => {
    const person = (trait: TraitId, xp: number) => ({ trait, level: 1, xp, stats: all(5), wage: 100000 }) as Staff
    const d = person('diligent', 0)
    gainXp(d, createRng(1))
    expect(d.xp).toBe(1.5)
    const up = (trait: TraitId) => {
      const s = person(trait, 2)
      gainXp(s, createRng(1))
      return s.wage
    }
    expect(up('studious')).toBe(100000 + 2 * LEVEL_WAGE_RAISE)
    expect(up('calm')).toBe(100000 + LEVEL_WAGE_RAISE)
    expect(up('diligent')).toBe(100000 + LEVEL_WAGE_RAISE)
  })

  it('walks a calm technician 20% slower', () => {
    expect(staffWalkSpeed(with_('calm'))).toBeCloseTo(walkSpeed(3) * 0.8)
    expect(staffWalkSpeed(with_('quick'))).toBe(walkSpeed(3))
  })

  it("gives a jolly greeter's customers more patience", () => {
    const r = (trait: TraitId) => with_(trait, { role: 'receptionist' })
    expect(greeterPatience(r('jolly'))).toBeCloseTo(greetPatience(3) + 0.1)
    expect(greeterPatience(r('diligent'))).toBe(greetPatience(3))
  })
})
