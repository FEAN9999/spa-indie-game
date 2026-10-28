import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { GAME_H, GAME_W } from '../config'
import type { SpaSim } from '../sim/spa'
import { STARTER_GOAL_IDS, starterRunning } from '../sim/starter'
import { t } from '../strings/vi'
import { chainRows, GOAL_ICON } from '../view/starter'
import { textStyle } from '../view/text'
import { addButton, addCard } from '../view/ui'

export interface StarterData {
  sim: SpaSim
  onClose: () => void
}

const ROW_X = 110
const ROW_Y = 400
const ROW_STEP = 112
const ROW_W = 860
const ROW_H = 98
const MARK_R = 30
const BAR_W = 200
const LATER_ALPHA = 0.45
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
/** Scales a text down to fit `w` when it is wider. */
const fit = <T extends Phaser.GameObjects.Text>(text: T, w: number) => text.setScale(Math.min(1, w / text.width))

/** The quest panel before the daily quests: the starter chain, done goals ticked, the current one with its count, later ones faded. */
export class StarterScene extends Phaser.Scene {
  private params!: StarterData

  constructor() {
    super('StarterScene')
  }

  init(data: StarterData) {
    this.params = data
  }

  create() {
    const { sim, onClose } = this.params
    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    addCard(this, 60, 190, 960, 1780)
    fit(this.add.text(GAME_W / 2, 270, t('navQuests'), textStyle(56)).setOrigin(0.5), 860)
    const subtitle = t('starterTitle', { done: Math.min(sim.starter.at, STARTER_GOAL_IDS.length), total: STARTER_GOAL_IDS.length })
    fit(this.add.text(GAME_W / 2, 332, subtitle, textStyle(30, '600', C.soft)).setOrigin(0.5), 860)

    chainRows(sim).forEach((row, i) => {
      const top = ROW_Y + ROW_STEP * i
      const mid = top + ROW_H / 2
      const current = row.state === 'current'
      const parts: (Phaser.GameObjects.Graphics | Phaser.GameObjects.Text | Phaser.GameObjects.Image)[] = []
      parts.push(
        this.add
          .graphics()
          .fillStyle(hex(current ? C.goldPale : C.cream), 1)
          .fillRoundedRect(ROW_X, top, ROW_W, ROW_H, 24)
          .lineStyle(current ? 4 : 3, hex(current ? C.ink : C.tileSeam))
          .strokeRoundedRect(ROW_X, top, ROW_W, ROW_H, 24),
      )
      // a teal tick for a done goal, the flag for the current one, a plain ring for a later one
      const markX = ROW_X + 30 + MARK_R
      const mark = this.add.graphics({ x: markX, y: mid })
      if (row.state === 'done') {
        mark.fillStyle(hex(C.teal), 1).fillCircle(0, 0, MARK_R).lineStyle(4, hex(C.ink)).strokeCircle(0, 0, MARK_R).lineStyle(7, hex(C.paper))
        mark.strokePoints([new Phaser.Math.Vector2(-13, 1), new Phaser.Math.Vector2(-4, 11), new Phaser.Math.Vector2(14, -10)])
        parts.push(mark)
      } else if (current) {
        mark.fillStyle(hex(GOAL_ICON.disc), 1).fillCircle(0, 0, MARK_R).lineStyle(4, hex(C.ink)).strokeCircle(0, 0, MARK_R)
        const flag = this.add.image(markX, mid, GOAL_ICON.texture)
        flag.setScale(40 / Math.max(flag.width, flag.height))
        parts.push(mark, flag)
      } else {
        mark.lineStyle(4, hex(C.tileSeam)).strokeCircle(0, 0, MARK_R)
        parts.push(mark)
      }
      const textX = markX + MARK_R + 24
      // the current goal keeps room on the right for its count and bar
      const textW = ROW_X + ROW_W - 30 - textX - (current && row.need > 1 ? BAR_W + 30 : 0)
      parts.push(fit(this.add.text(textX, mid - 20, row.name, textStyle(36)).setOrigin(0, 0.5), textW))
      parts.push(fit(this.add.text(textX, mid + 24, row.detail, textStyle(26, '600', C.soft)).setOrigin(0, 0.5), textW))
      if (current && row.need > 1) {
        const barX = ROW_X + ROW_W - 30 - BAR_W
        parts.push(this.add.text(barX + BAR_W, mid - 20, `${row.have}/${row.need}`, textStyle(32, '800')).setOrigin(1, 0.5))
        parts.push(
          this.add
            .graphics()
            .fillStyle(hex(C.sand), 1)
            .fillRoundedRect(barX, mid + 14, BAR_W, 20, 10)
            .fillStyle(hex(C.teal), 1)
            .fillRoundedRect(barX, mid + 14, Math.max(20, (BAR_W * row.have) / row.need), 20, 10)
            .lineStyle(3, hex(C.ink))
            .strokeRoundedRect(barX, mid + 14, BAR_W, 20, 10),
        )
      }
      if (row.state === 'later') for (const p of parts) p.setAlpha(LATER_ALPHA)
    })

    // once the chain is done the daily quests start the next morning
    if (!starterRunning(sim.starter)) fit(this.add.text(GAME_W / 2, 1690, t('starterDailyNext'), textStyle(34, '800', C.teal)).setOrigin(0.5), 860)
    addButton(this, GAME_W / 2, 1830, 520, 120, t('done'), 'primary', () => {
      onClose()
      this.scene.stop()
    })
  }
}
