import * as Phaser from 'phaser'
import { itemTexture } from '../art/furniture'
import { C, teacherColors, TEACHER_LOOK } from '../art/palette'
import { GAME_H, GAME_W, LESSON_PASS_STARS } from '../config'
import type { Stars } from '../sim/economy'
import { SERVICES, type LessonService } from '../sim/services'
import type { SpaSim } from '../sim/spa'
import type { HintId } from '../sim/types'
import { t } from '../strings/vi'
import { CharacterView } from '../view/CharacterView'
import { lessonHowTo, lessonPassLine, lessonTitle } from '../view/lesson'
import type { MiniGameData } from '../view/miniGame'
import { textStyle } from '../view/text'
import { addButton } from '../view/ui'

export interface LessonData {
  sim: SpaSim
  service: LessonService
  /** After a lesson game: save. */
  onChange: () => void
  onClose: () => void
}

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const MID = GAME_W / 2
/** The lesson's game scene, by service. */
const GAME_SCENE: Record<LessonService, string> = { scrub: 'ScrubScene', foot: 'FootScene' }
/** The hand that shows the lesson game once, by service. */
const LESSON_DEMO: Record<LessonService, HintId> = { scrub: 'demoScrub', foot: 'demoFoot' }
const TITLE_Y = 100
const TITLE_MAX_W = 800
const BOTTOM_PAD = 55
const TEACH = { w: 900, feetY: 560, scale: 2.4, rx: 130, ry: 26, rowTop: 630, discX: 170, discR: 30, textX: 222, textW: 640, textSize: 36, rowGap: 22, startW: 520, startH: 130 }
const PASS = { w: 880, discY: 320, discR: 130, giftPx: 200, textY: 480, textW: 720, textSize: 38, btnW: 520, btnH: 130 }
const FAIL = { w: 880, feetY: 470, scale: 2, rx: 110, ry: 22, textY: 520, textW: 720, laterW: 340, retryW: 380, btnH: 124, btnGap: 20 }
const BTN_GAP = 40

/**
 * A lesson over the services panel: the teacher's card, one practice game on her back, then "Học xong!" or "Chưa đạt".
 * The shop and the panel wait underneath, frozen.
 */
export class LessonScene extends Phaser.Scene {
  private params!: LessonData
  /** Everything drawn for the card on screen, destroyed when it is redrawn. */
  private shown: Phaser.GameObjects.GameObject[] = []

  constructor() {
    super('LessonScene')
  }

  init(data: LessonData) {
    this.params = data
    this.shown = []
  }

  create() {
    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    this.teacherCard()
  }

  /** A paper card `w` wide on the screen's centre, as tall as `build` says (it returns the bottom of its content). */
  private card(w: number, fill: string, build: (c: Phaser.GameObjects.Container) => number): void {
    for (const obj of this.shown) obj.destroy()
    const content = this.add.container(0, 0)
    const bottom = build(content) + BOTTOM_PAD
    const x = MID - w / 2
    const y = Math.round((GAME_H - bottom) / 2)
    const bg = this.add.graphics().fillStyle(hex(fill), 1).fillRoundedRect(x, 0, w, bottom, 60).lineStyle(4, hex(C.ink)).strokeRoundedRect(x, 0, w, bottom, 60)
    content.addAt(bg, 0)
    content.setY(y)
    this.shown = [content]
  }

  private title(c: Phaser.GameObjects.Container, words: string, size: number, color: string = C.ink): void {
    const text = this.add.text(MID, TITLE_Y, words, textStyle(size, '800', color)).setOrigin(0.5)
    c.add(text.setScale(Math.min(1, TITLE_MAX_W / text.width)))
  }

  private teacher(c: Phaser.GameObjects.Container, feetY: number, scale: number, rx: number, ry: number): void {
    c.add(this.add.ellipse(MID, feetY, rx * 2, ry * 2, hex(C.sand)))
    const view = new CharacterView(this, teacherColors())
    c.add(view.container.setPosition(MID, feetY).setScale(scale))
  }

  /** Wrapped, centred text from `top`; returns its bottom. */
  private paragraph(c: Phaser.GameObjects.Container, words: string, top: number, size: number, width: number): number {
    const text = this.add.text(MID, top, words, { ...textStyle(size, '600'), align: 'center', wordWrap: { width } }).setOrigin(0.5, 0)
    c.add(text)
    return top + text.height
  }

