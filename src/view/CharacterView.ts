import * as Phaser from 'phaser'
import { CHIBI_PX, PART_ANCHORS } from '../art/chibi'
import { PANTS, type CharacterColors } from '../art/palette'
import { TILE } from '../config'
import type { CustomerKind } from '../sim/customers'
import type { RegularId } from '../sim/regulars'
import type { VipId } from '../sim/vips'
import type { Facing } from '../sim/types'

export type Pose = 'stand' | 'walk' | 'sit' | 'lie'

const U = CHIBI_PX
const HIP_Y = -11 * U
const BODY_Y = -27 * U
const SHOULDER_Y = -24 * U
const HEAD_Y = -37 * U
const SWING = Phaser.Math.DegToRad(25)
const STEP_HZ = 5 // one full leg cycle is two steps, so 10 steps a second at 5 tiles a second
const BOB_PX = 3
const SIT_DROP_PX = 12
// lying on a bed: the feet origin is the bottom of the bed's middle tile
const BLANKET_TOP = -1.1 * TILE
const LIE_HEAD_Y = -1.45 * TILE

/** From the feet to the top of the hair. */
export const CHARACTER_HEIGHT_PX = 51 * U

/** What each kind of customer wears, untinted, on the body, over the face or on the hair; a piece shows from each side it has a texture for. */
const WORN: Record<CustomerKind, { key: string; on: 'body' | 'face' | 'hair' }[]> = {
  student: [{ key: 'backpack', on: 'body' }],
  office: [{ key: 'tie', on: 'body' }],
  picky: [{ key: 'glasses', on: 'face' }],
  elder: [],
  celeb: [
    { key: 'sunglasses', on: 'face' },
    { key: 'hat', on: 'hair' },
  ],
}

/** What each regular wears in place of their kind's things; the face still comes from the kind. */
const REGULAR_WORN: Record<RegularId, { key: string; on: 'body' | 'face' | 'hair' }[]> = {
  hanh: [{ key: 'redApron', on: 'body' }],
  vy: [{ key: 'artTube', on: 'body' }],
  sau: [{ key: 'helmet', on: 'hair' }],
  khoa: [{ key: 'headphones', on: 'body' }],
  tu: [
    { key: 'goldGlasses', on: 'face' },
    { key: 'silkScarf', on: 'body' },
  ],
  ba: [
    { key: 'readingGlasses', on: 'face' },
    { key: 'paperFan', on: 'body' },
  ],
  thao: [{ key: 'flowerClip', on: 'hair' }],
  lan: [{ key: 'daisies', on: 'body' }],
}

/** What each VIP wears, ahead of the regular's and the kind's; the face still comes from the kind. */
const VIP_WORN: Record<VipId, { key: string; on: 'body' | 'face' | 'hair' }[]> = {
  singer: [
    { key: 'featherBoa', on: 'body' },
    { key: 'micPin', on: 'body' },
  ],
  miss: [
    { key: 'tiara', on: 'hair' },
    { key: 'sash', on: 'body' },
  ],
  star: [
    { key: 'bigShades', on: 'face' },
    { key: 'headscarf', on: 'hair' },
  ],
  chef: [{ key: 'chefHat', on: 'hair' }],
}

