import { IDOL_TEXT } from '../strings/idols'
import {
  ANSWER_PLAIN, ANSWER_PLAIN_MANAGER, ANSWER_RIGHT, ANSWER_RIGHT_MANAGER, COMMENT_LINES, COMPLAINT_OPENERS, COMPLAINT_PIECES, DRAMA_LINES, IDOL_CLOSERS, IDOL_OPENERS, IDOL_PIECES, KOL_CLOSERS, KOL_OPENERS, KOL_PIECES,
  MANAGER_OPENERS, MANAGER_PIECES, PRAISE_CLOSERS, PRAISE_OPENERS, PRAISE_PIECES, REASON_LINE, REPLY_PLAIN, REPLY_RIGHT, REPLY_RUDE, RIVAL_OPENERS, RIVAL_PIECES, SHOP_OPENERS,
  SHOP_PIECES, STRANGER_NAMES, VIP_CLOSERS, VIP_OPENERS, VIP_PIECES, WARD_OPENERS, WARD_PIECES,
} from '../strings/phay'
import { BREED_NAME, t } from '../strings/vi'
import type { StringKey } from '../strings/vi'
import { VIP_TEXT } from '../strings/vips'
import { CUSTOMER_KINDS } from './customers'
import type { CustomerKind } from './customers'
import type { ComplaintReason, PostKind, ReplyKind } from './feed'
import { FESTIVALS } from './festivals'
import type { FestivalId } from './festivals'
import type { IdolId } from './idols'
import type { BreedId } from './pets'
import type { PlaceId } from './places'
import type { Rng } from './rng'
import { SERVICES } from './services'
import type { ServiceId } from './services'
import type { VipId } from './vips'

export { REASON_LINE }

export type ShopNews =
  | { kind: 'rank'; stars: number } | { kind: 'year'; place: number } | { kind: 'branch'; place: PlaceId }
  | { kind: 'house'; place: PlaceId | null } | { kind: 'floor'; floor: number } | { kind: 'pet'; name: string; breed: BreedId }
  | { kind: 'festival'; festival: FestivalId }

const PLACE_NAME: Record<PlaceId, StringKey> = { beach: 'placeBeach', oldTown: 'placeOldTown', uptown: 'placeUptown' }
const FLOOR_NAME: Record<number, StringKey> = { 1: 'floorName1', 2: 'floorName2', 3: 'floorName3' }

const pick = <T>(list: readonly T[], rng: Rng): T => list[Math.floor(rng() * list.length)]
const lower = (s: string): string => s.toLocaleLowerCase('vi')
/** Lowers only the first letter, so a proper noun inside (Xiêm, Phú Quốc) keeps its capitals. */
const lowerFirst = (s: string): string => s.charAt(0).toLocaleLowerCase('vi') + s.slice(1)
const serviceWord = (id: ServiceId): string => lower(t(SERVICES[id].name))

/** A template with its `{word}` slots filled. */
function fill(template: string, words: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in words ? String(words[key]) : match))
}

const sentence = (...parts: string[]): string => parts.join(' ')

export function praiseText(service: ServiceId, kind: CustomerKind, rng: Rng): string {
  return sentence(pick(PRAISE_OPENERS, rng), fill(pick(PRAISE_PIECES, rng), { service: serviceWord(service) }), pick(PRAISE_CLOSERS[kind], rng))
}

export function complaintText(reason: ComplaintReason, service: ServiceId, rng: Rng): string {
  return sentence(pick(COMPLAINT_OPENERS, rng), fill(pick(COMPLAINT_PIECES[reason], rng), { service: serviceWord(service) }))
}

export function managerText(idolName: string, reason: ComplaintReason, rng: Rng): string {
  return sentence(pick(MANAGER_OPENERS, rng), fill(pick(MANAGER_PIECES[reason], rng), { name: idolName }))
}

export function idolText(idol: IdolId, service: ServiceId, shopName: string, rng: Rng): string {
  return sentence(
    pick(IDOL_OPENERS, rng),
    fill(pick(IDOL_PIECES, rng), { shop: shopName, service: serviceWord(service) }),
    fill(pick(IDOL_CLOSERS, rng), { song: IDOL_TEXT[idol].song }),
  )
}

