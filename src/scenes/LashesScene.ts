import * as Phaser from 'phaser'
import { LS_CARD_INSET, LS_PAD, LS_SAMPLE, LS_TOPLEFT } from '../art/lashesArt'
import { C, customerColors } from '../art/palette'
import { LASHES_LID, LASHES_LIMIT_MS } from '../config'
import type { Stars } from '../sim/economy'
import { LASH_LENS, LashesGame, lashSlots, type LashDrop, type LashLen, type LashStyle } from '../sim/lashes'
import { createRng } from '../sim/rng'
import { t, type StringKey } from '../strings/vi'
import { addMiniGameCard, drawBars, revealStars, type MiniGameData, setInstruction } from '../view/miniGame'
import { oneFinger } from '../view/oneFinger'
import { textStyle } from '../view/text'

/** The sample card at the top: its box, its title's line, and the small lid drawn on it, at this share of the big one. */
const SAMPLE = { x: 290, y: 465, w: LS_SAMPLE.w, h: LS_SAMPLE.h, titleY: 505, lidY: 585, scale: 0.55 }
/** Each length's lash in game pixels; each hangs down from its dot, leaning outward toward the corners. */
const LEN_PX: Record<LashLen, number> = { s: 45, m: 75, l: 105 }
const LEAN_DEG = 28
const LASH_W = 7
/** The bare dots, and the ring round the dot a held lash would land on. */
const DOT = { r: 15, ring: 30 }
/** The tray's three pads, short to long, with the lash drawn on each and its name under it. */
const PADS = { xs: [270, 540, 810], y: 1420, w: LS_PAD.w, h: LS_PAD.h, lashY: 1370, labelY: 1478 }
/** A held lash floats this far above the finger, so the thumb never hides where it will land. */
const LIFT = 90
const NAME: Record<LashLen, StringKey> = { s: 'lashesShort', m: 'lashesMid', l: 'lashesLong' }
const STYLE: Record<LashStyle, StringKey> = { natural: 'lashesNatural', cat: 'lashesCat', doll: 'lashesDoll' }
const WORDS: Record<LashDrop, { key: StringKey; color: string }> = {
  right: { key: 'lashesGood', color: C.teal },
  wrong: { key: 'lashesWrong', color: C.lantern },
  stuck: { key: 'lashesStuck', color: C.lantern },
}
/** A word rises from over the brow and fades. */
const WORD = { x: 540, y: 760, size: 56, stroke: 12, risePx: 70, ms: 700 }
const DEMO = { alpha: 0.6, moveMs: 1100, holdMs: 250, pauseMs: 450 }
const DEPTH = { held: 6, word: 10, hand: 20 }
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color

/** Draws a lash of `len` hanging from (x, y), leaning by the dot's place `t` along the lid from 0 (inner corner) to 1. */
function strokeLash(g: Phaser.GameObjects.Graphics, x: number, y: number, len: number, t: number, colour: number, width = LASH_W): void {
  const a = Phaser.Math.DegToRad((t - 0.5) * 2 * LEAN_DEG)
  const tip = { x: x + Math.sin(a) * len, y: y + Math.cos(a) * len }
  // a gentle curl: the middle bows outward
  const mid = { x: (x + tip.x) / 2 + Math.cos(a) * len * 0.12 * Math.sign(t - 0.5 || 1), y: (y + tip.y) / 2 }
  const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(x, y), new Phaser.Math.Vector2(mid.x, mid.y), new Phaser.Math.Vector2(tip.x, tip.y))
  // sợi mi thuôn: gốc dày `width`, ngọn còn 20%
  const pts = curve.getPoints(12)
  const left: Phaser.Math.Vector2[] = []
  const right: Phaser.Math.Vector2[] = []
  pts.forEach((p, i) => {
    const q = pts[Math.min(i + 1, pts.length - 1)]
    const r = pts[Math.max(i - 1, 0)]
    const n = Math.hypot(q.x - r.x, q.y - r.y) || 1
    const [nx, ny] = [-(q.y - r.y) / n, (q.x - r.x) / n]
    const half = (width / 2) * (1 - (0.8 * i) / (pts.length - 1))
    left.push(new Phaser.Math.Vector2(p.x + nx * half, p.y + ny * half))
    right.push(new Phaser.Math.Vector2(p.x - nx * half, p.y - ny * half))
  })
  g.fillStyle(colour, 1).fillPoints([...left, ...right.reverse()], true).fillCircle(x, y, width / 2)
}

