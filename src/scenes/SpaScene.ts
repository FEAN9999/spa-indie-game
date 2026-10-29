import * as Phaser from 'phaser'
import { currentInstallEnv, installPlatform } from '../app/install'
import { BUILD_ID, latestVersion, onReturn, shouldReload } from '../app/update'
import { C, customerColors, inspectorColors, ownerColors } from '../art/palette'
import { cueFor } from '../audio/cues'
import { sound } from '../audio/engine'
import { ARRIVE_MS, AUTOSAVE_MS, BUBBLE_MS, EXIT_MS, FLOOR_PRICE, FOOT_SEAT_MS, GAME_H, GAME_W, HUM_MS, TILE, UPDATE_WAIT_MS } from '../config'
import { SaveSession } from '../save/session'
import type { AwayResult } from '../sim/away'
import type { BadgeId } from '../sim/badges'
import { openStore, type SaveStore } from '../save/store'
import { PROBLEM_TEXT } from '../sim/build'
import { Chain } from '../sim/chain'
import { KINDS } from '../sim/customers'
import { dayEase } from '../sim/economy'
import { monthOf } from '../sim/calendar'
import { MACHINES, rivalToday } from '../sim/events'
import { festivalOf } from '../sim/festivals'
import { floorOf } from '../sim/floors'
import { onBed, tileEq } from '../sim/grid'
import type { OutfitId } from '../sim/outfits'
import { ITEMS, seatFacing, seatTiles } from '../sim/items'
import type { PlaceId } from '../sim/places'
import { bookOpen } from '../sim/regulars'
import { createRng } from '../sim/rng'
import { SaveError, SaveTooNewError, type SaveData } from '../sim/save'
import { SERVICES, type ServiceId } from '../sim/services'
import { SpaSim } from '../sim/spa'
import { STOCK_NAME } from '../sim/stock'
import { pickHint } from '../sim/tutorial'
import type { Customer, Facing, HintId, SimEvent, Tile } from '../sim/types'
import { isUnlocked } from '../sim/unlocks'
import { formatMoney } from '../strings/format'
import { GREETINGS, REGULAR_TEXT } from '../strings/regulars'
import { GENEROUS_LINES, RECIPE_HINT_TEXT, t, type StringKey } from '../strings/vi'
import { IDOL_TEXT } from '../strings/idols'
import { VIP_TEXT } from '../strings/vips'
import { awayTip } from '../view/away'
import { BADGE_TEXT } from '../view/badges'
import { closingCard, idolCallCard, noTechCard, placeName, unlockCard, vipCallCard, type ChoiceText } from '../view/chain'
import { OUTFIT_NAME } from '../view/outfits'
import { CHARACTER_HEIGHT_PX, CharacterView } from '../view/CharacterView'
import { FloorBar } from '../view/FloorBar'
import { climbPose, followFloor, pills, showPills, stairsToasts } from '../view/floors'
import { HandPointer } from '../view/HandPointer'
import { navIds, type NavId } from '../view/nav'
import { BANNER_MS, BOOK_BUTTON, DEPTH as HUD_DEPTH, Hud } from '../view/Hud'
import { eventCard, hotCard, powerWarnText, rivalBeatenCard } from '../view/events'
import { festivalDoneCard, festivalStartCard, goldCardMs, monthToast, type GoldCard } from '../view/festivals'
import { addMedal } from '../view/medal'
import type { MiniGameData } from '../view/miniGame'
import { questTitle } from '../view/quests'
import { servicesOpening } from '../view/servicesPanel'
import { stockLowText } from '../view/stockText'
import { humNow, humText, todayToasts } from '../view/idol'
import { RoomView } from '../view/RoomView'
import { SpeechBubble } from '../view/SpeechBubble'
import { goalCard, lockedText } from '../view/starter'
import { StaffLayer } from '../view/StaffLayer'
import { courseName } from '../view/staffCard'
import { textStyle } from '../view/text'
import { addButton, addCard } from '../view/ui'
import { TOP_BAR } from '../view/topBar'
import type { AwayData } from './AwayScene'
import type { BuildData } from './BuildScene'
import type { ChainData } from './ChainScene'
import type { ChoiceData } from './ChoiceScene'
import type { GuestBookData } from './GuestBookScene'
import type { QuestsData } from './QuestsScene'
import type { StarterData } from './StarterScene'
import type { OwnerData, OwnerMode } from './OwnerScene'
import type { PauseData, PausePanel } from './PauseScene'
import type { ServicesData } from './ServicesScene'
import type { StaffData } from './StaffScene'
import type { InspectData } from './InspectScene'
import type { NewOutfitData } from './NewOutfitScene'
import type { RankData } from './RankScene'
import type { SummaryData } from './SummaryScene'

const FX_DEPTH = 9000
/** The quick-buy card covers the top bar and the bottom nav too. */
const CARD_DEPTH = HUD_DEPTH + 100
const TAP_SLOP_PX = 20
const STREET_SIDE_TILES = 4.5
const RIPPLE_MS = 1200
/** How long each of the money and star pointers stays after the first payment. */
const TOUR_STEP_MS = 3000
/** The patience pointer is done once it has been seen this long. */
const PATIENCE_HINT_MS = 4000
/** The money and star pointers aim just under the top bar's first row. */
const TOP_ROW_TIP_Y = 120
/** The top of a waiting customer's patience bar, from their feet. */
const PATIENCE_BAR_TOP = -CHARACTER_HEIGHT_PX - 12
/** The bottom of the service badge, just above the patience bar. */
const BADGE_BOTTOM = PATIENCE_BAR_TOP - 4
/** A speech bubble's tail tip sits this far over the feet: over the head, above the mood bubble. */
const SPEECH_TIP = -CHARACTER_HEIGHT_PX - 70
/** The heart badge's centre, left of the service badge. */
const HEART_DX = -64
/** The toast after another that a toast right now would overwrite. */
const LATE_TOAST_MS = 2200
/** The gold card under the top bar (a new badge, a festival), from the sketch; a line that wraps makes it taller. */
const BADGE_CARD = { x: 110, y: 236, w: 860, h: 200, r: 50, medalX: 230, medalY: 336, textX: 330, textW: 610, bottomPad: 26, discR: 64, icon: 104 }
const BADGE_FADE_MS = 250
/** A VIP's star twinkles: its scale swings this far around 0.5 on this period. */
const STAR_TWINKLE = 0.04
const STAR_TWINKLE_MS = 1200
/** Steam rises from the steam tent's knob, this many tiles over the tent's bottom edge, and bobs this far on this period. */
const TENT_KNOB_TILES = 1.94
const STEAM_BOB = { px: 8, ms: 1600 }
/** Hot stones lie across a face-down back, this many tiles over the feet. */
const STONES_TILES = 0.78
/** Switching shops: a roll-down shutter with the place's name closes over the shop, then rolls up over the next one. */
const SHUTTER = { ms: 300, depth: HUD_DEPTH + 200, slat: 72, sign: { w: 640, h: 160, r: 40 } }
const hex = (c: string) => Phaser.Display.Color.HexStringToColor(c).color
/** The close-up each service is played in. */
const MINI_GAME_SCENE: Record<ServiceId, string> = { shampoo: 'ShampooScene', mask: 'MaskScene', massage: 'MassageScene', steam: 'SteamScene', stone: 'StoneScene', mud: 'MudScene', scrub: 'ScrubScene', foot: 'FootScene', nails: 'NailsScene' }
/** The hint marking each mini-game as played once, so its demo hand shows only the first time. */
const DEMO_HINT: Record<ServiceId, HintId> = { shampoo: 'demoShampoo', mask: 'demoMask', massage: 'demoMassage', steam: 'demoSteam', stone: 'demoStone', mud: 'demoMud', scrub: 'demoScrub', foot: 'demoFoot', nails: 'demoNails' }
/** Services whose customer sits on the station's upper tile instead of lying. */
const SEATED: readonly ServiceId[] = ['foot', 'nails']

interface CustomerSprite {
  view: CharacterView
  bar: Phaser.GameObjects.Graphics
  /** The service the customer wants, over the patience bar. */
  badge: Phaser.GameObjects.Image
  ripple: Phaser.GameObjects.Image
  /** A waiting regular's heart, just left of the service badge. */
  heart: Phaser.GameObjects.Image
  /** A VIP's gold star: with the heart's place while she waits, over her head otherwise. */
  vipStar: Phaser.GameObjects.Image
  /** Over the steam tent while the customer lies inside. */
  steam: Phaser.GameObjects.Image
  /** On the back while the customer is served on the stone bed. */
  stones: Phaser.GameObjects.Image
  /** 0 on the floor to 1 on the seat of the foot chair or the nail desk, eased as they sit down and get up. */
  lift: number
  bubble: Phaser.GameObjects.Image | null
}

interface Placement {
  x: number
  y: number
  facing: Facing
  alpha: number
}

/** What a switch of shops hands the restarted scene: the chain itself, the main shop's cards waiting for the owner, and time away paid while the shutter was down. */
export interface SpaSceneData {
  chain: Chain
  mainCards: { badgeQueue: (BadgeId | GoldCard)[]; inspectNote: Extract<SimEvent, { type: 'inspected' }> | null }
  heldAway: AwayResult[]
  arrived: boolean
}

