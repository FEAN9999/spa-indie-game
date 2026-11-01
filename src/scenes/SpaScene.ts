import * as Phaser from 'phaser'
import { currentInstallEnv, installPlatform } from '../app/install'
import { BUILD_ID, latestVersion, onReturn, shouldReload } from '../app/update'
import { C, customerColors, inspectorColors, ownerColors } from '../art/palette'
import { cueFor } from '../audio/cues'
import { sound } from '../audio/engine'
import { AUTOSAVE_MS, BUBBLE_MS, BUSTLE_PIECES, FLOOR_PRICE, FOOT_SEAT_MS, GAME_H, GAME_W, HUM_MS, RESTAURANT_PRICE, SHOP_X0, TAP_SLOP_PX, TILE, UPDATE_WAIT_MS, VISIT_WAIT_MS } from '../config'
import { currentHouse, homeLink, newVisitCode, openHouse, showVisitCode, visitCodeIn, VisitError, visitHouse, type Hello, type VisitProblem } from '../net/visit'
import { SaveSession } from '../save/session'
import type { AwayResult } from '../sim/away'
import type { BadgeId } from '../sim/badges'
import { memoryStore, openStore, type SaveStore } from '../save/store'
import { PROBLEM_TEXT } from '../sim/build'
import { Chain } from '../sim/chain'
import { BUSTLE_SCORE_MAX, bustleScore, type BustleId } from '../sim/bustle'
import { KINDS } from '../sim/customers'
import { dayEase } from '../sim/economy'
import { markRead, takeCheer, unreadCount, type Post } from '../sim/feed'
import { monthOf } from '../sim/calendar'
import { MACHINES, rivalToday } from '../sim/events'
import { festivalOf } from '../sim/festivals'
import { addFriend } from '../sim/friends'
import { floorOf } from '../sim/floors'
import { onBed, tileEq, tileOf } from '../sim/grid'
import type { OutfitId } from '../sim/outfits'
import { bedCentreOffset, bedTile, headSide, ITEMS, seatFacing, seatTiles, size, workFacing } from '../sim/items'
import type { PlaceId } from '../sim/places'
import { bookOpen } from '../sim/regulars'
import { createRng } from '../sim/rng'
import { SaveError, SaveTooNewError, type SaveData } from '../sim/save'
import { SERVICES, type ServiceId } from '../sim/services'
import type { ShopSide } from '../sim/dining'
import type { RestaurantEvent } from '../sim/restaurant'
import { SpaSim } from '../sim/spa'
import { NO_HOUSES, type House, type Houses, type Side } from '../sim/layout'
import { STOCK_NAME } from '../sim/stock'
import { pickHint } from '../sim/tutorial'
import type { Customer, Facing, HintId, SimEvent, Tile, Vec } from '../sim/types'
import { isUnlocked } from '../sim/unlocks'
import { formatMoney } from '../strings/format'
import { GREETINGS, REGULAR_TEXT } from '../strings/regulars'
import { BUSTLE_TEXT } from '../strings/bustle'
import { GENEROUS_LINES, RECIPE_HINT_TEXT, t, type StringKey } from '../strings/vi'
import { IDOL_TEXT } from '../strings/idols'
import { VIP_TEXT } from '../strings/vips'
import { Attention, type Held, type Inspected, type ShopState, type StairsCleared } from '../view/attention'
import { awayTip } from '../view/away'
import { BADGE_TEXT } from '../view/badges'
import { closingCard, idolCallCard, noTechCard, placeName, unlockCard, vipCallCard, type ChoiceText } from '../view/chain'
import { OUTFIT_NAME } from '../view/outfits'
import { CHARACTER_HEIGHT_PX, CharacterView, drawPatienceBar, PATIENCE_BAR_TOP } from '../view/CharacterView'
import { FloorBar } from '../view/FloorBar'
import { climbPose, floorCardLines, followFloor, pills, restaurantPills, showPills, stairsToasts } from '../view/floors'
import { MAP_VIEW, mapBounds, type Rect } from '../view/camera'
import { RestaurantLayer } from '../view/RestaurantLayer'
import { BustleLayer } from '../view/BustleLayer'
import { bustleAt, bustleFocus, bustlePercentText, onSidewalk, openStreetBounds, SIDEWALK_ROW, streetAt, STRIP_ROW, upperFronts } from '../view/bustle'
import type { BustleListData } from './BustleScene'
import { DOOR_X, doorWalk, restaurantHouseRect, restaurantSaleAt, restaurantTileAt, restaurantX, rideX, shopAt, streetBounds, stripBlocks, ticketDots } from '../view/street'
import { HandPointer } from '../view/HandPointer'
import { MapCamera } from '../view/MapCamera'
import { MapGestures } from '../view/MapGestures'
import { PositionStrip } from '../view/PositionStrip'
import { offscreenWaiting, worldXAt } from '../view/strip'
import { houseRect, saleAt, stripLots } from '../view/houses'
import { navIds, type NavId } from '../view/nav'
import { milestoneCard } from '../view/phayCards'
import { NOTICE_MS, nextNotice, noticeLine, phayButtonShown } from '../view/phay'
import { BANNER_MS, BOOK_BUTTON, DEPTH as HUD_DEPTH, Hud } from '../view/Hud'
import { eventCard, hotCard, powerWarnText, rivalBeatenCard } from '../view/events'
import { festivalDoneCard, festivalStartCard, goldCardMs, monthToast, type GoldCard } from '../view/festivals'
import { addMedal } from '../view/medal'
import type { MiniGameData } from '../view/miniGame'
import { questTitle } from '../view/quests'
import { servicesOpening } from '../view/servicesPanel'
import { restaurantStockText, stockLowText } from '../view/stockText'
import { humNow, humText, todayToasts } from '../view/idol'
import { lieAngle, liePoint } from '../view/lying'
import { RoomView } from '../view/RoomView'
import { SpeechBubble } from '../view/SpeechBubble'
import { goalCard, lockedText } from '../view/starter'
import { StaffLayer } from '../view/StaffLayer'
import { PetLayer } from '../view/PetLayer'
import { courseName } from '../view/staffCard'
import { textStyle } from '../view/text'
import { addButton, addCard, whenTapped } from '../view/ui'
import { TOP_BAR } from '../view/topBar'
import { addVisitBar } from '../view/visitBar'
import { ZoomButtons } from '../view/ZoomButtons'
import type { AwayData } from './AwayScene'
import type { BuildData } from './BuildScene'
import type { ChainData } from './ChainScene'
import type { ChoiceData } from './ChoiceScene'
import type { GuestBookData } from './GuestBookScene'
import type { HudScene } from './HudScene'
import type { QuestsData } from './QuestsScene'
import type { StarterData } from './StarterScene'
import type { OwnerData, OwnerMode } from './OwnerScene'
import type { PauseData, PausePanel } from './PauseScene'
import type { ChefData } from './ChefScene'
import type { MenuData } from './MenuScene'
import type { ServicesData } from './ServicesScene'
import type { StaffData } from './StaffScene'
import type { InspectData } from './InspectScene'
import type { NewOutfitData } from './NewOutfitScene'
import type { LitterData } from './LitterScene'
import type { PetNameData } from './PetNameScene'
import { COOK_SCENE, type CookData } from '../view/cook'
import type { PhayData } from './PhayScene'
import type { RankData } from './RankScene'
import type { SummaryData } from './SummaryScene'

const FX_DEPTH = 9000
/** The quick-buy card covers the top bar and the bottom nav too. */
const CARD_DEPTH = HUD_DEPTH + 100
const RIPPLE_MS = 1200
/** How long each of the money and star pointers stays after the first payment. */
const TOUR_STEP_MS = 3000
/** The patience pointer is done once it has been seen this long. */
const PATIENCE_HINT_MS = 4000
/** The money and star pointers aim just under the top bar's first row. */
const TOP_ROW_TIP_Y = 120
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
/** Phây's notice, a cream bar sliding down to the gold card's spot. */
const NOTICE = { y: 300, w: 900, h: 130, r: 65, slide: 60, iconX: -390, textX: -330, textW: 740, headY: -28, lineY: 20 }
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
const MINI_GAME_SCENE: Record<ServiceId, string> = { shampoo: 'ShampooScene', mask: 'MaskScene', massage: 'MassageScene', steam: 'SteamScene', stone: 'StoneScene', mud: 'MudScene', scrub: 'ScrubScene', foot: 'FootScene', nails: 'NailsScene', cupping: 'CuppingScene' }
/** The hint marking each mini-game as played once, so its demo hand shows only the first time. */
const DEMO_HINT: Record<ServiceId, HintId> = { shampoo: 'demoShampoo', mask: 'demoMask', massage: 'demoMassage', steam: 'demoSteam', stone: 'demoStone', mud: 'demoMud', scrub: 'demoScrub', foot: 'demoFoot', nails: 'demoNails', cupping: 'demoCupping' }
/** Services whose customer sits on the station's tile toward its head instead of lying. */
const SEATED: readonly ServiceId[] = ['foot', 'nails']
/** The way the head of a piece standing up the floor lies from its bed tile: a bed's head, a foot chair's or nail desk's seat. */
const UP: Vec = { x: 0, y: -1 }
/** What a friend's shop shows while it is looked round: its people, their words and its coins, never its owner's cards or toasts. */
const VISIT_EVENTS: ReadonlySet<SimEvent['type']> = new Set<SimEvent['type']>(['customerArrived', 'customerLeft', 'paid', 'generous', 'review', 'regularArrived', 'vipArrived', 'vipServed', 'idolArrived', 'idolServed', 'heart', 'recipeHint', 'greeted', 'levelUp', 'sloppy', 'roomChanged'])
/** A service or a bowl the friend left half done finishes by itself in the copy, with these stars. */
const VISIT_STARS = 3
/** Why a friend's shop could not be found, for its card. */
const VISIT_PROBLEM: Record<VisitProblem, StringKey> = { notFound: 'visitNotFound', noLink: 'visitNoLink', tooNew: 'visitTooNew', bad: 'visitBad' }

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
  /** The way the lift takes them: toward the head of the foot chair or nail desk they last sat at, up the floor, or left or right on a turned one; kept while they step down. */
  liftSide: Vec
  bubble: Phaser.GameObjects.Image | null
}

interface Placement {
  x: number
  y: number
  facing: Facing
  alpha: number
}

/** What a switch of shops hands the restarted scene: the chain itself, and what waits for the owner there, from `Attention.carry`. */
export interface SpaSceneData {
  chain: Chain
  held: readonly Held[]
  arrived: boolean
  /** The chain is a friend's, looked round and never saved. */
  visit?: boolean
}

