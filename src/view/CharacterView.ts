import * as Phaser from 'phaser'
import { CHIBI_PX, PART_ANCHORS } from '../art/chibi'
import { PANTS, type CharacterColors } from '../art/palette'
import { TILE } from '../config'
import type { Facing } from '../sim/types'

export type Pose = 'stand' | 'walk' | 'sit' | 'lie'

const U = CHIBI_PX
const HIP_Y = -11 * U
const SHOULDER_Y = -24 * U
const HEAD_Y = -37 * U
const SWING = Phaser.Math.DegToRad(25)
const STEP_HZ = 5 // one full leg cycle is two steps, so 10 steps a second at 5 tiles a second
const BOB_PX = 3
const SIT_DROP_PX = 12
// lying on the shampoo bed: the feet origin is the bottom of the bed's middle tile
const BLANKET_TOP = -1.1 * TILE
const LIE_HEAD_Y = -1.45 * TILE

/** From the feet to the top of the hair. */
export const CHARACTER_HEIGHT_PX = 51 * U

/** A chibi built from tinted part textures and animated in code, with its feet at the container origin. */
export class CharacterView {
  readonly container: Phaser.GameObjects.Container
  private readonly upper: Phaser.GameObjects.Container
  private readonly shadow: Phaser.GameObjects.Image
  private readonly blanket: Phaser.GameObjects.Image
  private readonly legs: Phaser.GameObjects.Image[]
  private readonly arms: Phaser.GameObjects.Image[]
  private readonly body: Phaser.GameObjects.Image
  private readonly head: Phaser.GameObjects.Image
  private readonly face: Phaser.GameObjects.Image
  private readonly hair: Phaser.GameObjects.Image
  private readonly hairStyle: number
  private facing: Facing | null = null
  private pose: Pose = 'stand'
  private timeMs = 0

  constructor(scene: Phaser.Scene, colors: CharacterColors) {
    const part = (key: string, x: number, y: number, tint?: number) => {
      const img = scene.add.image(x, y, key).setOrigin(PART_ANCHORS[key].ox, PART_ANCHORS[key].oy)
      if (tint !== undefined) img.setTint(tint)
      return img
    }
    this.hairStyle = colors.hairStyle
    this.shadow = scene.add.image(0, 0, 'shadow')
    this.legs = [part('leg', -3.5 * U, HIP_Y, PANTS), part('leg', 3.5 * U, HIP_Y, PANTS)]
    this.body = part('body', 0, -27 * U, colors.shirt)
    this.arms = [part('arm', -9 * U, SHOULDER_Y, colors.skin), part('arm', 9 * U, SHOULDER_Y, colors.skin)]
    this.head = part('head', 0, HEAD_Y, colors.skin)
    this.face = part('face-down', 0, HEAD_Y)
    this.hair = part(`hair${colors.hairStyle}-down`, 0, HEAD_Y, colors.hair)
    this.upper = scene.add.container(0, 0, [this.body, ...this.arms, this.head, this.face, this.hair])
    this.blanket = part('blanket', 0, BLANKET_TOP).setVisible(false)
    this.container = scene.add.container(0, 0, [this.shadow, ...this.legs, this.blanket, this.upper])
    this.setFacing('down')
  }

  setFacing(f: Facing): void {
    if (f === this.facing) return
    this.facing = f
    const side = f === 'left' || f === 'right'
    const dir = side ? 'side' : f
    this.hair.setTexture(`hair${this.hairStyle}-${dir}`)
    const lying = this.pose === 'lie'
    this.face.setTexture(lying ? 'face-rest' : side ? 'face-side' : 'face-down').setVisible(f !== 'up')
    for (const img of [this.head, this.face, this.hair]) img.setFlipX(f === 'left')
    // seen from the side the legs overlap and only the near arm shows
    this.legs[0].x = (side ? -1.5 : -3.5) * U
    this.legs[1].x = (side ? 1.5 : 3.5) * U
    this.arms[0].setVisible(!side && !lying)
    this.arms[1].x = (side ? 0 : 9) * U
  }

  setPose(p: Pose): void {
    if (p === this.pose) return
    this.pose = p
    this.timeMs = 0
    const lying = p === 'lie'
    this.shadow.setVisible(!lying)
    this.blanket.setVisible(lying)
    for (const leg of this.legs) leg.setVisible(p !== 'sit' && !lying).setRotation(0)
    for (const arm of this.arms) arm.setVisible(!lying).setRotation(0)
    this.body.setVisible(!lying).setScale(1)
    this.upper.y = lying ? LIE_HEAD_Y - HEAD_Y : p === 'sit' ? SIT_DROP_PX : 0
    // re-apply the facing so the face and the near arm follow the pose
    const f = this.facing
    this.facing = null
    if (f) this.setFacing(f)
  }

  update(dtMs: number): void {
    this.timeMs += dtMs
    const t = this.timeMs / 1000
    if (this.pose === 'walk') {
      const s = Math.sin(t * Math.PI * 2 * STEP_HZ)
      this.legs[0].setRotation(s * SWING)
      this.legs[1].setRotation(-s * SWING)
      this.arms[0].setRotation(-s * SWING * 0.8)
      this.arms[1].setRotation(s * SWING * 0.8)
      this.upper.y = -Math.abs(s) * BOB_PX
    } else if (this.pose === 'stand') {
      this.body.setScale(1, 1 + 0.015 * Math.sin(t * Math.PI))
    }
  }
}