/** A chibi built from tinted part textures and animated in code, with its feet at the container origin. */
export class CharacterView {
  readonly container: Phaser.GameObjects.Container
  private readonly upper: Phaser.GameObjects.Container
  private readonly shadow: Phaser.GameObjects.Image
  private readonly blanket: Phaser.GameObjects.Image
  private readonly legs: Phaser.GameObjects.Image[]
  private readonly arms: Phaser.GameObjects.Image[]
  private readonly body: Phaser.GameObjects.Image
  private readonly apron: Phaser.GameObjects.Image | null
  private readonly head: Phaser.GameObjects.Image
  private readonly face: Phaser.GameObjects.Image
  /** The face from the front: a picky customer frowns. */
  private readonly frontFace: string
  private readonly hair: Phaser.GameObjects.Image
  private readonly hairStyle: number
  /** What the kind, the regular or the VIP wears, each with its key without the side. */
  private readonly worn = new Map<Phaser.GameObjects.Image, string>()
  /** The pieces worn on the body, which breathe with it. */
  private readonly bodyWorn: Phaser.GameObjects.Image[]
  private readonly mask: Phaser.GameObjects.Image
  private masked = false
  /** Round the head in place of the hair, in the mud tub. */
  private readonly towel: Phaser.GameObjects.Image
  private towelled = false
  /** Each tinted part's untinted brown outline, drawn on top and kept in step by syncLines. */
  private readonly lines = new Map<Phaser.GameObjects.Image, Phaser.GameObjects.Image>()
  private facing: Facing | null = null
  private pose: Pose = 'stand'
  private timeMs = 0

  constructor(scene: Phaser.Scene, colors: CharacterColors) {
    const part = (key: string, x: number, y: number, tint?: number) => {
      const img = scene.add.image(x, y, key).setOrigin(PART_ANCHORS[key].ox, PART_ANCHORS[key].oy)
      if (tint !== undefined) {
        img.setTint(tint)
        this.lines.set(img, scene.add.image(x, y, `${key}-line`).setOrigin(PART_ANCHORS[key].ox, PART_ANCHORS[key].oy))
      }
      return img
    }
    // each tinted part followed by its outline
    const withLines = (imgs: Phaser.GameObjects.Image[]) => imgs.flatMap(img => [img, ...(this.lines.has(img) ? [this.lines.get(img)!] : [])])
    this.hairStyle = colors.hairStyle
    const wear = (on: 'body' | 'face' | 'hair') =>
      (colors.vip ? VIP_WORN[colors.vip] : colors.regular ? REGULAR_WORN[colors.regular] : colors.kind ? WORN[colors.kind] : [])
        .filter(w => w.on === on)
        .map(w => {
          const img = part(`${w.key}-down`, 0, on === 'body' ? BODY_Y : HEAD_Y)
          this.worn.set(img, w.key)
          return img
        })
    this.shadow = scene.add.image(0, 0, 'shadow')
    this.legs = [part('leg', -3.5 * U, HIP_Y, PANTS), part('leg', 3.5 * U, HIP_Y, PANTS)]
    this.body = part('body', 0, BODY_Y, colors.shirt)
    this.apron = colors.apron ? part('apron-down', 0, BODY_Y) : null
    this.bodyWorn = wear('body')
    this.arms = [part('arm', -9 * U, SHOULDER_Y, colors.skin), part('arm', 9 * U, SHOULDER_Y, colors.skin)]
    this.head = part('head', 0, HEAD_Y, colors.skin)
    this.frontFace = colors.kind === 'picky' ? 'face-frown' : 'face-down'
    this.face = part(this.frontFace, 0, HEAD_Y)
    this.mask = part('mask-face', 0, HEAD_Y).setVisible(false)
    const onFace = wear('face')
    this.hair = part(`hair${colors.hairStyle}-down`, 0, HEAD_Y, colors.hair)
    const onHair = wear('hair')
    this.towel = part('towel-wrap', 0, HEAD_Y).setVisible(false)
    this.upper = scene.add.container(
      0,
      0,
      withLines([this.body, ...(this.apron ? [this.apron] : []), ...this.bodyWorn, ...this.arms, this.head, this.face, this.mask, ...onFace, this.hair, ...onHair, this.towel]),
    )
    this.blanket = part('blanket', 0, BLANKET_TOP).setVisible(false)
    this.container = scene.add.container(0, 0, [this.shadow, ...withLines(this.legs), this.blanket, this.upper])
    this.setFacing('down')
  }

