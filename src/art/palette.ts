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
} as const

export const SKIN = [0xf7d5b8, 0xebc3a0, 0xd9a47e]
export const HAIR = [0x2b201c, 0x5b3a29, 0x7a4a2f, 0x9a5b36, 0xc98b5a]
export const SHIRT = [0xc65d3b, 0xe3a73b, 0x2d5fa8, 0xf28ca0, 0xfbf7ee]
export const PANTS = 0x3b2b26

export interface CharacterColors {
  skin: number
  hair: number
  hairStyle: number
  shirt: number
}

export const OWNER_COLORS: CharacterColors = { skin: 0xf7d5b8, hair: 0x2b201c, hairStyle: 0, shirt: 0x2f7d6e }

export function lookColors(look: Look): CharacterColors {
  return { skin: SKIN[look.skin], hair: HAIR[look.hair], hairStyle: look.hairStyle, shirt: SHIRT[look.shirt] }
}
