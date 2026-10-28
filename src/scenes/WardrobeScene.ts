import * as Phaser from 'phaser'
import { C, ownerColors } from '../art/palette'
import { sound } from '../audio/engine'
import { GAME_H, GAME_W } from '../config'
import { OUTFIT_IDS, type OutfitId } from '../sim/outfits'
import type { SpaSim } from '../sim/spa'
import { t } from '../strings/vi'
import { CharacterView } from '../view/CharacterView'
import { OUTFIT_NAME, outfitStatus, outfitTileTag, wardrobeHead } from '../view/outfits'
import { textStyle } from '../view/text'
import { addButton, addCard } from '../view/ui'

export interface WardrobeData {
  sim: SpaSim
  /** Puts the outfit on the owner; the wardrobe then draws itself again. */
  onWear: (id: OutfitId) => void
  onClose: () => void
}

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const MID = GAME_W / 2
const TITLE_Y = 225
const HEAD_Y = 290
const PREVIEW_Y = 795
const PREVIEW_SCALE = 2.85
const SHADOW_Y = 785
const NAME_Y = 850
const STATUS_Y = 898
const LOCKED_ALPHA = 0.45
const TILE_W = 290
const TILE_H = 300
const TILE_GAP = 16
const TILES_X = MID - (3 * TILE_W + 2 * TILE_GAP) / 2
const TILES_Y = 945
const TILE_FIGURE_DY = 200
const TILE_FIGURE_SCALE = 1.15
const TILE_FIGURE_LOCKED_ALPHA = 0.38
const TILE_NAME_DY = 214
const TILE_NAME_WRAP = 260
const BUTTON_Y = 1955
const BUTTON_H = 120
const DASH_ON = 14
const DASH_OFF = 10

/** Draws a rounded rectangle's edge as dashes, as Phaser has no dashed line. */
function dashedRoundRect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, r: number, width: number, color: number): void {
  const pts: Phaser.Math.Vector2[] = []
  const corner = (cx: number, cy: number, from: number) => {
    for (let i = 0; i <= 6; i++) {
      const a = from + (i * Math.PI) / 12
      pts.push(new Phaser.Math.Vector2(cx + r * Math.cos(a), cy + r * Math.sin(a)))
    }
  }
  corner(x + w - r, y + r, -Math.PI / 2)
  corner(x + w - r, y + h - r, 0)
  corner(x + r, y + h - r, Math.PI / 2)
  corner(x + r, y + r, Math.PI)
  pts.push(pts[0])
  g.lineStyle(width, color)
  let phase = 0
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]
    const b = pts[i + 1]
    const len = Phaser.Math.Distance.BetweenPoints(a, b)
    let at = 0
    while (at < len) {
      const step = Math.min(phase < DASH_ON ? DASH_ON - phase : DASH_ON + DASH_OFF - phase, len - at)
      if (phase < DASH_ON) g.lineBetween(a.x + ((b.x - a.x) * at) / len, a.y + ((b.y - a.y) * at) / len, a.x + ((b.x - a.x) * (at + step)) / len, a.y + ((b.y - a.y) * (at + step)) / len)
      at += step
      phase = (phase + step) % (DASH_ON + DASH_OFF)
    }
  }
}

/**
 * The wardrobe: the nine outfits on the owner, a big preview of the picked one, and a button to wear it.
 * It opens over the quest panel or the owner card, swallows their taps, and gives them back on Xong.
 */
export class WardrobeScene extends Phaser.Scene {
  private params!: WardrobeData
  private picked: OutfitId = 'baba'
  /** Everything drawn for the cover on screen, destroyed when it is redrawn. */
  private shown: Phaser.GameObjects.GameObject[] = []
  private preview: CharacterView | null = null

  constructor() {
    super('WardrobeScene')
  }

  init(data: WardrobeData) {
    this.params = data
    this.picked = data.sim.ownerOutfit
    this.shown = []
    this.preview = null
  }

  create() {
    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    this.show()
  }

  update(_time: number, delta: number) {
    this.preview?.update(delta)
  }