export class SpaScene extends Phaser.Scene {
  /** The main shop, its branches, and where the owner is. */
  chain!: Chain
  /** The shop the owner is in: `chain.active()`. */
  sim!: SpaSim
  private room!: RoomView
  /** The floor on view, from 1; only showFloor changes it. */
  private viewFloor = 1
  /** The owner's floor on the last frame, so the view follows them only on the frame they come off the stairs. */
  private lastOwnerFloor = 1
  private floorBar!: FloorBar
  private hud!: Hud
  private owner!: CharacterView
  private customers = new Map<number, CustomerSprite>()
  private staffLayer!: StaffLayer
  private store!: SaveStore
  private session!: SaveSession
  /** A service that became ready while paused, with the scene it is played in; the mini-game opens on resume. */
  private pendingService: { scene: string; data: MiniGameData } | null = null
  /** Frozen while asking for a newer version on return, so nothing happens that the reload would drop. */
  private holding = false
  /** The owner card, the bed card, build mode or the staff panel is open: the shop waits and its events stay queued until it closes. */
  private modal = false
  /** The morning banner waits for the install card a new shop opens with. */
  private bannerOnResume = false
  /** The slot was saved by a newer version: only the card shows, and the shop never runs. */
  private tooNew = false
  private pointer!: HandPointer
  /** After the first payment: the money pointer, then the star pointer, each with the time it has left on screen. */
  private tour: { hint: 'money' | 'star'; ms: number }[] = []
  /** Delay for the next "finished a course" or stairs toast this morning, so they follow the VIP-today toast and each other. */
  private studiedToastMs = 0
  /** The scene time before which a queued toast may not go up, so finished quests follow each other and whatever was said just before. */
  private toastQueueAt = 0
  /** The "Chủ tiệm về rồi" card is open. */
  private awayOpen = false
  /** Earnings from returns to the page, paid and saved already, whose cards wait for a mini-game, an update check or a switch of shops. */
  private heldAway: AwayResult[] = []
  /** From the start of a switch of shops until the next shop's shutter has rolled up. The welcome-back card waits meanwhile: it puts `modal` back as it found it, and would put back the shutter's freeze for good. */
  private switching = false
  /** The wear toast, held while a panel covers the shop; a later wear replaces it. */
  private heldWearToast: string | null = null
  /** Gold cards waiting to show, in the order they came: new badges and festival cards. */
  private badgeQueue: (BadgeId | GoldCard)[] = []
  /** The scene time the badge banner on screen is gone. */
  private badgeUntil = 0
  /** An old shop's "already has" toast, held until no summary covers the shop. */
  private foundToast: string | null = null
  /** What clearing an older shop's stairs spot did, held until no card, summary or mini-game covers the shop, so its toasts are seen. */
  private stairsNote: Extract<SimEvent, { type: 'stairsCleared' }> | null = null
  /** The inspection, held until nothing else is open or being played. */
  private inspectNote: Extract<SimEvent, { type: 'inspected' }> | null = null
  /** At a branch: the main shop's cards, kept aside untouched until the owner is back there. */
  private mainCards: SpaSceneData['mainCards'] = { badgeQueue: [], inspectNote: null }
  private patienceHintMs = 0
  private regularHintMs = 0
  private vipHintMs = 0
  /** Each customer's speech bubble; one that outlives its customer stays where it last was until it is done. */
  private bubbles = new Map<number, SpeechBubble>()
  private bubbleSpots = new Map<number, { x: number; y: number; floor: number }>()
  /** A line waiting for that customer's live bubble to finish. */
  private queuedLines = new Map<number, { text: string; ms: number }>()
  /** How long each waiting star has been quiet, in ms. */
  private humMs = new Map<number, number>()

  constructor() {
    super('SpaScene')
  }

