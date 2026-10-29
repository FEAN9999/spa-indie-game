import { FLOOR_ROWS, STAIRS_MS } from '../config'
import { floorOf } from '../sim/floors'
import { bedSlotAt, isWalkable, manhattan, tileEq, tileOf as roundTile, type Grid } from '../sim/grid'
import { findPath } from '../sim/path'
import { BREEDS, type Pet, type PetKind } from '../sim/pets'
import type { Rng } from '../sim/rng'
import type { Tile, Vec } from '../sim/types'

/** What a pet's brain reads of the shop: the grid, how many floors are open, the owner, the door, and whether it is night. */
export interface PetWorld {
  grid: Grid
  floors: number
  owner: Tile
  ownerMoving: boolean
  door: Tile
  night: boolean
}

export type PetState = 'walk' | 'sit' | 'sleep'

/** A pet as the view moves it: `pos` in tile units like the sim's people, `leftMs` of sitting or sleeping still to go, and why it walked. */
export interface PetMind {
  id: number
  kind: PetKind
  pos: Vec
  facing: 'left' | 'right'
  path: Tile[]
  state: PetState
  leftMs: number
  why: 'wander' | 'follow' | 'greet'
  step: 0 | 1
  stepMs: number
  /** How long it has stood at the foot of the stairs, while the next step is a climb. */
  climbMs?: number
}

/** Tiles per second. */
const SPEED: Record<PetKind, number> = { cat: 1.2, dog: 1.8 }
/** How long each walking pose lasts. */
const STEP_MS = 160

const between = (rng: Rng, lo: number, hi: number) => lo + rng() * (hi - lo)

const onOpenFloor = (world: PetWorld, t: Tile) => floorOf(t.y) <= world.floors

/** Plain floor on an open floor, off any empty bed slot: where a pet may choose to go. */
function restful(world: PetWorld, t: Tile): boolean {
  return onOpenFloor(world, t) && world.grid.cells[t.y]?.[t.x] === 'floor' && !bedSlotAt(world.grid, t)
}

/** Every tile a pet may stand on, on an open floor. */
function walkables(world: PetWorld): Tile[] {
  const out: Tile[] = []
  const rows = Math.min(world.grid.rows, world.floors * FLOOR_ROWS)
  for (let y = 0; y < rows; y++) for (let x = 0; x < world.grid.cols; x++) if (isWalkable(world.grid, { x, y })) out.push({ x, y })
  return out
}

function sit(m: PetMind, ms: number, why: PetMind['why'] = 'wander'): void {
  Object.assign(m, { state: 'sit', leftMs: ms, why, path: [] })
  delete m.climbMs
}

function sleep(m: PetMind, ms: number): void {
  sit(m, ms)
  m.state = 'sleep'
}

/** Sets off along the shortest walk to a tile matching `isGoal`; with no way there it sits and thinks again later. */
function go(m: PetMind, world: PetWorld, rng: Rng, why: PetMind['why'], isGoal: (t: Tile) => boolean): void {
  const path = findPath(world.grid, tileOf(m), t => isWalkable(world.grid, t) && onOpenFloor(world, t) && isGoal(t))
  if (path === null) return sit(m, between(rng, 3000, 5000))
  if (path.length === 0) return arrive(m, rng, why)
  Object.assign(m, { state: 'walk', leftMs: 0, why, path, step: 0, stepMs: 0 })
}

/** At the end of a walk: by the owner or the door it sits wagging; after a wander it thinks again. */
function arrive(m: PetMind, rng: Rng, why: PetMind['why']): void {
  sit(m, why === 'wander' ? 0 : between(rng, 3000, 5000), why)
}

function wander(m: PetMind, world: PetWorld, rng: Rng): void {
  const spots = walkables(world).filter(t => restful(world, t))
  const spot = spots[Math.floor(rng() * spots.length)]
  if (!spot) return sit(m, between(rng, 3000, 5000))
  go(m, world, rng, 'wander', t => tileEq(t, spot))
}

/** To the owner's side, where it is seen; above or below only when neither side is free. */
function follow(m: PetMind, world: PetWorld, rng: Rng): void {
  const o = world.owner
  const beside = (t: Tile) => t.y === o.y && Math.abs(t.x - o.x) === 1
  const sideFree = [-1, 1].some(dx => isWalkable(world.grid, { x: o.x + dx, y: o.y }))
  go(m, world, rng, 'follow', t => (sideFree ? beside(t) : manhattan(t, o) === 1))
}

