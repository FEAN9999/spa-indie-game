import { C } from '../art/palette'
import { DAY_END_MIN } from '../config'
import { clockLabel } from '../sim/clock'
import type { PlaceId } from '../sim/places'
import type { VipId } from '../sim/vips'
import { formatMoney } from '../strings/format'
import { t, type StringKey } from '../strings/vi'
import { VIP_TEXT } from '../strings/vips'
import type { GoldCard } from './festivals'

const PLACE_NAME: Record<PlaceId, StringKey> = { beach: 'placeBeach', oldTown: 'placeOldTown', uptown: 'placeUptown' }

/** "Tiệm gốc" for the main shop, else the place's name. */
export const placeName = (place: PlaceId | null): string => t(place === null ? 'placeMain' : PLACE_NAME[place])

/** Money with a "+" in front when above 0. */
export const signedMoney = (n: number): string => (n > 0 ? '+' : '') + formatMoney(n)

/** A card over the frozen shop that waits for one of its buttons, the first the main one. */
export interface ChoiceText {
  kicker: string
  title: string
  lines: string[]
  buttons: string[]
}

/** 20:00 at a branch: the owner goes back to the main shop; the staff line only when a technician is there to finish. */
export function closingCard(place: PlaceId, hasTech: boolean): ChoiceText {
  return {
    kicker: t('closingKicker', { time: clockLabel(DAY_END_MIN), place: placeName(place) }),
    title: t('closingTitle'),
    lines: [t('closingLine'), ...(hasTech ? [t('closingStaffLine')] : [])],
    buttons: [t('closingGo')],
  }
}

/** A VIP came to the main shop while the owner is at a branch: back now, or stay. */
export function vipCallCard(vip: VipId): ChoiceText {
  return {
    kicker: t('vipCallKicker'),
    title: t('vipCallTitle', { name: VIP_TEXT[vip].name }),
    lines: [t('vipCallLine')],
    buttons: [t('vipCallGo'), t('vipCallStay')],
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
