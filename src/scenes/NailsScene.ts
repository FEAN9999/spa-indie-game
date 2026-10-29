import * as Phaser from 'phaser'
import { NAILS_BOX, NAILS_FINGERS, NAILS_LENS } from '../art/nailsArt'
import { C, customerColors, teacherColors, type CharacterColors } from '../art/palette'
import { NAILS_BOTTLE_X, NAILS_BOTTLE_Y, NAILS_COAT_MS, NAILS_COUNT, NAILS_LIMIT_MS, NAILS_NAIL, NAILS_SHAKE_MS, NAILS_SHAPE } from '../config'
import type { Stars } from '../sim/economy'
import { NailsGame, nailsBottleAt, type NailsPattern, type NailsPhase, type NailsPt } from '../sim/nails'
import { createRng } from '../sim/rng'
import { t, type StringKey } from '../strings/vi'
import { CharacterView } from '../view/CharacterView'
import { addMiniGameCard, drawBars, revealStars, type MiniGameData, setInstruction } from '../view/miniGame'
import { textStyle } from '../view/text'

/** The polish of each colour the rules name. */
const POLISH = [C.lantern, C.lotus, C.teal, C.mustard]
/** The instruction for each phase; the coat and the pause after a nail already ask for the trace. */
const WORDS: Partial<Record<NailsPhase, StringKey>> = { pick: 'nailsPick', coat: 'nailsTrace', trace: 'nailsTrace', next: 'nailsTrace' }
/** Patterns whose line closes, so their last dot joins the first. */
const CLOSED: readonly NailsPattern[] = ['heart', 'flower']
/** The customer standing on her sand disc, swinging side to side after a wrong pick. */
const CUSTOMER = { x: 170, y: 590, r: 92, ink: 4, scale: 1.3, shakePx: 10, shakePerMs: 0.04 }
/** The cream card she holds the sample in, its point towards her, and the sample nail on it. */
const SAMPLE = { x: 288, y: 482, w: 250, h: 216, r: 32, ink: 4, nailX: 413, nailY: 592, scale: 0.4, nailInk: 10 }
const SPEECH_POINT = [292, 560, 262, 590, 292, 616] as const
/** A cream stroke over the card's edge where the point meets it. */
const SPEECH_SEAM = { x: 292, top: 566, bottom: 610, w: 6 }
/** A small nail, this far down its finger from the tip and this share of the finger's width; its ring while traced; its pattern is this many card pixels wide. */
const SMALL = { fromTip: 30, w: 0.64, h: 0.8, cornerOfW: 1 / 2.4, ink: 3.5, ringGap: 12, ringW: 8, patternW: 260 }
/** A finished nail's mark above it: a disc with a check or a cross. */
const MARK = { dy: 44, r: 18, ink: 3.5, icon: 8, iconW: 4 }
/** A bottle round its centre: cap, neck, body and label as x, y, w, h, corner and ink; the shine down the body. */
const BOTTLE = {
  cap: [-22, -110, 44, 58, 10, 4],
  neck: [-16, -56, 32, 20, 0, 3],
  body: [-54, -40, 108, 140, 28, 4],
  label: [-30, 46, 60, 34, 8, 3],
  shine: { x: -32, top: -18, bottom: 40, w: 9, alpha: 0.7 },
  fadedAlpha: 0.35,
  shakePx: 10,
  shakePerMs: 0.05,
} as const
/** The pointer from the lens's foot to the small nail under way. */
const POINTER = { halfW: 46, baseUp: 14, tipUp: 40, ink: 4 }
/** The big nail's ink and corners, its shine, and the faint guide through the dots. */
const NAIL = { ink: 6, corner: 28 }
const SHINE = { w: 10, alpha: 0.35 }
const GUIDE = { w: 4, alpha: 0.35 }
/** The dots to trace, faint until lit, the rings on the first and the last, and the stroke's ink round each lit dot. */
const DOT = { faintAlpha: 0.4, faintInkAlpha: 0.6, ink: 3, faintInk: 2.5, litScale: 1.15, ringGap: 11, ringW: 6, strokeInk: 3 }
const BLOB_INK = 3
const RIM = { w: 8, innerGap: 9, innerW: 4, innerAlpha: 0.8 }
/** A word rises from where it is said and fades; a smudge's from above the finger, a nail's end over the lens. */
const WORD = { size: 60, stroke: 12, risePx: 80, ms: 600, smudgeDy: 70, endX: 540, endY: 700 }
const DEMO = { alpha: 0.6, tapMs: 800, hoverPx: 50, pressScale: 0.92, pxPerMs: 0.26, restMs: 600 }
const DEPTH = { word: 10, hand: 20 }
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const v = (x: number, y: number) => new Phaser.Math.Vector2(x, y)