  create(data?: SpaSceneData) {
    // a scene started without data gets an empty object; a switch of shops hands over the chain
    const switched = data?.chain ? data : null
    this.customers = new Map()
    this.pendingService = null
    this.holding = false
    this.modal = false
    this.tooNew = false
    this.bannerOnResume = false
    this.stairsNote = null
    this.inspectNote = null
    this.toastQueueAt = 0
    this.heldWearToast = null
    this.awayOpen = false
    this.heldAway = switched ? [...switched.heldAway] : []
    this.switching = false
    this.badgeQueue = []
    this.badgeUntil = 0
    this.foundToast = null
    this.tour = []
    this.patienceHintMs = 0
    this.regularHintMs = 0
    this.vipHintMs = 0
    this.bubbles = new Map()
    this.bubbleSpots = new Map()
    this.queuedLines = new Map()
    this.humMs = new Map()
    this.store = openStore()
    // the chain's save: the main shop's own leaves its branches out
    this.session = new SaveSession(this.store, () => this.chain.toSave(), () => location.reload())
    let saved: SaveData | null = null
    if (!switched) {
      try {
        saved = this.session.load()
      } catch (e) {
        if (!(e instanceof SaveTooNewError)) throw e
        this.showTooNew()
        return
      }
    }
    this.chain = switched?.chain ?? this.openChain(saved)
    this.sim = this.chain.active()
    this.mainCards = switched?.mainCards ?? { badgeQueue: [], inspectNote: null }
    // back at the main shop, its cards come out from where they were kept
    if (this.sim.place === null) {
      this.badgeQueue = [...this.mainCards.badgeQueue]
      this.inspectNote = this.mainCards.inspectNote
    }
    this.room = new RoomView(this, this.sim.place)
    this.room.setRank(this.sim.rank.stars)
    this.lastOwnerFloor = floorOf(this.sim.owner.pos.y)
    this.showFloor(this.lastOwnerFloor)
    this.owner = this.buildOwner()
    for (const c of this.sim.customers) this.addCustomerSprite(c)
    this.staffLayer = new StaffLayer(this, this.room)
    this.hud = new Hud(this, this.sim, () => this.pause(), () => this.openBuild(), () => this.openStaff(), () => this.openServices(), () => this.openBook(), () => this.openQuests(), () => this.openChainMap(), () => navIds(this.chain))
    this.floorBar = new FloorBar(this, HUD_DEPTH, floor => this.tapFloor(floor))
    this.pointer = new HandPointer(this)
    this.input.on('pointerup', this.onTap, this)

    // a shop is first written once it has an owner; until then the owner card holds it still, so nothing is lost
    const autosave = () => {
      if (this.chain.main.profileDone) this.session.saveNow()
    }
    this.time.addEvent({ delay: AUTOSAVE_MS, loop: true, callback: autosave })
    let hiddenAt: number | null = null
    const saveOnHide = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now()
        autosave()
      }
    }
    const saveOnLeave = () => autosave()
    document.addEventListener('visibilitychange', saveOnHide)
    window.addEventListener('pagehide', saveOnLeave)
    // back in the game: first the shop another page may have saved meanwhile, then a newer version
    const stopWatching = onReturn(() => {
      this.session.reloadIfChangedElsewhere()
      let paid = false
      if (this.session.open && this.chain.main.profileDone && hiddenAt !== null) {
        const back = this.chain.comeBack(Date.now() - hiddenAt)
        hiddenAt = null
        if (back.paid > 0) {
          paid = true
          this.heldAway.push(back)
          this.session.saveNow()
        } else if (back.tip) {
          this.badgeQueue.push(awayTip())
          this.session.saveNow()
        }
      }
      if (!paid && this.heldAway.length === 0 && !this.awayOpen) void this.checkForUpdate()
    })
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.removeEventListener('visibilitychange', saveOnHide)
      window.removeEventListener('pagehide', saveOnLeave)
      stopWatching()
    })

    if (switched) {
      // a switch of shops neither loads, pays time away nor pauses
      if (switched.arrived) this.arrive()
    }
    // a new shop
    else if (!saved) {
      this.openOwnerCard('new', () => {
        // a new shop on a phone asks once to be installed, before any progress could be lost
        if (installPlatform(currentInstallEnv()) && !this.store.flag('installCardSeen')) {
          this.store.setFlag('installCardSeen')
          this.bannerOnResume = true
          this.pause('install')
        } else this.showMorningBanner()
      })
    }
    // a shop from before owners picks its owner and name once, then reopens as usual
    else if (!this.sim.profileDone) {
      this.openOwnerCard('upgrade', () => {
        if (!this.sim.dayOver) this.pause()
      })
    }
    // a reopened shop is welcomed back, then waits on the pause card; an ended day reopens its summary by itself
    else {
      const back = this.chain.comeBack(saved.savedAt === null ? 0 : Date.now() - saved.savedAt)
      const pauseUnlessOver = () => {
        if (!this.sim.dayOver) this.pause()
      }
      if (back.paid > 0) {
        this.session.saveNow()
        this.showAway(back, pauseUnlessOver)
      } else {
        if (back.tip) {
          this.badgeQueue.push(awayTip())
          this.session.saveNow()
        }
        pauseUnlessOver()
      }
    }
    if (import.meta.env.DEV) Object.assign((window as any).__spa, { sim: this.sim, chain: this.chain, spa: this, store: this.store, session: this.session })
  }

  /** On arriving by a switch of shops: the shutter rolls up, then the owner is greeted, or told the branch has no technician yet. */
  private arrive(): void {
    this.modal = true
    this.switching = true
    this.shutter(this.sim.place, false, () => {
      this.modal = false
      this.switching = false
      const place = this.sim.place
      if (place === null) this.hud.toast(t('backMainToast'))
      else if (this.sim.hasTechnician()) this.hud.toast(t('arrivedToast', { place: placeName(place) }))
      else this.badgeQueue.push(noTechCard(place))
    })
  }

  /** The owner goes to `place`: the shutter closes over the frozen shop, then the chain switches, saves, and the scene starts again on the shop she is in. */
  private switchShop(place: PlaceId | null): void {
    // the shop she is in, one not open or a branch after closing time is not gone to
    if (this.chain.goProblem(place) !== null) return
    // nothing is tapped or played while it closes: a mini-game opened now would be left behind
    this.modal = true
    this.switching = true
    sound.play('chime')
    this.shutter(place, true, () => {
      const mainCards = this.sim.place === null ? { badgeQueue: this.badgeQueue, inspectNote: this.inspectNote } : this.mainCards
      this.chain.goTo(place)
      this.session.saveNow()
      // another page saved first: the session has closed and the page is reloading, so no new scene may open a session on that save
      if (!this.session.open) return
      const data: SpaSceneData = { chain: this.chain, mainCards, heldAway: this.heldAway, arrived: true }
      this.scene.restart(data)
    })
  }

  /** The roll-down shutter with the place's name on its sign: down over the shop, or up off it; `then` runs once it has rolled. Taps on it go nowhere. */
  private shutter(place: PlaceId | null, down: boolean, then: () => void): void {
    const y = down ? -GAME_H : 0
    const { sign } = SHUTTER
    const sheet = this.add.rectangle(0, y, GAME_W, GAME_H, hex(C.wood)).setOrigin(0).setInteractive()
    const art = this.add.graphics({ y }).lineStyle(6, hex(C.woodDark))
    for (let s = SHUTTER.slat; s < GAME_H; s += SHUTTER.slat) art.lineBetween(0, s, GAME_W, s)
    const signX = (GAME_W - sign.w) / 2
    const signY = (GAME_H - sign.h) / 2
    art.fillStyle(hex(C.goldPale), 1).fillRoundedRect(signX, signY, sign.w, sign.h, sign.r).lineStyle(5, hex(C.ink)).strokeRoundedRect(signX, signY, sign.w, sign.h, sign.r)
    const name = this.add.text(GAME_W / 2, y + GAME_H / 2, placeName(place), textStyle(64)).setOrigin(0.5)
    const parts = [sheet, art, name]
    for (const p of parts) p.setDepth(SHUTTER.depth)
    this.tweens.add({
      targets: parts,
      y: `${down ? '+' : '-'}=${GAME_H}`,
      duration: SHUTTER.ms,
      ease: down ? 'Cubic.easeIn' : 'Cubic.easeOut',
      onComplete: () => {
        if (!down) for (const p of parts) p.destroy()
        then()
      },
    })
  }

  /** A choice card over the frozen shop; the shop is free again once a button is tapped, before what the button does. */
  private choose(card: ChoiceText, onChoose: (i: number) => void): void {
    this.modal = true
    const data: ChoiceData = {
      card,
      owner: ownerColors(this.chain.main.ownerLook, this.chain.main.ownerOutfit),
      onChoose: i => {
        this.modal = false
        onChoose(i)
      },
    }
    this.scene.launch('ChoiceScene', data)
  }

  /** At a branch: once the owner is free at closing time, the card that sends her home; before then, a VIP, else a star, waiting at the main shop, once the shop is free. */
  private callOwner(place: PlaceId): void {
    const sim = this.sim
    if (this.modal || this.holding || sim.paused) return
    if (sim.clock.isClosed) {
      if (sim.servingCustomerId === null && sim.owner.task?.kind !== 'serve') this.choose(closingCard(place, sim.hasTechnician()), () => this.switchShop(null))
      return
    }
    if (!this.shopFree()) return
    const vip = this.chain.takeVipCall()
    const idol = vip ? null : this.chain.takeIdolCall()
    const card = vip ? vipCallCard(vip) : idol ? idolCallCard(idol) : null
    if (!card) return
    // "Về ngay" goes back; "Ở lại" leaves them waiting there as usual
    this.choose(card, i => {
      if (i === 0) this.switchShop(null)
    })
  }

  /** The welcome-back card over whatever is open; closing it puts `modal` back as it was, so a panel underneath stays frozen. */
  private showAway(back: AwayResult, then?: () => void): void {
    const wasModal = this.modal
    this.awayOpen = true
    this.modal = true
    const data: AwayData = {
      // the card's figures are the main shop's staff
      sim: this.chain.main,
      back,
      onDone: () => {
        this.awayOpen = false
        this.modal = wasModal
        this.floatMoneyAt(TOP_BAR.moneyX + 120, 250, back.paid, HUD_DEPTH + 40)
        then?.()
      },
    }
    this.scene.launch('AwayScene', data)
  }

  /** The slot was saved by a newer version: nothing runs and nothing is written; reloading fetches the newer version. */
  private showTooNew(): void {
    this.tooNew = true
    this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    addCard(this, 90, 800, 900, 520)
    this.add
      .text(GAME_W / 2, 880, t('saveTooNew'), { ...textStyle(42, '600'), align: 'center', wordWrap: { width: 780 } })
      .setOrigin(0.5, 0)
    addButton(this, GAME_W / 2, 1190, 720, 120, t('reload'), 'primary', () => location.reload())
  }

  private openChain(saved: SaveData | null): Chain {
    const seed = Date.now()
    if (saved) {
      try {
        return Chain.fromSave(saved, seed)
      } catch (e) {
        if (!(e instanceof SaveError)) throw e
        // kept for a later version that may read it, instead of being written over by the new shop
        this.session.setAside()
      }
    }
    // a new shop runs the starter chain
    return new Chain(new SpaSim({ rng: createRng(seed), starter: true }), seed)
  }

  /** Coming back to the game moves it to a newer version, unless a service or a lesson is in progress or the shop has no owner yet. */
  private async checkForUpdate(): Promise<void> {
    if (BUILD_ID === 'dev' || !this.sim.profileDone || this.sim.servingCustomerId !== null || this.scene.isActive('LessonScene')) return
    this.holding = true
    const latest = await latestVersion(UPDATE_WAIT_MS)
    if (shouldReload(BUILD_ID, latest, this.sim.servingCustomerId !== null, this.scene.isActive('LessonScene'))) this.session.reloadForUpdate()
    else this.holding = false
  }

  pause(panel: PausePanel = 'menu'): void {
    this.sim.paused = true
    const data: PauseData = {
      sim: this.sim,
      store: this.store,
      session: this.session,
      panel,
      onResume: () => this.resume(),
      onEditProfile: () => this.openOwnerCard('edit', () => this.pause()),
      save: () => this.chain.toSave(),
    }
    this.scene.launch('PauseScene', data)
  }

  private resume(): void {
    this.sim.paused = false
    if (this.bannerOnResume) {
      this.bannerOnResume = false
      this.showMorningBanner()
    }
    if (this.pendingService) {
      this.scene.launch(this.pendingService.scene, this.pendingService.data)
      this.pendingService = null
    }
  }

  private buildOwner(): CharacterView {
    return new CharacterView(this, ownerColors(this.sim.ownerLook, this.sim.ownerOutfit))
  }

  /** Draws the owner again from the sim's look and outfit. */
  rebuildOwner(): void {
    this.owner.container.destroy()
    this.owner = this.buildOwner()
  }

  /** Puts an outfit on the owner, at every shop, draws her in it and saves. */
  private wear(id: OutfitId): void {
    if (!this.chain.main.wearOutfit(id)) return
    this.chain.sync()
    this.rebuildOwner()
    this.heldWearToast = t('outfitWornToast', { name: t(OUTFIT_NAME[id]) })
    this.session.saveNow()
  }

  /** Opens the owner card over the shop; `after` runs once it closes. The owner and the shop's name are the main shop's, copied to every branch. */
  openOwnerCard(mode: OwnerMode, after: () => void): void {
    this.modal = true
    const main = this.chain.main
    const data: OwnerData = {
      mode,
      look: { ...main.ownerLook },
      name: main.shopName,
      outfit: main.ownerOutfit,
      sim: main,
      onWear: id => this.wear(id),
      onSave: (look, name) => {
        main.setProfile(look, name)
        this.chain.sync()
        this.rebuildOwner()
        this.session.saveNow()
      },
      onClose: () => {
        this.modal = false
        after()
      },
    }
    this.scene.launch('OwnerScene', data)
  }

  /** Build mode over the frozen shop; the build button opens it only while nothing else is open or being played. */
  private openBuild(): void {
    const sim = this.sim
    if (this.modal || this.holding || sim.paused || sim.dayOver || sim.servingCustomerId !== null) return
    this.modal = true
    const intro = !sim.hintDone('openBuild')
    sim.markHint('openBuild')
    if (sim.floors > 1) sim.markHint('openFloor')
    const data: BuildData = {
      sim,
      room: this.room,
      intro,
      onChange: () => {
        this.syncRoom()
        this.session.saveNow()
      },
      onClose: () => {
        this.modal = false
        this.session.saveNow()
      },
      showFloor: floor => this.showFloor(floor),
    }
    this.scene.launch('BuildScene', data)
  }

  /** The staff panel over the frozen shop, opened only when build mode would be. */
  private openStaff(): void {
    const sim = this.sim
    if (this.modal || this.holding || sim.paused || sim.dayOver || sim.servingCustomerId !== null) return
    this.modal = true
    const intro = !sim.hintDone('openStaff')
    sim.markHint('openStaff')
    const studyIntro = !intro && !sim.hintDone('study') && sim.staff.some(s => s.role === 'technician' && !s.leaving)
    if (studyIntro) sim.markHint('study')
    const data: StaffData = {
      sim,
      chain: this.chain,
      intro,
      studyIntro,
      onChange: () => this.session.saveNow(),
      onClose: () => {
        this.modal = false
        this.session.saveNow()
      },
    }
    this.scene.launch('StaffScene', data)
  }

  /** The services panel over the frozen shop, opened only when build mode would be. */
  private openServices(): void {
    const sim = this.sim
    if (this.modal || this.holding || sim.paused || sim.dayOver || sim.servingCustomerId !== null) return
    this.modal = true
    const intro = !sim.hintDone('openServices')
    sim.markHint('openServices')
    const stock = isUnlocked('stock', sim.day)
    const stockIntro = stock && !sim.hintDone('openStock')
    const { tab, page } = servicesOpening(sim, stock, stockIntro)
    if (stock) sim.markHint('openStock')
    const recipesIntro = !intro && tab === 'services' && sim.benchOpen() && !sim.hintDone('recipes')
    const data: ServicesData = {
      sim,
      intro,
      tab,
      page,
      stockIntro,
      recipesIntro,
      // a lesson passed opens its service at every branch, so the save written now already has it
      onChange: () => {
        this.chain.sync()
        this.session.saveNow()
      },
      onClose: () => {
        if (recipesIntro) sim.markHint('recipes')
        this.modal = false
        // a service the main shop opened is the branches' too
        this.chain.sync()
        this.session.saveNow()
      },
    }
    this.scene.launch('ServicesScene', data)
  }

  /** The guest book over the frozen shop, opened only when build mode would be. */
  private openBook(): void {
    const sim = this.sim
    if (!sim.bookShown() || this.modal || this.holding || sim.paused || sim.dayOver || sim.servingCustomerId !== null) return
    this.modal = true
    const hint = sim.bookHint()
    const intro = hint === 'openBook' && !sim.hintDone(hint)
    sim.markHint(hint)
    const data: GuestBookData = {
      sim,
      intro,
      onClose: () => {
        this.modal = false
        this.session.saveNow()
      },
    }
    this.scene.launch('GuestBookScene', data)
  }

  /** The chain's map over the frozen shop, opened only when build mode would be: open a branch there, or go to another shop. */
  private openChainMap(): void {
    const sim = this.sim
    if (this.modal || this.holding || sim.paused || sim.dayOver || sim.servingCustomerId !== null) return
    this.modal = true
    this.chain.main.markHint('openChain')
    const data: ChainData = {
      chain: this.chain,
      onOpen: place => {
        if (this.chain.open(place)) return
        sound.play('levelUp')
        this.session.saveNow()
      },
      // the map goes without its onClose, so the shop stays frozen until the shutter has rolled up over the next one
      onGo: place => {
        this.scene.stop('ChainScene')
        this.switchShop(place)
      },
      onClose: () => {
        this.modal = false
        this.session.saveNow()
      },
    }
    this.scene.launch('ChainScene', data)
  }

  /** The hand over a bottom-bar button, if the bar has it. */
  private pointOnPlate(text: string, id: NavId): void {
    const top = this.hud.plateTop(id)
    if (top) this.pointer.show(text, top.x, top.y, 'down')
  }

  /** The quest panel over the frozen shop, opened only when build mode would be; the starter chain's list until the daily quests open. */
  private openQuests(): void {
    const sim = this.sim
    if (this.modal || this.holding || sim.paused || sim.dayOver || sim.servingCustomerId !== null) return
    this.modal = true
    if (!sim.questsOpen()) {
      sim.markHint('openStarter')
      const data: StarterData = {
        sim,
        onClose: () => {
          this.modal = false
          this.session.saveNow()
        },
      }
      this.scene.launch('StarterScene', data)
      return
    }
    const intro = !sim.hintDone('openQuests')
    sim.markHint('openQuests')
    sim.markQuestsSeen()
    const data: QuestsData = {
      sim,
      intro,
      onWear: id => this.wear(id),
      onClose: () => {
        this.modal = false
        this.session.saveNow()
      },
    }
    this.scene.launch('QuestsScene', data)
  }

  /** Shows the toast once the one before it has had LATE_TOAST_MS on screen, after any toast already queued here. */
  private queueToast(text: string): void {
    const now = this.time.now
    const at = Math.max(now, this.hud.lastToastAt + LATE_TOAST_MS, this.toastQueueAt)
    this.toastQueueAt = at + LATE_TOAST_MS
    this.time.delayedCall(at - now, () => this.hud.toast(text))
  }

  /**
   * Sends out the held found toast, and the next badge's banner once the one before it and the morning banner are gone.
   * Both wait while the summary, the pause card or a mini-game covers the shop, so a day-end badge is seen the next morning.
   */
  private pumpBadges(): void {
    const sim = this.sim
    if (sim.dayOver || sim.paused || sim.servingCustomerId !== null) return
    if (this.foundToast) {
      // after this morning's month, VIP and stairs toasts, which are spaced the same way
      const text = this.foundToast
      this.time.delayedCall(this.studiedToastMs, () => this.hud.toast(text))
      this.studiedToastMs += LATE_TOAST_MS
      this.foundToast = null
    }
    const now = this.time.now
    const next = this.badgeQueue[0]
    // nor while the first day's tour points at the top bar, where the card goes
    if (next === undefined || this.tour.length > 0 || now < Math.max(this.badgeUntil, this.hud.lastBannerAt + BANNER_MS)) return
    this.badgeQueue.shift()
    this.badgeUntil = now + this.showCard(next)
  }

  /**
   * A gold card under the top bar: a new badge's medal, "Huy hiệu mới", its name and what it asked, or a festival card's picture and words.
   * A long heading or name is drawn smaller to fit; a long line wraps and the card grows under it, and stays longer to be read.
   * It plays the level-up sound, unless the card is a quiet morning notice, and returns how long it stays.
   */
  private showCard(next: BadgeId | GoldCard): number {
    const card: Omit<GoldCard, 'icon'> =
      typeof next === 'string' ? { head: t('badgeNew'), name: t(BADGE_TEXT[next].name), line: t(BADGE_TEXT[next].cond) } : next
    const fit = (text: Phaser.GameObjects.Text) => text.setScale(Math.min(1, BADGE_CARD.textW / text.width))
    const head = fit(this.add.text(BADGE_CARD.textX, 300, card.head, textStyle(32, '800', C.terracotta)).setOrigin(0, 0.5))
    const name = fit(this.add.text(BADGE_CARD.textX, 352, card.name, textStyle(50)).setOrigin(0, 0.5))
    const line = this.add.text(BADGE_CARD.textX, 0, card.line, { ...textStyle(28, '600', C.soft), wordWrap: { width: BADGE_CARD.textW } })
    // the first line sits where a badge's one line always did
    line.setY(400 - line.height / line.getWrappedText().length / 2)
    const h = Math.max(BADGE_CARD.h, line.y + line.height + BADGE_CARD.bottomPad - BADGE_CARD.y)
    const iconY = BADGE_CARD.y + h / 2
    const bg = this.add
      .graphics()
      .fillStyle(hex(C.goldPale), 1)
      .fillRoundedRect(BADGE_CARD.x, BADGE_CARD.y, BADGE_CARD.w, h, BADGE_CARD.r)
      .lineStyle(5, hex(C.ink))
      .strokeRoundedRect(BADGE_CARD.x, BADGE_CARD.y, BADGE_CARD.w, h, BADGE_CARD.r)
    const icon: Phaser.GameObjects.GameObject[] = []
    if (typeof next === 'string') icon.push(addMedal(this, next, BADGE_CARD.medalX, iconY, { got: true, ring: null }))
    else {
      const disc = this.add.circle(BADGE_CARD.medalX, iconY, BADGE_CARD.discR, hex(next.icon.disc)).setStrokeStyle(5, hex(C.ink))
      const picture = this.add.image(BADGE_CARD.medalX, iconY, next.icon.texture)
      picture.setScale(BADGE_CARD.icon / Math.max(picture.width, picture.height))
      if (next.icon.tint) picture.setTint(hex(next.icon.tint))
      icon.push(disc, picture)
    }
    const box = this.add
      .container(0, 0, [bg, ...icon, head, name, line])
      .setDepth(HUD_DEPTH + 60)
      .setAlpha(0)
    if (typeof next === 'string' || !next.quiet) sound.play('levelUp')
    const ms = goldCardMs(line.getWrappedText().length)
    this.tweens.chain({
      targets: box,
      tweens: [
        { alpha: 1, duration: BADGE_FADE_MS },
        { alpha: 0, delay: ms - 2 * BADGE_FADE_MS, duration: BADGE_FADE_MS },
      ],
      onComplete: () => box.destroy(),
    })
    return ms
  }

  /** The held stairs note, a toast at a time after any morning toasts. */
  private showStairsNote(): void {
    const texts = stairsToasts(this.stairsNote!)
    this.stairsNote = null
    for (const text of texts) {
      this.time.delayedCall(this.studiedToastMs, () => this.hud.toast(text))
      this.studiedToastMs += LATE_TOAST_MS
    }
  }

  /** The inspector at the floor-1 door and the inspection card over the frozen shop; Xong pays out and lets the shop run again. */
  private showInspection(): void {
    const result = this.inspectNote!
    this.inspectNote = null
    this.modal = true
    if (this.viewFloor !== 1) this.showFloor(1)
    const door = this.room.tileToWorld(this.sim.grid.door)
    const inspector = new CharacterView(this, inspectorColors())
    inspector.container.setPosition(door.x, door.y).setDepth(door.y)
    const data: InspectData = {
      result,
      onDone: () => {
        inspector.container.destroy()
        this.modal = false
        if (result.reward > 0) this.floatMoneyAt(TOP_BAR.moneyX + 120, 250, result.reward, HUD_DEPTH + 40)
        if (result.cert) this.queueToast(t('certToast'))
        this.session.saveNow()
      },
    }
    this.scene.launch('InspectScene', data)
  }

  /** Nothing else is asking for the player: no card, mini-game, customer being served, badge or morning banner. */
  private shopFree(): boolean {
    const { sim, time } = this
    return (
      !this.modal && !this.holding && !sim.paused && !sim.dayOver && sim.servingCustomerId === null && this.inspectNote === null && this.badgeQueue.length === 0 && time.now >= this.badgeUntil && time.now >= this.hud.lastBannerAt + BANNER_MS
    )
  }

  /** The Áo mới card for the highest outfit just unlocked; either button counts all of them as seen. */
  private showNewOutfits(): void {
    const ids = this.sim.newOutfits()
    if (ids.length === 0) return
    const id = ids[ids.length - 1]
    this.modal = true
    const done = (wear: boolean) => () => {
      this.sim.markOutfitsSeen(ids)
      this.modal = false
      if (wear) this.wear(id)
      this.session.saveNow()
    }
    const data: NewOutfitData = { sim: this.sim, id, more: ids.length - 1, onLater: done(false), onWear: done(true) }
    this.scene.launch('NewOutfitScene', data)
  }

  /** The judging evening's cards, month then year, each from the results the sim saved (it paid them already, so a reload shows the same and pays nothing); then the next day starts. */
  private showRankCards(): void {
    const { sim } = this
    const month = sim.rank.last?.day === sim.day ? sim.rank.last : null
    const year = sim.rank.lastYear?.day === sim.day ? sim.rank.lastYear : null
    const begin = () => {
      sound.startOfDay()
      sim.markHint('summary')
      this.chain.startDay()
      this.showFloor(1)
      this.session.saveNow()
      this.showMorningBanner()
      const reward = (month?.reward ?? 0) + (year?.reward ?? 0)
      if (reward > 0) this.floatMoneyAt(TOP_BAR.moneyX + 120, 250, reward, HUD_DEPTH + 40)
      if (month && month.after > month.before) {
        // after the VIP toast and before the month's (which the next update sends, timed by what this leaves)
        const text = t('rankUpToast', { n: month.after })
        const at = this.studiedToastMs + LATE_TOAST_MS
        this.time.delayedCall(at, () => this.hud.toast(text))
        this.studiedToastMs = at + LATE_TOAST_MS
        this.room.setRank(month.after)
      }
    }
    const launch = (kind: 'month' | 'year', onDone: () => void) => {
      const data: RankData = { sim, kind, onDone }
      this.scene.launch('RankScene', data)
    }
    const yearCard = () => (year ? launch('year', begin) : begin())
    if (month) launch('month', yearCard)
    else yearCard()
  }

  private showMorningBanner(): void {
    this.hud.banner(t('morningBanner', { name: this.sim.shopName, day: this.sim.day }))
    const [first, ...rest] = todayToasts(this.sim.vip, this.sim.idol, this.sim.day)
    if (first !== undefined) this.hud.toast(first)
    this.studiedToastMs = first !== undefined ? LATE_TOAST_MS : 0
    for (const text of rest) this.queueToast(text)
  }

  /** Brings a floor into view, the one place that does, and draws its furniture. */
  private showFloor(floor: number): void {
    this.viewFloor = floor
    this.room.setFloor(floor, this.sim.floors, this.sim.maxFloors())
    this.syncRoom()
  }

  /** The top-centre tile of every machine bed, for its off mark while the power is out. */
  private machineBeds(): Tile[] {
    const kinds = MACHINES.map(id => SERVICES[id].bed)
    return this.sim.items.filter(i => kinds.includes(i.kind)).map(i => ({ x: i.x + ITEMS[i.kind].w / 2, y: i.y }))
  }

  /** The floor a customer is shown on: the street, where arrivals and leavers walk, counts as floor 1. */
  private floorOfCustomer(c: Customer): number {
    return this.streetPlacement(c) ? 1 : floorOf(c.pos.y)
  }

  /** Draws the furniture as the sim has it, and a bed slot wherever a bed would fit. */
  private syncRoom(): void {
    const sim = this.sim
    this.room.sync(sim.items, sim.grid.bedSlots.map(tile => ({ tile, open: sim.canPlace('bed', tile.x, tile.y, false) === null })))
  }

  /** The floor buttons show whenever the shop is free to tap: not under a card, a pause, build mode or a mini-game, nor while waiting on an update check. */
  private updateFloorBar(): void {
    const sim = this.sim
    if (!showPills(sim) || this.modal || this.holding || sim.paused || sim.dayOver || sim.servingCustomerId !== null) {
      this.floorBar.hide()
      return
    }
    this.floorBar.show(pills(sim, this.viewFloor), sim.ownerLook)
  }

  /** A viewed or open pill brings its floor into view; a locked one offers to open it. Nothing while waiting on an update check, which hides the pills on its next frame. */
  private tapFloor(floor: number): void {
    if (this.holding) return
    if (floor <= this.sim.floors) this.showFloor(floor)
    else this.offerFloor(floor)
  }

  /** A card over the frozen shop to open a floor, or why it cannot be opened yet. */
  private offerFloor(floor: number): void {
    const sim = this.sim
    const problem = sim.floorProblem(floor)
    if (problem === 'max') return
    const price = FLOOR_PRICE[floor]
    const note = problem === 'order' ? t('floorOrder') : problem === 'blocked' ? t('floorBlocked') : null
    const canOpen = problem === null
    this.modal = true
    const close = () => {
      for (const p of parts) p.destroy()
      this.modal = false
    }
    const open = () => {
      close()
      if (sim.openFloor(floor)) return
      sound.play('thud')
      this.showFloor(floor)
      this.syncRoom()
      this.session.saveNow()
    }
    const parts: (Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Depth)[] = [
      this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive(),
      addCard(this, 90, 760, 900, 640),
      this.add.text(GAME_W / 2, 810, t(`floorName${floor}` as StringKey), textStyle(60, '800')).setOrigin(0.5, 0),
      this.add.text(GAME_W / 2, 910, `${t(`floorLine${floor}a` as StringKey)}
${t(`floorLine${floor}b` as StringKey)}`, { ...textStyle(44, '600'), align: 'center', wordWrap: { width: 780 } }).setOrigin(0.5, 0),
    ]
    if (note) parts.push(this.add.text(GAME_W / 2, 1130, note, { ...textStyle(48, '800', C.lantern), align: 'center', wordWrap: { width: 780 } }).setOrigin(0.5, 0))
    // the open button is wide enough for its price; "Để sau" beside it is narrower, so the pair keeps even margins inside the card
    const openX = GAME_W / 2 + 165
    parts.push(addButton(this, note ? GAME_W / 2 : GAME_W / 2 - 245, 1290, note ? 340 : 300, 120, t('floorLater'), 'plain', close))
    if (!note) {
      const openBtn = addButton(this, openX, 1290, 460, 120, t('floorOpen', { money: formatMoney(price) }), 'primary', canOpen ? open : () => {}, 44)
      parts.push(openBtn)
      if (problem === 'money') {
        openBtn.setAlpha(0.45)
        parts.push(this.add.text(openX, 1370, t('floorShort', { money: formatMoney(price - sim.money) }), textStyle(34, '600', C.lantern)).setOrigin(0.5, 0))
      }
    }
    for (const p of parts) p.setDepth(CARD_DEPTH)
  }

  /** A tap on an open bed slot: once building is open and the money is there, a card over the frozen shop asks before buying. */
  private offerBed(slot: Tile): void {
    const price = ITEMS.bed.price
    if (!this.sim.featureOpen('build')) {
      this.hud.toast(lockedText(this.sim, 'build'))
      return
    }
    if (this.sim.money < price) {
      this.hud.toast(t(PROBLEM_TEXT.money, { money: formatMoney(price - this.sim.money) }))
      return
    }
    this.modal = true
    const close = () => {
      for (const p of parts) p.destroy()
      this.modal = false
    }
    const buy = () => {
      close()
      const problem = this.sim.buy('bed', slot.x, slot.y, false)
      if (problem) {
        this.hud.toast(t(PROBLEM_TEXT[problem], { money: formatMoney(price - this.sim.money) }))
        return
      }
      sound.play('thud')
      this.syncRoom()
      this.session.saveNow()
    }
    const text = t('quickBuyBed', { money: formatMoney(price) })
    const parts = [
      this.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive(),
      addCard(this, 90, 860, 900, 440),
      this.add.text(GAME_W / 2, 950, text, { ...textStyle(48, '800'), align: 'center', wordWrap: { width: 720 } }).setOrigin(0.5, 0),
      addButton(this, GAME_W / 2 - 190, 1170, 340, 120, t('cancel'), 'plain', close),
      addButton(this, GAME_W / 2 + 190, 1170, 340, 120, t('buy'), 'primary', buy),
    ]
    for (const p of parts) p.setDepth(CARD_DEPTH)
  }

  update(time: number, delta: number) {
    if (this.tooNew) return
    // over a panel too, so it does not wait for the panel to close; not over a lesson game, which has no serving customer
    if (this.heldAway.length > 0 && this.sim.servingCustomerId === null && !this.scene.isActive('LessonScene') && !this.scene.isActive('ScrubScene') && !this.scene.isActive('FootScene') && !this.scene.isActive('NailsScene') && !this.holding && !this.awayOpen && !this.switching) this.showAway(this.heldAway.shift()!)
    if (!this.modal) {
      if (this.heldWearToast && !this.sim.paused && this.sim.servingCustomerId === null) {
        this.queueToast(this.heldWearToast)
        this.heldWearToast = null
      }
      if (!this.holding) this.chain.update(delta)
      // at the main shop, the cards it kept while the owner was away come first
      const events = [...(this.sim.place === null ? this.chain.takeHeld() : []), ...this.sim.drainEvents()]
      for (const e of events) this.handle(e)
      // two items can run low on the same customer: one toast, or the first would be destroyed unseen
      const low = events.flatMap(e => (e.type === 'stockLow' ? [e.item] : []))
      if (low.length > 0) this.queueToast(stockLowText(low))
      if (this.stairsNote && !this.sim.paused && !this.sim.dayOver && this.sim.servingCustomerId === null) this.showStairsNote()
      // a card opened by this frame's events (a bed slot's) goes first; a badge card waits for whichever card is up, rather than play under it
      if (this.inspectNote && !this.modal && !this.holding && !this.sim.paused && !this.sim.dayOver && this.sim.servingCustomerId === null) this.showInspection()
      if (!this.modal) this.pumpBadges()
      if (!this.modal && this.shopFree()) this.showNewOutfits()
      // once, when the main shop has the stars for a chain: the card that opens it, after whatever cards came first
      if (this.sim.place === null && this.shopFree() && this.chain.shouldTell()) {
        this.badgeQueue.push(unlockCard())
        this.chain.told = true
        this.session.saveNow()
      }
      if (this.sim.place !== null) this.callOwner(this.sim.place)
    }

    // never under build mode or a card, where the player may be looking at another floor on purpose
    if (!this.modal) {
      const follow = followFloor(this.sim, this.viewFloor, this.lastOwnerFloor)
      if (follow !== this.viewFloor) this.showFloor(follow)
    }
    this.lastOwnerFloor = floorOf(this.sim.owner.pos.y)

    const dt = this.sim.paused || this.modal ? 0 : delta
    const o = this.sim.owner
    const at = this.room.tileToWorld(o.pos)
    // on the stairs, the owner rises toward the next floor and fades
    const climb = climbPose(o)
    if (climb) at.y -= climb.lift * TILE
    // serving: face the bed beside the work tile
    const task = o.task
    const station = task?.kind === 'serve' && o.path.length === 0 ? this.sim.stations.find(s => s.id === task.stationId) : undefined
    this.owner.setFacing(station ? (station.bed.x < station.work.x ? 'left' : 'right') : o.facing)
    this.owner.setPose(o.path.length > 0 ? 'walk' : 'stand')
    this.owner.container.setPosition(at.x, at.y).setDepth(at.y).setAlpha(climb?.alpha ?? 1).setVisible(this.room.onFloor(o.pos.y))
    this.owner.update(dt)

    // a badge tells which service a waiting customer wants once the shop offers more than one
    const badges = this.sim.availableServices().length > 1
    for (const c of this.sim.customers) {
      const s = this.customers.get(c.id)
      if (s) this.syncCustomer(c, s, time, dt, badges)
    }
    // staff also hold still while the owner plays, as the sim does
    this.staffLayer.update(this.sim, this.sim.servingCustomerId !== null ? 0 : dt)
    this.moveBubbles()
    this.humStars(dt)
    // festivals are the main shop's
    this.room.setFestival(this.sim.place === null ? festivalOf(this.sim.day) : null)
    this.room.setRival(rivalToday(this.sim.eventBook, this.sim.day))
    this.room.setPowerOut(this.sim.powerOut(), this.sim.powerOut() ? this.machineBeds() : [])
    this.hud.update(this.modal)
    this.updateFloorBar()
    this.updatePointer(delta)
  }

  /** One hint at a time: the money and star pointers after the first payment first, then the waiting customers, then the build or staff button. */
  private updatePointer(delta: number): void {
    const sim = this.sim
    if (sim.paused || sim.dayOver || sim.servingCustomerId !== null || this.modal || this.holding) {
      this.pointer.hide()
      return
    }

    const step = this.tour[0]
    if (step) {
      if (step.hint === 'money') this.pointer.show(t('hintMoney'), TOP_BAR.moneyX + 80, TOP_ROW_TIP_Y, 'up')
      else this.pointer.show(t('hintStar'), this.hud.starX, TOP_ROW_TIP_Y, 'up')
      step.ms -= delta
      if (step.ms <= 0) this.tour.shift()
      return
    }

    // from the card that opens the chain until the map is first opened
    if (sim.place === null && this.chain.told && !this.chain.main.hintDone('openChain')) {
      this.pointOnPlate(t('unlockName'), 'chain')
      return
    }

    const pick = pickHint(sim)
    if (pick?.hint === 'openBuild') {
      this.pointOnPlate(t('hintBuild'), 'build')
      return
    }
    if (pick?.hint === 'placeGift') {
      this.pointOnPlate(t('hintPlaceGift'), 'build')
      return
    }
    if (pick?.hint === 'openFloor') {
      this.pointOnPlate(t('hintOpenFloor'), 'build')
      return
    }
    if (pick?.hint === 'openStaff') {
      this.pointOnPlate(t('hintStaff'), 'staff')
      return
    }
    if (pick?.hint === 'openServices') {
      this.pointOnPlate(t('hintServices'), 'services')
      return
    }
    if (pick?.hint === 'openStock') {
      this.pointOnPlate(t('hintStock'), 'services')
      return
    }
    if (pick?.hint === 'openQuests') {
      this.pointOnPlate(t('hintQuests'), 'quests')
      return
    }
    if (pick?.hint === 'openBook') {
      this.pointer.show(t(bookOpen(this.sim.book) ? 'hintBook' : 'hintBookVip'), BOOK_BUTTON.x, BOOK_BUTTON.y + 40, 'up')
      return
    }
    const at = pick && this.customers.get(pick.customerId)?.view.container
    if (!pick || !at || !at.visible) {
      this.pointer.hide()
      return
    }
    if (pick.hint === 'tapCustomer') {
      this.pointer.show(t('hintTapCustomer'), at.x, at.y - CHARACTER_HEIGHT_PX - 10, 'down')
      return
    }
    if (pick.hint === 'regular') {
      this.pointer.show(t('hintRegular'), at.x, at.y + PATIENCE_BAR_TOP, 'down')
      this.regularHintMs += delta
      if (this.regularHintMs >= PATIENCE_HINT_MS) sim.markHint('regular')
      return
    }
    if (pick.hint === 'vip') {
      this.pointer.show(t('hintVip'), at.x, at.y + PATIENCE_BAR_TOP, 'down')
      this.vipHintMs += delta
      if (this.vipHintMs >= PATIENCE_HINT_MS) sim.markHint('vip')
      return
    }
    this.pointer.show(t('hintPatience'), at.x, at.y + PATIENCE_BAR_TOP, 'down')
    this.patienceHintMs += delta
    if (this.patienceHintMs >= PATIENCE_HINT_MS) sim.markHint('patience')
  }

  private handle(e: SimEvent): void {
    const cue = cueFor(e)
    if (cue) sound.play(cue)
    switch (e.type) {
      case 'customerArrived': {
        const c = this.sim.customers.find(x => x.id === e.id)
        if (c) this.addCustomerSprite(c)
        return
      }
      case 'customerLeft': {
        const s = this.customers.get(e.id)
        if (!s) return
        s.view.container.destroy()
        s.bar.destroy()
        s.badge.destroy()
        s.ripple.destroy()
        s.bubble?.destroy()
        s.heart.destroy()
        s.vipStar.destroy()
        s.steam.destroy()
        s.stones.destroy()
        this.customers.delete(e.id)
        if (!this.bubbles.has(e.id)) this.bubbleSpots.delete(e.id)
        return
      }
      case 'serviceReady': {
        const c = this.sim.customers.find(x => x.id === e.customerId)
        if (!c) return
        const scene = MINI_GAME_SCENE[c.service]
        const demo = DEMO_HINT[c.service]
        const data: MiniGameData = {
          look: c.look,
          kind: c.kind,
          idol: c.idol ?? undefined,
          extraMs: dayEase(this.sim.day).miniGameExtraMs,
          hard: c.vip !== null || c.idol !== null || KINDS[c.kind].hard,
          demo: !this.sim.hintDone(demo),
          onDone: stars => {
            this.sim.markHint(demo)
            this.sim.completeService(c.id, stars)
          },
        }
        if (this.sim.paused) this.pendingService = { scene, data }
        else this.scene.launch(scene, data)
        return
      }
      case 'paid':
        this.floatMoney(e.tile, e.amount + e.tip)
        // the first payment ever points out the money, then the star; marked now so a reload never repeats them
        if (!this.sim.hintDone('money')) {
          this.sim.markHint('money')
          this.sim.markHint('star')
          this.tour = [
            { hint: 'money', ms: TOUR_STEP_MS },
            { hint: 'star', ms: TOUR_STEP_MS },
          ]
        }
        return
      case 'generous':
        // the extra a beat after the bill's coin, so the two do not stack, and over the customer's word for it (speech sits at FX_DEPTH + 20)
        this.time.delayedCall(600, () => this.floatMoney({ ...e.tile }, e.amount, FX_DEPTH + 30))
        this.say(e.customerId, GENEROUS_LINES[e.customerId % GENEROUS_LINES.length], BUBBLE_MS.greet)
        return
      case 'review':
        this.showBubble(e.customerId, e.score)
        return
      case 'regularArrived': {
        const r = REGULAR_TEXT[e.regular]
        const text = e.first ? r.intro : t('greetingLine', { name: r.name, text: GREETINGS[e.customerId % GREETINGS.length] })
        this.say(e.customerId, text, BUBBLE_MS.greet)
        return
      }
      case 'vipArrived':
        this.say(e.customerId, VIP_TEXT[e.vip].arrive, BUBBLE_MS.story)
        return
      case 'vipServed': {
        const name = VIP_TEXT[e.vip].name
        if (e.stars === 3) this.say(e.customerId, VIP_TEXT[e.vip].thanks, BUBBLE_MS.story)
        if (e.photo) this.hud.toast(t('vipPhotoToast', { name }))
        // queued after the photo toast, which a toast right now would overwrite, and ahead of a quest it finished
        if (e.board) this.queueToast(t('vipBoardToast'))
        return
      }
      case 'idolArrived':
        this.say(e.customerId, IDOL_TEXT[e.idol].arrive, BUBBLE_MS.story)
        return
      case 'idolServed': {
        if (e.stars === 3) this.say(e.customerId, IDOL_TEXT[e.idol].thanks, BUBBLE_MS.story)
        if (e.photo) this.hud.toast(t('vipPhotoToast', { name: IDOL_TEXT[e.idol].name }))
        if (e.wall) this.queueToast(t('idolWallToast'))
        return
      }
      case 'heart': {
        const r = REGULAR_TEXT[e.regular]
        this.say(e.customerId, r.story[e.hearts - 1], BUBBLE_MS.story)
        this.floatHeart(e.customerId)
        if (e.member) this.hud.toast(t('memberToast', { name: r.name }))
        return
      }
      case 'recipeHint': {
        const line = RECIPE_HINT_TEXT[e.recipe][e.ingredient]
        if (line) this.sayNext(e.customerId, line, BUBBLE_MS.story)
        return
      }
      case 'gift': {
        const name = REGULAR_TEXT[e.regular].name
        const g = e.gift
        if (g.kind === 'money') {
          const tile = this.sim.customers.find(x => x.id === e.customerId)?.pos
          // a beat after the pay coin of the same moment, so the two do not stack
          if (tile) this.time.delayedCall(600, () => this.floatMoney({ ...tile }, g.amount))
          this.hud.toast(t('giftMoneyToast', { name, money: formatMoney(g.amount) }))
        } else if (g.kind === 'item') this.hud.toast(t('giftItemToast', { name }))
        else if (g.kind === 'regular') this.hud.toast(t('giftFriendToast', { friend: REGULAR_TEXT[g.who].name }))
        else this.hud.toast(t('giftExtraToast', { name }))
        return
      }
      case 'bookPage':
        // queued after the gift toast, which a toast right now would overwrite, and ahead of a quest it finished
        this.queueToast(t('bookPageToast'))
        return
      case 'greeted':
      case 'levelUp':
      case 'sloppy':
        this.staffLayer.handle(e, this.sim)
        return
      case 'studied': {
        this.staffLayer.handle(e, this.sim)
        const person = this.sim.staff.find(s => s.id === e.staffId)
        if (!person) return
        const text =
          e.course === 'greet'
            ? t('studiedGreetToast', { name: person.name, n: e.level })
            : t('studiedToast', { name: person.name, course: courseName(e.course), n: e.level })
        // one at a time: a toast replaces the one on screen
        this.time.delayedCall(this.studiedToastMs, () => this.hud.toast(text))
        this.studiedToastMs += LATE_TOAST_MS
        return
      }
      case 'studyRefunded': {
        const person = this.sim.staff.find(s => s.id === e.staffId)
        if (!person) return
        const text = t('studyRefundToast', { name: person.name, money: formatMoney(e.amount) })
        this.time.delayedCall(this.studiedToastMs, () => this.hud.toast(text))
        this.studiedToastMs += LATE_TOAST_MS
        return
      }
      case 'toast':
        this.hud.toast(t(e.key))
        return
      case 'stockLow':
        return
      case 'stockOut':
        this.hud.toast(t('stockOut', { item: t(STOCK_NAME[e.item]).toLocaleLowerCase('vi') }))
        return
      case 'roomChanged':
        this.syncRoom()
        return
      case 'floorOpened':
        this.showFloor(e.floor)
        return
      case 'stairsCleared':
        // it comes as the shop loads, under the pause card, the owner card or the day's summary; update shows it once they are gone
        this.stairsNote = e
        return
      case 'bedSlot':
        this.offerBed(e.slot)
        return
      case 'questDone':
        this.floatMoneyAt(TOP_BAR.moneyX + 120, 250, e.quest.reward, HUD_DEPTH + 40)
        this.queueToast(t('questDoneToast', { name: questTitle(e.quest), money: formatMoney(e.quest.reward) }))
        return
      case 'badge':
        this.badgeQueue.push(e.id)
        return
      case 'festivalStarted':
        this.badgeQueue.push(festivalStartCard(e, monthOf(this.sim.day)))
        return
      case 'goalDone':
        if (e.reward > 0) this.floatMoneyAt(TOP_BAR.moneyX + 120, 250, e.reward, HUD_DEPTH + 40)
        this.badgeQueue.push(goalCard(e))
        return
      case 'festivalQuestDone':
        this.floatMoneyAt(TOP_BAR.moneyX + 120, 250, e.quest.reward, HUD_DEPTH + 40)
        this.badgeQueue.push(festivalDoneCard(e))
        return
      case 'eventToday':
        this.badgeQueue.push(eventCard(e.plan, this.sim.rivalTarget()))
        return
      case 'hotStarted':
        this.badgeQueue.push(hotCard(this.sim.eventBook.hotBy))
        return
      case 'kolArrived':
        this.queueToast(t('kolArrivedToast'))
        return
      case 'kolPosted':
        this.queueToast(t('kolPostedToast'))
        return
      case 'kolLeft':
        this.queueToast(t('kolLeftToast'))
        return
      case 'inspected':
        this.inspectNote = e
        return
      case 'rivalBeaten':
        this.floatMoneyAt(TOP_BAR.moneyX + 120, 250, e.reward, HUD_DEPTH + 40)
        this.badgeQueue.push(rivalBeatenCard(e))
        return
      case 'powerWarn':
        this.queueToast(powerWarnText(e.machines))
        return
      case 'powerOff':
        this.queueToast(t('powerOffToast'))
        return
      case 'powerOn':
        this.queueToast(t('powerOnToast'))
        return
      case 'badgesFound':
        this.foundToast = t('badgesFoundToast', { n: e.n })
        return
      case 'monthStarted': {
        const text = monthToast(e, this.sim.festival.keepsakes)
        this.time.delayedCall(this.studiedToastMs, () => this.hud.toast(text))
        this.studiedToastMs += LATE_TOAST_MS
        return
      }
      case 'dayEnded': {
        // a branch's day ends behind its closing card; the summary is the main shop's, once every branch is done too
        if (this.sim.place !== null) return
        this.chain.finishDay()
        this.session.saveNow()
        const data: SummaryData = {
          sim: this.sim,
          firstDay: !this.sim.hintDone('summary'),
          chain: this.chain.branches.length ? this.chain.dayRows() : [],
          onNewDay: () => this.showRankCards(),
        }
        this.scene.launch('SummaryScene', data)
        return
      }
    }
  }

  private addCustomerSprite(c: Customer): void {
    this.customers.set(c.id, {
      view: new CharacterView(this, customerColors(c.look, c.kind, c.regular, c.vip, c.kol, c.idol)),
      bar: this.add.graphics(),
      badge: this.add.image(0, 0, `svc-${c.service}`).setOrigin(0.5, 1).setDepth(FX_DEPTH).setVisible(false),
      ripple: this.add.image(0, 0, 'ripple').setVisible(false),
      heart: this.add.image(0, 0, 'heart-full').setScale(0.5).setDepth(FX_DEPTH).setVisible(false),
      vipStar: this.add.image(0, 0, 'star').setScale(0.5).setDepth(FX_DEPTH).setVisible(false),
      steam: this.add.image(0, 0, 'fx-steam').setOrigin(0.5, 1).setVisible(false),
      stones: this.add.image(0, 0, 'fx-stones').setVisible(false),
      bubble: null,
      lift: 0,
    })
  }

  /** Where the heart and the VIP star sit while waiting: level with the service badge, shifted left of it when it shows, or, on an upright seat, to the side of it away from the customer. */
  private badgeSide(p: Placement, s: CustomerSprite, badge: boolean, dx: number): [number, number] {
    return [p.x + dx + (badge ? (dx > 0 ? -HEART_DX : HEART_DX) : 0), p.y + BADGE_BOTTOM - s.badge.height / 2]
  }

  private syncCustomer(c: Customer, s: CustomerSprite, time: number, dt: number, badges: boolean): void {
    // on the bed from arrival until the owner finishes, waiting or being served
    const onStation = c.stationId !== null && c.path.length === 0
    // in the foot chair they sit with their feet over the basin, and at the nail desk on the stool behind it, instead of lying
    const seated = onStation && SEATED.includes(c.service)
    const lying = onStation && !seated
    // a VIP with no seat free stands by the desk, facing down
    const sitting = seated || (c.state === 'waiting' && !this.sim.isStanding(c))
    const street = this.streetPlacement(c)
    const floor = street ? 1 : floorOf(c.pos.y)
    if (floor !== this.viewFloor) {
      // on a floor that is not in view: nothing of them shows
      const gone = [s.view.container, s.badge, s.ripple, s.heart, s.vipStar, s.steam, s.stones, s.bubble]
      for (const g of gone) g?.setVisible(false)
      s.bar.clear()
      this.bubbleSpots.set(c.id, { x: 0, y: 0, floor })
      return
    }
    const p: Placement = street ?? { ...this.room.tileToWorld(c.pos), facing: c.facing, alpha: 1 }
    // on the stairs, they rise toward the next floor and fade, here on the floor they are leaving
    const climb = climbPose(c)
    if (climb) {
      p.y -= climb.lift * TILE
      p.alpha = climb.alpha
    }
    // lying in a mud tub, the customer is drawn half a tile towards its other column, the side the tent's steam takes, so the head sits in its middle
    const tub = lying ? this.sim.stations.find(st => st.id === c.stationId && st.service === 'mud') : undefined
    if (tub) p.x += tub.work.x > tub.bed.x ? -TILE / 2 : TILE / 2
    // a customer on the bed, or stepping on or off it, draws over the bed, whose anchor is one tile lower
    const depth = !street && onBed(this.sim.grid, c.pos) ? p.y + TILE + 1 : sitting ? p.y + 1 : p.y
    // the chair's seat is its upper tile, one above the bed tile they stand on; they rise onto it and step down rather than hop
    s.lift = Math.min(1, Math.max(0, s.lift + ((seated ? 1 : -1) * dt) / FOOT_SEAT_MS))
    p.y -= TILE * s.lift

    // face down on the massage and stone beds, face up anywhere else
    // a waiting customer on a seat faces the front of the piece under them, which an upright bench turns sideways
    const seat = c.state === 'waiting' && sitting && !seated ? this.sim.items.find(i => seatTiles(i).some(t => tileEq(t, c.pos))) : undefined
    const facing = seat ? seatFacing(seat) : null
    // on an upright seat the waiting marks move a tile to the side they face, off the faces of those sitting above, or to the other side when a wall or the grid's edge is there
    const side = facing === 'left' ? -1 : 1
    const wall = (dx: number) => (this.sim.grid.cells[c.pos.y]?.[c.pos.x + dx] ?? 'wall') === 'wall'
    const markDx = seat?.turned ? (wall(side) ? -side : side) * TILE : 0
    s.view.setFacing(lying ? (c.service === 'massage' || c.service === 'stone' || c.service === 'scrub' ? 'up' : 'down') : facing ?? (c.state === 'waiting' || seated ? 'down' : p.facing))
    s.view.setPose(lying ? 'lie' : sitting ? 'sit' : street || c.path.length > 0 ? 'walk' : 'stand')
    s.view.setMask(c.service === 'mask' && c.state === 'inService')
    // only the towel-wrapped head shows over the mud
    s.view.setTowel(tub !== undefined)
    // lying in a steam tent, the customer is out of sight and the tent steams
    const tent = lying ? this.sim.stations.find(st => st.id === c.stationId && st.service === 'steam') : undefined
    s.view.container.setPosition(p.x, p.y).setDepth(depth).setAlpha(p.alpha).setVisible(!tent)
    s.view.update(dt)
    s.steam.setVisible(tent !== undefined)
    if (tent) {
      // the bed tile is the tent's half beside the work tile
      const centreX = p.x + (tent.work.x > tent.bed.x ? -TILE / 2 : TILE / 2)
      const bob = STEAM_BOB.px * Math.sin((time / STEAM_BOB.ms) * 2 * Math.PI)
      s.steam.setPosition(centreX, p.y - TENT_KNOB_TILES * TILE + bob).setDepth(depth)
    }
    // served on the stone bed, the customer has hot stones along the back; a hair deeper, as an equal depth can sort them under the customer
    const stones = c.service === 'stone' && c.state === 'inService'
    s.stones.setVisible(stones)
    if (stones) s.stones.setPosition(p.x, p.y - STONES_TILES * TILE).setDepth(depth + 0.5)

    s.bar.clear()
    if (c.state === 'waiting') {
      const f = Math.max(0, c.patienceMs / c.patienceMaxMs)
      const color = hex(f > 0.5 ? C.green : f > 0.25 ? C.mustard : C.lantern)
      const x = p.x + markDx - 36
      const y = p.y + PATIENCE_BAR_TOP + 4
      s.bar.fillStyle(hex(C.paper), 1).fillRoundedRect(x - 4, y - 4, 80, 20, 10)
      s.bar.lineStyle(3, hex(C.ink)).strokeRoundedRect(x - 4, y - 4, 80, 20, 10)
      s.bar.fillStyle(color, 1).fillRoundedRect(x, y, Math.max(12, 72 * f), 12, 6)
      s.bar.setDepth(FX_DEPTH)
    }
    const badge = c.state === 'waiting' && badges
    s.badge.setVisible(badge)
    if (badge) {
      const key = `svc-${c.service}`
      if (s.badge.texture.key !== key) s.badge.setTexture(key)
      s.badge.setPosition(p.x + markDx, p.y + BADGE_BOTTOM)
    }

    const heart = c.state === 'waiting' && c.regular !== null
    s.heart.setVisible(heart)
    if (heart) s.heart.setPosition(...this.badgeSide(p, s, badge, markDx))

    const star = ((c.vip !== null || c.idol !== null) && !onStation) || (c.kol && (c.state === 'arriving' || c.state === 'toSeat'))
    s.vipStar.setVisible(star)
    if (star) {
      const waiting = c.state === 'waiting'
      s.vipStar
        .setPosition(...(waiting ? this.badgeSide(p, s, badge, markDx) : ([p.x, p.y + PATIENCE_BAR_TOP] as const)))
        .setScale(0.5 + STAR_TWINKLE * Math.sin((time / STAR_TWINKLE_MS) * 2 * Math.PI))
    }

    const pulsing = c.state === 'waiting' && this.sim.owner.task === null
    s.ripple.setVisible(pulsing)
    if (pulsing) {
      const k = (time % RIPPLE_MS) / RIPPLE_MS
      s.ripple.setPosition(p.x, p.y - CHARACTER_HEIGHT_PX * 0.35).setScale(0.9 + 0.6 * k).setAlpha(0.9 * (1 - k)).setDepth(depth - 0.5)
    }

    s.bubble?.setPosition(p.x, p.y - CHARACTER_HEIGHT_PX + 4).setAlpha(p.alpha).setVisible(true)
    this.bubbleSpots.set(c.id, { x: p.x, y: p.y + SPEECH_TIP, floor })
  }

  /** A star on the way to or waiting at their seat hums their song title every HUM_EVERY_MS, never over a line. */
  private humStars(dt: number): void {
    const sim = this.sim
    const live = new Set<number>()
    for (const c of sim.customers) {
      if (c.idol === null || (c.state !== 'toSeat' && c.state !== 'waiting')) continue
      live.add(c.id)
      if (sim.paused || sim.servingCustomerId !== null) continue
      const ms = (this.humMs.get(c.id) ?? 0) + dt
      if (humNow(c, ms, this.bubbles.has(c.id) || this.queuedLines.has(c.id))) {
        this.say(c.id, humText(c.idol), HUM_MS)
        this.humMs.set(c.id, 0)
      } else this.humMs.set(c.id, ms)
    }
    for (const id of [...this.humMs.keys()]) if (!live.has(id)) this.humMs.delete(id)
  }

  /** Follows each customer; one whose customer has left holds its last spot until it fades out, then goes. */
  private moveBubbles(): void {
    for (const [id, b] of this.bubbles) {
      if (b.done) {
        const next = this.queuedLines.get(id)
        if (next) {
          // hands its spot to the queued line, which shows even when the customer has gone
          this.queuedLines.delete(id)
          this.speak(id, next.text, next.ms)
          continue
        }
        b.destroy()
        this.bubbles.delete(id)
        this.bubbleSpots.delete(id)
        continue
      }
      const spot = this.bubbleSpots.get(id)
      if (spot) b.setPosition(spot.x, spot.y).setVisible(spot.floor === this.viewFloor)
    }
  }

  /** Whether the customer has left the shop: a card the main shop kept while the owner was away may name one. */
  private gone(customerId: number): boolean {
    return !this.sim.customers.some(c => c.id === customerId)
  }

  /** A customer's line of speech; a new one replaces the old. A customer who has left says nothing. */
  private say(customerId: number, text: string, ms: number): void {
    if (this.gone(customerId)) return
    this.speak(customerId, text, ms)
  }

  /** Draws the line in the customer's bubble, even once they have gone, where their bubble last was. */
  private speak(customerId: number, text: string, ms: number): void {
    // a customer not yet drawn is on the street, floor 1
    if ((this.bubbleSpots.get(customerId)?.floor ?? 1) !== this.viewFloor) return
    this.bubbles.get(customerId)?.destroy()
    const b = new SpeechBubble(this, text, ms)
    this.bubbles.set(customerId, b)
    const spot = this.bubbleSpots.get(customerId)
    if (spot) b.setPosition(spot.x, spot.y)
  }

  /** Like say, but waits for a live bubble of that customer to finish instead of replacing it. */
  private sayNext(customerId: number, text: string, ms: number): void {
    if (this.gone(customerId)) return
    if (this.bubbles.has(customerId)) this.queuedLines.set(customerId, { text, ms })
    else this.say(customerId, text, ms)
  }

  /** A "+1" with a heart over the customer's head, tweened like floatMoney. */
  private floatHeart(customerId: number): void {
    if (this.gone(customerId)) return
    const at = this.bubbleSpots.get(customerId)
    if (!at || at.floor !== this.viewFloor) return
    const label = this.add.text(0, 0, '+1', { ...textStyle(46), stroke: C.cream, strokeThickness: 10 }).setOrigin(0, 0.5)
    const width = 56 + 8 + label.width
    const heart = this.add.image(-width / 2 + 28, 0, 'heart-full')
    label.x = -width / 2 + 64
    const box = this.add.container(at.x, at.y + 40, [heart, label]).setDepth(FX_DEPTH + 10)
    this.tweens.add({ targets: box, y: box.y - 60, duration: 1000, ease: 'Cubic.easeOut' })
    this.tweens.add({ targets: box, alpha: 0, duration: 1000, ease: 'Cubic.easeIn', onComplete: () => box.destroy() })
  }

  /** Arriving and exiting customers walk along the sidewalk and through the door. */
  private streetPlacement(c: Customer): Placement | null {
    if (c.state !== 'arriving' && c.state !== 'exiting') return null
    const door = this.room.tileToWorld(this.sim.grid.door)
    const walkY = door.y + 0.9 * TILE
    const fromLeft = c.id % 2 === 1
    const sideX = door.x + (fromLeft ? -1 : 1) * STREET_SIDE_TILES * TILE
    const across: Facing = fromLeft ? 'right' : 'left'
    const back: Facing = fromLeft ? 'left' : 'right'

    if (c.state === 'arriving') {
      const k = Math.min(1, c.stateMs / ARRIVE_MS)
      const alpha = Math.min(1, k / 0.2)
      if (k < 0.7) return { x: Phaser.Math.Linear(sideX, door.x, k / 0.7), y: walkY, facing: across, alpha }
      return { x: door.x, y: Phaser.Math.Linear(walkY, door.y, (k - 0.7) / 0.3), facing: 'up', alpha }
    }
    const k = Math.min(1, c.stateMs / EXIT_MS)
    const alpha = Math.min(1, (1 - k) / 0.2)
    if (k < 0.3) return { x: door.x, y: Phaser.Math.Linear(door.y, walkY, k / 0.3), facing: 'down', alpha }
    return { x: Phaser.Math.Linear(door.x, sideX, (k - 0.3) / 0.7), y: walkY, facing: back, alpha }
  }

  private floatMoney(tile: Tile, amount: number, depth = FX_DEPTH + 10): void {
    if (!this.room.onFloor(tile.y)) return
    const at = this.room.tileToWorld(tile)
    this.floatMoneyAt(at.x, at.y - 130, amount, depth)
  }

  /** A coin and "+money" centred on x, y that rises and fades. */
  private floatMoneyAt(x: number, y: number, amount: number, depth: number): void {
    const label = this.add.text(0, 0, '+' + formatMoney(amount), { ...textStyle(46), stroke: C.cream, strokeThickness: 10 }).setOrigin(0, 0.5)
    const width = 48 + 8 + label.width
    const coin = this.add.image(-width / 2 + 24, 0, 'coin')
    label.x = -width / 2 + 56
    const box = this.add.container(x, y, [coin, label]).setDepth(depth)
    this.tweens.add({ targets: box, y: box.y - 60, duration: 1000, ease: 'Cubic.easeOut' })
    this.tweens.add({ targets: box, alpha: 0, duration: 1000, ease: 'Cubic.easeIn', onComplete: () => box.destroy() })
  }

  private showBubble(customerId: number, score: number): void {
    const s = this.customers.get(customerId)
    const c = this.sim.customers.find(x => x.id === customerId)
    if (!s || (c && this.floorOfCustomer(c) !== this.viewFloor)) return
    const key = score >= 4 ? 'bubble-happy' : score === 3 ? 'bubble-ok' : 'bubble-angry'
    s.bubble?.destroy()
    s.bubble = this.add.image(0, 0, key).setOrigin(0.5, 1).setDepth(FX_DEPTH).setScale(0)
    this.tweens.add({ targets: s.bubble, scale: 1.2, duration: 250, ease: 'Back.easeOut' })
  }

  private onTap(p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): void {
    if (this.holding || over.length > 0) return
    if (Phaser.Math.Distance.Between(p.downX, p.downY, p.upX, p.upY) > TAP_SLOP_PX) return
    // A seated customer's head covers the tile above the seat, so test the figure before the floor.
    const hit = this.sim.customers.find(c => {
      if (c.state !== 'waiting' || !c.seat || this.floorOfCustomer(c) !== this.viewFloor) return false
      const at = this.room.tileToWorld(c.pos)
      return Math.abs(p.x - at.x) <= TILE / 2 && p.y <= at.y && p.y >= at.y - CHARACTER_HEIGHT_PX
    })
    const tile = hit?.seat ?? this.room.worldToTile(p.x, p.y)
    // a point above or below the floor in view would land on the rows of the next floor
    if (!this.room.onFloor(tile.y)) return
    this.sim.tapTile(tile)
  }
}
