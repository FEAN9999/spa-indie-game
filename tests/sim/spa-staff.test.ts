import { describe, expect, it } from 'vitest'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import { hireStaff } from './helpers'

const newSim = () => new SpaSim({ rng: createRng(5), autoSpawn: false })

describe('hiring', () => {
  it('offers three new candidates each morning from day 3', () => {
    const sim = newSim()
    sim.startDay()
    expect([sim.day, sim.candidates.length, sim.candidatesDay]).toEqual([2, 0, 0])
    sim.startDay()
    expect([sim.day, sim.candidates.length, sim.candidatesDay]).toEqual([3, 3, 3])
    expect(new Set(sim.candidates.map(c => c.name)).size).toBe(3)
    const hired = sim.candidates[0].name
    expect(sim.hire(0)).toBeNull()
    sim.startDay()
    expect(sim.candidates.map(c => c.name)).not.toContain(hired)
    expect(new Set(sim.candidates.map(c => c.name)).size).toBe(3)
  })

  it('hires at once and for free', () => {
    const sim = newSim()
    sim.startDay()
    sim.startDay()
    const name = sim.candidates[1].name
    const money = sim.money
    expect(sim.hire(1)).toBeNull()
    expect(sim.money).toBe(money)
    expect(sim.candidates).toHaveLength(2)
    expect(sim.staff).toHaveLength(1)
    const s = sim.staff[0]
    expect([s.name, s.id, s.level, s.xp, s.sinceRest, s.leaving, s.task]).toEqual([name, 1, 1, 0, 0, false, null])
    expect(s.pos).toEqual(sim.grid.door)
    expect(s.facing).toBe('up')
  })

  it('refuses a second receptionist and a fourth technician', () => {
    const sim = newSim()
    hireStaff(sim, 'receptionist')
    for (let i = 0; i < 3; i++) hireStaff(sim, 'technician')
    for (const role of ['receptionist', 'technician'] as const) {
      sim.candidates.push({ ...sim.staff.find(s => s.role === role)!, name: 'Extra' })
      expect(sim.hire(sim.candidates.length - 1)).toBe('full')
    }
    sim.staff[0].leaving = true
    expect(sim.hire(sim.candidates.length - 2)).toBeNull()
  })

  it('refuses to hire or buy while money is negative', () => {
    const sim = newSim()
    sim.startDay()
    sim.startDay()
    sim.money = -1
    expect(sim.hire(0)).toBe('money')
    expect(sim.buy('plant', 6, 9, false)).toBe('money')
    expect(sim.staff).toHaveLength(0)
  })
})