/** Close-up Nối mi mini-game over the frozen spa: the sample card names a style, and a lash of the right length is dragged from the tray onto each dot along the customer's closed lid. */
export class LashesScene extends Phaser.Scene {
  private params!: MiniGameData
  private rules!: LashesGame
  private lashes!: Phaser.GameObjects.Graphics
  private dots!: Phaser.GameObjects.Graphics
  private heldG!: Phaser.GameObjects.Graphics
  private instruction!: Phaser.GameObjects.Text
  private bars!: Phaser.GameObjects.Graphics
  /** The lash on the finger and where the finger is, while one is held. */
  private held: { len: LashLen; x: number; y: number } | null = null
  /** The dots whose lash is the wrong length, drawn red. */
  private wrong = new Set<number>()
  private revealed = false
  /** The faint hand dragging the next lash until the first touch, and how far along its drag it is. */
  private demoHand: Phaser.GameObjects.Image | null = null
  private demo = { k: 0 }

  constructor() {
    super('LashesScene')
  }

  init(data: MiniGameData) {
    this.params = data
  }

  create() {
    // the lashes game takes no day-ease time
    this.rules = new LashesGame(createRng(Date.now()), this.params.hard)
    this.held = null
    this.wrong = new Set()
    this.revealed = false
    this.demoHand = null
    this.demo = { k: 0 }

    const colors = customerColors(this.params.look, this.params.kind)
    this.instruction = addMiniGameCard(this, t('lashesTap'))
    this.drawSample()
    this.drawFace(colors.skin, colors.hair)
    this.dots = this.add.graphics()
    this.lashes = this.add.graphics()
    this.drawPads()
    this.heldG = this.add.graphics().setDepth(DEPTH.held)
    this.bars = this.add.graphics()
    if (this.params.demo) this.showDemo()
    this.redraw()

    oneFinger(this.input, {
      down: p => this.onDown(p),
      move: p => this.onMove(p),
      up: () => this.onUp(),
    })
  }

  update(_time: number, delta: number) {
    if (this.revealed) return
    this.rules.tick(delta)
    if (this.rules.phase === 'done') {
      this.reveal(this.rules.stars() ?? 1)
      return
    }
    this.moveDemo()
    drawBars(this.bars, this.rules.progress(), this.timeLeft())
  }

  /** Dev builds only: jump to the star reveal so headless checks can finish a service. */
  __finishForTest(stars: Stars): void {
    if (!import.meta.env.DEV || this.revealed) return
    this.reveal(stars)
  }

  /** The sample card: the style's name, and a small lid with the style's lashes on it. */
  private drawSample(): void {
    this.add.image(SAMPLE.x - LS_CARD_INSET.x, SAMPLE.y - LS_CARD_INSET.y, 'ls-sample').setOrigin(0)
    const g = this.add.graphics()
    this.add.text(SAMPLE.x + SAMPLE.w / 2, SAMPLE.titleY, `${t('lashesSample')} · ${t(STYLE[this.rules.style])}`, textStyle(38, '800', C.terracotta)).setOrigin(0.5)
    const slots = lashSlots(this.rules.pattern.length)
    const at = (p: { x: number; y: number }) => ({ x: SAMPLE.x + SAMPLE.w / 2 + (p.x - LASHES_LID.x) * SAMPLE.scale, y: SAMPLE.lidY + (p.y - LASHES_LID.y) * SAMPLE.scale })
    g.lineStyle(6, hex(C.ink)).strokePoints(slots.map(s => new Phaser.Math.Vector2(at(s).x, at(s).y)))
    slots.forEach((s, i) => {
      const p = at(s)
      strokeLash(g, p.x, p.y, LEN_PX[this.rules.pattern[i]] * SAMPLE.scale, i / (slots.length - 1), hex(C.ink), 5)
    })
  }

  /** Da quanh mắt nhắm qua vành đèn lúp, chân mày và tóc mai, nếp mí và đường mí đi qua các chấm. */
  private drawFace(skin: number, hair: number): void {
    const { x, y } = LS_TOPLEFT
    this.add.image(x, y, 'ls-face').setOrigin(0).setTint(skin)
    this.add.image(x, y, 'ls-brow').setOrigin(0).setTint(hair)
    this.add.image(x, y, 'ls-face-line').setOrigin(0)
  }

  /** The three pads, each with its lash and its name. */
  private drawPads(): void {
    for (const x of PADS.xs) this.add.image(x - PADS.w / 2 - LS_CARD_INSET.x, PADS.y - PADS.h / 2 - LS_CARD_INSET.y, 'ls-pad').setOrigin(0)
    const g = this.add.graphics()
    LASH_LENS.forEach((len, i) => {
      const x = PADS.xs[i]
      strokeLash(g, x, PADS.lashY - LEN_PX[len] / 2, LEN_PX[len], 0.5, hex(C.ink))
      this.add.text(x, PADS.labelY, t(NAME[len]), textStyle(36, '800')).setOrigin(0.5)
    })
  }

