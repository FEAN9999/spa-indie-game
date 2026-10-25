import * as Phaser from 'phaser'
import { C } from '../art/palette'
import { GAME_H, GAME_W } from '../config'
import { decodeSaveCode, encodeSaveCode } from '../save/code'
import type { SaveSession } from '../save/session'
import { SLOTS, type SaveStore, type SlotId } from '../save/store'
import type { SaveData } from '../sim/save'
import type { SpaSim } from '../sim/spa'
import { formatMoney } from '../strings/format'
import { t } from '../strings/vi'
import { codeBox, copyText, type CodeBox } from '../view/dom'
import { textStyle } from '../view/text'
import { addButton, addCard } from '../view/ui'

export type PausePanel = 'menu' | 'install'

export interface PauseData {
  sim: SpaSim
  store: SaveStore
  session: SaveSession
  panel: PausePanel
  onResume: () => void
}

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const CARD_X = 90
const CARD_W = 900
const CARD_TOP = 380
const MID = GAME_W / 2
const ROW_W = 720
const ROW_H = 120
const ROW_STEP = 144

/** The pause card over the frozen spa, with save slots and save codes. Taps on the dimmed backdrop do nothing. */
export class PauseScene extends Phaser.Scene {
  private params!: PauseData
  /** Everything drawn for the panel on screen, destroyed when the panel changes. */
  private shown: Phaser.GameObjects.GameObject[] = []

  constructor() {
    super('PauseScene')
  }

  init(data: PauseData) {
    this.params = data
    this.shown = []
  }

  create() {
    // below the card, which each panel draws at depth -1 once it knows its height
    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive().setDepth(-2)
    this.showMenu()
  }

  private keep<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.shown.push(obj)
    return obj
  }

  private clear(): void {
    for (const obj of this.shown) obj.destroy()
    this.shown = []
  }

  /** A card from CARD_TOP down to `bottom`, drawn under the panel's content. */
  private card(bottom: number): void {
    this.keep(addCard(this, CARD_X, CARD_TOP, CARD_W, bottom - CARD_TOP)).setDepth(-1)
  }

  private title(text: string): void {
    this.keep(this.add.text(MID, CARD_TOP + 120, text, textStyle(72)).setOrigin(0.5))
  }

  private note(y: number, text: string, color: string = C.ink): Phaser.GameObjects.Text {
    return this.keep(this.add.text(MID, y, text, { ...textStyle(38, '600', color), align: 'center', wordWrap: { width: ROW_W } }).setOrigin(0.5, 0))
  }

  private button(y: number, label: string, kind: 'primary' | 'plain', onTap: () => void, h = ROW_H): void {
    this.keep(addButton(this, MID, y, ROW_W, h, label, kind, onTap))
  }

  private showMenu(): void {
    this.clear()
    const { store, session } = this.params
    this.title(t('paused'))
    this.button(CARD_TOP + 280, t('resume'), 'primary', () => this.resume(), 150)
    this.keep(this.add.text(MID, CARD_TOP + 435, t('saveSlots'), textStyle(44, '600')).setOrigin(0.5))
    let y = CARD_TOP + 540
    for (const slot of SLOTS) {
      this.slotRow(slot, y, slot === session.slot, store)
      y += ROW_STEP
    }
    y += 20
    this.button(y, t('exportSave'), 'plain', () => this.showExport())
    y += ROW_STEP
    this.button(y, t('importSave'), 'plain', () => this.showImport())
    this.card(y + ROW_H / 2 + 70)
  }

  private slotRow(slot: SlotId, y: number, playing: boolean, store: SaveStore): void {
    const left = MID - ROW_W / 2
    this.keep(this.add.graphics())
      .fillStyle(hex(C.cream), 1)
      .fillRoundedRect(left, y - ROW_H / 2, ROW_W, ROW_H, ROW_H / 2)
      .lineStyle(playing ? 6 : 4, hex(playing ? C.teal : C.ink))
      .strokeRoundedRect(left, y - ROW_H / 2, ROW_W, ROW_H, ROW_H / 2)
    this.keep(this.add.text(left + 50, y, t(playing ? 'slotPlaying' : 'slotName', { n: slot }), textStyle(40)).setOrigin(0, 0.5))
    if (playing) return
    const info = store.info(slot)
    const detail = info ? t('slotDetail', { day: info.day, money: formatMoney(info.money) }) : t('slotEmpty')
    this.keep(this.add.text(left + ROW_W - 50, y, detail, textStyle(36, '600')).setOrigin(1, 0.5))
    const zone = this.keep(this.add.zone(MID, y, ROW_W, ROW_H).setInteractive())
    zone.on('pointerup', () => this.params.session.switchTo(slot))
  }

  private showExport(): void {
    this.clear()
    this.title(t('exportSave'))
    this.note(CARD_TOP + 200, t('exportHint'))
    const box = codeBox(this, MID, CARD_TOP + 360, {
      readonly: true,
      button: t('copy'),
      onButton: async b => {
        if (await copyText(b.textarea.value, b.textarea)) b.button.textContent = t('copied')
      },
    })
    this.keep(box.dom)
    encodeSaveCode(this.params.sim.toSave()).then(code => (box.textarea.value = code))
    this.button(CARD_TOP + 920, t('back'), 'plain', () => this.showMenu())
    this.card(CARD_TOP + 1050)
  }

  private showImport(): void {
    this.clear()
    this.title(t('importSave'))
    this.note(CARD_TOP + 200, t('importHint'))
    const error = this.note(CARD_TOP + 750, '', C.lantern)
    const box = codeBox(this, MID, CARD_TOP + 260, {
      readonly: false,
      button: t('importIntoSlot'),
      onButton: async b => {
        try {
          const data = await decodeSaveCode(b.textarea.value)
          error.setText('')
          this.confirmImport(data, b)
        } catch {
          error.setText(t('badCode'))
        }
      },
    })
    this.keep(box.dom)
    this.button(CARD_TOP + 880, t('back'), 'plain', () => this.showMenu())
    this.card(CARD_TOP + 1010)
  }

  private confirmImport(data: SaveData, box: CodeBox): void {
    // the text box sits above the canvas, so hide it while the confirm card is up
    box.dom.setVisible(false)
    const parts: Phaser.GameObjects.GameObject[] = []
    const close = () => {
      for (const p of parts) p.destroy()
      box.dom.setVisible(true)
    }
    parts.push(this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.4).setOrigin(0).setInteractive().setDepth(10))
    parts.push(addCard(this, CARD_X, 800, CARD_W, 560).setDepth(10))
    const { session, sim } = this.params
    const text = t('importConfirm', { n: session.slot, day: sim.day })
    parts.push(this.add.text(MID, 900, text, { ...textStyle(44, '600'), align: 'center', wordWrap: { width: ROW_W } }).setOrigin(0.5, 0).setDepth(10))
    parts.push(addButton(this, MID - 190, 1230, 340, ROW_H, t('cancel'), 'plain', close).setDepth(10))
    parts.push(addButton(this, MID + 190, 1230, 340, ROW_H, t('replace'), 'primary', () => session.replaceWith(data)).setDepth(10))
    this.shown.push(...parts)
  }

  private resume(): void {
    this.params.onResume()
    this.scene.stop()
  }
}
