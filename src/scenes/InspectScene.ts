import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { sound } from '../audio/engine'
import { GAME_H, GAME_W, INSPECT_MIN } from '../config'
import { clockLabel } from '../sim/clock'
import type { SimEvent } from '../sim/types'
import { t } from '../strings/vi'
import { EVENT_ICON, inspectResult, inspectRows } from '../view/events'
import { textStyle } from '../view/text'
import { addButton, addCard } from '../view/ui'

export interface InspectData {
  result: Extract<SimEvent, { type: 'inspected' }>
  onDone: () => void
}

const ROW_X = 140
const ROW_Y = 830
const ROW_STEP = 140
const ROW_W = 800
const ROW_H = 116
const MARK_MS = 450
const RESULT_MS = 1800
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
/** Scales a text down to fit `w` when it is wider. */
const fit = (text: Phaser.GameObjects.Text, w: number) => text.setScale(Math.min(1, w / text.width))

/** The inspection card: the three checks tick or cross one by one, then the outcome and Xong. */
export class InspectScene extends Phaser.Scene {
  private params!: InspectData

  constructor() {
    super('InspectScene')
  }

  init(data: InspectData) {
    this.params = data
  }

  create() {
    const { result, onDone } = this.params
    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    addCard(this, 90, 400, 900, 1120)
    this.add.circle(GAME_W / 2, 520, 70, hex(EVENT_ICON.inspect.disc)).setStrokeStyle(5, hex(C.ink))
    const clip = this.add.image(GAME_W / 2, 520, EVENT_ICON.inspect.texture)
    clip.setScale(96 / Math.max(clip.width, clip.height))
    fit(this.add.text(GAME_W / 2, 650, t('inspectTitle'), textStyle(56)).setOrigin(0.5), 820)
    fit(this.add.text(GAME_W / 2, 712, t('inspectSub', { time: clockLabel(INSPECT_MIN) }), textStyle(30, '600', C.soft)).setOrigin(0.5), 820)

    inspectRows(result).forEach((row, i) => {
      const top = ROW_Y + ROW_STEP * i
      const mid = top + ROW_H / 2
      this.add
        .graphics()
        .fillStyle(hex(C.cream), 1)
        .fillRoundedRect(ROW_X, top, ROW_W, ROW_H, 24)
        .lineStyle(3, hex(C.tileSeam))
        .strokeRoundedRect(ROW_X, top, ROW_W, ROW_H, 24)
      fit(this.add.text(ROW_X + 30, mid - 22, row.name, textStyle(38)).setOrigin(0, 0.5), 620)
      fit(this.add.text(ROW_X + 30, mid + 24, row.detail, textStyle(30, '600', C.soft)).setOrigin(0, 0.5), 620)
      // a teal tick or a terracotta cross, one row after the other
      const markX = ROW_X + ROW_W - 70
      const mark = this.add
        .graphics({ x: markX, y: mid })
        .fillStyle(hex(row.ok ? C.teal : C.terracotta), 1)
        .fillCircle(0, 0, 38)
        .lineStyle(4, hex(C.ink))
        .strokeCircle(0, 0, 38)
        .lineStyle(8, hex(C.paper))
      if (row.ok) mark.strokePoints([new Phaser.Math.Vector2(-16, 1), new Phaser.Math.Vector2(-5, 13), new Phaser.Math.Vector2(17, -12)])
      else mark.lineBetween(-13, -13, 13, 13).lineBetween(-13, 13, 13, -13)
      mark.setScale(0).setAlpha(0)
      this.tweens.add({ targets: mark, scale: 1, alpha: 1, delay: MARK_MS * (i + 1), duration: 220, ease: 'Back.easeOut', onStart: () => sound.play('tap') })
    })

    const outcome = inspectResult(result)
    this.time.delayedCall(RESULT_MS, () => {
      if (outcome.ok) sound.play('levelUp')
      fit(this.add.text(GAME_W / 2, 1260, outcome.head, textStyle(50, '800', outcome.ok ? C.teal : C.terracotta)).setOrigin(0.5), 820)
      fit(this.add.text(GAME_W / 2, 1318, outcome.line, textStyle(30, '600', C.soft)).setOrigin(0.5), 820)
      addButton(this, GAME_W / 2, 1430, 520, 120, t('inspectDone'), 'primary', () => {
        onDone()
        this.scene.stop()
      })
    })
  }
}
