import { FRIENDS_MAX } from '../config'
import { t } from '../strings/vi'
import { cleanShopName } from './profile'

/** Letters and digits that are never taken for one another when read out or typed: no 0, O, 1, I or L. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const FRIEND_CODE_LENGTH = 6

/** The code typed or pasted back, whatever its case, spaces or the dash it is shown with; null when it is not one. */
export function parseFriendCode(text: string): string | null {
  const clean = text.toUpperCase().replace(/[\s-]/g, '')
  return clean.length === FRIEND_CODE_LENGTH && [...clean].every(ch => ALPHABET.includes(ch)) ? clean : null
}

/** A new code from `picks`, one random whole number per character. */
export const friendCodeFrom = (picks: ArrayLike<number>): string => Array.from(picks, n => ALPHABET[n % ALPHABET.length]).join('')

/** A friend's shop: the code that finds it and its name when last met. */
export interface Friend {
  code: string
  name: string
}

/** The main shop's own code for friends to find it, whether it lets them in while the game is open, and the friends' shops, the latest met first. */
export interface FriendBook {
  /** Empty until the game first gives the shop one. */
  code: string
  open: boolean
  list: Friend[]
}

export const emptyFriends = (): FriendBook => ({ code: '', open: false, list: [] })

/** Puts the friend at the top of the list under the name just met, dropping the one met longest ago past FRIENDS_MAX; never the shop's own code. */
export function addFriend(book: FriendBook, code: string, name: string): void {
  const clean = parseFriendCode(code)
  if (!clean || clean === book.code) return
  book.list = [{ code: clean, name: cleanShopName(name, t('guestSomeone')) }, ...book.list.filter(f => f.code !== clean)].slice(0, FRIENDS_MAX)
}

export function removeFriend(book: FriendBook, code: string): void {
  book.list = book.list.filter(f => f.code !== code)
}

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)

/** A saved book, field by field: shops saved before version 40 have no code yet, are closed and have no friends. */
export function repairFriends(x: unknown): FriendBook {
  if (!isObject(x)) return emptyFriends()
  const book: FriendBook = { code: (typeof x.code === 'string' && parseFriendCode(x.code)) || '', open: x.open === true, list: [] }
  const raw = Array.isArray(x.list) ? x.list : []
  // added oldest first, so the list keeps its order and the first of two with one code wins
  for (const f of [...raw].reverse()) if (isObject(f) && typeof f.code === 'string') addFriend(book, f.code, typeof f.name === 'string' ? f.name : '')
  return book
}
