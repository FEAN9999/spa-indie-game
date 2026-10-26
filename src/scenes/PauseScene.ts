import * as Phaser from 'phaser'
import { canPromptInstall, currentInstallEnv, inSafari, installPlatform, promptInstall } from '../app/install'
import { C } from '../art/palette'
import { sound } from '../audio/engine'
import { GAME_H, GAME_W } from '../config'
import { decodeSaveCode, encodeSaveCode } from '../save/code'
import type { SaveSession } from '../save/session'
import { SLOTS, type SaveStore, type SlotId } from '../save/store'
import type { SaveData } from '../sim/save'
import type { SpaSim } from '../sim/spa'
import { formatMoney } from '../strings/format'
import { t } from '../strings/vi'
import { codeBox, copyText, domButton, type CodeBox } from '../view/dom'
import { textStyle } from '../view/text'
import { addButton, addCard } from '../view/ui'

export type PausePanel = 'menu' | 'install'

export interface PauseData {
  sim: SpaSim
  store: SaveStore
  session: SaveSession
  panel: PausePanel
  onResume: () => void
  onEditProfile: () => void
}

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const CARD_X = 90
const CARD_W = 900
const CARD_TOP = 380
const MID = GAME_W / 2
const ROW_W = 720
const ROW_H = 120
const ROW_STEP = 144

/** Shrinks `text` to `width` when it is wider. */
const fitWidth = (text: Phaser.GameObjects.Text, width: number) => {
  if (text.width > width) text.setScale(width / text.width)
}