export function vipText(vip: VipId, service: ServiceId, rng: Rng): string {
  return sentence(pick(VIP_OPENERS, rng), fill(pick(VIP_PIECES, rng), { title: VIP_TEXT[vip].title, service: serviceWord(service) }), pick(VIP_CLOSERS, rng))
}

export function kolText(service: ServiceId, rng: Rng): string {
  return sentence(pick(KOL_OPENERS, rng), fill(pick(KOL_PIECES, rng), { service: serviceWord(service) }), pick(KOL_CLOSERS, rng))
}

export function rivalText(when: 'morning' | 'beaten', rng: Rng): string {
  return sentence(pick(RIVAL_OPENERS[when], rng), fill(pick(RIVAL_PIECES[when], rng), { rival: t('rivalSignName') }))
}

export function shopText(news: ShopNews, shopName: string, rng: Rng): string {
  const place = (id: PlaceId): string => t(PLACE_NAME[id])
  let pieces: readonly string[]
  let words: Record<string, string | number>
  switch (news.kind) {
    case 'rank': pieces = SHOP_PIECES.rank; words = { stars: news.stars }; break
    case 'year': pieces = SHOP_PIECES.year; words = { place: news.place }; break
    case 'branch': pieces = SHOP_PIECES.branch; words = { place: place(news.place) }; break
    case 'house':
      pieces = news.place === null ? SHOP_PIECES.houseMain : SHOP_PIECES.houseBranch
      words = { place: news.place === null ? '' : place(news.place) }
      break
    case 'floor': pieces = SHOP_PIECES.floor; words = { floor: lower(t(FLOOR_NAME[news.floor] ?? 'floorName2')) }; break
    case 'pet': pieces = SHOP_PIECES.pet; words = { name: news.name, breed: lowerFirst(BREED_NAME[news.breed]) }; break
    case 'festival': pieces = SHOP_PIECES.festival; words = { festival: t(FESTIVALS[news.festival].name) }; break
  }
  return sentence(pick(SHOP_OPENERS, rng), fill(pick(pieces, rng), { shop: shopName, ...words }))
}

export function wardText(shopName: string, rng: Rng): string {
  return sentence(pick(WARD_OPENERS, rng), fill(pick(WARD_PIECES, rng), { shop: shopName }))
}

export function strangerName(kind: CustomerKind, rng: Rng): string {
  return pick(STRANGER_NAMES[kind], rng)
}

/** The shop's line for a reply: the right one names the reason, the plain one an apology for nothing in particular, the rude one argues back. */
export function replyText(reply: ReplyKind, reason: ComplaintReason, rng: Rng): string {
  return pick(reply === 'right' ? REPLY_RIGHT[reason] : reply === 'plain' ? REPLY_PLAIN : REPLY_RUDE, rng)
}

/** The guest's (or, for a star's complaint, the manager's) answer to a right or a plain reply; a rude reply gets none here, only a stranger's drama. */
export function answerText(reply: ReplyKind, manager: boolean, rng: Rng): string {
  if (reply === 'rude') return ''
  if (reply === 'right') return pick(manager ? ANSWER_RIGHT_MANAGER : ANSWER_RIGHT, rng)
  return pick(manager ? ANSWER_PLAIN_MANAGER : ANSWER_PLAIN, rng)
}

/** A stranger's line under a rude reply, as [author, words]. */
export function dramaComment(rng: Rng): [string, string] {
  const author = strangerName(pick(CUSTOMER_KINDS, rng), rng)
  return [author, pick(DRAMA_LINES, rng)]
}

/** 0–2 comments under a post, as [author, words]; a rival's post always gets 2 defending the shop. The authors are the regulars first, then strangers, never the same twice. */
export function commentsFor(kind: PostKind, regulars: string[], rng: Rng): [string, string][] {
  const count = kind === 'rival' ? 2 : Math.floor(rng() * 3)
  const lines = [...COMMENT_LINES[kind]]
  const used = new Set<string>()
  const start = regulars.length > 0 ? Math.floor(rng() * regulars.length) : 0
  const out: [string, string][] = []
  for (let i = 0; i < count; i++) {
    let author = i < regulars.length ? regulars[(start + i) % regulars.length] : ''
    while (!author || used.has(author)) author = strangerName(pick(CUSTOMER_KINDS, rng), rng)
    used.add(author)
    const said = lines.splice(Math.floor(rng() * lines.length), 1)[0]
    out.push([author, said])
  }
  return out
}
