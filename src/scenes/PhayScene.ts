import * as Phaser from 'phaser'
import { C, customerColors, ownerColors, type CharacterColors } from '../art/palette'
import { sound } from '../audio/engine'
import { GAME_H, GAME_W } from '../config'
import type { FeedBook, Post, PostPic, ReplyKind } from '../sim/feed'
import { REASON_LINE } from '../sim/feedText'
import type { OutfitId } from '../sim/outfits'
import type { Look } from '../sim/types'
import { formatCount } from '../strings/format'
import { t } from '../strings/vi'
import { CHARACTER_HEIGHT_PX, CharacterView } from '../view/CharacterView'
import { clampScroll, dragTo, inWindow, postTime, replyButtonShown, shortCount, stackPosts, type Hold } from '../view/phay'
import { starPoints } from '../view/rankDraw'
import { textStyle } from '../view/text'
import { addButton, whenTapped } from '../view/ui'

export interface PhayData {
  feed: FeedBook
  shopName: string
  ownerLook: Look
  ownerOutfit: OutfitId
  /** The post to scroll to the top, or null for the newest first. */
  focusId: number | null
  onClose: () => void
  /** The shop's line answering complaint `postId` with `reply`, exactly as it would be posted. */
  replyLine: (postId: number, reply: ReplyKind) => string
  /** Answers complaint `postId` with `reply` and saves the shop. */
  onAnswer: (postId: number, reply: ReplyKind) => void
}

const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
const fit = <T extends Phaser.GameObjects.Text>(text: T, w: number): T => text.setScale(Math.min(1, w / text.width))

/** The phone over the shop and its screen, from the sketch. */
const FRAME = { x: 26, y: 30, w: 1028, h: 2100, r: 80 }
const SCREEN = { x: 46, y: 50, w: 988, h: 2060, r: 64 }
/** The app's head: the logo, its name and the close button. */
const HEAD = { logoX: 92, logoY: 92, logo: 76, titleX: 190, y: 130, closeX: 966, closeR: 48, closeHit: 140, line: 210 }
/** The shop's own page line: the owner's disc, the name and the followers. */
const PROFILE = { x: 140, y: 300, r: 56, textX: 220, nameY: 270, followY: 330, tickR: 20, line: 390 }
/** The list shows between these, through a camera of its own, so nothing is masked. */
const LIST_TOP = 400
const LIST_BOTTOM = 2090
const POST_X = 74
const POST_W = 932
const POST_GAP = 26
const FIRST_GAP = 14
const PAD = 30
const AVATAR_R = 46
/** A post's name and time, right of the avatar; the body starts this far under the card's top. */
const NAME_X = 140
const BODY_DY = 146
const TICK_R = 16
const STAR_R = 15
const STAR_DX = 34
const PIC_H = 360
const PIC_PAD = 26
/** How tall a whole figure stands in an avatar disc, its feet this far under the middle. */
const FACE_H = 82
const FACE_FEET = 42
/** A figure in a picture. */
const PIC_FIGURE = 1.7
const TICK_AT = 100_000
const GOLD_AT = 1_000_000
/** Posts this far past the window's edges are built ahead, so a drag meets them ready. */
const BUILD_MARGIN = 600
/** An unanswered complaint's Trả lời button, its middle this far left of the card's right edge, on the likes row grown to hold it. */
const REPLY_BUTTON = { w: 240, h: 88, dx: 150, rowH: 104 }
const ROW_H = 64
/** The reply card, from the sketch: from its top, the title's and the stars' middles and the complaint's top; the replies' boxes and the gaps. */
const REPLY_CARD = { w: 960, r: 60, titleY: 90, starsY: 160, textY: 205, textW: 800, replyW: 840, replyPad: 40, replyTextW: 760, replyMinH: 88, replyGap: 24, later: { w: 300, h: 100, size: 38 }, bottom: 60 }

const PIC_BG: Record<PostPic, string> = { idol: C.seaPale, video: C.pinkPale, plaque: C.goldPale, cup: C.goldPale, cert: C.tealPale }

/** A post laid in the list; its box is built only once it comes near the window. */
interface Shown {
  post: Post
  box: Phaser.GameObjects.Container | null
  top: number
  bottom: number
}

