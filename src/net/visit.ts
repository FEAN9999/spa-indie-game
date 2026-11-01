import { decodeSaveCode, encodeSaveCode } from '../save/code'
import { SaveTooNewError, type SaveData } from '../sim/save'

/** Letters and digits that are never taken for one another when read out or typed: no 0, O, 1, I or L. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const VISIT_CODE_LENGTH = 6
/** The address's parameter that opens a friend's shop: `?ghe=K7P2QX`. */
export const VISIT_PARAM = 'ghe'
/** Trystero's name for the game: only pages with the same one find each other. */
const APP_ID = 'fean9999-tiem-spa'
/** The longest visitor's name a host shows. */
const NAME_MAX = 40

/** A new code for a shop that invites friends. */
export function newVisitCode(): string {
  const picks = crypto.getRandomValues(new Uint32Array(VISIT_CODE_LENGTH))
  return Array.from(picks, n => ALPHABET[n % ALPHABET.length]).join('')
}

/** The code typed or pasted back, whatever its case, spaces or the dash it is shown with; null when it is not one. */
export function parseVisitCode(text: string): string | null {
  const clean = text.toUpperCase().replace(/[\s-]/g, '')
  return clean.length === VISIT_CODE_LENGTH && [...clean].every(ch => ALPHABET.includes(ch)) ? clean : null
}

/** In two halves, easy to read out: "K7P-2QX". */
export const showVisitCode = (code: string): string => `${code.slice(0, 3)}-${code.slice(3)}`

/** The game's address that opens the friend's shop with this code. */
export function visitLink(href: string, code: string): string {
  const url = new URL(href)
  url.search = ''
  url.hash = ''
  url.searchParams.set(VISIT_PARAM, code)
  return url.toString()
}

/** The code the address asks to visit, or null. */
export function visitCodeIn(href: string): string | null {
  return parseVisitCode(new URL(href).searchParams.get(VISIT_PARAM) ?? '')
}

/** The same address without the visit: the player's own shop. */
export function homeLink(href: string): string {
  const url = new URL(href)
  url.searchParams.delete(VISIT_PARAM)
  return url.toString()
}

/** A room as a visit uses it: who joins, and two kinds of line, each a string. Trystero's in the game, a fake in the tests. */
export interface VisitRoom {
  onJoin: ((peer: string) => void) | null
  /** The host's shop, as a save code. */
  onShop: ((code: string, peer: string) => void) | null
  /** A visitor's own shop name. */
  onHello: ((name: string, peer: string) => void) | null
  sendShop(code: string, peer: string): void
  sendHello(name: string, peer: string): void
  leave(): void
}

/** Joins the room named by the code; `onError` hears of a peer the network would not connect. */
export type JoinVisitRoom = (code: string, onError: () => void) => VisitRoom | Promise<VisitRoom>

/** Trystero over the public Nostr relays: they only introduce the two phones, the shop goes straight from one to the other. Loaded on first use. */
const joinTrystero: JoinVisitRoom = async (code, onError) => {
  const { joinRoom } = await import('trystero')
  const room = joinRoom({ appId: APP_ID }, code, { onJoinError: () => onError() })
  const shop = room.makeAction<string>('shop')
  const hello = room.makeAction<string>('hello')
  // a peer that left before the line went out needs nothing
  const quiet = () => {}
  const visit: VisitRoom = {
    onJoin: null,
    onShop: null,
    onHello: null,
    sendShop: (text, peer) => void shop.send(text, { target: peer }).catch(quiet),
    sendHello: (name, peer) => void hello.send(name, { target: peer }).catch(quiet),
    leave: () => void room.leave().catch(quiet),
  }
  room.onPeerJoin = peer => visit.onJoin?.(peer)
  shop.onMessage = (data, { peerId }) => {
    if (typeof data === 'string') visit.onShop?.(data, peerId)
  }
  hello.onMessage = (data, { peerId }) => {
    if (typeof data === 'string') visit.onHello?.(data, peerId)
  }
  return visit
}

/** The shop's open invitation: its code, and closing it. */
export interface House {
  readonly code: string
  close(): void
}

let house: (House & { save: () => SaveData; onGuest: (name: string) => void }) | null = null

/** The invitation open on this page, if any. */
export const currentHouse = (): House | null => house

/**
 * Opens the shop to friends until the page closes: whoever joins with its code is sent the shop as it is at that moment,
 * and `onGuest` hears their shop's name. Opening it again keeps the code and takes the new `save` and `onGuest`.
 */
export function openHouse(save: () => SaveData, onGuest: (name: string) => void, join: JoinVisitRoom = joinTrystero, code = newVisitCode()): House {
  if (house) {
    house.save = save
    house.onGuest = onGuest
    return house
  }
  let room: VisitRoom | null = null
  let closed = false
  const open = {
    code,
    save,
    onGuest,
    close: () => {
      closed = true
      room?.leave()
      if (house === open) house = null
    },
  }
  house = open
  void Promise.resolve(join(code, () => {})).then(
    r => {
      if (closed) return r.leave()
      room = r
      r.onJoin = peer => void encodeSaveCode(open.save()).then(text => r.sendShop(text, peer))
      r.onHello = name => open.onGuest(name.slice(0, NAME_MAX))
    },
    () => open.close(),
  )
  return open
}

/** `notFound`: no host answered in time; `noLink`: one was there but the network would not connect; `tooNew`: the host plays a newer version; `bad`: what came is not a shop. */
export type VisitProblem = 'notFound' | 'noLink' | 'tooNew' | 'bad'

export class VisitError extends Error {
  constructor(readonly problem: VisitProblem) {
    super(problem)
  }
}

/** Finds the shop with the code and fetches it, telling its host this player's shop name; VisitError when none comes within `waitMs`. */
export function visitHouse(code: string, name: string, waitMs: number, join: JoinVisitRoom = joinTrystero): Promise<SaveData> {
  return new Promise((resolve, reject) => {
    let done = false
    let room: VisitRoom | null = null
    let linkFailed = false
    const finish = (end: () => void) => {
      if (done) return
      done = true
      clearTimeout(timer)
      room?.leave()
      end()
    }
    const fail = (problem: VisitProblem) => finish(() => reject(new VisitError(problem)))
    // a peer the network would not connect may be another visitor, so it only counts once nobody has answered
    const timer = setTimeout(() => fail(linkFailed ? 'noLink' : 'notFound'), waitMs)
    Promise.resolve(join(code, () => (linkFailed = true))).then(
      r => {
        if (done) return r.leave()
        room = r
        r.onJoin = peer => r.sendHello(name, peer)
        r.onShop = text =>
          void decodeSaveCode(text).then(
            data => finish(() => resolve(data)),
            e => fail(e instanceof SaveTooNewError ? 'tooNew' : 'bad'),
          )
      },
      () => fail('noLink'),
    )
  })
}
