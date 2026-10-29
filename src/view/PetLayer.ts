import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { PET_ORIGIN, petKey } from '../art/pets'
import { sound } from '../audio/engine'
import { DAY_END_MIN, TILE } from '../config'
import type { Pet } from '../sim/pets'
import { createRng } from '../sim/rng'
import type { SpaSim } from '../sim/spa'
import { climbPose } from './floors'
import { newMind, poseOf, settle, stepMind, type PetMind, type PetWorld } from './petBrain'
import type { RoomView } from './RoomView'
import { textStyle } from './text'

/** SpaScene's effects depth, over every character. */
const FX_DEPTH = 9000
const HOP_MS = 500
const HOP_PX = 40
const PAT_MS = 1200
/** Where the heart and the name start, over the pet's feet. */
const PAT_TOP = -100
const Z_MS = 1600
const Z_RISE_PX = 30

interface PetSprite {
  pet: Pet
  mind: PetMind
  image: Phaser.GameObjects.Image
  /** The z over a sleeper. */
  z: Phaser.GameObjects.Text
  /** When the last pat's hop started; -Infinity before any. */
  hopAt: number
}

/** The shop's cats and dogs: drawn where their own brains walk them, at the main shop only; a tap pats one. */
export class PetLayer {
  private readonly sprites = new Map<number, PetSprite>()
  /** The pets' own stream: the sim's is never drawn from. */
  private readonly rng = createRng(Date.now())
  /** Pets there at the first frame start inside; one adopted later walks in from the door. */
  private started = false
  private clockMs = 0

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly room: RoomView,
  ) {}

  update(sim: SpaSim, dt: number): void {
    this.clockMs += dt
    // the pets live at the main shop: out of sight, and where they were, while the owner is at a branch
    if (sim.place !== null) {
      for (const sp of this.sprites.values()) this.hide(sp)
      return
    }
    const world = this.world(sim)
    const ids = new Set(sim.pets.owned.map(p => p.id))
    for (const [id, sp] of this.sprites) {
      if (ids.has(id)) continue
      sp.image.destroy()
      sp.z.destroy()
      this.sprites.delete(id)
    }
    for (const pet of sim.pets.owned) {
      const sp = this.sprites.get(pet.id) ?? this.add(pet, world)
      sp.pet = pet
      stepMind(sp.mind, dt, world, this.rng)
      this.draw(sp)
    }
    this.started = true
  }

  /** The pet a tap landed on, from the objects under the pointer; null for none. */
  petAt(over: Phaser.GameObjects.GameObject[]): number | null {
    for (const sp of this.sprites.values()) if (over.includes(sp.image)) return sp.pet.id
    return null
  }

  /** A pat: the pet hops, its name and a heart rise, and it meows or barks. */
  pat(id: number): void {
    const sp = this.sprites.get(id)
    if (!sp) return
    sp.hopAt = this.scene.time.now
    sound.play(sp.mind.kind === 'cat' ? 'meow' : 'woof')
    const { x, y } = sp.image
    const heart = this.scene.add.image(x, y + PAT_TOP, 'heart-full').setDepth(FX_DEPTH + 10)
    const name = this.scene.add
      .text(x, y + PAT_TOP - 50, sp.pet.name, { ...textStyle(40), stroke: C.cream, strokeThickness: 10 })
      .setOrigin(0.5, 1)
      .setDepth(FX_DEPTH + 10)
    for (const o of [heart, name]) {
      this.scene.tweens.add({ targets: o, y: o.y - 80, duration: PAT_MS, ease: 'Cubic.easeOut' })
      this.scene.tweens.add({ targets: o, alpha: 0, duration: PAT_MS, ease: 'Cubic.easeIn', onComplete: () => o.destroy() })
    }
  }

  /** After build mode: a pet whose tile now holds furniture hops to the nearest free one, and every walk is thought over on the new room. */
  settle(sim: SpaSim): void {
    const world = this.world(sim)
    for (const sp of this.sprites.values()) settle(sp.mind, world)
  }

  private world(sim: SpaSim): PetWorld {
    const o = sim.owner
    return {
      grid: sim.grid,
      floors: sim.floors,
      owner: { x: Math.round(o.pos.x), y: Math.round(o.pos.y) },
      ownerMoving: o.path.length > 0,
      door: sim.grid.door,
      // from 20:00, and over the day's summary, everyone sleeps
      night: sim.dayOver || sim.clock.minutes >= DAY_END_MIN,
    }
  }

  private add(pet: Pet, world: PetWorld): PetSprite {
    const mind = newMind(pet, world, this.rng)
    if (this.started) mind.pos = { ...world.door }
    const image = this.scene.add.image(0, 0, petKey(pet.breed, 'sit')).setOrigin(PET_ORIGIN.x, PET_ORIGIN.y)
    image.setInteractive(this.scene.input.makePixelPerfect())
    const z = this.scene.add.text(0, 0, 'z', textStyle(34, '800', C.soft)).setOrigin(0.5, 1).setDepth(FX_DEPTH).setVisible(false)
    const sp: PetSprite = { pet, mind, image, z, hopAt: -Infinity }
    this.sprites.set(pet.id, sp)
    return sp
  }

  private hide(sp: PetSprite): void {
    sp.image.setVisible(false).disableInteractive()
    sp.z.setVisible(false)
  }

  private draw(sp: PetSprite): void {
    const m = sp.mind
    if (!this.room.onFloor(m.pos.y)) {
      this.hide(sp)
      return
    }
    const at = this.room.tileToWorld(m.pos)
    // on the stairs, it rises toward the next floor and fades, as people do
    const climb = climbPose(m)
    if (climb) at.y -= climb.lift * TILE
    const hop = (this.scene.time.now - sp.hopAt) / HOP_MS
    const hopping = hop >= 0 && hop < 1
    const pose = hopping ? 'happy' : poseOf(m)
    sp.image
      .setTexture(petKey(sp.pet.breed, pose))
      .setFlipX(m.facing === 'left')
      .setPosition(at.x, at.y - (hopping ? Math.sin(Math.PI * hop) * HOP_PX : 0))
      .setDepth(at.y)
      .setAlpha(climb?.alpha ?? 1)
      .setVisible(true)
      .setInteractive()
    const asleep = pose === 'sleep'
    sp.z.setVisible(asleep)
    if (asleep) {
      const k = (this.clockMs % Z_MS) / Z_MS
      sp.z.setPosition(at.x + 30 * (m.facing === 'left' ? -1 : 1), at.y - 60 - k * Z_RISE_PX).setAlpha(1 - k)
    }
  }
}
