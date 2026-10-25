import type { Look } from '../sim/types'

/** Named colors from the approved style A board (spec 7.1). */
export const C = {
  ink: '#4A2E22',
  cream: '#FBF7EE',
  paper: '#FBF3E4',
  sand: '#F3E6D3',
  tile: '#F6ECDB',
  tileSeam: '#E2D3BC',
  terracotta: '#C65D3B',
  teal: '#2F7D6E',
  tealLight: '#3E9682',
  tealDark: '#2A6B5C',
  mustard: '#E3A73B',
  mustardDark: '#C78A22',
  wall: '#F2CC6B',
  wallDark: '#E0B04F',
  cobalt: '#2D5FA8',
  wood: '#8A5634',
  woodDark: '#6B4027',
  woodLight: '#A86E45',
  plank: '#C99A6A',
  plankLine: '#A87A4E',
  lantern: '#D8463A',
  lanternDark: '#A8302A',
  lotus: '#F28CA0',
  lotusDark: '#E8708A',
  leaf: '#4E9A6B',
  leafLight: '#5FAE7B',
  water: '#BFE3F2',
  waterDeep: '#7FC4D8',
  glass: '#CFE8F0',
  weave: '#D9A866',
  weaveLine: '#B98544',
  mat: '#EBD29E',
  matLine: '#D9B577',
  sidewalk: '#E9DCC8',
  sidewalkLine: '#D8C8B0',
  road: '#D4C5B1',
  green: '#6DB36A',
  // legacy pastel: removed in Task 7
  gold: '#f5c242',
  goldDark: '#e0a82e',
  lavender: '#c9b6e4',
  lavenderLight: '#d9cbef',
  lavenderDark: '#b9a2dc',
  mint: '#9fd8c7',
  mintLight: '#e2f3ec',
  pink: '#f4a6b8',
  pinkDark: '#e48aa0',
  desk: '#f2c4a4',
  deskDark: '#e5a985',
  floor: '#ecd3b4',
  wallCap: '#f0cdb8',
  wallLine: '#e5c3ad',
  sky: '#cfe9f5',
  rugCream: '#f7e3c8',
  text: '#5a4a42',
  textSoft: '#8a776a',
  red: '#e86a6a',
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
