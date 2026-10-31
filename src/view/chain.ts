import { C } from '../art/palette'
import { DAY_END_MIN, PLACES } from '../config'
import type { Chain } from '../sim/chain'
import { clockLabel } from '../sim/clock'
import { staffCap } from '../sim/crew'
import { housesBought } from '../sim/layout'
import { dayProfit } from '../sim/economy'
import type { CustomerKind } from '../sim/customers'
import { PLACE_IDS, type PlaceId } from '../sim/places'
import type { SpaSim } from '../sim/spa'
import type { StaffRole } from '../sim/staff'
import { STOCK_NAME } from '../sim/stock'
import type { Look } from '../sim/types'
import type { IdolId } from '../sim/idols'
import type { VipId } from '../sim/vips'
import { formatMoney } from '../strings/format'
import { t, type StringKey } from '../strings/vi'
import { IDOL_TEXT } from '../strings/idols'
import { VIP_TEXT } from '../strings/vips'
import type { GoldCard } from './festivals'

const PLACE_NAME: Record<PlaceId, StringKey> = { beach: 'placeBeach', oldTown: 'placeOldTown', uptown: 'placeUptown' }

/** "Tiệm gốc" for the main shop, else the place's name. */
export const placeName = (place: PlaceId | null): string => t(place === null ? 'placeMain' : PLACE_NAME[place])

/** Money with a "+" in front when above 0. */
export const signedMoney = (n: number): string => (n > 0 ? '+' : '') + formatMoney(n)

/** Who stands between the title and the lines: a VIP or a star under five stars, or the owner by her scooter. */
export type ChoiceFigure = { kind: 'vip'; vip: VipId } | { kind: 'idol'; idol: IdolId } | { kind: 'owner' }

/** A card over the frozen shop that waits for one of its buttons, the first the main one. */
export interface ChoiceText {
  kicker: string
  title: string
  lines: string[]
  buttons: string[]
  figure?: ChoiceFigure
}

/** 20:00 at a branch: the owner goes back to the main shop; the staff line only when a technician is there to finish. */
export function closingCard(place: PlaceId, hasTech: boolean): ChoiceText {
  return {
    kicker: t('closingKicker', { time: clockLabel(DAY_END_MIN), place: placeName(place) }),
    title: t('closingTitle'),
    lines: [t('closingLine'), ...(hasTech ? [t('closingStaffLine')] : [])],
    buttons: [t('closingGo')],
    figure: { kind: 'owner' },
  }
}

/** A VIP came to the main shop while the owner is at a branch: back now, or stay. */
export function vipCallCard(vip: VipId): ChoiceText {
  return {
    kicker: t('vipCallKicker'),
    title: t('vipCallTitle', { name: VIP_TEXT[vip].name }),
    lines: [t('vipCallLine')],
    buttons: [t('vipCallGo'), t('vipCallStay')],
    figure: { kind: 'vip', vip },
  }
}

/** A star came to the main shop while the owner is at a branch: back now, or stay. */
export function idolCallCard(idol: IdolId): ChoiceText {
  return {
    kicker: t('idolCallKicker'),
    title: t('vipCallTitle', { name: IDOL_TEXT[idol].name }),
    lines: [t('idolCallLine')],
    buttons: [t('vipCallGo'), t('vipCallStay')],
    figure: { kind: 'idol', idol },
  }
}

/** The quiet notice on arriving at a branch with no technician. */
export const noTechCard = (place: PlaceId): GoldCard => ({
  icon: { texture: 'icon-staff', disc: C.mustard },
  head: t('noTechHead', { place: placeName(place) }),
  name: t('noTechName'),
  line: t('noTechLine'),
  quiet: true,
})

/** The card that opens the chain, once the main shop has the stars for it. */
export const unlockCard = (): GoldCard => ({
  icon: { texture: 'icon-chain', disc: C.mustard },
  head: t('unlockHead'),
  name: t('unlockName'),
  line: t('unlockLine'),
})

/** `here`: the owner is there; `open`: a shop she can go to; `can`: the stars are there to open it; `lock`: the stars are not. */
export type PinState = 'here' | 'open' | 'can' | 'lock'

/** What the map's sheet says about a place, and what its button does. `short`: the money missing to open; `warn`: who leaves the shop the owner is in if she goes. */
export interface Sheet {
  title: string
  status: string
  rows: string[]
  button: { text: string; on: boolean }
  short: string | null
}

/** A place's own customer (the kind, how it looks and its name) and the piece its room opens with. */
const PLACE_OWN: Record<PlaceId, { kind: CustomerKind; look: Look; name: StringKey; decor: StringKey }> = {
  beach: { kind: 'tourist', look: { skin: 1, hair: 1, hairStyle: 0, shirt: 0 }, name: 'kindTourist', decor: 'decorBeach' },
  oldTown: { kind: 'backpacker', look: { skin: 0, hair: 0, hairStyle: 0, shirt: 4 }, name: 'kindBackpacker', decor: 'decorOldTown' },
  uptown: { kind: 'lady', look: { skin: 0, hair: 0, hairStyle: 3, shirt: 3 }, name: 'kindLady', decor: 'decorUptown' },
}