  private teacherCard(): void {
    const { service } = this.params
    this.card(TEACH.w, C.paper, c => {
      this.title(c, lessonTitle(service), 58)
      this.teacher(c, TEACH.feetY, TEACH.scale, TEACH.rx, TEACH.ry)
      let top = TEACH.rowTop
      lessonHowTo(service).forEach((line, i) => {
        const text = this.add.text(TEACH.textX, top + 5, line, { ...textStyle(TEACH.textSize, '600'), wordWrap: { width: TEACH.textW } })
        const disc = this.add.circle(TEACH.discX, top + TEACH.discR, TEACH.discR, hex(C.teal)).setStrokeStyle(4, hex(C.ink))
        const num = this.add.text(TEACH.discX, top + TEACH.discR, String(i + 1), textStyle(34, '800', C.paper)).setOrigin(0.5)
        c.add([disc, num, text])
        top += Math.max(2 * TEACH.discR, text.height + 10) + TEACH.rowGap
      })
      const y = top + BTN_GAP + TEACH.startH / 2
      c.add(addButton(this, MID, y, TEACH.startW, TEACH.startH, t('learnStart'), 'primary', () => this.start()))
      return y + TEACH.startH / 2
    })
  }

  private passCard(): void {
    const { service } = this.params
    this.card(PASS.w, C.goldPale, c => {
      this.title(c, t('learnPassTitle'), 60, C.mustardDark)
      c.add(this.add.circle(MID, PASS.discY, PASS.discR, hex(C.goldPale)).setStrokeStyle(4, hex(C.mustardDark)))
      const pic = this.add.image(MID, PASS.discY, itemTexture(SERVICES[service].bed))
      c.add(pic.setScale(PASS.giftPx / Math.max(pic.width, pic.height)))
      const bottom = this.paragraph(c, lessonPassLine(service), PASS.textY, PASS.textSize, PASS.textW)
      const y = bottom + BTN_GAP + PASS.btnH / 2
      c.add(addButton(this, MID, y, PASS.btnW, PASS.btnH, t('done'), 'primary', () => this.close()))
      return y + PASS.btnH / 2
    })
  }

  private failCard(): void {
    this.card(FAIL.w, C.paper, c => {
      this.title(c, t('learnFailTitle'), 60)
      this.teacher(c, FAIL.feetY, FAIL.scale, FAIL.rx, FAIL.ry)
      const bottom = this.paragraph(c, t('learnFailLine'), FAIL.textY, 38, FAIL.textW)
      const y = bottom + BTN_GAP + FAIL.btnH / 2
      const left = MID - (FAIL.laterW + FAIL.retryW + FAIL.btnGap) / 2
      c.add(addButton(this, left + FAIL.laterW / 2, y, FAIL.laterW, FAIL.btnH, t('later'), 'plain', () => this.close(), 46))
      c.add(addButton(this, left + FAIL.laterW + FAIL.btnGap + FAIL.retryW / 2, y, FAIL.retryW, FAIL.btnH, t('learnRetry'), 'primary', () => this.start(), 46))
      return y + FAIL.btnH / 2
    })
  }

  /** The practice game on the teacher's back: this card steps aside, and the result comes back as a pass or fail card. */
  private start(): void {
    const { sim, service, onChange } = this.params
    const data: MiniGameData = {
      look: TEACHER_LOOK,
      kind: 'office',
      extraMs: 0,
      hard: false,
      // the hand shows until one lesson game has ended; a retry plays without it
      demo: !sim.hintDone(LESSON_DEMO[service]),
      onDone: (stars: Stars) => {
        sim.markHint(LESSON_DEMO[service])
        const passed = stars >= LESSON_PASS_STARS
        if (passed) sim.passLesson(service)
        onChange()
        this.scene.setVisible(true)
        if (passed) this.passCard()
        else this.failCard()
      },
    }
    this.scene.setVisible(false)
    this.scene.launch(GAME_SCENE[service], data)
  }

  private close(): void {
    this.params.onClose()
    this.scene.stop()
  }
}