/** The points of a quadratic curve from a over c to b, both ends included. */
const quad = (a: NailsPt, c: NailsPt, b: NailsPt, steps = 6): Phaser.Math.Vector2[] =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const k = i / steps
    const [u, w, z] = [(1 - k) ** 2, 2 * (1 - k) * k, k ** 2]
    return v(u * a.x + w * c.x + z * b.x, u * a.y + w * c.y + z * b.y)
  })

/** The nail's outline round its centre: a half-ellipse top, straight sides and rounded bottom corners. */
const NAIL_OUTLINE = (() => {
  const { hw, top, cap, bottom } = NAILS_SHAPE
  const k = NAIL.corner
  const arc = Array.from({ length: 25 }, (_, i) => {
    const a = Math.PI + (i / 24) * Math.PI
    return v(hw * Math.cos(a), cap + (cap - top) * Math.sin(a))
  })
  return [
    ...arc,
    ...quad({ x: hw, y: bottom - k }, { x: hw, y: bottom }, { x: hw - k, y: bottom }),
    ...quad({ x: -hw + k, y: bottom }, { x: -hw, y: bottom }, { x: -hw, y: bottom - k }),
  ]
})()

/** The big nail on the card, and the shine curving down its left. */
const BIG_NAIL = NAIL_OUTLINE.map(p => v(NAILS_NAIL.x + p.x, NAILS_NAIL.y + p.y))
const SHINE_LINE = quad({ x: NAILS_NAIL.x - 80, y: NAILS_NAIL.y - 120 }, { x: NAILS_NAIL.x - 96, y: NAILS_NAIL.y - 60 }, { x: NAILS_NAIL.x - 92, y: NAILS_NAIL.y + 20 })

/** A smudge's blot round where the finger left the nail: five curves, each as control x, y and end x, y. */
const BLOB = (() => {
  const curves = [[-18, -24, 0, -22], [22, -28, 24, -6], [32, 16, 10, 20], [-10, 30, -20, 14], [-32, 10, -26, 0]]
  let from = { x: -26, y: 0 }
  return curves.flatMap(([cx, cy, x, y]) => {
    const pts = quad(from, { x: cx, y: cy }, { x, y }).slice(0, -1)
    from = { x, y }
    return pts
  })
})()

/** Where each small nail sits on its finger and its turn, its length along the finger, and its size. */
const SMALL_NAILS = NAILS_FINGERS.map(([tx, ty, bx, by, fw]) => {
  const l = Math.hypot(bx - tx, by - ty)
  const [ux, uy] = [(bx - tx) / l, (by - ty) / l]
  return { x: tx + ux * SMALL.fromTip, y: ty + uy * SMALL.fromTip, turn: Math.atan2(uy, ux) - Math.PI / 2, w: fw * SMALL.w, h: fw * SMALL.h }
})

