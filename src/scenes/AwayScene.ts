import * as Phaser from 'phaser'
import { C, ownerColors, staffColors, type CharacterColors } from '../art/palette'
import { sound } from '../audio/engine'
import { GAME_H, GAME_W } from '../config'
import type { AwayResult } from '../sim/away'
import type { SpaSim } from '../sim/spa'
import { formatMoney } from '../strings/format'
import { t } from '../strings/vi'
import { CharacterView } from '../view/CharacterView'
import { awayLines, awayTime } from '../view/away'
import { textStyle } from '../view/text'
import { addButton } from '../view/ui'

export interface AwayData {
  sim: SpaSim
  back: AwayResult
  onDone: () => void
}

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const MID = GAME_W / 2
const CARD_Y = 330

/** The two figures: the receptionist on the left, a technician on the right; a missing one is filled by other staff, then the owner, nobody twice. */
function figures(sim: SpaSim): CharacterColors[] {
  const crew = sim.staff.filter(s => !s.leaving)
  const reception = crew.find(s => s.role === 'receptionist')
  const technician = crew.find(s => s.role === 'technician')
  const spare = crew.filter(s => s !== reception && s !== technician)
  const people = [reception, technician].map(s => s ?? spare.shift())
  let owner = true
  const colors: CharacterColors[] = []
  for (const s of people) {
    if (s) colors.push(staffColors(s.look))
    else if (owner) {
      owner = false
      colors.push(ownerColors(sim.ownerLook, sim.ownerOutfit))
    }
  }
  return colors
}

/** The "Chủ tiệm về rồi" card: what the staff earned while the shop was closed. */
export class AwayScene extends Phaser.Scene {
  private params!: AwayData
  private views: CharacterView[] = []

  constructor() {
    super('AwayScene')
  }

  init(data: AwayData) {
    this.params = data
    this.views = []
  }

  create() {
    const { sim, back, onDone } = this.params
    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    const card = this.add.graphics()
    this.add.text(MID, 410, t('awayKicker'), textStyle(34, '800', C.terracotta)).setOrigin(0.5)
    this.add.text(MID, 480, t('awayTitle', { time: awayTime(back.ms) }), textStyle(60, '800')).setOrigin(0.5)
    this.add.ellipse(MID, 800, 600, 92, hex(C.sand))
    figures(sim).forEach((colors, i) => {
      const view = new CharacterView(this, colors)
      view.container.setPosition(i === 0 ? 400 : 680, 800).setScale(2.3)
      this.views.push(view)
    })
    this.add.circle(MID, 690, 58, hex(C.mustard)).setStrokeStyle(5, hex(C.ink))
    const coins = this.add.image(MID, 692, 'badge-coins').setTint(hex(C.ink))
    coins.setScale(70 / Math.max(coins.width, coins.height))
    this.add.text(MID, 900, t('awayEarned'), textStyle(36, '800', C.soft)).setOrigin(0.5)
    this.add.text(MID, 975, t('awayAmount', { money: formatMoney(back.paid) }), textStyle(72, '800', C.mustardDark)).setOrigin(0.5)
    let y = 1080
    for (const line of awayLines(back)) {
      const text = this.add.text(MID, y, line, { ...textStyle(31, '600', C.soft), align: 'center', wordWrap: { width: 740 } }).setOrigin(0.5, 0)
      y += text.height + 14
    }
    const h = y + 200 - CARD_Y
    card.fillStyle(hex(C.paper), 1).fillRoundedRect(90, CARD_Y, 900, h, 60).lineStyle(5, hex(C.ink)).strokeRoundedRect(90, CARD_Y, 900, h, 60).setDepth(-1)
    // stop first: the callback may open another card, and a stop queued after that would kill it
    addButton(this, MID, y + 80, 560, 130, t('awayTake'), 'primary', () => {
      this.scene.stop()
      onDone()
    }, 50)
    sound.play('levelUp')
  }

  update(_time: number, delta: number) {
    for (const v of this.views) v.update(delta)
  }
}