  private keep<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.shown.push(obj)
    return obj
  }

  /** The owner in outfit `id` at x, y (the feet). */
  private figure(id: OutfitId, x: number, y: number, scale: number, alpha: number): CharacterView {
    const view = new CharacterView(this, ownerColors(this.params.sim.ownerLook, id))
    view.container.setPosition(x, y).setScale(scale).setAlpha(alpha)
    this.keep(view.container)
    return view
  }

  /** Draws the whole cover again. */
  private show(): void {
    for (const obj of this.shown) obj.destroy()
    this.shown = []
    const { sim } = this.params
    const unlocked = sim.unlockedOutfits()
    const badges = Object.keys(sim.badges).length
    const worn = sim.ownerOutfit
    const picked = this.picked
    const can = unlocked.includes(picked)

    this.keep(addCard(this, 50, 150, 980, 1900))
    this.keep(this.add.text(MID, TITLE_Y, t('wardrobe'), textStyle(60)).setOrigin(0.5))
    this.keep(this.add.text(MID, HEAD_Y, wardrobeHead(badges, unlocked.length), textStyle(30, '600', C.soft)).setOrigin(0.5))

    this.keep(this.add.ellipse(MID, SHADOW_Y, 400, 80, hex(C.sand)))
    this.preview = this.figure(picked, MID, PREVIEW_Y, PREVIEW_SCALE, can ? 1 : LOCKED_ALPHA)
    this.keep(this.add.text(MID, NAME_Y, t(OUTFIT_NAME[picked]), textStyle(42)).setOrigin(0.5))
    const status = outfitStatus(picked, worn, unlocked, badges)
    this.keep(this.add.text(MID, STATUS_Y, status.text, textStyle(30, '800', status.ok ? C.teal : C.terracotta)).setOrigin(0.5))

    OUTFIT_IDS.forEach((id, i) => {
      const tx = TILES_X + (i % 3) * (TILE_W + TILE_GAP)
      const ty = TILES_Y + Math.floor(i / 3) * (TILE_H + TILE_GAP)
      const open = unlocked.includes(id)
      const isPicked = id === picked
      const g = this.keep(this.add.graphics())
      g.fillStyle(hex(open ? C.cream : C.sand), 1).fillRoundedRect(tx, ty, TILE_W, TILE_H, 32)
      const edge = hex(isPicked ? C.teal : C.ink)
      const edgeW = isPicked ? 9 : 3
      if (open) g.lineStyle(edgeW, edge).strokeRoundedRect(tx, ty, TILE_W, TILE_H, 32)
      else dashedRoundRect(g, tx, ty, TILE_W, TILE_H, 32, edgeW, edge)

      this.figure(id, tx + TILE_W / 2, ty + TILE_FIGURE_DY, TILE_FIGURE_SCALE, open ? 1 : TILE_FIGURE_LOCKED_ALPHA)
      this.keep(
        this.add
          .text(tx + TILE_W / 2, ty + TILE_NAME_DY, t(OUTFIT_NAME[id]), { ...textStyle(24, '800', open ? C.ink : C.soft), align: 'center', wordWrap: { width: TILE_NAME_WRAP } })
          .setOrigin(0.5, 0),
      )
      if (!open) {
        this.keep(this.add.circle(tx + TILE_W - 44, ty + 44, 30, hex(C.paper)).setStrokeStyle(3, hex(C.ink)))
        this.keep(this.add.image(tx + TILE_W - 44, ty + 46, 'icon-lock').setScale(0.62))
        this.keep(this.add.text(tx + 22, ty + 40, outfitTileTag(id) ?? '', textStyle(24, '800', C.terracotta)).setOrigin(0, 0.5))
      } else if (id === worn) {
        this.keep(this.add.circle(tx + TILE_W - 44, ty + 44, 28, hex(C.teal)).setStrokeStyle(3, hex(C.ink)))
        this.keep(
          this.add
            .graphics()
            .lineStyle(6, hex(C.paper))
            .beginPath()
            .moveTo(tx + TILE_W - 56, ty + 44)
            .lineTo(tx + TILE_W - 47, ty + 53)
            .lineTo(tx + TILE_W - 31, ty + 35)
            .strokePath(),
        )
      }
      this.keep(this.add.zone(tx + TILE_W / 2, ty + TILE_H / 2, TILE_W, TILE_H).setInteractive()).on('pointerup', () => {
        sound.play('tap')
        this.picked = id
        this.show()
      })
    })

    this.keep(addButton(this, 300, BUTTON_Y, 380, BUTTON_H, t('done'), 'plain', () => this.close(), 46))
    if (can && picked !== worn) {
      this.keep(
        addButton(
          this,
          760,
          BUTTON_Y,
          420,
          BUTTON_H,
          t('wearOutfit'),
          'primary',
          () => {
            this.params.onWear(picked)
            this.show()
          },
          46,
        ),
      )
    } else this.keep(this.inertButton(760, BUTTON_Y, 420, BUTTON_H, t('wearOutfit'), 46))
  }

  /** A button that does nothing: sand with a soft edge, for an outfit that is locked or already worn. */
  private inertButton(x: number, y: number, w: number, h: number, label: string, size: number): Phaser.GameObjects.Container {
    const bg = this.add.graphics().fillStyle(hex(C.sand), 1).fillRoundedRect(-w / 2, -h / 2, w, h, h / 2).lineStyle(4, hex(C.soft)).strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2)
    const text = this.add.text(0, 0, label, textStyle(size, '800', C.soft)).setOrigin(0.5)
    return this.add.container(x, y, [bg, text])
  }

  private close(): void {
    this.params.onClose()
    this.scene.stop()
  }
}