/**
 * Phây over the frozen chain: a phone with the shop's page and its posts, newest first. The list scrolls by a drag (or the wheel)
 * and is drawn through a camera whose viewport is the list's window, so the head and the frame never need to cover it.
 */
export class PhayScene extends Phaser.Scene {
  private params!: PhayData
  private list!: Phaser.GameObjects.Container
  private posts: Shown[] = []
  private listH = 0
  private scroll = 0
  private drag: (Hold & { id: number }) | null = null
  private listCam!: Phaser.Cameras.Scene2D.Camera
  /** Draws the reply card over the list, which the list's camera would otherwise cover; shown only while the card is up. */
  private cardCam!: Phaser.Cameras.Scene2D.Camera
  private card: Phaser.GameObjects.Container | null = null
  /** One hidden text per style, to count a post's wrapped lines before it is built; the heights by line count. */
  private measurers = new Map<string, { text: Phaser.GameObjects.Text; h: number[] }>()

  constructor() {
    super('PhayScene')
  }

  init(data: PhayData) {
    this.params = data
    this.posts = []
    this.listH = 0
    this.scroll = 0
    this.drag = null
    this.card = null
    this.measurers = new Map()
  }

  create() {
    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    this.add
      .graphics()
      .fillStyle(hex(C.deepBrown), 1)
      .fillRoundedRect(FRAME.x, FRAME.y, FRAME.w, FRAME.h, FRAME.r)
      .lineStyle(5, hex(C.ink))
      .strokeRoundedRect(FRAME.x, FRAME.y, FRAME.w, FRAME.h, FRAME.r)
      .fillStyle(hex(C.paper), 1)
      .fillRoundedRect(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h, SCREEN.r)
      .lineStyle(4, hex(C.tileSeam))
      .lineBetween(SCREEN.x, HEAD.line, SCREEN.x + SCREEN.w, HEAD.line)
      .lineBetween(SCREEN.x, PROFILE.line, SCREEN.x + SCREEN.w, PROFILE.line)
    this.head()
    this.profile()

    this.list = this.add.container(0, 0)
    this.fillList()
    this.listCam = this.cameras.add(SCREEN.x, LIST_TOP, SCREEN.w, LIST_BOTTOM - LIST_TOP).setScroll(SCREEN.x, LIST_TOP)
    this.listCam.ignore(this.children.list.filter(o => o !== this.list))
    this.cameras.main.ignore(this.list)
    this.cardCam = this.cameras.add(0, 0, GAME_W, GAME_H).setVisible(false)
    this.setScroll(this.scroll)
    this.listenForDrags()
  }

  /** The logo, "Phây" and the close button. */
  private head(): void {
    const { logoX, logoY, logo, y } = HEAD
    this.add
      .graphics()
      .fillStyle(hex(C.teal), 1)
      .fillRoundedRect(logoX, logoY, logo, logo, 22)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(logoX, logoY, logo, logo, 22)
    this.add.image(logoX + logo / 2, logoY + logo / 2 + 2, 'icon-heart').setScale(0.8)
    this.add.text(HEAD.titleX, y, t('phayTitle'), textStyle(60, '800', C.teal)).setOrigin(0, 0.5)
    const cross = this.add
      .graphics()
      .lineStyle(7, hex(C.ink))
      .lineBetween(-15, -15, 15, 15)
      .lineBetween(15, -15, -15, 15)
    const close = this.add.container(HEAD.closeX, y, [this.add.circle(0, 0, HEAD.closeR, hex(C.cream)).setStrokeStyle(4, hex(C.ink)), cross])
    whenTapped(close.setSize(HEAD.closeHit, HEAD.closeHit).setInteractive(), () => {
      sound.play('tap')
      this.close()
    })
  }