export class SpaScene extends Phaser.Scene {
  /** The main shop, its branches, and where the owner is. */
  chain!: Chain
  /** The shop the owner is in: `chain.active()`. */
  sim!: SpaSim
  /** The layer over the map that never zooms: the HUD, the floor buttons, the pointer, the cards and the shutter are drawn there. */
  private ui!: HudScene
  private room!: RoomView
  /** The map's zoom and place, on this scene's main camera. */
  private cam!: MapCamera
  private gestures!: MapGestures
  private zoomButtons!: ZoomButtons
  private strip!: PositionStrip
  /** The customer the hand last pointed at, so the map slides to a new one out of view only once. */
  private pointedId: number | null = null
  /** The floor on view, from 1; only showFloor changes it. */
  private viewFloor = 1
  /** The owner's floor on the last frame, so the view follows them only on the frame they come off the stairs. */
  private lastOwnerFloor = 1
  /** The same for the owner in the restaurant, whom the view follows up and down its stairs. */
  private lastRestOwnerFloor = 1
  private floorBar!: FloorBar
  private hud!: Hud
  private owner!: CharacterView
  private customers = new Map<number, CustomerSprite>()
  private staffLayer!: StaffLayer
  private pets!: PetLayer
  /** The day Chú Sáu's litter was put off; it comes back the next day, or the next time the game opens. */
  private litterLaterDay: number | null = null
  private store!: SaveStore
  private session!: SaveSession
  /** A service that became ready while paused, with the scene it is played in; the mini-game opens on resume. */
  private pendingService: { scene: string; data: MiniGameData } | null = null
  /** A bowl ready to cook while paused; it is cooked on resume. */
  private pendingCook: Extract<RestaurantEvent, { type: 'cookReady' }> | null = null
  /** The restaurant on the street, at the main shop only. */
  private restaurant: RestaurantLayer | null = null
  /** The street in front of the main shop once the restaurant is bought; null at a branch. */
  private bustle: BustleLayer | null = null
  /** The owner was on her bike last frame, so the view comes down to floor 1 only as a ride starts. */
  private riding = false
  /**
   * What covers the shop and what waits for the player. While anything covers it (a card or panel, the shutter, the welcome-back card, the wait for a newer version)
   * the shop holds still and its events stay queued until it is uncovered.
   */
  private attention!: Attention
  /** The morning banner waits for the install card a new shop opens with. */
  private bannerOnResume = false
  /** The slot was saved by a newer version: only the card shows, and the shop never runs. */
  private tooNew = false
  /** The page is finding a friend's shop: only its card shows, and no shop runs yet. */
  private finding = false
  /** Looking round a friend's shop: a copy that runs here and is never saved; nothing in it is bought, served or answered. */
  private visit = false
  private pointer!: HandPointer
  /** After the first payment: the money pointer, then the star pointer, each with the time it has left on screen. */
  private tour: { hint: 'money' | 'star'; ms: number }[] = []
  /** Delay for the next "finished a course" or stairs toast this morning, so they follow the VIP-today toast and each other. */
  private studiedToastMs = 0
  /** The scene time before which a queued toast may not go up, so finished quests follow each other and whatever was said just before. */
  private toastQueueAt = 0
  /** The scene time the badge banner on screen is gone. */
  private badgeUntil = 0
  /** The last post id already noticed or folded into the red count; set on entering a shop, never saved, so posts there on load never notify. */
  private phayNotified = 0
  /** The Phây notice on screen, if any. */
  private phayNotice: Phaser.GameObjects.Container | null = null
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
    this.ui = this.scene.get('HudScene') as HudScene
    this.customers = new Map()
    this.pendingService = null
    this.pendingCook = null
    this.riding = false
    this.tooNew = false
    this.finding = false
    this.visit = switched?.visit ?? false
    this.bannerOnResume = false
    this.toastQueueAt = 0
    this.badgeUntil = 0
    this.tour = []
    this.patienceHintMs = 0
    this.regularHintMs = 0
    this.vipHintMs = 0
    this.bubbles = new Map()
    this.bubbleSpots = new Map()
    this.queuedLines = new Map()
    this.humMs = new Map()
    this.pointedId = null
    // an address with a friend's code opens their shop instead; neither it nor this page's own shop is written while it is looked round
    const findCode = switched ? null : visitCodeIn(location.href)
    this.store = this.visit || findCode ? memoryStore() : openStore()
    // the chain's save: the main shop's own leaves its branches out
    this.session = new SaveSession(this.store, () => this.chain.toSave(), () => location.reload())
    if (findCode) {
      this.findShop(findCode)
      return
    }
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
    if (!this.visit) this.meetFriends()
    // back at the main shop, its cards come out from where they were kept; at a branch they stay aside
    this.attention = new Attention(this.sim.place === null, switched?.held ?? [], () => this.shopState())
    this.phayNotified = this.chain.main.feed.nextId - 1
    this.phayNotice?.destroy()
    this.phayNotice = null
    this.room = new RoomView(this, this.sim.place)
    this.room.setRank(this.sim.rank.stars)
    // the houses go in before the first sync, which crops each bench's mat to the floor they widen
    this.room.setHouses(this.sim.houses, this.sim.shownHouses(), null, this.lightRect())
    // the main shop's street runs on to the restaurant beside it, or the old house for sale there
    this.restaurant = this.chain.at === null ? new RestaurantLayer(this) : null
    this.bustle = this.chain.at === null ? new BustleLayer(this) : null
    this.syncRestaurantHouses()
    this.lastOwnerFloor = floorOf(this.sim.owner.pos.y)
    const inRestaurant = this.chain.at === null && this.chain.restaurant?.ownerIn ? this.chain.restaurant : null
    this.lastRestOwnerFloor = inRestaurant ? floorOf(inRestaurant.owner.pos.y) : 1
    // the floor she stands on, in the restaurant if she is there
    this.showFloor(inRestaurant ? this.lastRestOwnerFloor : this.lastOwnerFloor)
    // at normal size on the owner, in the restaurant if she is there; the view is never saved
    this.cam = new MapCamera(this, MAP_VIEW, this.mapRect())
    const next = inRestaurant?.owner.pos ?? null
    // the map's top at the area's top, as at the start of a day, though the open street runs it further down
    this.cam.jump({ zoom: 1, cx: next ? restaurantX(next.x + 0.5) : this.room.tileToWorld(this.sim.owner.pos).x, cy: MAP_VIEW.y + MAP_VIEW.h / 2 })
    this.owner = this.buildOwner()
    for (const c of this.sim.customers) this.addCustomerSprite(c)
    this.staffLayer = new StaffLayer(this, this.room)
    this.pets = new PetLayer(this, this.room)
    this.hud = new Hud(this.ui, this.sim, () => (this.visit ? this.askHome() : this.pause()), () => this.openBuild(), () => this.openStaff(), () => this.openServices(), () => this.openBook(), () => this.openQuests(), () => this.openChainMap(), () => this.openPhay(null), () => (this.visit ? [] : navIds(this.chain)))
    // a friend's shop has no buttons of its own in the bottom bar: whose it is, and the way home
    if (this.visit) addVisitBar(this.ui, this.chain.main.shopName, this.chain.branches.length > 0 ? () => this.openChainMap() : null, () => this.goHome())
    this.hud.onBustle = () => this.openBustleList()
    this.floorBar = new FloorBar(this.ui, HUD_DEPTH, floor => this.tapFloor(floor))
    this.pointer = new HandPointer(this.ui)
    this.zoomButtons = new ZoomButtons(this.ui, HUD_DEPTH, dir => this.cam.zoomStep(dir))
    // a tap on the strip slides there, keeping the zoom and the height
    this.strip = new PositionStrip(this.ui, HUD_DEPTH, sx => {
      if (!this.attention.covered()) this.cam.slideTo(worldXAt(this.cam.bounds, sx))
    })
    // a press on anything of the HUD's never moves nor taps the map
    this.gestures = new MapGestures(this.ui.input, this.cam, { allow: (_, over) => over.length === 0 && this.attention.mapFree(), onTap: p => this.onMapTap(p) })

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
      // a friend's copy pays no time away, and the page never reloads under it
      if (this.visit) return
      this.session.reloadIfChangedElsewhere()
      let paid = false
      if (this.session.open && this.chain.main.profileDone && hiddenAt !== null) {
        const back = this.chain.comeBack(Date.now() - hiddenAt)
        hiddenAt = null
        if (back.paid > 0) {
          paid = true
          this.attention.hold({ kind: 'away', back })
          this.session.saveNow()
        } else if (back.tip) {
          this.attention.hold({ kind: 'gold', card: awayTip() })
          this.session.saveNow()
        }
      }
      if (!paid && !this.attention.holds('away') && !this.attention.covered('away')) void this.checkForUpdate()
    })
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.removeEventListener('visibilitychange', saveOnHide)
      window.removeEventListener('pagehide', saveOnLeave)
      stopWatching()
      this.restaurant?.destroy()
      this.bustle?.destroy()
      // the layer over the map outlives the scene: the next shop draws its own
      this.ui.clear()
      this.gestures.destroy()
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
          this.attention.hold({ kind: 'gold', card: awayTip() })
          this.session.saveNow()
        }
        pauseUnlessOver()
      }
    }
    if (import.meta.env.DEV)
      Object.assign((window as any).__spa, {
        sim: this.sim,
        chain: this.chain,
        spa: this,
        store: this.store,
        session: this.session,
        cam: this.cam,
        restaurant: () => this.chain.restaurant,
        street: () => this.chain.street,
      })
  }

  /** On arriving by a switch of shops: the shutter rolls up, then the owner is greeted, or told the branch has no technician yet. */
  private arrive(): void {
    const release = this.attention.cover('shutter')
    this.shutter(this.sim.place, false, () => {
      release()
      const place = this.sim.place
      if (place === null) this.hud.toast(t('backMainToast'))
      else if (this.sim.hasTechnician()) this.hud.toast(t('arrivedToast', { place: placeName(place) }))
      else if (!this.visit) this.attention.hold({ kind: 'gold', card: noTechCard(place) })
    })
  }

  /** The owner goes to `place`: the shutter closes over the frozen shop, then the chain switches, saves, and the scene starts again on the shop she is in. */
  private switchShop(place: PlaceId | null): void {
    // the shop she is in, one not open or a branch after closing time is not gone to
    if (this.chain.goProblem(place) !== null) return
    // nothing is tapped or played while it closes: a mini-game opened now would be left behind
    this.attention.cover('shutter')
    sound.play('chime')
    this.shutter(place, true, () => {
      this.chain.goTo(place)
      this.session.saveNow()
      // another page saved first: the session has closed and the page is reloading, so no new scene may open a session on that save
      if (!this.session.open) return
      const data: SpaSceneData = { chain: this.chain, held: this.attention.carry(), arrived: true, visit: this.visit }
      this.scene.restart(data)
    })
  }

  /** The roll-down shutter with the place's name on its sign: down over the shop, or up off it; `then` runs once it has rolled. Taps on it go nowhere. */
  private shutter(place: PlaceId | null, down: boolean, then: () => void): void {
    const y = down ? -GAME_H : 0
    const { sign } = SHUTTER
    const sheet = this.ui.add.rectangle(0, y, GAME_W, GAME_H, hex(C.wood)).setOrigin(0).setInteractive()
    const art = this.ui.add.graphics({ y }).lineStyle(6, hex(C.woodDark))
    for (let s = SHUTTER.slat; s < GAME_H; s += SHUTTER.slat) art.lineBetween(0, s, GAME_W, s)
    const signX = (GAME_W - sign.w) / 2
    const signY = (GAME_H - sign.h) / 2
    art.fillStyle(hex(C.goldPale), 1).fillRoundedRect(signX, signY, sign.w, sign.h, sign.r).lineStyle(5, hex(C.ink)).strokeRoundedRect(signX, signY, sign.w, sign.h, sign.r)
    const name = this.ui.add.text(GAME_W / 2, y + GAME_H / 2, placeName(place), textStyle(64)).setOrigin(0.5)
    const parts = [sheet, art, name]
    for (const p of parts) p.setDepth(SHUTTER.depth)
    this.ui.tweens.add({
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
    const release = this.attention.cover('panel')
    const data: ChoiceData = {
      card,
      owner: ownerColors(this.chain.main.ownerLook, this.chain.main.ownerOutfit),
      onChoose: i => {
        release()
        onChoose(i)
      },
    }
    this.scene.launch('ChoiceScene', data)
  }

  /** At a branch: once the owner is free at closing time, the card that sends her home; before then, a VIP, else a star, waiting at the main shop, once the shop is free. */
  private callOwner(place: PlaceId): void {
    const sim = this.sim
    if (this.attention.covered() || sim.paused) return
    if (sim.clock.isClosed) {
      if (!this.playing() && sim.owner.task?.kind !== 'serve') this.choose(closingCard(place, sim.hasTechnician()), () => this.switchShop(null))
      return
    }
    if (!this.attention.shopFree()) return
    const vip = this.chain.takeVipCall()
    const idol = vip ? null : this.chain.takeIdolCall()
    const card = vip ? vipCallCard(vip) : idol ? idolCallCard(idol) : null
    if (!card) return
    // "Về ngay" goes back; "Ở lại" leaves them waiting there as usual
    this.choose(card, i => {
      if (i === 0) this.switchShop(null)
    })
  }

  /** The welcome-back card over whatever is open; closing it lifts only its own cover, so a panel underneath stays frozen. */
  private showAway(back: AwayResult, then?: () => void): void {
    const release = this.attention.cover('away')
    const data: AwayData = {
      // the card's figures are the main shop's staff
      sim: this.chain.main,
      back,
      onDone: () => {
        release()
        this.floatMoneyAt(this.ui, TOP_BAR.moneyX + 120, 250, back.paid, HUD_DEPTH + 40)
        then?.()
      },
    }
    this.scene.launch('AwayScene', data)
  }

  /** The slot was saved by a newer version: nothing runs and nothing is written; reloading fetches the newer version. */
  private showTooNew(): void {
    this.tooNew = true
    this.ui.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    addCard(this.ui, 90, 800, 900, 520)
    this.ui.add
      .text(GAME_W / 2, 880, t('saveTooNew'), { ...textStyle(42, '600'), align: 'center', wordWrap: { width: 780 } })
      .setOrigin(0.5, 0)
    addButton(this.ui, GAME_W / 2, 1190, 720, 120, t('reload'), 'primary', () => location.reload())
  }

  /** Looks for the friend's shop with the code over the empty page; once it comes, the scene starts again on a copy of it. */
  private findShop(code: string): void {
    this.finding = true
    // this page's own shop, read and never written: its name and code go to the host, who can visit back
    const own = openStore()
    const slot = own.currentSlot()
    let mine: SaveData | null = null
    try {
      mine = own.load(slot)
    } catch {
      // a shop from a newer version introduces itself by no name
    }
    const hello: Hello = { name: mine?.shopName ?? t('guestSomeone'), code: mine?.friends.code || null }
    this.ui.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive()
    addCard(this.ui, 90, 760, 900, 640)
    const text = this.ui.add
      .text(GAME_W / 2, 860, t('visitFinding', { code: showVisitCode(code) }), { ...textStyle(42, '600'), align: 'center', wordWrap: { width: 780 } })
      .setOrigin(0.5, 0)
    const home = addButton(this.ui, GAME_W / 2, 1280, 720, 120, t('visitHome'), 'plain', () => this.goHome())
    const failed = (problem: VisitProblem) => {
      text.setText(t(VISIT_PROBLEM[problem], { code: showVisitCode(code) }))
      home.destroy()
      addButton(this.ui, GAME_W / 2 - 190, 1280, 340, 120, t('visitHome'), 'plain', () => this.goHome(), 40)
      addButton(this.ui, GAME_W / 2 + 190, 1280, 340, 120, t('visitRetry'), 'primary', () => location.reload(), 40)
    }
    visitHouse(code, hello, VISIT_WAIT_MS).then(
      data => {
        let chain: Chain
        try {
          chain = Chain.fromSave(data, Date.now())
        } catch {
          failed('bad')
          return
        }
        // the friend joins this player's list when their own shop next opens
        own.addMet(slot, { code, name: data.shopName })
        this.ui.clear()
        const next: SpaSceneData = { chain, held: [], arrived: false, visit: true }
        this.scene.restart(next)
      },
      e => failed(e instanceof VisitError ? e.problem : 'noLink'),
    )
  }

  /** The shop's code for friends, given once; the friends visited since it last opened join its list, and its door opens if it lets friends in. */
  private meetFriends(): void {
    const friends = this.chain.main.friends
    if (!friends.code) friends.code = newVisitCode()
    // the latest met goes in last, so it ends on top
    for (const f of this.store.takeMet(this.session.slot).reverse()) addFriend(friends, f.code, f.name)
    if (friends.open) this.openDoor()
  }

  /** Lets friends in with the shop's code while the game is open. */
  private openDoor(): void {
    openHouse(this.chain.main.friends.code, () => this.chain.toSave(), h => this.welcome(h))
  }

  /** A friend has come to look round: they go to the top of the list, and the owner hears of it. */
  private welcome(h: Hello): void {
    if (h.code) addFriend(this.chain.main.friends, h.code, h.name)
    this.hud.toast(t('guestArrivedToast', { name: h.name }))
    this.session.saveNow()
  }

  /** Back to the player's own shop: the page opens again without the friend's code. */
  private goHome(): void {
    location.replace(homeLink(location.href))
  }

  /** The pause button at a friend's shop asks whether to go home. */
  private askHome(): void {
    this.choose({ kicker: this.chain.main.shopName, title: t('visitLeaveTitle'), lines: [], buttons: [t('visitHome'), t('visitStay')] }, i => {
      if (i === 0) this.goHome()
    })
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
    if (BUILD_ID === 'dev' || !this.sim.profileDone || this.playing() || this.scene.isActive('LessonScene')) return
    const release = this.attention.cover('update')
    const latest = await latestVersion(UPDATE_WAIT_MS)
    if (shouldReload(BUILD_ID, latest, this.playing(), this.scene.isActive('LessonScene'))) this.session.reloadForUpdate()
    else release()
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
      friends: this.chain.main.friends,
      onDoor: open => {
        this.chain.main.friends.open = open
        if (open) this.openDoor()
        else currentHouse()?.close()
        this.session.saveNow()
      },
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
    if (this.pendingCook) {
      this.cook(this.pendingCook)
      this.pendingCook = null
    }
  }

  /** The owner stands at a stove with a diner's ticket: that dish's game opens, and its stars send her off with the dish. */
  private cook(e: Extract<RestaurantEvent, { type: 'cookReady' }>): void {
    const restaurant = this.chain.restaurant
    const d = restaurant?.diners.find(x => x.id === e.dinerId)
    if (!restaurant || !d) return
    const data: CookData = {
      look: d.look,
      kind: d.kind,
      extraMs: dayEase(this.sim.day).miniGameExtraMs,
      hard: KINDS[d.kind].hard,
      demo: restaurant.needsLesson(d.dish),
      ticket: d.ticket,
      onDone: stars => restaurant.completeCooking(d.id, stars),
    }
    this.scene.launch(COOK_SCENE[d.dish], data)
  }

  /** A mini-game is being played: a spa service or a bowl at the restaurant's stove. */
  private playing(): boolean {
    return this.sim.servingCustomerId !== null || this.chain.cooking()
  }

  /** What the shop under the covers is doing, for what waits on it; the practice game of a lesson is played under the open LessonScene. */
  private shopState(): ShopState {
    const now = this.time.now
    return {
      paused: this.sim.paused,
      dayOver: this.sim.dayOver,
      playing: this.playing(),
      lesson: this.scene.isActive('LessonScene'),
      topBusy: this.tour.length > 0 || now < Math.max(this.badgeUntil, this.hud.lastBannerAt + BANNER_MS),
    }
  }

  /** The world the camera may show: at the main shop the street out to the restaurant, at a branch its own houses. */
  private mapRect(): Rect {
    if (this.chain.at !== null) return mapBounds(this.sim.shownHouses())
    const street = streetBounds(this.sim.shownHouses(), this.restaurantShown())
    // the open street runs the map further down, across the road
    return this.chain.bustleOpen() ? openStreetBounds(street) : street
  }

  /** The day's light and the power cut's dark lie over the whole street at the main shop; at a branch over its bought houses, as RoomView has it. */
  private lightRect(): Rect | undefined {
    return this.chain.at === null ? streetBounds(this.sim.shownHouses(), this.restaurantShown()) : undefined
  }

  /** The restaurant's houses the street shows: none before it is bought. */
  private restaurantShown(): Houses {
    return this.chain.restaurant?.shownHouses() ?? NO_HOUSES
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
    this.attention.hold({ kind: 'wear', text: t('outfitWornToast', { name: t(OUTFIT_NAME[id]) }) })
    this.session.saveNow()
  }

  /** Opens the owner card over the shop; `after` runs once it closes. The owner and the shop's name are the main shop's, copied to every branch. */
  openOwnerCard(mode: OwnerMode, after: () => void): void {
    const release = this.attention.cover('panel')
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
        release()
        after()
      },
    }
    this.scene.launch('OwnerScene', data)
  }

  /** The shop under the screen's centre, which Build, Dịch vụ, Nhân viên and the floor pills act on: always the spa at a branch or before the restaurant is bought. */
  private centreShop(): ShopSide {
    return this.restaurant && this.chain.street ? shopAt(this.cam.view.cx, true) : 'spa'
  }

  /** Build mode over the frozen shop under the centre; the build button opens it only while nothing else is open or being played. */
  private openBuild(): void {
    const sim = this.sim
    if (!this.attention.mapFree()) return
    const release = this.attention.cover('panel')
    const intro = !sim.hintDone('openBuild')
    sim.markHint('openBuild')
    const shop = this.centreShop()
    if (sim.floors > 1 && shop === 'spa') sim.markHint('openFloor')
    const restaurant = shop === 'restaurant' ? this.chain.restaurant : null
    // build mode works on an open floor of the shop under the centre: a floor in view that it has not opened (the other shop's) goes back to floor 1
    if (this.viewFloor > (restaurant ?? sim).floors) this.showFloor(1)
    const data: BuildData = {
      sim,
      place: restaurant ?? sim,
      shop,
      room: restaurant ? this.restaurant! : this.room,
      intro,
      onChange: () => {
        this.syncRoom()
        this.session.saveNow()
      },
      onClose: () => {
        release()
        this.pets.settle(this.sim)
        this.session.saveNow()
      },
      showFloor: floor => this.showFloor(floor),
      map: this,
      cam: this.cam,
    }
    this.scene.launch('BuildScene', data)
  }

  /** The staff panel over the frozen shop, opened only when build mode would be; at the restaurant, the cook panel. */
  private openStaff(): void {
    const sim = this.sim
    if (!this.attention.mapFree()) return
    const release = this.attention.cover('panel')
    const restaurant = this.centreShop() === 'restaurant' ? this.chain.restaurant : null
    if (restaurant) {
      const chefs: ChefData = {
        restaurant,
        onChange: () => this.session.saveNow(),
        onClose: () => {
          release()
          this.session.saveNow()
        },
      }
      this.scene.launch('ChefScene', chefs)
      return
    }
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
        release()
        this.session.saveNow()
      },
    }
    this.scene.launch('StaffScene', data)
  }

  /** The services panel over the frozen shop, opened only when build mode would be; at the restaurant, its menu. */
  private openServices(): void {
    const sim = this.sim
    if (!this.attention.mapFree()) return
    const release = this.attention.cover('panel')
    const restaurant = this.centreShop() === 'restaurant' ? this.chain.restaurant : null
    if (restaurant) {
      const menu: MenuData = {
        restaurant,
        onChange: () => this.session.saveNow(),
        onClose: () => {
          release()
          this.session.saveNow()
        },
      }
      this.scene.launch('MenuScene', menu)
      return
    }
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
        release()
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
    if (!sim.bookShown() || !this.attention.mapFree()) return
    const release = this.attention.cover('panel')
    const hint = sim.bookHint()
    const intro = hint === 'openBook' && !sim.hintDone(hint)
    sim.markHint(hint)
    const data: GuestBookData = {
      sim,
      intro,
      onClose: () => {
        release()
        this.session.saveNow()
      },
    }
    this.scene.launch('GuestBookScene', data)
  }

  /** The chain's map over the frozen shop, opened only when build mode would be: open a branch there, or go to another shop. */
  private openChainMap(): void {
    if (!this.attention.mapFree()) return
    const release = this.attention.cover('panel')
    this.chain.main.markHint('openChain')
    const data: ChainData = {
      chain: this.chain,
      visit: this.visit,
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
        release()
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
    if (!this.attention.mapFree()) return
    const release = this.attention.cover('panel')
    if (!sim.questsOpen()) {
      sim.markHint('openStarter')
      const data: StarterData = {
        sim,
        onClose: () => {
          release()
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
        release()
        this.session.saveNow()
      },
    }
    this.scene.launch('QuestsScene', data)
  }

  /** The Phây panel over the frozen chain, opened only when the quest panel would be; opening it reads every post. `focusId` is the post to show first. */
  private openPhay(focusId: number | null): void {
    if (!this.attention.mapFree() || !this.chain.main.feed.open) return
    const release = this.attention.cover('panel')
    const main = this.chain.main
    markRead(main.feed)
    const data: PhayData = {
      feed: main.feed,
      shopName: main.shopName,
      ownerLook: main.ownerLook,
      ownerOutfit: main.ownerOutfit,
      focusId,
      onClose: () => {
        release()
        this.session.saveNow()
      },
      // the complaint's customer is the main shop's, wherever the owner stands
      replyLine: (postId, reply) => main.replyLine(postId, reply),
      onAnswer: (postId, reply) => {
        main.answerPost(postId, reply)
        this.session.saveNow()
      },
      // boosts are the main shop's: its day, its price, and tomorrow's crowd at the main shop
      day: main.day,
      money: () => main.money,
      boostPrice: tier => main.boostPrice(tier),
      onBoost: (postId, tier) => {
        main.boostPost(postId, tier)
        this.session.saveNow()
      },
    }
    this.scene.launch('PhayScene', data)
  }

  /**
   * When nothing else asks for the player: a follower mark's gold card first, then the newest post that wants a notice.
   * The older posts waiting are folded into the red count.
   */
  private pumpPhay(): void {
    const feed = this.chain.main.feed
    if (feed.cheer.length > 0) {
      this.attention.hold({ kind: 'gold', card: milestoneCard(takeCheer(feed)!) })
      return
    }
    const post = nextNotice(feed, this.phayNotified)
    this.phayNotified = feed.nextId - 1
    if (post) this.showPhayNotice(post)
  }

  /** A cream bar with the phone, "Phây · vừa xong" and one line of the post slides down from the top for NOTICE_MS; a tap opens Phây at the post. It holds the shop's cards back like a gold card. */
  private showPhayNotice(post: Post): void {
    const n = NOTICE
    const bg = this.ui.add
      .graphics()
      .fillStyle(hex(C.cream), 1)
      .fillRoundedRect(-n.w / 2, -n.h / 2, n.w, n.h, n.r)
      .lineStyle(5, hex(C.ink))
      .strokeRoundedRect(-n.w / 2, -n.h / 2, n.w, n.h, n.r)
    const icon = this.ui.add.image(n.iconX, 0, 'icon-phone').setScale(0.9)
    const head = this.ui.add.text(n.textX, n.headY, t('phayNoticeHead'), textStyle(26, '800', C.soft)).setOrigin(0, 0.5)
    const line = this.ui.add.text(n.textX, n.lineY, noticeLine(post), textStyle(34, '800')).setOrigin(0, 0.5)
    line.setScale(Math.min(1, n.textW / line.width))
    const zone = this.ui.add.zone(0, 0, n.w, n.h).setInteractive()
    const box = this.ui.add
      .container(GAME_W / 2, n.y - n.slide, [bg, icon, head, line, zone])
      .setDepth(HUD_DEPTH + 60)
      .setAlpha(0)
    const close = () => {
      this.ui.tweens.killTweensOf(box)
      box.destroy()
      if (this.phayNotice === box) this.phayNotice = null
    }
    whenTapped(zone, () => {
      close()
      this.badgeUntil = this.time.now
      this.openPhay(post.id)
    })
    this.phayNotice = box
    this.badgeUntil = this.time.now + NOTICE_MS
    this.ui.tweens.chain({
      targets: box,
      tweens: [
        { y: n.y, alpha: 1, duration: 250, ease: 'Cubic.easeOut' },
        { alpha: 0, delay: NOTICE_MS - 500, duration: 250 },
      ],
      onComplete: close,
    })
  }

  /** Shows the toast once the one before it has had LATE_TOAST_MS on screen, after any toast already queued here. */
  private queueToast(text: string): void {
    const now = this.time.now
    const at = Math.max(now, this.hud.lastToastAt + LATE_TOAST_MS, this.toastQueueAt)
    this.toastQueueAt = at + LATE_TOAST_MS
    this.time.delayedCall(at - now, () => this.hud.toast(text))
  }

  /**
   * Lets out each thing waiting for the player as soon as it may show, until one covers the shop: see Attention for what waits on what.
   * A gold card goes up once the one before it, the morning banner and the first day's tour are gone, and a day-end badge waits through the summary, so it is seen the next morning.
   */
  private showHeld(): void {
    for (let h = this.attention.next(); h; h = this.attention.next()) {
      switch (h.kind) {
        case 'away':
          this.showAway(h.back)
          break
        case 'wear':
          this.queueToast(h.text)
          break
        case 'stairs':
          this.showStairsNote(h.note)
          break
        case 'inspection':
          this.showInspection(h.note)
          break
        case 'found': {
          // after this morning's month, VIP and stairs toasts, which are spaced the same way
          const text = h.text
          this.time.delayedCall(this.studiedToastMs, () => this.hud.toast(text))
          this.studiedToastMs += LATE_TOAST_MS
          break
        }
        case 'gold':
          this.badgeUntil = this.time.now + this.showCard(h.card)
          break
      }
    }
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
    const head = fit(this.ui.add.text(BADGE_CARD.textX, 300, card.head, textStyle(32, '800', C.terracotta)).setOrigin(0, 0.5))
    const name = fit(this.ui.add.text(BADGE_CARD.textX, 352, card.name, textStyle(50)).setOrigin(0, 0.5))
    const line = this.ui.add.text(BADGE_CARD.textX, 0, card.line, { ...textStyle(28, '600', C.soft), wordWrap: { width: BADGE_CARD.textW } })
    // the first line sits where a badge's one line always did
    line.setY(400 - line.height / line.getWrappedText().length / 2)
    const h = Math.max(BADGE_CARD.h, line.y + line.height + BADGE_CARD.bottomPad - BADGE_CARD.y)
    const iconY = BADGE_CARD.y + h / 2
    const bg = this.ui.add
      .graphics()
      .fillStyle(hex(C.goldPale), 1)
      .fillRoundedRect(BADGE_CARD.x, BADGE_CARD.y, BADGE_CARD.w, h, BADGE_CARD.r)
      .lineStyle(5, hex(C.ink))
      .strokeRoundedRect(BADGE_CARD.x, BADGE_CARD.y, BADGE_CARD.w, h, BADGE_CARD.r)
    const icon: Phaser.GameObjects.GameObject[] = []
    if (typeof next === 'string') icon.push(addMedal(this.ui, next, BADGE_CARD.medalX, iconY, { got: true, ring: null }))
    else {
      const disc = this.ui.add.circle(BADGE_CARD.medalX, iconY, BADGE_CARD.discR, hex(next.icon.disc)).setStrokeStyle(5, hex(C.ink))
      const picture = this.ui.add.image(BADGE_CARD.medalX, iconY, next.icon.texture)
      picture.setScale(BADGE_CARD.icon / Math.max(picture.width, picture.height))
      if (next.icon.tint) picture.setTint(hex(next.icon.tint))
      icon.push(disc, picture)
    }
    const box = this.ui.add
      .container(0, 0, [bg, ...icon, head, name, line])
      .setDepth(HUD_DEPTH + 60)
      .setAlpha(0)
    if (typeof next === 'string' || !next.quiet) sound.play('levelUp')
    const ms = goldCardMs(line.getWrappedText().length)
    this.ui.tweens.chain({
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
  private showStairsNote(note: StairsCleared): void {
    for (const text of stairsToasts(note)) {
      this.time.delayedCall(this.studiedToastMs, () => this.hud.toast(text))
      this.studiedToastMs += LATE_TOAST_MS
    }
  }

  /** The inspector at the floor-1 door and the inspection card over the frozen shop; Xong pays out and lets the shop run again. */
  private showInspection(result: Inspected): void {
    const release = this.attention.cover('panel')
    if (this.viewFloor !== 1) this.showFloor(1)
    const door = this.room.tileToWorld(this.sim.grid.door)
    const inspector = new CharacterView(this, inspectorColors())
    inspector.container.setPosition(door.x, door.y).setDepth(door.y)
    const data: InspectData = {
      result,
      onDone: () => {
        inspector.container.destroy()
        release()
        if (result.reward > 0) this.floatMoneyAt(this.ui, TOP_BAR.moneyX + 120, 250, result.reward, HUD_DEPTH + 40)
        if (result.cert) this.queueToast(t('certToast'))
        this.session.saveNow()
      },
    }
    this.scene.launch('InspectScene', data)
  }

  /** The Áo mới card for the highest outfit just unlocked; either button counts all of them as seen. */
  private showNewOutfits(): void {
    const ids = this.sim.newOutfits()
    if (ids.length === 0) return
    const id = ids[ids.length - 1]
    const release = this.attention.cover('panel')
    const done = (wear: boolean) => () => {
      this.sim.markOutfitsSeen(ids)
      release()
      if (wear) this.wear(id)
      this.session.saveNow()
    }
    const data: NewOutfitData = { sim: this.sim, id, more: ids.length - 1, onLater: done(false), onWear: done(true) }
    this.scene.launch('NewOutfitScene', data)
  }

  /** Chú Sáu's litter: a kitten or a puppy, named, and it walks in from the door; put off, it comes back tomorrow or at the next open. */
  private showLitter(): void {
    const release = this.attention.cover('panel')
    const later = () => {
      this.litterLaterDay = this.sim.day
      release()
    }
    const litter: LitterData = {
      onLater: later,
      onPick: breed => {
        const naming: PetNameData = {
          breed,
          price: null,
          // back to the litter, to pick the other one
          onCancel: () => this.scene.launch('LitterScene', litter),
          onDone: name => {
            const pet = this.sim.takeLitter(breed, name)
            release()
            if (!pet) return
            this.queueToast(t('petHome', { name: pet.name }))
            this.session.saveNow()
          },
        }
        this.scene.launch('PetNameScene', naming)
      },
    }
    this.scene.launch('LitterScene', litter)
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
      // a new day may put a house up for sale: the bounds widen before the jump home
      this.syncHouses()
      this.showFloor(1)
      // the day starts at normal size, on the old shop
      this.cam.jump({ zoom: 1, cx: 540, cy: 990 })
      this.session.saveNow()
      this.showMorningBanner()
      const reward = (month?.reward ?? 0) + (year?.reward ?? 0)
      if (reward > 0) this.floatMoneyAt(this.ui, TOP_BAR.moneyX + 120, 250, reward, HUD_DEPTH + 40)
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
    this.restaurant?.setFloor(floor)
    this.syncRoom()
  }

  /** The top-centre tile of every machine bed, for its off mark while the power is out. */
  private machineBeds(): Tile[] {
    const kinds = MACHINES.map(id => SERVICES[id].bed)
    return this.sim.items.filter(i => kinds.includes(i.kind)).map(i => ({ x: i.x + size(i).w / 2, y: i.y }))
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

  /**
   * The floor buttons show whenever the shop is free to tap: not under a card, a pause, build mode or a mini-game, nor while waiting on an update check.
   * Over the restaurant they are its own once it is bought; over the spa its own once floors are open, or whenever another floor is in view, so the way down is always there.
   */
  private updateFloorBar(): void {
    const sim = this.sim
    const r = this.centreShop() === 'restaurant' ? this.chain.restaurant : null
    const shown = this.centreShop() === 'restaurant' ? r !== null : showPills(sim) || this.viewFloor !== 1
    if (!shown || !this.attention.mapFree()) {
      this.floorBar.hide()
      return
    }
    this.floorBar.show(r ? restaurantPills(r, this.viewFloor, r.ownerIn) : pills(sim, this.viewFloor), sim.ownerLook)
  }

  /** The strip shows whenever the map is free and wider than the screen, drawn from where this frame left the view. */
  private updateStrip(ownerX: number): void {
    const sim = this.sim
    if (!this.attention.mapFree() || !this.cam.overflowsX()) {
      this.strip.hide()
      return
    }
    const visible = this.cam.visible()
    const lots = stripLots(sim.houses, sim.shownHouses(), sim.place)
    const dots = offscreenWaiting(sim.customers, this.viewFloor, visible)
    if (this.chain.at !== null) {
      const door = this.room.tileToWorld(sim.grid.door).x
      this.strip.show({ bounds: this.cam.bounds, visible, lots, doors: [door], blocks: [], owner: ownerX, dots, look: sim.ownerLook })
      return
    }
    // the main shop's street: both blocks and doors, the owner wherever she is on it, and the diners holding tickets up too
    const r = this.chain.restaurant
    const ride = this.chain.street?.rideProgress() ?? null
    const owner = ride ? rideX(ride.to, ride.k) : r?.ownerIn ? restaurantX(r.owner.pos.x + 0.5) : ownerX
    this.strip.show({
      bounds: this.cam.bounds,
      visible,
      lots,
      doors: [DOOR_X.spa, DOOR_X.restaurant],
      blocks: stripBlocks(sim.shownHouses(), this.restaurantShown()),
      owner,
      dots: [...dots, ...(r ? ticketDots(r.diners, visible) : [])],
      look: sim.ownerLook,
    })
  }

  /** A viewed or open pill brings its floor into view, for the whole street; a locked one offers to open it, the restaurant's over the restaurant. Nothing while waiting on an update check, which hides the pills on its next frame. */
  private tapFloor(floor: number): void {
    if (this.attention.covered()) return
    const r = this.centreShop() === 'restaurant' ? this.chain.restaurant : null
    if (floor <= (r ?? this.sim).floors) this.showFloor(floor)
    // a friend's floors are looked at, never bought
    else if (this.visit) return
    else if (r) this.offerRestaurantFloor(floor)
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
    const release = this.attention.cover('panel')
    const close = () => {
      for (const p of parts) p.destroy()
      release()
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
      this.ui.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive(),
      addCard(this.ui, 90, 760, 900, 640),
      this.ui.add.text(GAME_W / 2, 810, t(`floorName${floor}` as StringKey), textStyle(60, '800')).setOrigin(0.5, 0),
      this.ui.add.text(GAME_W / 2, 910, floorCardLines(sim.place, floor as 2 | 3).join('\n'), { ...textStyle(44, '600'), align: 'center', wordWrap: { width: 780 } }).setOrigin(0.5, 0),
    ]
    if (note) parts.push(this.ui.add.text(GAME_W / 2, 1130, note, { ...textStyle(48, '800', C.lantern), align: 'center', wordWrap: { width: 780 } }).setOrigin(0.5, 0))
    // the open button is wide enough for its price; "Để sau" beside it is narrower, so the pair keeps even margins inside the card
    const openX = GAME_W / 2 + 165
    parts.push(addButton(this.ui, note ? GAME_W / 2 : GAME_W / 2 - 245, 1290, note ? 340 : 300, 120, t('floorLater'), 'plain', close))
    if (!note) {
      const openBtn = addButton(this.ui, openX, 1290, 460, 120, t('floorOpen', { money: formatMoney(price) }), 'primary', canOpen ? open : () => {}, 44)
      parts.push(openBtn)
      if (problem === 'money') {
        openBtn.setAlpha(0.45)
        parts.push(this.ui.add.text(openX, 1370, t('floorShort', { money: formatMoney(price - sim.money) }), textStyle(34, '600', C.lantern)).setOrigin(0.5, 0))
      }
    }
    for (const p of parts) p.setDepth(CARD_DEPTH)
  }

  /** The houses bought and for sale on the map, and the camera's bounds over them; `justBought` plays its purchase. */
  private syncHouses(justBought: House | null = null): void {
    const sim = this.sim
    this.room.setHouses(sim.houses, sim.shownHouses(), justBought, this.lightRect())
    this.syncRestaurantHouses()
    this.cam.setBounds(this.mapRect())
  }

  /** The restaurant's houses bought and for sale on the street, once it is bought. */
  private syncRestaurantHouses(): void {
    const r = this.chain.restaurant
    if (this.restaurant && r) this.restaurant.setHouses(r.houses, r.shownHouses())
  }

  /** The old house beside the main shop: before RESTAURANT_DAY a toast, then a card over the frozen shop to buy it as a restaurant, saying what is missing when the money is short. */
  private offerRestaurant(): void {
    const problem = this.chain.restaurantProblem()
    if (problem === 'owned') return
    if (problem === 'day') {
      this.hud.toast(t('restaurantLater'))
      return
    }
    const short = () => t('floorShort', { money: formatMoney(RESTAURANT_PRICE - this.sim.money) })
    const card: ChoiceText = {
      kicker: t('restaurantKicker'),
      title: t('restaurantTitle'),
      lines: [t('restaurantLine1'), t('restaurantLine2'), ...(problem === 'money' ? [short()] : [])],
      buttons: [t('houseBuy', { money: formatMoney(RESTAURANT_PRICE) }), t('floorLater')],
    }
    this.choose(card, i => {
      if (i !== 0) return
      const why = this.chain.buyRestaurant()
      if (why === 'money') this.hud.toast(short())
      if (why) return
      sound.play('thud')
      // its houses go up for sale with it: the street widens to them before the slide
      this.syncHouses()
      this.cam.slideTo(restaurantX(SHOP_X0 + 6.5))
      this.session.saveNow()
    })
  }

  /** A card over the frozen shop to open the restaurant's floor 2 or rooftop, saying why it cannot open yet: the floor below first, a way to the stairs, or the money missing. */
  private offerRestaurantFloor(floor: number): void {
    const r = this.chain.restaurant
    if (!r) return
    const problem = r.floorProblem(floor)
    if (problem === 'max') return
    const price = FLOOR_PRICE[floor]
    const note = (why: 'order' | 'blocked' | 'money') => (why === 'order' ? t('floorOrder') : why === 'blocked' ? t('floorBlocked') : t('floorShort', { money: formatMoney(price - r.money) }))
    const card: ChoiceText = {
      kicker: t('restaurantKicker'),
      title: t(`floorName${floor}` as StringKey),
      lines: [t(`restFloorLine${floor}a` as StringKey), t(`restFloorLine${floor}b` as StringKey), ...(problem ? [note(problem)] : [])],
      buttons: [t('floorOpen', { money: formatMoney(price) }), t('floorLater')],
    }
    this.choose(card, i => {
      if (i !== 0) return
      const why = r.openFloor(floor)
      if (why === 'max') return
      if (why) this.hud.toast(note(why))
      else sound.play('thud')
    })
  }

  /** A card over the frozen shop to buy the restaurant's next house on `side`, saying what is missing when the money is short. */
  private offerRestaurantHouse(side: Side): void {
    const r = this.chain.restaurant
    if (!r) return
    const problem = r.houseProblem(side)
    if (problem === 'max') return
    const price = r.housePrice(side)
    const short = () => t('floorShort', { money: formatMoney(price - r.money) })
    const card: ChoiceText = {
      kicker: t('restaurantKicker'),
      title: t(`houseTitle${side === 'right' ? 'Right' : 'Left'}${r.houses[side] + 1}` as StringKey),
      lines: [t('houseLine1'), t('restHouseLine2'), t('restHouseLine3'), ...(problem === 'money' ? [short()] : [])],
      buttons: [t('houseBuy', { money: formatMoney(price) }), t('floorLater')],
    }
    this.choose(card, i => {
      if (i !== 0) return
      if (r.buyHouse(side) === 'money') this.hud.toast(short())
    })
  }

  /** A card over the frozen shop to buy the next house on `side`, faded with what is missing when the money is short. */
  private offerHouse(side: Side): void {
    const sim = this.sim
    const problem = sim.houseProblem(side)
    if (problem !== null && problem !== 'money') return
    const price = sim.housePrice(side)
    const n = sim.houses[side] + 1
    const release = this.attention.cover('panel')
    const close = () => {
      for (const p of parts) p.destroy()
      release()
    }
    const buy = () => {
      close()
      if (sim.buyHouse(side)) return
      sound.play('thud')
      this.session.saveNow()
    }
    const title = `houseTitle${side === 'right' ? 'Right' : 'Left'}${n}` as StringKey
    // a branch lays its place's own floors, not the main shop's gạch bông
    const lines = [t('houseLine1'), t(sim.place === null ? 'houseLine2' : 'houseBranchLine2')]
    const parts: (Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Depth)[] = [
      this.ui.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive(),
      addCard(this.ui, 90, 740, 900, 680),
      this.ui.add.text(GAME_W / 2, 790, t(title), textStyle(60, '800')).setOrigin(0.5, 0),
      this.ui.add.text(GAME_W / 2, 890, [...lines, t('houseLine3')].join('\n'), { ...textStyle(42, '600'), align: 'center', wordWrap: { width: 780 } }).setOrigin(0.5, 0),
    ]
    // the same pair as the floor card: "Để sau" and the buy button wide enough for its price
    const buyX = GAME_W / 2 + 165
    parts.push(addButton(this.ui, GAME_W / 2 - 245, 1290, 300, 120, t('floorLater'), 'plain', close))
    const buyBtn = addButton(this.ui, buyX, 1290, 460, 120, t('houseBuy', { money: formatMoney(price) }), 'primary', problem === null ? buy : () => {}, 44)
    parts.push(buyBtn)
    if (problem === 'money') {
      buyBtn.setAlpha(0.45)
      parts.push(this.ui.add.text(buyX, 1370, t('floorShort', { money: formatMoney(price - sim.money) }), textStyle(34, '600', C.lantern)).setOrigin(0.5, 0))
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
    const release = this.attention.cover('panel')
    const close = () => {
      for (const p of parts) p.destroy()
      release()
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
      this.ui.add.rectangle(0, 0, GAME_W, GAME_H, hex(C.ink), 0.6).setOrigin(0).setInteractive(),
      addCard(this.ui, 90, 860, 900, 440),
      this.ui.add.text(GAME_W / 2, 950, text, { ...textStyle(48, '800'), align: 'center', wordWrap: { width: 720 } }).setOrigin(0.5, 0),
      addButton(this.ui, GAME_W / 2 - 190, 1170, 340, 120, t('cancel'), 'plain', close),
      addButton(this.ui, GAME_W / 2 + 190, 1170, 340, 120, t('buy'), 'primary', buy),
    ]
    for (const p of parts) p.setDepth(CARD_DEPTH)
  }

  update(time: number, delta: number) {
    if (this.tooNew || this.finding) return
    if (!this.attention.covered()) {
      this.chain.update(delta)
      // at the main shop, the cards it kept while the owner was away come first
      const events = [...(this.sim.place === null ? this.chain.takeHeld() : []), ...this.sim.drainEvents()]
      for (const e of events) this.handle(e)
      // two items can run low on the same customer: one toast, or the first would be destroyed unseen
      const low = events.flatMap(e => (e.type === 'stockLow' ? [e.item] : []))
      if (low.length > 0) this.queueToast(stockLowText(low))
      // the restaurant is the main shop's street's; at a branch nothing of it is drawn
      const restaurantEvents = this.chain.drainRestaurantEvents()
      for (const e of restaurantEvents) if (this.restaurant) this.handleRestaurant(e)
      // one portion can run both its dish's stock and the herbs low: one toast, or the first would be destroyed unseen
      const restaurantLow = restaurantEvents.flatMap(e => (e.type === 'stockLow' ? [e] : []))
      if (this.restaurant && restaurantLow.length > 0) this.hud.toast(restaurantStockText(restaurantLow)!)
    }
    // the welcome-back card over a panel too; a card opened by this frame's events (a bed slot's) goes before the rest, which wait for it rather than play under it
    this.showHeld()
    // a friend's shop brings up none of its owner's cards
    if (!this.visit) {
      if (this.attention.shopFree()) this.pumpPhay()
      if (this.attention.shopFree()) this.showNewOutfits()
      if (this.attention.shopFree() && this.sim.litterDue() && this.litterLaterDay !== this.sim.day) this.showLitter()
      // once, when the main shop has the stars for a chain: the card that opens it, after whatever cards came first
      if (this.sim.place === null && this.attention.shopFree() && this.chain.shouldTell()) {
        this.attention.hold({ kind: 'gold', card: unlockCard() })
        this.chain.told = true
        this.session.saveNow()
      }
      if (this.sim.place !== null) this.callOwner(this.sim.place)
      // once, when the street first opens: how to buy for it
      const main = this.chain.main
      if (this.bustle && this.chain.bustleOpen() && main.profileDone && !main.hintDone('bustle') && this.attention.shopFree()) {
        main.markHint('bustle')
        this.queueToast(t('bustleHint'))
      }
    }

    // never under build mode or a card, where the player may be looking at another floor on purpose
    if (!this.attention.covered()) {
      const follow = followFloor(this.sim, this.viewFloor, this.lastOwnerFloor)
      if (follow !== this.viewFloor) this.showFloor(follow)
    }
    this.lastOwnerFloor = floorOf(this.sim.owner.pos.y)
    // the owner on her bike: the view comes down to floor 1 as she sets off and the map follows her, unless a finger holds it; at the door it stays
    const ride = this.restaurant ? (this.chain.street?.rideProgress() ?? null) : null
    if (ride && !this.riding) this.showFloor(1)
    this.riding = ride !== null
    if (ride && !this.gestures.busy) this.cam.jump({ cx: rideX(ride.to, ride.k) })
    // in the restaurant the view goes with her up or down its stairs while she works for a diner, on the frame she comes off them; only while it is under the centre, never under a card or build mode
    const rest = this.restaurant ? this.chain.restaurant : null
    const restFloor = rest ? floorOf(rest.owner.pos.y) : 1
    if (!this.attention.covered() && this.centreShop() === 'restaurant' && rest?.ownerIn && !ride && rest.owner.task && restFloor !== this.lastRestOwnerFloor && restFloor !== this.viewFloor) this.showFloor(restFloor)
    this.lastRestOwnerFloor = restFloor

    const dt = this.sim.paused || this.attention.covered() ? 0 : delta
    const o = this.sim.owner
    const at = this.room.tileToWorld(o.pos)
    // on the stairs, the owner rises toward the next floor and fades
    const climb = climbPose(o)
    if (climb) at.y -= climb.lift * TILE
    // serving: face the bed beside the work tile, or down at a turned bed in front of it
    const task = o.task
    const station = task?.kind === 'serve' && o.path.length === 0 ? this.sim.stations.find(s => s.id === task.stationId) : undefined
    this.owner.setFacing(station ? workFacing(station) : o.facing)
    this.owner.setPose(o.path.length > 0 ? 'walk' : 'stand')
    // in the restaurant or on the street between, she is drawn there instead
    this.owner.container.setPosition(at.x, at.y).setDepth(at.y).setAlpha(climb?.alpha ?? 1).setVisible(this.room.onFloor(o.pos.y) && !this.sim.ownerNextDoor)
    this.owner.update(dt)

    // a badge tells which service a waiting customer wants once the shop offers more than one
    const badges = this.sim.availableServices().length > 1
    for (const c of this.sim.customers) {
      const s = this.customers.get(c.id)
      if (s) this.syncCustomer(c, s, time, dt, badges)
    }
    // staff also hold still while the owner plays, as the sim does
    this.staffLayer.update(this.sim, this.playing() ? 0 : dt)
    this.pets.update(this.sim, this.playing() ? 0 : dt)
    this.moveBubbles()
    this.humStars(dt)
    // festivals are the main shop's
    this.room.setFestival(this.sim.place === null ? festivalOf(this.sim.day) : null)
    this.room.setRival(rivalToday(this.sim.eventBook, this.sim.day))
    this.room.setPowerOut(this.sim.powerOut(), this.sim.powerOut() ? this.machineBeds() : [])
    this.restaurant?.sync(this.chain, this.sim.clock.minutes, this.sim.powerOut(), this.playing() ? 0 : dt)
    // after the restaurant's sync, so its rooms light up with the spa's from this frame
    const restaurantLit = this.restaurant?.litSpan()
    this.room.setDaylight(this.sim.clock.minutes, this.sim.powerOut(), this.sim.grid.door, restaurantLit ? [restaurantLit] : [])
    this.syncBustle(this.playing() ? 0 : dt)
    // the wait for a newer version draws nothing over the shop, so the day's line stays up through it
    this.hud.update(this.attention.covered('panel', 'shutter', 'away'))
    this.hud.setShopLabel(this.restaurant && this.chain.street ? this.centreShop() : null)
    // the street's chip on the player's own main shop once the street is open, never under a card
    const chip = this.bustle && !this.visit && this.chain.bustleOpen() && !this.attention.covered()
    this.hud.setBustle(chip ? bustleScore(this.chain.main.bustle) : null, BUSTLE_SCORE_MAX)
    // Phây is the main shop's, shared by its branches; the button gives way to the gold card and the morning banner, which use its spot
    const feed = this.chain.main.feed
    this.hud.setPhay(!this.visit && phayButtonShown(feed.open, this.time.now < this.badgeUntil, this.time.now < this.hud.lastBannerAt + BANNER_MS), unreadCount(feed), this.sim.place !== null)
    this.updateFloorBar()
    if (this.attention.mapFree()) this.zoomButtons.show(1010, 1520, 1630)
    else this.zoomButtons.hide()
    // leading a customer to a bed out of view on this floor: one slide puts the owner in the middle, never under a finger
    if (this.attention.mapFree() && !this.gestures.busy && !this.cam.sliding && task?.kind === 'serve' && o.path.length > 0 && floorOf(o.pos.y) === this.viewFloor && !this.cam.isVisible(at.x, at.y, TILE)) this.cam.slideTo(at.x, at.y)
    this.cam.update(delta)
    this.updateStrip(at.x)
    this.updatePointer(delta)
  }

  /** One hint at a time: the money and star pointers after the first payment first, then the waiting customers, then the build or staff button. */
  private updatePointer(delta: number): void {
    const sim = this.sim
    // a friend's shop is only looked at, so nothing is pointed out
    if (!this.attention.mapFree() || this.visit) {
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
    // a customer newly pointed at out of view: the map slides to them, and the hand shows once they are in view; not while the owner is next door, the slide waits until she is back
    if (pick && at?.visible && !sim.ownerNextDoor && pick.customerId !== this.pointedId) {
      this.pointedId = pick.customerId
      if (!this.gestures.busy && !this.cam.isVisible(at.x, at.y)) this.cam.slideTo(at.x, at.y)
    }
    if (!pick || !at || !at.visible || !this.cam.isVisible(at.x, at.y)) {
      this.pointer.hide()
      return
    }
    // the hand is drawn over the map, where the customer is on screen
    const head = this.cam.toScreen(at.x, at.y - CHARACTER_HEIGHT_PX - 10)
    const bar = this.cam.toScreen(at.x, at.y + PATIENCE_BAR_TOP)
    if (pick.hint === 'tapCustomer') {
      this.pointer.show(t('hintTapCustomer'), head.x, head.y, 'down')
      return
    }
    if (pick.hint === 'regular') {
      this.pointer.show(t('hintRegular'), bar.x, bar.y, 'down')
      this.regularHintMs += delta
      if (this.regularHintMs >= PATIENCE_HINT_MS) sim.markHint('regular')
      return
    }
    if (pick.hint === 'vip') {
      this.pointer.show(t('hintVip'), bar.x, bar.y, 'down')
      this.vipHintMs += delta
      if (this.vipHintMs >= PATIENCE_HINT_MS) sim.markHint('vip')
      return
    }
    this.pointer.show(t('hintPatience'), bar.x, bar.y, 'down')
    this.patienceHintMs += delta
    if (this.patienceHintMs >= PATIENCE_HINT_MS) sim.markHint('patience')
  }

  private handle(e: SimEvent): void {
    if (this.visit && e.type === 'serviceReady') {
      this.sim.completeService(e.customerId, VISIT_STARS)
      return
    }
    if (this.visit && !VISIT_EVENTS.has(e.type)) return
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
      case 'houseBought': {
        // the bounds take the new house in before the slide there
        this.syncHouses(e.house)
        const r = houseRect(e.house)
        this.cam.slideTo(r.x + r.w / 2)
        this.syncRoom()
        if (!this.sim.hintDone('buyHouse')) {
          this.queueToast(t('buyHouseHint'))
          this.sim.markHint('buyHouse')
        }
        return
      }
      case 'stairsCleared':
        // it comes as the shop loads, under the pause card, the owner card or the day's summary; update shows it once they are gone
        this.attention.hold({ kind: 'stairs', note: e })
        return
      case 'bedSlot':
        this.offerBed(e.slot)
        return
      case 'questDone':
        this.floatMoneyAt(this.ui, TOP_BAR.moneyX + 120, 250, e.quest.reward, HUD_DEPTH + 40)
        this.queueToast(t('questDoneToast', { name: questTitle(e.quest), money: formatMoney(e.quest.reward) }))
        return
      case 'badge':
        this.attention.hold({ kind: 'gold', card: e.id })
        return
      case 'festivalStarted':
        this.attention.hold({ kind: 'gold', card: festivalStartCard(e, monthOf(this.sim.day)) })
        return
      case 'goalDone':
        if (e.reward > 0) this.floatMoneyAt(this.ui, TOP_BAR.moneyX + 120, 250, e.reward, HUD_DEPTH + 40)
        this.attention.hold({ kind: 'gold', card: goalCard(e) })
        return
      case 'festivalQuestDone':
        this.floatMoneyAt(this.ui, TOP_BAR.moneyX + 120, 250, e.quest.reward, HUD_DEPTH + 40)
        this.attention.hold({ kind: 'gold', card: festivalDoneCard(e) })
        return
      case 'eventToday':
        this.attention.hold({ kind: 'gold', card: eventCard(e.plan, this.sim.rivalTarget()) })
        return
      case 'hotStarted':
        this.attention.hold({ kind: 'gold', card: hotCard(this.sim.eventBook.hotBy) })
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
        this.attention.hold({ kind: 'inspection', note: e })
        return
      case 'rivalBeaten':
        this.floatMoneyAt(this.ui, TOP_BAR.moneyX + 120, 250, e.reward, HUD_DEPTH + 40)
        this.attention.hold({ kind: 'gold', card: rivalBeatenCard(e) })
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
        this.attention.hold({ kind: 'found', text: t('badgesFoundToast', { n: e.n }) })
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
          // read now, before the new day's startDay clears it; null once the owner is at a branch
          restaurant: this.chain.restaurant?.stats ?? null,
          onNewDay: () => this.showRankCards(),
        }
        this.scene.launch('SummaryScene', data)
        return
      }
    }
  }

  private handleRestaurant(e: RestaurantEvent): void {
    if (this.visit && e.type === 'cookReady') {
      this.chain.restaurant?.completeCooking(e.dinerId, VISIT_STARS)
      return
    }
    if (this.visit && e.type === 'toast') return
    switch (e.type) {
      case 'cookReady':
        if (this.sim.paused) this.pendingCook = e
        else this.cook(e)
        return
      case 'dinerPaid':
        sound.play('coin')
        if (this.restaurant && floorOf(e.tile.y) === this.viewFloor) this.floatMoneyAt(this, restaurantX(e.tile.x + 0.5), this.restaurant.rowY(e.tile.y + 1) - 130, e.amount + e.tip, FX_DEPTH + 10)
        return
      case 'toast':
        this.hud.toast(t(e.key))
        return
      case 'stockLow':
        // toasted together, once per step, where the events are drained
        return
      case 'houseBought': {
        // the bounds take the new house in before the slide there
        this.syncHouses()
        const h = restaurantHouseRect(e.house)
        this.cam.slideTo(h.x + h.w / 2)
        sound.play('thud')
        this.session.saveNow()
        return
      }
      case 'floorOpened':
        this.showFloor(e.floor)
        this.session.saveNow()
        return
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
      liftSide: UP,
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
    // the bed, foot chair or nail desk they are at: its head is where a lying head goes and where the seat is
    const piece = onStation ? this.sim.items.find(i => i.id === c.stationId) : undefined
    const head = piece ? headSide(piece) : UP
    // lying in a mud tub, the customer is drawn to its middle: half a tile towards its other column, the side the tent's steam takes, or half a tile down in a turned one
    const tub = lying && piece?.kind === 'mudTub' ? piece : undefined
    if (tub) {
      const off = bedCentreOffset(tub)
      p.x += off.x * TILE
      p.y += off.y * TILE
    }
    // a customer on the bed, or stepping on or off it, draws over the bed, whose anchor is one tile lower;
    // a turned bed's anchor is its own bottom row, so they draw just over that, still under whoever stands in front of it
    const on = !street && onBed(this.sim.grid, c.pos)
    const across = on ? this.sim.items.find(i => i.turned && ITEMS[i.kind].group === 'bed' && tileEq(bedTile(i), tileOf(c.pos))) : undefined
    const depth = across ? this.room.rowY(across.y + size(across).h) + 1 : on ? p.y + TILE + 1 : sitting ? p.y + 1 : p.y
    // the chair's seat is its tile toward its head, one above the bed tile they stand on, or beside it on a turned one; they rise onto it and step down rather than hop
    s.lift = Math.min(1, Math.max(0, s.lift + ((seated ? 1 : -1) * dt) / FOOT_SEAT_MS))
    if (seated) s.liftSide = head
    p.x += TILE * s.lift * s.liftSide.x
    p.y += TILE * s.lift * s.liftSide.y

    // face down on the massage and stone beds, face up anywhere else
    // a waiting customer on a seat faces the front of the piece under them, which an upright bench turns sideways
    const seat = c.state === 'waiting' && sitting && !seated ? this.sim.items.find(i => seatTiles(i).some(t => tileEq(t, c.pos))) : undefined
    const facing = seat ? seatFacing(seat) : null
    // on an upright seat the waiting marks move a tile to the side they face, off the faces of those sitting above, or to the other side when a wall or the grid's edge is there
    const side = facing === 'left' ? -1 : 1
    const wall = (dx: number) => (this.sim.grid.cells[c.pos.y]?.[c.pos.x + dx] ?? 'wall') === 'wall'
    const markDx = seat?.turned ? (wall(side) ? -side : side) * TILE : 0
    // seated, they face away from the piece's head: down, or right on a turned piece whose head is on the left, left on one whose head is on the right
    const away: Facing = head.x < 0 ? 'right' : head.x > 0 ? 'left' : 'down'
    s.view.setFacing(lying ? (c.service === 'massage' || c.service === 'stone' || c.service === 'scrub' ? 'up' : 'down') : facing ?? (seated ? away : c.state === 'waiting' ? 'down' : p.facing))
    s.view.setPose(lying ? 'lie' : sitting ? 'sit' : street || c.path.length > 0 ? 'walk' : 'stand')
    s.view.setMask(c.service === 'mask' && c.state === 'inService')
    // only the towel-wrapped head shows over the mud
    s.view.setTowel(tub !== undefined)
    // lying in a steam tent, the customer is out of sight and the tent steams
    const tent = lying && piece?.kind === 'steamTent' ? piece : undefined
    // lying on a turned bed, the figure, with its mask, towel and blanket, turns about the bed tile's centre so the head lies toward the bed's head
    const lie = lying ? head : UP
    const at = liePoint(p, 0, lie)
    s.view.container.setPosition(at.x, at.y).setRotation(lieAngle(lie)).setDepth(depth).setAlpha(p.alpha).setVisible(!tent)
    s.view.update(dt)
    s.steam.setVisible(tent !== undefined)
    if (tent) {
      // the bed tile is the tent's half beside the work tile, or its upper half once turned: the steam rises from the tent's middle, over its bottom edge
      const off = bedCentreOffset(tent)
      const bob = STEAM_BOB.px * Math.sin((time / STEAM_BOB.ms) * 2 * Math.PI)
      s.steam.setPosition(p.x + off.x * TILE, p.y + (off.y + 0.5) * TILE - TENT_KNOB_TILES * TILE + bob).setDepth(depth)
    }
    // served on the stone bed, the customer has hot stones along the back, turned with them; a hair deeper, as an equal depth can sort them under the customer
    const stones = c.service === 'stone' && c.state === 'inService'
    s.stones.setVisible(stones)
    if (stones) {
      const back = liePoint(p, STONES_TILES * TILE, lie)
      s.stones.setPosition(back.x, back.y).setRotation(lieAngle(lie)).setDepth(depth + 0.5)
    }

    s.bar.clear()
    if (c.state === 'waiting') {
      drawPatienceBar(s.bar, p.x + markDx, p.y, c.patienceMs / c.patienceMaxMs)
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
      if (sim.paused || this.playing()) continue
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
      if (spot) b.setPosition(spot.x, spot.y, this.inView()).setVisible(spot.floor === this.viewFloor)
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
    if (spot) b.setPosition(spot.x, spot.y, this.inView())
  }

  /** The left and right of the part of the map on screen, in world pixels: speech stays within them. */
  private inView(): { left: number; right: number } {
    const v = this.cam.visible()
    return { left: v.x, right: v.x + v.w }
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
    return doorWalk(c.state, c.stateMs, this.room.tileToWorld(this.sim.grid.door), c.id % 2 === 1)
  }

  private floatMoney(tile: Tile, amount: number, depth = FX_DEPTH + 10): void {
    if (!this.room.onFloor(tile.y)) return
    const at = this.room.tileToWorld(tile)
    this.floatMoneyAt(this, at.x, at.y - 130, amount, depth)
  }

  /** A coin and "+money" centred on x, y that rises and fades: on the map, or over the HUD by the money counter. */
  private floatMoneyAt(on: Phaser.Scene, x: number, y: number, amount: number, depth: number): void {
    const label = on.add.text(0, 0, '+' + formatMoney(amount), { ...textStyle(46), stroke: C.cream, strokeThickness: 10 }).setOrigin(0, 0.5)
    const width = 48 + 8 + label.width
    const coin = on.add.image(-width / 2 + 24, 0, 'coin')
    label.x = -width / 2 + 56
    const box = on.add.container(x, y, [coin, label]).setDepth(depth)
    on.tweens.add({ targets: box, y: box.y - 60, duration: 1000, ease: 'Cubic.easeOut' })
    on.tweens.add({ targets: box, alpha: 0, duration: 1000, ease: 'Cubic.easeIn', onComplete: () => box.destroy() })
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

  /** Draws the street in front of the main shop as it is this frame, its passers-by and bus moving `dt` ms on. */
  private syncBustle(dt = 0): void {
    this.bustle?.sync({
      open: this.chain.bustleOpen(),
      floor: this.viewFloor,
      bought: this.chain.main.bustle,
      minutes: this.sim.clock.minutes,
      powerOut: this.sim.powerOut(),
      marks: !this.visit && this.viewFloor === 1,
      light: this.lightRect() ?? this.mapRect(),
      fronts: upperFronts(this.chain.main.houses, this.chain.restaurant?.houses ?? null),
      dt,
    })
  }

  /** A tap on the open street: a piece's card, or nothing at all across the road; false leaves the tap to the shops. */
  private bustleTap(w: Vec): boolean {
    if (!this.bustle || !this.chain.bustleOpen()) return false
    const { col, row } = streetAt(w.x, w.y)
    if (row < SIDEWALK_ROW) return false
    const id = bustleAt(col, row, this.viewFloor)
    // on an upper floor no + shows, so only a lot bought already answers
    if (id && (this.viewFloor === 1 || this.chain.main.bustle.includes(id))) {
      this.offerBustle(id)
      return true
    }
    return row >= STRIP_ROW
  }

  /** A card over the frozen shop for a piece of the street: what it is and does and its price, or that the street has it already. */
  private offerBustle(id: BustleId): void {
    const chain = this.chain
    const problem = chain.bustleProblem(id)
    if (problem === 'locked') return
    const { price, score } = BUSTLE_PIECES[id]
    const focus = bustleFocus(id)
    if (onSidewalk(id)) this.cam.slideTo(focus.x)
    else this.cam.slideTo(focus.x, focus.y)
    const owned = problem === 'owned'
    const short = () => t('floorShort', { money: formatMoney(price - chain.main.money) })
    const card: ChoiceText = {
      kicker: t('bustleKicker'),
      title: BUSTLE_TEXT[id].name,
      lines: [BUSTLE_TEXT[id].line, owned ? t('bustleOwned') : t('bustleEffect', { score, percent: bustlePercentText(score) }), ...(problem === 'money' ? [short()] : [])],
      buttons: owned ? [t('bustleClose')] : [t('houseBuy', { money: formatMoney(price) }), t('floorLater')],
    }
    this.choose(card, i => {
      if (owned || i !== 0) return
      const why = chain.buyBustle(id)
      if (why === 'money') this.hud.toast(short())
      if (why) return
      sound.play('thud')
      this.syncBustle()
      this.bustle?.pop(id)
      this.hud.toast(t('bustleBought', { name: BUSTLE_TEXT[id].name, score: bustleScore(chain.main.bustle), max: BUSTLE_SCORE_MAX }))
      this.session.saveNow()
    })
  }

  /** The street's list over the frozen shop; a row closes it and opens that piece's card. */
  private openBustleList(): void {
    if (!this.chain.bustleOpen() || this.attention.covered()) return
    const release = this.attention.cover('panel')
    const data: BustleListData = {
      bought: [...this.chain.main.bustle],
      onClose: id => {
        release()
        this.session.saveNow()
        if (id) this.offerBustle(id)
      },
    }
    this.scene.launch('BustleScene', data)
  }

  /** A tap on the map that no HUD object took, from the map's gestures: tested against what is under it on the map, at its world point. */
  private onMapTap(p: Phaser.Input.Pointer): void {
    // a card, a pause or a mini-game may have come up between the press and the lift
    if (!this.attention.mapFree()) return
    if (Phaser.Math.Distance.Between(p.downX, p.downY, p.upX, p.upY) > TAP_SLOP_PX) return
    const w = this.cam.toWorld(p.x, p.y)
    // under or over the map's area, a zoomed map has rows that are not drawn
    if (!this.cam.isVisible(w.x, w.y)) return
    const over = this.input.hitTestPointer(p)
    if (over.length > 0) {
      // a pet takes the tap: a pat, and the owner stays put
      const pet = this.pets.petAt(over)
      if (pet !== null && !this.attention.covered() && !this.sim.paused && !this.playing()) this.pets.pat(pet)
      return
    }
    // at a friend's shop a tap sends nobody anywhere and offers nothing for sale
    if (this.visit) return
    // the open street first: a sale roof takes any tap under it by its column alone
    if (this.bustleTap(w)) return
    // the restaurant beside the main shop: the old house offers itself, a bought one takes the tap on the floor in view
    const r = this.chain.restaurant
    // on floor 1, a roof for sale beside the restaurant offers its house
    const restHouse = this.restaurant && r && this.viewFloor === 1 ? restaurantSaleAt(r.houses, r.shownHouses(), w.x) : null
    if (restHouse) {
      const h = restaurantHouseRect(restHouse)
      this.cam.slideTo(h.x + h.w / 2)
      this.offerRestaurantHouse(restHouse.side)
      return
    }
    if (this.restaurant && (shopAt(w.x, r !== null) === 'restaurant' || this.restaurant.oldHouseHit(w))) {
      if (!r) this.offerRestaurant()
      else this.streetTap('restaurant', this.restaurant.dinerAt(w)?.chair ?? restaurantTileAt(w, this.viewFloor))
      return
    }
    // a roof for sale offers its house
    const house = saleAt(this.sim.houses, this.sim.shownHouses(), w.x)
    if (house) {
      const r = houseRect(house)
      this.cam.slideTo(r.x + r.w / 2)
      this.offerHouse(house.side)
      return
    }
    // A seated customer's head covers the tile above the seat, so test the figure before the floor.
    const hit = this.sim.customers.find(c => {
      if (c.state !== 'waiting' || !c.seat || this.floorOfCustomer(c) !== this.viewFloor) return false
      const at = this.room.tileToWorld(c.pos)
      return Math.abs(w.x - at.x) <= TILE / 2 && w.y <= at.y && w.y >= at.y - CHARACTER_HEIGHT_PX
    })
    const tile = hit?.seat ?? this.room.worldToTile(w.x, w.y)
    // a point above or below the floor in view would land on the rows of the next floor
    if (!this.room.onFloor(tile.y)) return
    // with a restaurant next door, the street knows where the owner is and sends her over when the tap asks for her
    if (this.restaurant && this.chain.street) this.streetTap('spa', tile)
    else this.sim.tapTile(tile)
  }

  /** A tap on one of the street's two shops; the owner holding work in the other one says so. */
  private streetTap(side: ShopSide, tile: Tile): void {
    if (this.chain.street?.tap(side, tile) === 'busy') this.hud.toast(t('ownerBusyTap'))
  }
}