/** The pause card over the frozen spa: save slots, save codes and the install steps. Taps on the dimmed backdrop do nothing. */
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
    if (this.params.panel === 'install') this.showInstall()
    else this.showMenu()
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

  /** The shop name over "paused", on the menu only. */
  private header(): void {
    const name = this.keep(this.add.text(MID, CARD_TOP + 80, this.params.sim.shopName, textStyle(64, '800')).setOrigin(0.5))
    fitWidth(name, 780)
    this.keep(this.add.text(MID, CARD_TOP + 150, t('paused'), textStyle(40, '600')).setOrigin(0.5))
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
    this.header()
    this.button(CARD_TOP + 280, t('resume'), 'primary', () => this.resume(), 150)
    this.toggle(MID - 185, 'soundMusic', sound.prefs.music, () => sound.setMusic(!sound.prefs.music))
    this.toggle(MID + 185, 'soundSfx', sound.prefs.sfx, () => sound.setSfx(!sound.prefs.sfx))
    this.keep(this.add.text(MID, CARD_TOP + 579, t('saveSlots'), textStyle(44, '600')).setOrigin(0.5))
    let y = CARD_TOP + 684
    for (const slot of SLOTS) {
      this.slotRow(slot, y, slot === session.slot, store)
      y += ROW_STEP
    }
    y += 20
    this.button(y, t('exportSave'), 'plain', () => this.showExport())
    y += ROW_STEP
    this.button(y, t('importSave'), 'plain', () => this.showImport())
    y += ROW_STEP
    this.button(y, t('profileTitle'), 'plain', () => {
      this.scene.stop()
      this.params.onEditProfile()
    })
    if (installPlatform(currentInstallEnv())) {
      y += ROW_STEP
      this.button(y, t('installMenu'), 'plain', () => this.showInstall())
    }
    this.card(y + ROW_H / 2 + 70)
  }

  /** One of the two sound switches under "Chơi tiếp": teal while on, cream while off. */
  private toggle(x: number, name: 'soundMusic' | 'soundSfx', on: boolean, flip: () => void): void {
    const label = t(on ? 'soundOn' : 'soundOff', { name: t(name) })
    this.keep(
      addButton(this, x, CARD_TOP + 450, 350, ROW_H, label, on ? 'primary' : 'plain', () => {
        flip()
        this.showMenu()
      }, 36),
    )
  }

  private slotRow(slot: SlotId, y: number, playing: boolean, store: SaveStore): void {
    const left = MID - ROW_W / 2
    this.keep(this.add.graphics())
      .fillStyle(hex(C.cream), 1)
      .fillRoundedRect(left, y - ROW_H / 2, ROW_W, ROW_H, ROW_H / 2)
      .lineStyle(playing ? 6 : 4, hex(playing ? C.teal : C.ink))
      .strokeRoundedRect(left, y - ROW_H / 2, ROW_W, ROW_H, ROW_H / 2)
    const info = playing ? null : store.info(slot)
    const name = playing ? this.params.sim.shopName : info?.name
    const first = this.keep(this.add.text(left + 50, y - 22, name ?? t('slotEmpty'), textStyle(40, '800')).setOrigin(0, 0.5))
    fitWidth(first, 620)
    const second = playing ? t('slotPlaying', { n: slot }) : info ? t('slotSummary', { n: slot, day: info.day, money: formatMoney(info.money) }) : t('slotName', { n: slot })
    this.keep(this.add.text(left + 50, y + 28, second, textStyle(32, '600')).setOrigin(0, 0.5))
    if (playing) return
    const zone = this.keep(this.add.zone(MID, y, ROW_W, ROW_H).setInteractive())
    zone.on('pointerup', () => {
      sound.play('tap')
      this.params.session.switchTo(slot)
    })
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

  /** How to put the game on the home screen. On iOS the app gets its own storage, so a shop past day 1 is carried over by save code. */
  private showInstall(): void {
    this.clear()
    const { sim } = this.params
    const heading = this.keep(
      // sized to break into two even lines
      this.add.text(MID, CARD_TOP + 90, t('installTitle'), { ...textStyle(52), align: 'center', wordWrap: { width: 780 } }).setOrigin(0.5, 0),
    )
    let y = heading.y + heading.height + 60
    let n = 1
    const env = currentInstallEnv()
    if (installPlatform(env) === 'ios') {
      const carry = sim.day > 1
      const safari = inSafari(env.ua)
      if (carry) {
        y = this.step(n++, y, t(safari ? 'installCopyFirst' : 'installKeepCode'))
        // encoded ahead, so the copy runs straight from the tap as Safari requires
        let code = ''
        encodeSaveCode(sim.toSave()).then(c => (code = c))
        this.keep(
          domButton(this, MID, y + 60, t('copySave'), async b => {
            if (await copyText(code, null)) b.textContent = t('copied')
            else this.showExport()
          }),
        )
        y += 170
      }
      if (safari) {
        y = this.step(n++, y, t('installIosShare'), 'icon-share')
        y = this.step(n++, y, t('installIosAdd'))
        y = this.step(n++, y, t('installOpenApp'))
      } else {
        // Zalo's built-in browser and Chrome have other menus: move to Safari, which shows its own install card
        y = this.step(n++, y, t('installToSafari'))
        const link = location.origin + location.pathname
        this.keep(
          domButton(this, MID, y + 60, t('copyLink'), async b => {
            if (await copyText(link, null)) b.textContent = t('copied')
            else {
              // no clipboard here: show the link to type into Safari
              b.textContent = link.replace(/^https?:\/\//, '')
              b.style.fontSize = '30px'
            }
          }),
        )
        y += 170
        y = this.step(n++, y, t('installInSafari'))
      }
      if (carry) y = this.step(n++, y, t('installImportAfter'))
    } else if (canPromptInstall()) {
      this.keep(domButton(this, MID, y + 60, t('installAndroid'), () => void promptInstall()))
      y += 170
    } else {
      const text = this.note(y, t('installAndroidMenu'))
      y += text.height + 40
    }
    // opened by itself on a new shop: "later" goes straight to playing
    const later = () => (this.params.panel === 'install' ? this.resume() : this.showMenu())
    this.button(y + 20 + ROW_H / 2, t('later'), 'plain', later)
    this.card(y + 20 + ROW_H + 70)
  }

  /** A numbered step starting at `y`; returns where the next one starts. */
  private step(n: number, y: number, text: string, icon?: string): number {
    const left = MID - ROW_W / 2
    this.keep(this.add.circle(left + 32, y + 28, 32, hex(C.teal)).setStrokeStyle(4, hex(C.ink)))
    this.keep(this.add.text(left + 32, y + 28, String(n), textStyle(36, '800', C.paper)).setOrigin(0.5))
    const width = ROW_W - 100 - (icon ? 100 : 0)
    const body = this.keep(this.add.text(left + 100, y, text, { ...textStyle(38, '600'), wordWrap: { width } }))
    if (icon) this.keep(this.add.image(left + ROW_W - 40, y + body.height / 2, icon).setDisplaySize(72, 72))
    return y + Math.max(body.height, 64) + 36
  }

  private resume(): void {
    this.params.onResume()
    this.scene.stop()
  }
}