  /** The owner in her disc, gold-ringed from a million; the shop's name with the blue tick from 100.000; the followers. */
  private profile(): void {
    const { shopName, ownerLook, ownerOutfit, feed } = this.params
    const { x, y, r } = PROFILE
    this.add.circle(x, y, r, hex(C.tealPale))
    this.figure(ownerColors(ownerLook, ownerOutfit), x, y + r - 6, (2 * r - 14) / CHARACTER_HEIGHT_PX)
    const gold = feed.followers >= GOLD_AT
    this.add.circle(x, y, r).setStrokeStyle(gold ? 10 : 4, hex(gold ? C.gold : C.ink))
    const ticked = feed.followers >= TICK_AT
    const nameW = SCREEN.x + SCREEN.w - 40 - PROFILE.textX - (ticked ? 3 * PROFILE.tickR : 0)
    const name = fit(this.add.text(PROFILE.textX, PROFILE.nameY, shopName, textStyle(44)).setOrigin(0, 0.5), nameW)
    if (ticked) this.tick(PROFILE.textX + name.displayWidth + 14 + PROFILE.tickR, PROFILE.nameY, PROFILE.tickR, false)
    this.add.text(PROFILE.textX, PROFILE.followY, t('phayFollowers', { n: formatCount(feed.followers) }), textStyle(32, '600', C.soft)).setOrigin(0, 0.5)
  }

  /** Every post, newest first, measured and laid down the list without being built (setScroll builds those near the window); the focused one's top becomes the scroll. */
  private fillList(): void {
    const { feed, focusId } = this.params
    const top = LIST_TOP + FIRST_GAP
    if (feed.posts.length === 0) {
      this.list.add(this.add.text(GAME_W / 2, top + 120, t('phayEmpty'), { ...textStyle(32, '600', C.soft), align: 'center', wordWrap: { width: 760 } }).setOrigin(0.5, 0))
    }
    const newest = [...feed.posts].reverse()
    const { spans, end } = stackPosts(newest.map(p => this.drawPost(null, p, 0)), top, POST_GAP)
    this.posts = newest.map((post, i) => ({ post, box: null, ...spans[i] }))
    const focus = this.posts.find(s => s.post.id === focusId)
    if (focus) this.scroll = -(focus.top - top)
    this.listH = end - LIST_TOP
  }

  /** A post's box at its place in the list. */
  private build(s: Shown): Phaser.GameObjects.Container {
    const box = this.add.container(0, 0)
    this.drawPost(box, s.post, s.top)
    this.list.add(box)
    return box
  }

  /** One post from `y0` into `box`, or only measured when there is no box: returns the card's bottom. */
  private drawPost(box: Phaser.GameObjects.Container | null, p: Post, y0: number): number {
    const x = POST_X
    const card = box ? this.add.graphics() : null
    let y = y0 + PAD
    if (box && card) {
      box.add(card)
      this.avatar(box, p, x + 74, y + AVATAR_R)
      const nameW = POST_W - NAME_X - PAD - (p.tick ? 3 * TICK_R : 0)
      const name = fit(this.add.text(x + NAME_X, y + 26, p.name, textStyle(36, '800', p.kind === 'rival' ? C.lantern : C.ink)).setOrigin(0, 0.5), nameW)
      box.add(name)
      if (p.tick) box.add(this.tick(name.x + name.displayWidth + 12 + TICK_R, name.y, TICK_R, p.kind === 'idol'))
      const time = this.add.text(x + NAME_X, y + 74, postTime(p.day, p.minute), textStyle(26, '600', C.soft)).setOrigin(0, 0.5)
      box.add(time)
      if (p.stars !== null) this.starRow(box, time.x + time.width + 24, time.y, p.stars)
    }

    y = y0 + BODY_DY
    y += this.words(box, x + PAD, y, p.text, { ...textStyle(32, '600'), wordWrap: { width: POST_W - 2 * PAD } }) + 14
    const unanswered = replyButtonShown(p)
    if (p.complaint && unanswered) {
      y += this.words(box, x + PAD, y, REASON_LINE[p.complaint.reason], { ...textStyle(26, '800', C.lanternDark), wordWrap: { width: POST_W - 2 * PAD } }) + 14
    }
    if (p.pic) {
      if (box) this.picture(box, p, y + 6)
      y += 6 + PIC_H + 24
    }

    // the likes, then the comments' count; an unanswered complaint's Trả lời button at the row's right, the row grown to hold it
    const rowH = unanswered ? REPLY_BUTTON.rowH : ROW_H
    const row = y + rowH / 2 - 8
    if (box) {
      box.add(this.add.image(x + 50, row, 'icon-heart').setScale(0.65))
      box.add(this.add.text(x + 84, row, shortCount(p.likes), textStyle(30)).setOrigin(0, 0.5))
      const comments = p.comments.length + p.extra
      if (comments > 0) {
        box.add(this.add.image(x + 310, row + 2, 'icon-comment').setScale(0.65))
        box.add(this.add.text(x + 344, row, t('phayComments', { n: shortCount(comments) }), textStyle(28, '600', C.soft)).setOrigin(0, 0.5))
      }
      if (unanswered) box.add(this.replyButton(p, x + POST_W - REPLY_BUTTON.dx, row))
    }
    y += rowH

    // the comments shown, on a sand box
    if (p.comments.length > 0) {
      const top = y
      const sand = box ? this.add.graphics() : null
      if (box && sand) box.add(sand)
      y += 22
      for (const [who, said] of p.comments) {
        y += this.words(box, x + 52, y, who, textStyle(28), POST_W - 104) + 2
        y += this.words(box, x + 52, y, said, { ...textStyle(28, '600'), wordWrap: { width: POST_W - 104 } }) + 12
      }
      y += 10
      sand?.fillStyle(hex(C.sand), 1).fillRoundedRect(x + PIC_PAD, top, POST_W - 2 * PIC_PAD, y - top, 24)
      y += 24
    }

    const h = y - y0 + 6
    card
      ?.fillStyle(hex(C.cream), 1)
      .fillRoundedRect(x, y0, POST_W, h, 36)
      .lineStyle(unanswered ? 6 : 4, hex(unanswered ? C.terracotta : C.ink))
      .strokeRoundedRect(x, y0, POST_W, h, 36)
    return y0 + h
  }