  /** The bare dots, the lashes on the lid (a wrong one red), and the held lash with the ring of the dot it would land on. */
  private redraw(): void {
    const { slots, lashes } = this.rules
    const n = slots.length
    this.dots.clear()
    this.lashes.clear()
    const target = this.held ? this.rules.slotAt(this.held.x, this.held.y - LIFT) : null
    slots.forEach((s, i) => {
      const len = lashes[i]
      if (len === null) this.dots.fillStyle(hex(C.paper), 1).fillCircle(s.x, s.y, DOT.r).lineStyle(4, hex(C.ink)).strokeCircle(s.x, s.y, DOT.r)
      else strokeLash(this.lashes, s.x, s.y, LEN_PX[len], i / (n - 1), hex(this.wrong.has(i) ? C.lantern : C.ink))
      if (i === target) this.dots.lineStyle(6, hex(lashes[i] === null ? C.mustard : C.lantern)).strokeCircle(s.x, s.y, DOT.ring)
    })
    this.heldG.clear()
    if (this.held) {
      const root = { x: this.held.x, y: this.held.y - LIFT }
      const tAlong = Phaser.Math.Clamp((root.x - slots[0].x) / (slots[n - 1].x - slots[0].x), 0, 1)
      strokeLash(this.heldG, root.x, root.y, LEN_PX[this.held.len], tAlong, hex(C.ink))
      this.heldG.fillStyle(hex(C.mustard), 1).fillCircle(root.x, root.y, 8)
    }
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (this.revealed) return
    this.hideDemo()
    const i = PADS.xs.findIndex(x => Math.abs(p.x - x) <= PADS.w / 2 && Math.abs(p.y - PADS.y) <= PADS.h / 2)
    if (i < 0) return
    this.held = { len: LASH_LENS[i], x: p.x, y: p.y }
    this.redraw()
  }

  private onMove(p: Phaser.Input.Pointer): void {
    if (!this.held) return
    this.held.x = p.x
    this.held.y = p.y
    this.redraw()
  }

  /** The held lash is dropped where its root is; the dot it lands on is judged, and a word says how. */
  private onUp(): void {
    const held = this.held
    this.held = null
    if (!held || this.revealed) {
      this.redraw()
      return
    }
    const slot = this.rules.slotAt(held.x, held.y - LIFT)
    const result = this.rules.drop(held.len, held.x, held.y - LIFT)
    if (result === 'wrong' && slot !== null) this.wrong.add(slot)
    this.redraw()
    if (result) this.floatWord(result)
  }

  private floatWord(result: LashDrop): void {
    const { key, color } = WORDS[result]
    const word = this.add.text(WORD.x, WORD.y, t(key), textStyle(WORD.size, '800', color)).setOrigin(0.5).setStroke(C.cream, WORD.stroke).setDepth(DEPTH.word)
    this.tweens.add({ targets: word, y: word.y - WORD.risePx, alpha: 0, duration: WORD.ms, ease: 'Quad.easeOut', onComplete: () => word.destroy() })
  }

  /** The hand drags over and over from the pad the next dot wants to just under that dot. */
  private showDemo(): void {
    // the fingertip is at the bottom centre of the texture
    this.demoHand = this.add.image(0, 0, 'hand').setOrigin(0.5, 1).setAlpha(DEMO.alpha).setDepth(DEPTH.hand)
    this.tweens.add({ targets: this.demo, k: 1, duration: DEMO.moveMs, hold: DEMO.holdMs, repeat: -1, repeatDelay: DEMO.pauseMs, ease: 'Sine.easeInOut' })
  }

  private moveDemo(): void {
    if (!this.demoHand) return
    const next = this.rules.nextBare()
    this.demoHand.setVisible(next !== null)
    if (next === null) return
    const pad = PADS.xs[LASH_LENS.indexOf(this.rules.pattern[next])]
    const slot = this.rules.slots[next]
    this.demoHand.setPosition(Phaser.Math.Linear(pad, slot.x, this.demo.k), Phaser.Math.Linear(PADS.y, slot.y + LIFT, this.demo.k))
  }

  private hideDemo(): void {
    if (!this.demoHand) return
    this.tweens.killTweensOf(this.demo)
    this.demoHand.destroy()
    this.demoHand = null
  }

  private reveal(stars: Stars): void {
    this.revealed = true
    this.held = null
    this.hideDemo()
    this.redraw()
    setInstruction(this.instruction, t('shampooDone'))
    drawBars(this.bars, this.rules.progress(), this.timeLeft())
    revealStars(this, stars, () => {
      this.params.onDone(stars)
      this.scene.stop()
    })
  }

  private timeLeft(): number {
    return Math.max(0, 1 - this.rules.elapsedMs / LASHES_LIMIT_MS)
  }
}
