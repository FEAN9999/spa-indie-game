import { MAX_PETS, PET_NAME_MAX } from '../config'
import { PET_NAME_IDEAS } from '../strings/vi'

/** The shop's pet breeds, cats first, each kind cheapest first. */
export const BREED_IDS = ['muop', 'mun', 'tamthe', 'xiem', 'chota', 'phuquoc', 'corgi', 'poodle'] as const
export type BreedId = (typeof BREED_IDS)[number]

export type PetKind = 'cat' | 'dog'

export const BREEDS: Record<BreedId, { kind: PetKind; price: number }> = {
  muop: { kind: 'cat', price: 450_000 },
  mun: { kind: 'cat', price: 600_000 },
  tamthe: { kind: 'cat', price: 900_000 },
  xiem: { kind: 'cat', price: 1_800_000 },
  chota: { kind: 'dog', price: 450_000 },
  phuquoc: { kind: 'dog', price: 1_500_000 },
  corgi: { kind: 'dog', price: 2_400_000 },
  poodle: { kind: 'dog', price: 3_000_000 },
}

/** The two Chú Sáu's litter offers, free. */
export const FREE_BREEDS: readonly BreedId[] = ['muop', 'chota']

export interface Pet {
  id: number
  breed: BreedId
  name: string
}

/** The shop's pets in adoption order, the next id, and whether Chú Sáu's litter has been taken. */
export interface PetBook {
  owned: Pet[]
  nextId: number
  litter: boolean
}

/** Why a pet cannot be adopted. */
export type PetProblem = 'full' | 'money' | 'main'

export const isBreedId = (x: unknown): x is BreedId => (BREED_IDS as readonly unknown[]).includes(x)

export function emptyPetBook(): PetBook {
  return { owned: [], nextId: 1, litter: false }
}

/** A branch's book: its pets live at the main shop, and Chú Sáu never brings it a litter. */
export function branchPetBook(): PetBook {
  return { owned: [], nextId: 1, litter: true }
}

/** A pet name as stored: composed letters, single spaces, at most PET_NAME_MAX letters; `fallback` when nothing is left. */
export function cleanPetName(raw: string, fallback: string): string {
  const squeezed = raw.normalize('NFC').replace(/\s+/g, ' ').trim()
  return [...squeezed].slice(0, PET_NAME_MAX).join('').trim() || fallback
}

const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)

/** A saved book made sound: unknown breeds and repeated ids dropped, names cleaned, the first MAX_PETS kept; an empty book with the litter untaken when missing. */
export function repairPets(x: unknown): PetBook {
  if (!isObject(x)) return emptyPetBook()
  const owned: Pet[] = []
  for (const p of Array.isArray(x.owned) ? x.owned : []) {
    if (!isObject(p) || !isBreedId(p.breed) || !Number.isInteger(p.id) || (p.id as number) < 1) continue
    if (owned.some(o => o.id === p.id)) continue
    owned.push({ id: p.id as number, breed: p.breed, name: cleanPetName(typeof p.name === 'string' ? p.name : '', PET_NAME_IDEAS[p.breed][0]) })
  }
  owned.length = Math.min(owned.length, MAX_PETS)
  const nextId = Math.max(Number.isInteger(x.nextId) ? (x.nextId as number) : 1, 1, ...owned.map(p => p.id + 1))
  return { owned, nextId, litter: x.litter === true || owned.length >= MAX_PETS }
}