  /** The terracotta Trả lời pill centred on x, y; a tap opens the reply card. */
  private replyButton(p: Post, x: number, y: number): Phaser.GameObjects.Container {
    const { w, h } = REPLY_BUTTON
    const bg = this.add
      .graphics()
      .fillStyle(hex(C.terracotta), 1)
      .fillRoundedRect(-w / 2, -h / 2, w, h, h / 2)
      .lineStyle(4, hex(C.ink))
      .strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2)
    const label = this.add.text(0, 0, t('phayReply'), textStyle(32, '800', C.paper)).setOrigin(0.5)
    return whenTapped(this.add.container(x, y, [bg, label]).setSize(w, h).setInteractive(), () => {
      sound.play('tap')
      this.openReply(p)
    })
  }

  /**
   * The card over the panel: the customer's name, stars, complaint and its reason, the three replies in the complaint's order, each
   * showing the very line that gets posted, and Để sau. A reply answers, saves and redraws the panel at this post.
   */
  private openReply(p: Post): void {
    const complaint = p.complaint
    if (!complaint || this.card) return
    const mid = GAME_W / 2
    const R = REPLY_CARD
    // over everything, so nothing under the card takes a tap
    const card = this.add.container(0, 0, [this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.4).setOrigin(0).setInteractive()])
    const body = this.add.container(0, 0)
    card.add(body)
    const bg = this.add.graphics()
    body.add(bg)
    body.add(fit(this.add.text(mid, R.titleY, t('phayReplyTitle', { name: p.name }), textStyle(48)).setOrigin(0.5), R.w - 120))
    if (p.stars !== null) this.starRow(body, mid - (4 * STAR_DX + 2 * STAR_R) / 2, R.starsY, p.stars)
    const centred = (size: number, weight: '600' | '800', color: string) => ({ ...textStyle(size, weight, color), align: 'center', wordWrap: { width: R.textW } })
    let y = R.textY
    const said = this.add.text(mid, y, `"${p.text}"`, centred(32, '600', C.soft)).setOrigin(0.5, 0)
    body.add(said)
    y += said.height + 12
    const reason = this.add.text(mid, y, REASON_LINE[complaint.reason], centred(28, '800', C.lanternDark)).setOrigin(0.5, 0)
    body.add(reason)
    y += reason.height + 44
    for (const reply of complaint.replies) {
      const line = this.add
        .text(-R.replyW / 2 + R.replyPad, 0, this.params.replyLine(p.id, reply), { ...textStyle(32, '800'), wordWrap: { width: R.replyTextW } })
        .setOrigin(0, 0.5)
      const h = Math.max(R.replyMinH, line.height + R.replyPad)
      const box = this.add
        .graphics()
        .fillStyle(hex(C.cream), 1)
        .fillRoundedRect(-R.replyW / 2, -h / 2, R.replyW, h, 32)
        .lineStyle(4, hex(C.ink))
        .strokeRoundedRect(-R.replyW / 2, -h / 2, R.replyW, h, 32)
      body.add(whenTapped(this.add.container(mid, y + h / 2, [box, line]).setSize(R.replyW, h).setInteractive(), () => this.answer(p, reply)))
      y += h + R.replyGap
    }
    y += 20
    body.add(addButton(this, mid, y + R.later.h / 2, R.later.w, R.later.h, t('phayReplyLater'), 'plain', () => this.closeReply(), R.later.size))
    const cardH = y + R.later.h + R.bottom
    bg.fillStyle(hex(C.paper), 1).fillRoundedRect(mid - R.w / 2, 0, R.w, cardH, R.r).lineStyle(5, hex(C.ink)).strokeRoundedRect(mid - R.w / 2, 0, R.w, cardH, R.r)
    body.y = Math.round((GAME_H - cardH) / 2)

    // the list's camera draws over the main one, so the card has a camera of its own, above both
    this.cameras.main.ignore(card)
    this.listCam.ignore(card)
    this.cardCam.ignore(this.children.list.filter(o => o !== card))
    this.cardCam.setVisible(true)
    this.card = card
    this.drag = null
  }

  private closeReply(): void {
    this.card?.destroy()
    this.card = null
    this.cardCam.setVisible(false)
  }

  /** Answers through the shop, which saves, then opens the panel again with the post, now the exchange, at the top. */
  private answer(p: Post, reply: ReplyKind): void {
    sound.play('tap')
    this.params.onAnswer(p.id, reply)
    this.scene.restart({ ...this.params, focusId: p.id })
  }

  /** Words at x, y into `box`, fitted to `fitW` when given, or only measured when there is no box: returns their height. */
  private words(box: Phaser.GameObjects.Container | null, x: number, y: number, str: string, style: Phaser.Types.GameObjects.Text.TextStyle, fitW = 0): number {
    if (!box) return this.measure(str, style)
    const text = this.add.text(x, y, str, style)
    if (fitW > 0) fit(text, fitW)
    box.add(text)
    return text.height
  }

  /** The height `str` takes in `style`: its wrapped lines are counted on one hidden text per style, and each line count is drawn once. */
  private measure(str: string, style: Phaser.Types.GameObjects.Text.TextStyle): number {
    const key = JSON.stringify(style)
    let m = this.measurers.get(key)
    if (!m) {
      m = { text: this.add.text(0, 0, '', style).setVisible(false), h: [] }
      this.measurers.set(key, m)
    }
    const n = m.text.getWrappedText(str).length
    m.h[n] ??= m.text.setText(Array(n).fill('M').join('\n')).height
    return m.h[n]
  }

  /** A guest's, star's or VIP's whole figure standing in a disc; the shop's lotus, SPA MỚI's initials or the ward's star. */
  private avatar(box: Phaser.GameObjects.Container, p: Post, cx: number, cy: number): void {
    const disc = p.face ? C.tealPale : p.kind === 'shop' ? C.teal : p.kind === 'rival' ? C.lantern : C.mustard
    box.add(this.add.circle(cx, cy, AVATAR_R, hex(disc)))
    if (p.face) {
      const f = p.face
      box.add(this.figure(customerColors(f.look, f.kind ?? 'office', f.regular, f.vip, p.kind === 'kol', f.idol), cx, cy + FACE_FEET, FACE_H / CHARACTER_HEIGHT_PX))
    } else if (p.kind === 'shop') {
      box.add(this.add.image(cx, cy, 'icon-services').setScale(1.05))
    } else if (p.kind === 'rival') {
      box.add(this.add.text(cx, cy + 2, 'SM', textStyle(34, '800', C.paper)).setOrigin(0.5))
    } else {
      const star = starPoints(cx, cy + 2, 26, 0.45)
      box.add(this.add.graphics().fillStyle(hex(C.cream), 1).fillPoints(star, true).lineStyle(3, hex(C.ink)).strokePoints(star, true))
    }
    box.add(this.add.circle(cx, cy, AVATAR_R).setStrokeStyle(4, hex(C.ink)))
  }

  /** A standing figure with its feet at x, y. */
  private figure(colors: CharacterColors, x: number, y: number, scale: number): Phaser.GameObjects.Container {
    return new CharacterView(this, colors).container.setPosition(x, y).setScale(scale)
  }

  /** The blue tick of a checked name, gold for a star. */
  private tick(cx: number, cy: number, r: number, gold: boolean): Phaser.GameObjects.GameObject[] {
    return [this.add.circle(cx, cy, r, hex(gold ? C.mustard : C.cobalt)).setStrokeStyle(3, hex(C.ink)), this.add.image(cx, cy + 1, 'icon-tick').setScale(r / 18)]
  }

  /** A customer's five stars, `n` of them gold. */
  private starRow(box: Phaser.GameObjects.Container, x: number, y: number, n: number): void {
    const g = this.add.graphics()
    for (let i = 0; i < 5; i++) {
      const pts = starPoints(x + STAR_R + i * STAR_DX, y, STAR_R, 0.43)
      g.fillStyle(hex(i < n ? C.gold : C.cream), 1).lineStyle(3, hex(C.ink)).fillPoints(pts, true).strokePoints(pts, true)
    }
    box.add(g)
  }

  /** The picture under a post's words: the star beside the owner before the shop's name, Mi Mi's video, the plaque, the cup or the certificate. */
  private picture(box: Phaser.GameObjects.Container, p: Post, top: number): void {
    const x = POST_X + PIC_PAD
    const w = POST_W - 2 * PIC_PAD
    const cx = x + w / 2
    const cy = top + PIC_H / 2
    const feet = top + PIC_H - 30
    const kind = p.pic!
    box.add(
      this.add
        .graphics()
        .fillStyle(hex(PIC_BG[kind]), 1)
        .fillRoundedRect(x, top, w, PIC_H, 28)
        .lineStyle(4, hex(C.ink))
        .strokeRoundedRect(x, top, w, PIC_H, 28),
    )
    const caption = (text: string) => box.add(fit(this.add.text(cx, top + PIC_H - 60, text, textStyle(36, '800', C.mustardDark)).setOrigin(0.5), w - 60))
    if (kind === 'idol') {
      box.add(this.add.image(x + 90, feet, 'decor-lotus').setOrigin(0, 1).setScale(1.3))
      box.add(this.add.image(x + w - 90, feet, 'decor-vase').setOrigin(1, 1).setScale(1.1))
      const f = p.face
      if (f) box.add(this.figure(customerColors(f.look, f.kind ?? 'office', f.regular, f.vip, false, f.idol), cx - 80, feet, PIC_FIGURE))
      box.add(this.figure(ownerColors(this.params.ownerLook, this.params.ownerOutfit), cx + 80, feet, PIC_FIGURE))
      box.add(
        this.add
          .graphics()
          .fillStyle(hex(C.cream), 1)
          .fillRoundedRect(cx - 170, top + 22, 340, 64, 16)
          .lineStyle(4, hex(C.ink))
          .strokeRoundedRect(cx - 170, top + 22, 340, 64, 16),
      )
      box.add(fit(this.add.text(cx, top + 54, this.params.shopName, textStyle(34)).setOrigin(0.5), 310))
    } else if (kind === 'video') {
      const f = p.face
      if (f) box.add(this.figure(customerColors(f.look, f.kind ?? 'office', f.regular, f.vip, true, f.idol), cx - 160, feet, 1.8))
      box.add(this.add.circle(cx + 110, cy, 70, hex(C.ink), 0.75))
      box.add(this.add.image(cx + 116, cy, 'icon-play').setScale(2.4))
      box.add(this.add.graphics().fillStyle(hex(C.ink), 0.8).fillRoundedRect(x + w - 130, top + PIC_H - 70, 100, 48, 14))
      box.add(this.add.text(x + w - 80, top + PIC_H - 46, t('phayVideoTime'), textStyle(28, '800', C.paper)).setOrigin(0.5))
    } else if (kind === 'plaque') {
      // the grade plaque by the door, larger, with one big star for the new grade
      const g = this.add.graphics()
      const by = cy - 30
      g.lineStyle(8, hex(C.woodDark))
        .lineBetween(cx - 120, by - 96, cx - 92, by - 62)
        .lineBetween(cx + 120, by - 96, cx + 92, by - 62)
        .fillStyle(hex(C.woodLight), 1)
        .fillRoundedRect(cx - 200, by - 66, 400, 132, 24)
        .lineStyle(5, hex(C.ink))
        .strokeRoundedRect(cx - 200, by - 66, 400, 132, 24)
        .fillStyle(hex(C.woodDark), 0.35)
        .fillRoundedRect(cx - 182, by - 48, 364, 96, 16)
      const star = starPoints(cx, by + 4, 44, 0.43)
      g.fillStyle(hex(C.gold), 1).lineStyle(4, hex(C.ink)).fillPoints(star, true).strokePoints(star, true)
      box.add(g)
      caption(t('phayPicRank'))
    } else if (kind === 'cup') {
      const cup = this.add.image(cx, top + PIC_H - 100, 'decor-trophy').setOrigin(0.5, 1)
      box.add(cup.setScale(220 / cup.height))
      caption(t('yearTitle'))
    } else {
      box.add(
        this.add
          .graphics()
          .fillStyle(hex(C.cream), 1)
          .fillRoundedRect(cx - 230, top + 40, 460, PIC_H - 80, 10)
          .lineStyle(8, hex(C.mustardDark))
          .strokeRoundedRect(cx - 230, top + 40, 460, PIC_H - 80, 10),
      )
      box.add(this.add.text(cx, top + 110, t('phayPicCert'), textStyle(46, '800', C.lanternDark)).setOrigin(0.5))
      box.add(this.add.text(cx, top + 170, t('phayPicCertLine'), textStyle(36, '600')).setOrigin(0.5))
      const seal = starPoints(cx + 140, top + PIC_H - 100, 22, 0.4)
      box.add(
        this.add
          .graphics()
          .fillStyle(hex(C.lantern), 1)
          .fillCircle(cx + 140, top + PIC_H - 100, 42)
          .lineStyle(5, hex(C.lanternDark))
          .strokeCircle(cx + 140, top + PIC_H - 100, 42)
          .fillStyle(hex(C.gold), 1)
          .fillPoints(seal, true),
      )
    }
  }

  /** A drag that passes DRAG_PX scrolls the list; the wheel scrolls it too. */
  private listenForDrags(): void {
    const inList = (p: Phaser.Input.Pointer) => p.y >= LIST_TOP && p.y <= LIST_BOTTOM && p.x >= SCREEN.x && p.x <= SCREEN.x + SCREEN.w
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.drag === null && this.card === null && inList(p)) this.drag = { id: p.id, y0: p.y, s0: this.scroll, moved: false }
    })
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      const d = this.drag
      if (!d || p.id !== d.id) return
      const y = dragTo(d, p.y)
      if (y !== null) this.setScroll(y)
    })
    for (const ev of ['pointerup', 'pointerupoutside']) {
      this.input.on(ev, (p: Phaser.Input.Pointer) => {
        if (this.drag?.id === p.id) this.drag = null
      })
    }
    this.input.on('gameout', () => (this.drag = null))
    this.input.on('wheel', (_p: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) => {
      if (this.card === null) this.setScroll(this.scroll - dy)
    })
  }

  /** Moves the list, kept in its bounds, builds the posts that come near the window and draws only those in it. */
  private setScroll(y: number): void {
    this.scroll = clampScroll(y, this.listH, LIST_BOTTOM - LIST_TOP)
    this.list.y = this.scroll
    for (const s of this.posts) {
      if (!s.box && inWindow(s, this.scroll, LIST_TOP - BUILD_MARGIN, LIST_BOTTOM + BUILD_MARGIN)) s.box = this.build(s)
      s.box?.setVisible(inWindow(s, this.scroll, LIST_TOP, LIST_BOTTOM))
    }
  }

  private close(): void {
    this.params.onClose()
    this.scene.stop()
  }
}