  /** Copies each tinted part's texture, place, turn, flip and visibility to its outline. */
  private syncLines(): void {
    for (const [fill, line] of this.lines) {
      const key = `${fill.texture.key}-line`
      if (line.texture.key !== key) line.setTexture(key)
      line.setPosition(fill.x, fill.y).setRotation(fill.rotation).setScale(fill.scaleX, fill.scaleY).setFlipX(fill.flipX).setVisible(fill.visible)
    }
  }

  setFacing(f: Facing): void {
    if (f === this.facing) return
    this.facing = f
    const side = f === 'left' || f === 'right'
    const dir = side ? 'side' : f
    this.hair.setTexture(`hair${this.hairStyle}-${dir}`)
    const lying = this.pose === 'lie'
    this.face.setTexture(lying ? 'face-rest' : side ? 'face-side' : this.frontFace).setVisible(f !== 'up')
    for (const img of [this.head, this.face, this.hair]) img.setFlipX(f === 'left')
    // seen from the side the legs overlap and only the near arm shows
    this.legs[0].x = (side ? -1.5 : -3.5) * U
    this.legs[1].x = (side ? 1.5 : 3.5) * U
    this.arms[0].setVisible(!side && !lying)
    this.arms[1].x = (side ? 0 : 9) * U
    // the apron shows its front or its side, and hides from behind and with the body
    this.apron?.setTexture(`apron-${side ? 'side' : 'down'}`).setFlipX(f === 'left').setVisible(f !== 'up' && this.body.visible)
    // what the kind, the regular or the VIP wears comes off on the bed
    for (const [img, key] of this.worn) {
      const tex = `${key}-${dir}`
      const shown = !lying && tex in PART_ANCHORS
      if (shown) img.setTexture(tex).setOrigin(PART_ANCHORS[tex].ox, PART_ANCHORS[tex].oy)
      img.setFlipX(f === 'left').setVisible(shown)
    }
    this.mask.setVisible(this.masked && lying && f !== 'up')
    this.syncLines()
  }

  /** Shows the face mask while lying face up. */
  setMask(on: boolean): void {
    if (on === this.masked) return
    this.masked = on
    this.mask.setVisible(on && this.pose === 'lie' && this.facing !== 'up')
  }

  /** In the mud tub, while lying, only the face and the towel round the head show: the blanket and the hair go. */
  setTowel(on: boolean): void {
    if (on === this.towelled) return
    this.towelled = on
    this.wrapTowel()
    this.syncLines()
  }

  /** Swaps the hair and the blanket for the towel while towelled and lying; what is worn on the hair is already off while lying. */
  private wrapTowel(): void {
    const lying = this.pose === 'lie'
    this.towel.setVisible(this.towelled && lying)
    this.hair.setVisible(!(this.towelled && lying))
    this.blanket.setVisible(lying && !this.towelled)
  }

  setPose(p: Pose): void {
    if (p === this.pose) return
    this.pose = p
    this.timeMs = 0
    const lying = p === 'lie'
    this.shadow.setVisible(!lying)
    this.wrapTowel()
    for (const leg of this.legs) leg.setVisible(p !== 'sit' && !lying).setRotation(0)
    for (const arm of this.arms) arm.setVisible(!lying).setRotation(0)
    this.body.setVisible(!lying).setScale(1)
    this.apron?.setScale(1)
    for (const img of this.bodyWorn) img.setScale(1)
    this.upper.y = lying ? LIE_HEAD_Y - HEAD_Y : p === 'sit' ? SIT_DROP_PX : 0
    // re-apply the facing so the face and the near arm follow the pose
    const f = this.facing
    this.facing = null
    if (f) this.setFacing(f)
    this.syncLines()
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
      const breath = 1 + 0.015 * Math.sin(t * Math.PI)
      this.body.setScale(1, breath)
      this.apron?.setScale(1, breath)
      for (const img of this.bodyWorn) img.setScale(1, breath)
    }
    this.syncLines()
  }
}