/** The main shop's customer, off the street. */
const MAIN_FIGURE: { kind: CustomerKind; look: Look } = { kind: 'student', look: { skin: 0, hair: 2, hairStyle: 0, shirt: 1 } }

/** Who stands in the sheet's disc: someone off the street at the main shop, a place's own customer at a place. */
export const figureOf = (place: PlaceId | null): { kind: CustomerKind; look: Look } => (place === null ? MAIN_FIGURE : PLACE_OWN[place])

/** A factor as the sheet writes it, with one decimal after a comma: "1,2". */
const factor = (n: number): string => n.toFixed(1).replace('.', ',')

export function pinState(chain: Chain, place: PlaceId | null): PinState {
  if (place === chain.at) return 'here'
  if (place === null || chain.shop(place)) return 'open'
  const problem = chain.openProblem(place)
  return problem === 'stars' ? 'lock' : 'can'
}

/** A shop the owner is away from with no technician: its customers wait with nobody to serve them. */
const resting = (chain: Chain, place: PlaceId | null): boolean => pinState(chain, place) === 'open' && !chain.shop(place)!.hasTechnician()

/** The small line on a pin's sign, under the place's name. */
export function pinLabel(chain: Chain, place: PlaceId | null): string {
  const state = pinState(chain, place)
  if (place === null || state === 'here' || state === 'open') return resting(chain, place) ? t('pinResting') : t('pinProfit', { profit: signedMoney(dayProfit(chain.shop(place)!.stats)) })
  const { stars, price } = PLACES[place]
  if (state === 'lock') return t('pinNeed', { n: stars, price: formatMoney(price) })
  return t('pinCan', { price: formatMoney(price) })
}

/** Under the map's title: the main shop's stars and how many of the shops are open. */
export const mapSub = (chain: Chain): string => t('mapSub', { n: chain.main.rank.stars, k: 1 + chain.branches.length, all: 1 + PLACE_IDS.length })

/** An open shop's day so far, its staff against what it can hire, and what runs low. */
function dayRows(shop: SpaSim): string[] {
  const { stats } = shop
  const count = (role: StaffRole) => shop.staff.filter(s => s.role === role && !s.leaving).length
  const low = shop.lowStock()
  return [
    t('sheetToday', { n: stats.served, m: stats.angry + stats.walkedAway }),
    t('sheetProfit', { profit: signedMoney(dayProfit(stats)) }),
    t('sheetStaff', { t: count('technician'), tc: staffCap('technician', shop.floors, housesBought(shop.houses)), r: count('receptionist'), rc: staffCap('receptionist', shop.floors, housesBought(shop.houses)) }),
    low.length === 0 ? t('sheetStockOk') : t('sheetStockLow', { items: low.map(item => t(STOCK_NAME[item]).toLocaleLowerCase('vi')).join(', ') }),
  ]
}

function statusOf(chain: Chain, place: PlaceId | null, state: PinState): string {
  if (place === null) return t('sheetMain', { n: chain.main.rank.stars })
  if (state === 'lock') return t('sheetLocked', { n: PLACES[place].stars, price: formatMoney(PLACES[place].price) })
  if (state === 'can') return t('sheetCan', { n: chain.main.rank.stars })
  return resting(chain, place) ? t('sheetResting') : t('sheetOpen')
}

function buttonOf(chain: Chain, place: PlaceId | null, state: PinState): Sheet['button'] {
  if (state === 'here') return { text: t('sheetHere'), on: false }
  if (place === null || state === 'open') return chain.goProblem(place) === 'closed' ? { text: t('sheetClosed'), on: false } : { text: t('sheetGo'), on: true }
  if (state === 'can') return { text: t('sheetOpenButton', { price: formatMoney(PLACES[place].price) }), on: chain.openProblem(place) === null }
  return { text: t('sheetNeed', { n: PLACES[place].stars }), on: false }
}

/** The sheet for the pin tapped: the place, how it stands, what is known of it, and opening it or going there. */
export function sheetOf(chain: Chain, place: PlaceId | null): Sheet {
  const state = pinState(chain, place)
  const shop = chain.shop(place)
  const rows: string[] = []
  if (place !== null) {
    rows.push(t('sheetKind', { kind: t(PLACE_OWN[place].name), arrival: factor(PLACES[place].arrival) }))
    rows.push(t('sheetPrice', { factor: factor(PLACES[place].priceFactor) }))
  }
  if (shop) rows.push(...dayRows(shop))
  else if (place !== null) rows.push(t('sheetRoom', { decor: t(PLACE_OWN[place].decor) }))
  const short = place !== null && state === 'can' && chain.openProblem(place) === 'money' ? t('problemMoney', { money: formatMoney(PLACES[place].price - chain.main.money) }) : null
  return {
    title: placeName(place),
    status: statusOf(chain, place, state),
    rows,
    button: buttonOf(chain, place, state),
    short,
  }
}