/** Decides what to do next, by kind. */
function think(m: PetMind, world: PetWorld, rng: Rng): void {
  const r = rng()
  if (m.kind === 'cat') {
    if (r < 0.4) return sleep(m, between(rng, 8000, 14000))
    if (r < 0.65) return sit(m, between(rng, 3000, 5000))
    return wander(m, world, rng)
  }
  if (r < 0.35) return follow(m, world, rng)
  if (r < 0.5) {
    const inside = 1 + Math.floor(rng() * 2)
    return go(m, world, rng, 'greet', t => t.x === world.door.x && t.y === world.door.y - inside)
  }
  if (r < 0.7) return sit(m, between(rng, 3000, 5000))
  if (r < 0.85) return sleep(m, between(rng, 6000, 11000))
  return wander(m, world, rng)
}

/** Walks the path as the sim's people do, facing the way it goes across; a step onto another floor waits STAIRS_MS at the foot of the stairs. */
function walk(m: PetMind, dtMs: number): void {
  const speed = SPEED[m.kind]
  let budget = (speed * dtMs) / 1000
  while (budget > 0 && m.path.length > 0) {
    const target = m.path[0]
    if (floorOf(target.y) !== floorOf(m.pos.y)) {
      m.climbMs = (m.climbMs ?? 0) + (budget / speed) * 1000
      if (m.climbMs < STAIRS_MS) return
      budget = ((m.climbMs - STAIRS_MS) / 1000) * speed
      delete m.climbMs
      m.pos = { x: target.x, y: target.y }
      m.path.shift()
      continue
    }
    const dx = target.x - m.pos.x
    const dy = target.y - m.pos.y
    const dist = Math.hypot(dx, dy)
    if (dx !== 0) m.facing = dx > 0 ? 'right' : 'left'
    if (dist <= budget) {
      m.pos = { x: target.x, y: target.y }
      m.path.shift()
      budget -= dist
    } else {
      m.pos = { x: m.pos.x + (dx / dist) * budget, y: m.pos.y + (dy / dist) * budget }
      budget = 0
    }
  }
}

/** A new pet on a random plain floor-1 tile, sitting briefly. */
export function newMind(pet: Pet, world: PetWorld, rng: Rng): PetMind {
  const ground = walkables(world).filter(t => floorOf(t.y) === 1)
  const plain = ground.filter(t => restful(world, t))
  const spots = plain.length > 0 ? plain : ground
  const at = spots[Math.floor(rng() * spots.length)] ?? world.door
  const facing = rng() < 0.5 ? 'left' : 'right'
  return { id: pet.id, kind: BREEDS[pet.breed].kind, pos: { ...at }, facing, path: [], state: 'sit', leftMs: between(rng, 1000, 2000), why: 'wander', step: 0, stepMs: 0 }
}

/** Moves the pet on by `dtMs`: walking, sitting or sleeping until it thinks again; at night it sleeps where it is. */
export function stepMind(m: PetMind, dtMs: number, world: PetWorld, rng: Rng): void {
  if (world.night) {
    if (m.state !== 'sleep' || m.leftMs > 0) sleep(m, 0)
    return
  }
  if (m.state === 'walk') {
    if (m.path.length > 0 && !isWalkable(world.grid, m.path[0])) return sit(m, between(rng, 1000, 2000))
    walk(m, dtMs)
    m.stepMs += dtMs
    while (m.stepMs >= STEP_MS) {
      m.stepMs -= STEP_MS
      m.step = m.step === 0 ? 1 : 0
    }
    if (m.path.length === 0) arrive(m, rng, m.why)
    return
  }
  if (m.state === 'sit' && m.why === 'follow' && world.ownerMoving && manhattan(tileOf(m), world.owner) > 2) return follow(m, world, rng)
  m.leftMs -= dtMs
  if (m.leftMs <= 0) think(m, world, rng)
}

/** After the room changed: a pet whose tile is no longer walkable jumps to the nearest one and drops its path. */
export function settle(m: PetMind, world: PetWorld): void {
  const here = tileOf(m)
  if (isWalkable(world.grid, here) && onOpenFloor(world, here)) return
  let best: Tile | undefined
  for (const t of walkables(world)) if (!best || manhattan(t, here) < manhattan(best, here)) best = t
  if (!best) return
  m.pos = { ...best }
  m.path = []
  delete m.climbMs
  if (m.state === 'walk') sit(m, 0)
}

/** The frame to draw: a walking step, sitting, sitting wagging by the owner or the door, or asleep. */
export function poseOf(m: PetMind): 'walk0' | 'walk1' | 'sit' | 'wag' | 'sleep' {
  if (m.state === 'walk') return m.step === 0 ? 'walk0' : 'walk1'
  if (m.state === 'sleep') return 'sleep'
  return m.why === 'wander' ? 'sit' : 'wag'
}

/** The tile the pet stands on, or is stepping onto. */
export function tileOf(m: PetMind): Tile {
  return roundTile(m.pos)
}