/** Close-up Sơn móng mini-game over the frozen spa: pick the polish the customer's sample shows, then trace its dotted pattern on each of her five nails. */
export class NailsScene extends Phaser.Scene {
  private params!: MiniGameData
  private rules!: NailsGame
  /** The sample's polish. */
  private polish: string = C.lantern
  /** The pattern's dots on the big nail, in card pixels. */
  private dotsAt: Phaser.Math.Vector2[] = []
  private customer!: CharacterView
  /** The small nails and their marks over the hand, and the bottles while picking. */
  private g!: Phaser.GameObjects.Graphics
  /** The lens: the pointer and the sand under the fingertip, the fingertip, and the nail with everything on it. */
  private lensBack!: Phaser.GameObjects.Graphics
  private tip!: Phaser.GameObjects.Image
  private tipLine!: Phaser.GameObjects.Image
  private lens!: Phaser.GameObjects.Graphics
  private instruction!: Phaser.GameObjects.Text
  private bars!: Phaser.GameObjects.Graphics
  private revealed = false
  /** Game time in ms, for the shakes. */
  private now = 0
  private shownPhase: NailsPhase = 'pick'
  private seenResults = 0
  private demoHand: Phaser.GameObjects.Image | null = null
  private demoMs = 0
  /** The hand's taps on the bottle end once a pick counts; it shows again on the first nail's dots. */
  private demoPicked = false

  constructor() {
    super('NailsScene')
  }

  init(data: MiniGameData) {
    this.params = data
  }

