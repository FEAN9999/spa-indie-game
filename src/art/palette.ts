import type { Look } from '../sim/types'

/** Named colors from the approved mockup. */
export const C = {
  cream: '#fdf1e4',
  wall: '#fbe3d3',
  wallCap: '#f0cdb8',
  wallLine: '#e5c3ad',
  floor: '#ecd3b4',
  plank: '#e3c6a2',
  lavender: '#c9b6e4',
  lavenderLight: '#d9cbef',
  lavenderDark: '#b9a2dc',
  mint: '#9fd8c7',
  mintLight: '#e2f3ec',
  teal: '#5fb3a1',
  pink: '#f4a6b8',
  pinkDark: '#e48aa0',
  gold: '#f5c242',
  goldDark: '#e0a82e',
  text: '#5a4a42',
  textSoft: '#8a776a',
  desk: '#f2c4a4',
  deskDark: '#e5a985',
  sky: '#cfe9f5',
  water: '#bfe3f2',
  sidewalk: '#eadfd2',
  road: '#d9cfc4',
  leaf: '#7cc59b',
  leafLight: '#8fd3a9',
  rugCream: '#f7e3c8',
  red: '#e86a6a',
  green: '#7dcf8f',
} as const

export const SKIN = [0xffe2cc, 0xf5cfae, 0xe0b08a]
export const HAIR = [0x3b2a22, 0x5b3b2a, 0x7a4a2f, 0x2f2a2a, 0xc98b5a]
export const SHIRT = [0xf4a6b8, 0xf6c87a, 0xc9b6e4, 0x9fd8c7, 0x8fc1e8]
export const PANTS = 0x6d5a50

export interface CharacterColors {
  skin: number
  hair: number
  hairStyle: number
  shirt: number
}

export const OWNER_COLORS: CharacterColors = { skin: 0xffe2cc, hair: 0x2f2a2a, hairStyle: 0, shirt: 0x5fb3a1 }

export function lookColors(look: Look): CharacterColors {
  return { skin: SKIN[look.skin], hair: HAIR[look.hair], hairStyle: look.hairStyle, shirt: SHIRT[look.shirt] }
}
