import { describe, expect, it } from 'vitest'
import { floorOf } from '../../src/sim/floors'
import { isWalkable, manhattan, tileOf as roundTile } from '../../src/sim/grid'
import type { BreedId } from '../../src/sim/pets'
import { createRng, type Rng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import type { Tile } from '../../src/sim/types'
import { newMind, poseOf, settle, stepMind, tileOf, type PetMind, type PetWorld } from '../../src/view/petBrain'

const STEP = 50
const MINUTES_10 = 10 * 60_000

/** A fresh floor-1 shop, or one with floor 2 open, seen as a pet sees it. */
function shop(floors: 1 | 2 = 1): PetWorld {
  const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
  if (floors === 2) {
    sim.day = 6
    sim.money = 8_000_000
    expect(sim.openFloor(2)).toBeNull()
  }
  return { grid: sim.grid, floors: sim.floors, owner: roundTile(sim.owner.pos), ownerMoving: false, door: sim.grid.door, night: false }
}

function pets(world: PetWorld, breeds: BreedId[], rng: Rng): PetMind[] {
  return breeds.map((breed, i) => newMind({ id: i + 1, breed, name: breed }, world, rng))
}

/** Runs every pet for `ms`, calling `look` after each step. */
function run(minds: PetMind[], world: PetWorld, rng: Rng, ms: number, look: (m: PetMind) => void = () => {}): void {
  for (let t = 0; t < ms; t += STEP)
    for (const m of minds) {
      stepMind(m, STEP, world, rng)
      look(m)
    }
}

const CATS: BreedId[] = ['muop', 'mun', 'tamthe', 'xiem']
const DOGS: BreedId[] = ['chota', 'phuquoc', 'corgi', 'poodle']

describe('the pet brain', () => {
  it('keeps every pet on walkable tiles of open floors', () => {
    for (const floors of [1, 2] as const) {
      const world = shop(floors)
      const rng = createRng(7)
      const minds = pets(world, [...CATS, ...DOGS], rng)
      // one expect at the end: one per step makes the test slow
      const off: Tile[] = []
      run(minds, world, rng, MINUTES_10, m => {
        const t = tileOf(m)
        if (!isWalkable(world.grid, t) || floorOf(t.y) > world.floors) off.push(t)
      })
      expect(off).toEqual([])
    }
  })

  it('lets cats sleep more than dogs, and keeps dogs nearer the owner', () => {
    const world = shop()
    const rng = createRng(3)
    const minds = pets(world, [...CATS, ...DOGS], rng)
    const asleep = { cat: 0, dog: 0 }
    const near = { cat: 0, dog: 0 }
    run(minds, world, rng, MINUTES_10, m => {
      if (m.state === 'sleep') asleep[m.kind]++
      if (manhattan(tileOf(m), world.owner) <= 2) near[m.kind]++
    })
    expect(asleep.cat).toBeGreaterThan(asleep.dog)
    expect(near.dog).toBeGreaterThan(near.cat)
  })

  it('walks with alternating steps, and wags by the owner', () => {
    const world = shop()
    const rng = createRng(4)
    const poses = new Set<string>()
    run(pets(world, DOGS, rng), world, rng, MINUTES_10, m => poses.add(poseOf(m)))
    expect([...poses].sort()).toEqual(['sit', 'sleep', 'wag', 'walk0', 'walk1'])
  })

  it('sends a dog sitting by the owner after them when they walk off', () => {
    const world = shop()
    const rng = createRng(5)
    const [dog] = pets(world, ['corgi'], rng)
    for (let t = 0; t < MINUTES_10 && !(dog.state === 'sit' && dog.why === 'follow'); t += STEP) stepMind(dog, STEP, world, rng)
    expect(poseOf(dog)).toBe('wag')
    const far = { ...world, owner: { x: world.door.x, y: world.door.y - 1 }, ownerMoving: true }
    expect(manhattan(tileOf(dog), far.owner)).toBeGreaterThan(2)
    stepMind(dog, STEP, far, rng)
    expect(dog.state).toBe('walk')
    expect(dog.why).toBe('follow')
  })

  it('puts everyone to sleep where they are at night, until morning', () => {
    const world = shop(2)
    const rng = createRng(6)
    const minds = pets(world, [...CATS, ...DOGS], rng)
    run(minds, world, rng, 60_000)
    const night = { ...world, night: true }
    run(minds, night, rng, STEP)
    const where = minds.map(m => ({ ...m.pos }))
    run(minds, night, rng, 60_000, m => expect(m.state).toBe('sleep'))
    expect(minds.map(m => m.pos)).toEqual(where)
    run(minds, world, rng, 60_000)
    expect(minds.some(m => m.state !== 'sleep' || m.pos.x !== where[m.id - 1].x || m.pos.y !== where[m.id - 1].y)).toBe(true)
  })

  it('moves a pet off a tile furniture now covers', () => {
    const world = shop()
    const rng = createRng(8)
    const [cat] = pets(world, ['muop'], rng)
    const t = tileOf(cat)
    const grid = structuredClone(world.grid)
    grid.cells[t.y][t.x] = 'desk'
    const moved = { ...world, grid }
    cat.path = [{ ...t }]
    settle(cat, moved)
    expect(isWalkable(grid, tileOf(cat))).toBe(true)
    expect(manhattan(tileOf(cat), t)).toBe(1)
    expect(cat.path).toEqual([])
  })

  it('climbs to floor 2 when it is open', () => {
    const world = shop(2)
    const rng = createRng(9)
    const minds = pets(world, CATS, rng)
    let upstairs = false
    run(minds, world, rng, MINUTES_10, m => (upstairs ||= floorOf(tileOf(m).y) === 2))
    expect(upstairs).toBe(true)
  })

  it('moves the same way from the same seed', () => {
    const trail = () => {
      const world = shop(2)
      const rng = createRng(11)
      const minds = pets(world, [...CATS, ...DOGS], rng)
      run(minds, world, rng, 2 * 60_000)
      return minds.map(m => m.pos)
    }
    expect(trail()).toEqual(trail())
  })
})