  create() {
    // the nails take no day-ease time
    this.rules = new NailsGame(createRng(Date.now()), this.params.hard)
    this.polish = POLISH[this.rules.colour]
    this.dotsAt = this.rules.dots.map(d => v(NAILS_NAIL.x + d.x, NAILS_NAIL.y + d.y))
    this.revealed = false
    this.now = 0
    this.shownPhase = 'pick'
    this.seenResults = 0
    this.demoHand = null
    this.demoMs = 0
    this.demoPicked = false

    const { look, kind, idol } = this.params
    const colors = this.params.teacher ? teacherColors() : customerColors(look, kind, null, null, false, idol ?? null)
    this.instruction = addMiniGameCard(this, t('nailsPick'))
    this.addCustomer(colors)
    // each texture is drawn in the card's pixels, so it sits at its box's corner
    const at = (key: string, [x, y]: readonly number[]) => this.add.image(x, y, key).setOrigin(0)
    at('nails-cushion', NAILS_BOX.cushion)
    at('nails-hand-line', NAILS_BOX.hand)
    at('nails-hand', NAILS_BOX.hand).setTint(colors.skin)
    this.g = this.add.graphics()
    this.lensBack = this.add.graphics()
    this.tip = at('nails-tip', NAILS_BOX.tip).setTint(colors.skin)
    this.tipLine = at('nails-tip-line', NAILS_BOX.tip)
    this.lens = this.add.graphics()
    this.bars = this.add.graphics()
    // the fingertip is at the bottom centre of the texture; placed now, so it shows from the first frame
    if (this.params.demo) this.demoHand = this.add.image(0, 0, 'hand').setOrigin(0.5, 1).setAlpha(DEMO.alpha).setDepth(DEPTH.hand)
    this.moveDemo(0)

    // only a pick that counts, or a touch that lights a dot, puts the demo hand away
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.revealed) return
      if (this.rules.phase === 'pick') {
        const bottle = nailsBottleAt(p.x, p.y)
        if (bottle !== null && this.rules.pick(bottle) !== null) this.demoPicked = true
      } else if (this.rules.phase === 'trace' && this.rules.down(p.x, p.y).lit > 0) this.hideDemo()
    })
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.revealed || !p.isDown) return
      const touch = this.rules.move(p.x, p.y)
      if (touch.smudge) this.floatWord(t('nailsSmudge'), p.x, p.y - WORD.smudgeDy, C.lantern)
      if (touch.lit > 0) this.hideDemo()
    })
    for (const ev of ['pointerup', 'pointerupoutside', 'gameout']) {
      this.input.on(ev, () => {
        if (!this.revealed) this.rules.up()
      })
    }
  }

  update(_time: number, delta: number) {
    if (this.revealed) return
    this.now += delta
    this.rules.tick(delta)
    this.noticeEnds()
    const { phase, shakeMs } = this.rules
    if (phase === 'done') {
      this.reveal(this.rules.stars() ?? 1)
      return
    }
    if (phase !== this.shownPhase) {
      this.shownPhase = phase
      const words = WORDS[phase]
      if (words) setInstruction(this.instruction, t(words))
    }
    const shake = phase === 'pick' && shakeMs > 0 ? Math.sin(this.now * CUSTOMER.shakePerMs) * CUSTOMER.shakePx * (shakeMs / NAILS_SHAKE_MS) : 0
    this.customer.container.setX(CUSTOMER.x + shake)
    this.drawHand()
    const picking = phase === 'pick'
    for (const o of [this.lensBack, this.tip, this.tipLine, this.lens]) o.setVisible(!picking)
    if (picking) this.drawBottles()
    else this.drawLens()
    this.moveDemo(delta)
    drawBars(this.bars, this.rules.progress(), 1 - this.rules.elapsedMs / NAILS_LIMIT_MS)
  }

  /** Dev builds only: jump to the star reveal so headless checks can finish a service. */
  __finishForTest(stars: Stars): void {
    if (!import.meta.env.DEV || this.revealed) return
    this.reveal(stars)
  }

  /** The customer standing on her sand disc, and the card with the sample nail in her polish and pattern. */
  private addCustomer(colors: CharacterColors): void {
    const { x, y, r } = CUSTOMER
    this.add.graphics().fillStyle(hex(C.sand), 1).fillCircle(x, y, r).lineStyle(CUSTOMER.ink, hex(C.ink)).strokeCircle(x, y, r)
    this.customer = new CharacterView(this, colors)
    this.customer.container.setPosition(x, y + r).setScale(CUSTOMER.scale)
    const g = this.add.graphics()
    const [ax, ay, bx, by, cx, cy] = SPEECH_POINT
    g.fillStyle(hex(C.cream), 1).fillTriangle(ax, ay, bx, by, cx, cy).lineStyle(SAMPLE.ink, hex(C.ink)).strokeTriangle(ax, ay, bx, by, cx, cy)
    g.fillStyle(hex(C.cream), 1).fillRoundedRect(SAMPLE.x, SAMPLE.y, SAMPLE.w, SAMPLE.h, SAMPLE.r)
    g.lineStyle(SAMPLE.ink, hex(C.ink)).strokeRoundedRect(SAMPLE.x, SAMPLE.y, SAMPLE.w, SAMPLE.h, SAMPLE.r)
    g.lineStyle(SPEECH_SEAM.w, hex(C.cream)).lineBetween(SPEECH_SEAM.x, SPEECH_SEAM.top, SPEECH_SEAM.x, SPEECH_SEAM.bottom)
    const s = SAMPLE.scale
    const nail = NAIL_OUTLINE.map(p => v(SAMPLE.nailX + p.x * s, SAMPLE.nailY + p.y * s))
    g.fillStyle(hex(this.polish), 1).fillPoints(nail, true).lineStyle(SAMPLE.nailInk * s, hex(C.ink)).strokePoints(nail, true)
    this.drawPattern(g, this.rules.dots.map(() => true), SAMPLE.nailX, SAMPLE.nailY, s)
  }

  /** The small nails on the fingers: bare, then coated one by one, ringed while traced, and once done with their pattern and a mark above. */
  private drawHand(): void {
    const g = this.g.clear()
    const { phase, phaseMs, nail, results, litAll } = this.rules
    const coat = phase === 'pick' ? 0 : phase === 'coat' ? phaseMs / NAILS_COAT_MS : 1
    SMALL_NAILS.forEach((n, i) => {
      const corner = n.w * SMALL.cornerOfW
      g.save().translateCanvas(n.x, n.y).rotateCanvas(n.turn)
      if (phase === 'trace' && i === nail && !this.revealed) {
        const pad = SMALL.ringGap
        g.lineStyle(SMALL.ringW, hex(C.mustard)).strokeRoundedRect(-n.w / 2 - pad, -n.h / 2 - pad, n.w + 2 * pad, n.h + 2 * pad, n.w / 2 + pad)
      }
      g.fillStyle(hex(coat > i / NAILS_COUNT ? this.polish : C.nailBare), 1).fillRoundedRect(-n.w / 2, -n.h / 2, n.w, n.h, corner)
      g.lineStyle(SMALL.ink, hex(C.ink)).strokeRoundedRect(-n.w / 2, -n.h / 2, n.w, n.h, corner)
      if (i < results.length) this.drawPattern(g, litAll[i], 0, 0, n.w / SMALL.patternW)
      g.restore()
      if (i >= results.length) return
      const y = n.y - n.h / 2 - MARK.dy
      g.fillStyle(hex(results[i] ? C.teal : C.lantern), 1).fillCircle(n.x, y, MARK.r).lineStyle(MARK.ink, hex(C.ink)).strokeCircle(n.x, y, MARK.r)
      this.icon(results[i] ? 'check' : 'cross', n.x, y, MARK.icon, C.cream, MARK.iconW)
    })
  }

  /** The four bottles in their colours: a wrong pick faded, the last one shaking while the customer shakes her head. */
  private drawBottles(): void {
    const { phase, order, faded, shakeMs } = this.rules
    const shaking = phase === 'pick' && shakeMs > 0 ? faded[faded.length - 1] : -1
    NAILS_BOTTLE_X.forEach((bx, i) => {
      const x = bx + (i === shaking ? Math.sin(this.now * BOTTLE.shakePerMs) * BOTTLE.shakePx : 0)
      const y = NAILS_BOTTLE_Y
      const alpha = faded.includes(i) ? BOTTLE.fadedAlpha : 1
      const colour = POLISH[order[i]]
      const part = ([dx, dy, w, h, corner, ink]: readonly number[], fill: string) => {
        this.g.fillStyle(hex(fill), alpha).lineStyle(ink, hex(C.ink), alpha)
        if (corner) this.g.fillRoundedRect(x + dx, y + dy, w, h, corner).strokeRoundedRect(x + dx, y + dy, w, h, corner)
        else this.g.fillRect(x + dx, y + dy, w, h).strokeRect(x + dx, y + dy, w, h)
      }
      part(BOTTLE.cap, C.deepBrown)
      part(BOTTLE.neck, colour)
      part(BOTTLE.body, colour)
      const { shine } = BOTTLE
      this.g.fillStyle(hex(C.cream), shine.alpha * alpha).fillRoundedRect(x + shine.x - shine.w / 2, y + shine.top - shine.w / 2, shine.w, shine.bottom - shine.top + shine.w, shine.w / 2)
      part(BOTTLE.label, C.cream)
    })
  }

  /** From the coat on: the nail under way, big in a lens over its finger, with the dots to trace or its finished pattern, and the smudges. */
  private drawLens(): void {
    const { phase, nail, dotR, lit, litAll, blobs, outside } = this.rules
    const { x: lx, y: ly, r: lr } = NAILS_LENS
    const to = SMALL_NAILS[nail]
    const foot = ly + lr - POINTER.baseUp
    const back = this.lensBack.clear()
    back.fillStyle(hex(C.cream), 1).fillTriangle(lx - POINTER.halfW, foot, to.x, to.y - POINTER.tipUp, lx + POINTER.halfW, foot)
    back.lineStyle(POINTER.ink, hex(C.ink)).strokeTriangle(lx - POINTER.halfW, foot, to.x, to.y - POINTER.tipUp, lx + POINTER.halfW, foot)
    back.fillStyle(hex(C.sand), 1).fillCircle(lx, ly, lr)

    const g = this.lens.clear()
    const { x: nx, y: ny } = NAILS_NAIL
    g.fillStyle(hex(this.polish), 1).fillPoints(BIG_NAIL, true)
    g.lineStyle(NAIL.ink, hex(phase === 'trace' && outside ? C.lantern : C.ink)).strokePoints(BIG_NAIL, true)
    g.lineStyle(SHINE.w, hex(C.cream), SHINE.alpha).strokePoints(SHINE_LINE)
    if (phase === 'trace') {
      g.lineStyle(GUIDE.w, hex(C.cream), GUIDE.alpha).strokePoints(this.dotsAt, CLOSED.includes(this.rules.pattern))
      this.drawPattern(g, lit, nx, ny, 1)
      const ends = [[this.dotsAt[0], C.teal], [this.dotsAt[this.dotsAt.length - 1], C.mustard]] as const
      for (const [d, c] of ends) g.lineStyle(DOT.ringW, hex(c)).strokeCircle(d.x, d.y, dotR + DOT.ringGap)
      this.dotsAt.forEach((d, i) => {
        g.fillStyle(hex(C.cream), lit[i] ? 1 : DOT.faintAlpha).fillCircle(d.x, d.y, dotR)
        g.lineStyle(lit[i] ? DOT.ink : DOT.faintInk, hex(C.ink), lit[i] ? 1 : DOT.faintInkAlpha).strokeCircle(d.x, d.y, dotR)
      })
    } else if (phase === 'next') this.drawPattern(g, litAll[litAll.length - 1], nx, ny, 1)
    // a smudge stays as a blot of polish over the nail's edge
    for (const b of blobs) {
      const blot = BLOB.map(p => v(b.x + p.x, b.y + p.y))
      g.fillStyle(hex(this.polish), 1).fillPoints(blot, true).lineStyle(BLOB_INK, hex(C.ink)).strokePoints(blot, true)
    }
    g.lineStyle(RIM.w, hex(C.ink)).strokeCircle(lx, ly, lr)
    g.lineStyle(RIM.innerW, hex(C.cream), RIM.innerAlpha).strokeCircle(lx, ly, lr - RIM.innerGap)
  }

  /**
   * A pattern at scale `s` round (cx, cy) from its lit dots: the dots stay dots; the others are a stroke joining each lit dot
   * to its lit predecessor, ink under cream, with a disc at each dot so the joints are round.
   */
  private drawPattern(g: Phaser.GameObjects.Graphics, lit: readonly boolean[], cx: number, cy: number, s: number): void {
    const { pattern, dots, dotR } = this.rules
    const at = (i: number) => ({ x: cx + dots[i].x * s, y: cy + dots[i].y * s })
    if (pattern === 'dots') {
      const r = dotR * s * DOT.litScale
      dots.forEach((_, i) => {
        if (!lit[i]) return
        const p = at(i)
        g.fillStyle(hex(C.cream), 1).fillCircle(p.x, p.y, r).lineStyle(Math.max(1, DOT.ink * s), hex(C.ink)).strokeCircle(p.x, p.y, r)
      })
      return
    }
    const closed = CLOSED.includes(pattern)
    const joins: [NailsPt, NailsPt][] = []
    dots.forEach((_, i) => {
      const prev = i > 0 ? i - 1 : closed ? dots.length - 1 : -1
      if (lit[i] && prev >= 0 && lit[prev]) joins.push([at(prev), at(i)])
    })
    for (const [r, colour] of [[(dotR + DOT.strokeInk) * s, C.ink], [dotR * s, C.cream]] as const) {
      g.lineStyle(2 * r, hex(colour)).fillStyle(hex(colour), 1)
      for (const [a, b] of joins) g.lineBetween(a.x, a.y, b.x, b.y).fillCircle(a.x, a.y, r).fillCircle(b.x, b.y, r)
    }
  }

  /** A check or cross of half-size `u` centred at (x, y). */
  private icon(kind: 'check' | 'cross', x: number, y: number, u: number, colour: string, w: number): void {
    const g = this.g.lineStyle(w, hex(colour)).beginPath()
    if (kind === 'check') g.moveTo(x - u, y).lineTo(x - u * 0.3, y + u * 0.7).lineTo(x + u, y - u * 0.7)
    else g.moveTo(x - u, y - u).lineTo(x + u, y + u).moveTo(x + u, y - u).lineTo(x - u, y + u)
    g.strokePath()
  }

  /** A nail's end floats Đẹp! or Chưa đẹp over the lens. */
  private noticeEnds(): void {
    const { results } = this.rules
    if (results.length <= this.seenResults) return
    this.seenResults = results.length
    const good = results[results.length - 1]
    this.floatWord(t(good ? 'nailsGood' : 'nailsBad'), WORD.endX, WORD.endY, good ? C.teal : C.lantern)
  }

  private floatWord(words: string, x: number, y: number, colour: string): void {
    const word = this.add.text(x, y, words, textStyle(WORD.size, '800', colour)).setOrigin(0.5).setStroke(C.cream, WORD.stroke).setDepth(DEPTH.word)
    this.tweens.add({
      targets: word,
      y: { value: word.y - WORD.risePx, ease: 'Quad.easeOut' },
      alpha: { value: 0, ease: 'Cubic.easeIn' },
      duration: WORD.ms,
      onComplete: () => word.destroy(),
    })
  }

  /**
   * Until a pick counts the hand taps the sample's bottle every 800 ms: it drops onto it, then presses. On the first nail it
   * follows the dots at 260 px/s, rests at the last and starts again. It is hidden in the coat and between nails.
   */
  private moveDemo(delta: number): void {
    if (!this.demoHand) return
    const { phase, nail, order, colour } = this.rules
    const picking = phase === 'pick' && !this.demoPicked
    const tracing = phase === 'trace' && nail === 0
    this.demoHand.setVisible(picking || tracing)
    if (!picking && !tracing) {
      this.demoMs = 0
      return
    }
    this.demoMs += delta
    if (picking) {
      const f = (this.demoMs % DEMO.tapMs) / DEMO.tapMs
      const x = NAILS_BOTTLE_X[order.indexOf(colour)]
      this.demoHand.setPosition(x, NAILS_BOTTLE_Y - (f < 0.5 ? DEMO.hoverPx * (1 - f * 2) : 0)).setScale(f > 0.5 && f < 0.75 ? DEMO.pressScale : 1)
      return
    }
    const path = this.dotsAt
    const lens = path.slice(1).map((p, i) => Math.hypot(p.x - path[i].x, p.y - path[i].y))
    const total = lens.reduce((a, b) => a + b, 0)
    let s = Math.min(total, (this.demoMs % (total / DEMO.pxPerMs + DEMO.restMs)) * DEMO.pxPerMs)
    let i = 0
    while (i < lens.length - 1 && s > lens[i]) s -= lens[i++]
    const k = Math.min(1, s / lens[i])
    this.demoHand.setPosition(path[i].x + (path[i + 1].x - path[i].x) * k, path[i].y + (path[i + 1].y - path[i].y) * k).setScale(1)
  }

  private hideDemo(): void {
    if (!this.demoHand) return
    this.demoHand.destroy()
    this.demoHand = null
  }

  /** The lens goes; the hand stays with its marks under the stars. */
  private reveal(stars: Stars): void {
    this.revealed = true
    setInstruction(this.instruction, t('shampooDone'))
    this.hideDemo()
    for (const o of [this.lensBack, this.tip, this.tipLine, this.lens]) o.setVisible(false)
    this.customer.container.setX(CUSTOMER.x)
    this.drawHand()
    drawBars(this.bars, this.rules.progress(), 1 - this.rules.elapsedMs / NAILS_LIMIT_MS)
    revealStars(this, stars, () => {
      this.params.onDone(stars)
      this.scene.stop()
    })
  }
}
