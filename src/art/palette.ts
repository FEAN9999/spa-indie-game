import type { CustomerKind } from '../sim/customers'
import type { RegularId } from '../sim/regulars'
import type { VipId } from '../sim/vips'
import type { OutfitId } from '../sim/outfits'
import type { Look } from '../sim/types'

/** Named colors from the approved style A board (spec 7.1). */
export const C = {
  ink: '#4A2E22',
  cream: '#FBF7EE',
  paper: '#FBF3E4',
  gold: '#F7C531',
  silver: '#C9CFD3',
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
  bamboo: '#E4C77A',
  bambooLight: '#F4E2A6',
  bambooDark: '#AE8E48',
  clay: '#7E5A2E',
  clayLight: '#B8955A',
  glow: '#F8DE96',
  sidewalk: '#E9DCC8',
  sidewalkLine: '#D8C8B0',
  road: '#D4C5B1',
  green: '#6DB36A',
  mint: '#BFE8D2',
  mintTeal: '#7CC4AE',
  cucumber: '#DCEFB4',
  stone: '#5B5450',
  stoneLight: '#8C8580',
  stoneWarm: '#C08A63',
  stoneHot: '#EE8A2E',
  steamBlue: '#9FB8BF',
  deepBrown: '#2B201C',
  // the quest panel: a finished row, the month's row, and quiet notes
  tealPale: '#E1F0EA',
  goldPale: '#FFF2D3',
  soft: '#7A5E50',
  // rooftop (floor 3) and its pigeon coop
  cloud: '#FFFFFF',
  tank: '#CBD2D6',
  tankRib: '#9AA5AB',
  tin: '#A9BEC4',
  tinRib: '#8EA6AD',
  gachTauBase: '#C98062',
  gachTauFace: '#DB9677',
  gachTauGlint: '#E9B095',
  bougainvillea: '#D6457E',
  coopDoor: '#3B2A22',
  coopStepLow: '#94633C',
  coopStepMid: '#7E5232',
  coopStepHigh: '#56331F',
  // the beach branch: sea, its wall and floors, a shell; the chain map's land, beach and river; the tourist's straw hat
  sea: '#6FB3CF',
  seaPale: '#CFE8F0',
  scrubSheet: '#DCEFF4',
  seaWash: '#E3F0F3',
  seaWashLine: '#C8DFE5',
  seaWall: '#BFD9E2',
  beachTile: '#EAF4F6',
  beachTileDark: '#D5E8EE',
  beachTileSeam: '#BCD7DF',
  beachPlank: '#EAD3AB',
  beachPlankLine: '#CFB287',
  beachPlankGrain: '#DCC197',
  seashell: '#F2B8A0',
  sandBeach: '#F1DDB0',
  river: '#8CC4D6',
  mapLand: '#EFE2CB',
  straw: '#E8C878',
  strawDark: '#B9944A',
  // the backpacker's cobalt cap (darker peak and seams) and olive pack, the lady's berry handbag
  capPeak: '#244C86',
  capSeam: '#1E3F70',
  olive: '#7C8B3E',
  berry: '#B23A5B',
  // the old town branch: dark wood planks, gạch tàu tiles, a Hội An yellow wall with weathered patches, dark wood walls
  phoPlank: '#7A4A2C',
  phoPlankLine: '#5E3820',
  phoPlankGrain: '#8C5835',
  phoTile: '#C9744F',
  phoTileDark: '#C26B47',
  phoTileSeam: '#9E5236',
  phoTileSpeck: '#B45F3E',
  phoWall: '#E9B13F',
  phoWallPatch: '#DA9C2E',
  phoWood: '#5A3520',
  // the uptown branch: light wood, white marble with gold seams, cream panels with gold trim, a glass wall onto three towers
  caoPlank: '#DCC6A2',
  caoPlankLine: '#C4AA80',
  marble: '#F7F4EE',
  marbleSeam: '#E4DDD2',
  marbleVein: '#DCD5CA',
  caoGold: '#C9A24A',
  caoGoldLight: '#D9B65A',
  caoWall: '#F4EBDD',
  caoWallLine: '#E3D5BF',
  caoGlass: '#D6E6EE',
  caoGlassShine: '#E8F1F5',
  towerFar: '#9DB4C4',
  towerNear: '#7F9BB0',
  towerMid: '#A9BDCB',
  caoMat: '#E9DCC6',
  caoHill: '#B9CBB0',
  // an orchid's petals
  orchid: '#FBEFF3',
} as const

export const SKIN = [0xf7d5b8, 0xebc3a0, 0xd9a47e, 0xb97f58]
export const HAIR = [0x2b201c, 0x5b3a29, 0x7a4a2f, 0x9a5b36, 0xc98b5a]
export const SHIRT = [0xc65d3b, 0xe3a73b, 0x2d5fa8, 0xf28ca0, 0xfbf7ee]
export const OWNER_SHIRT = [0x2f7d6e, 0x4e9a6b, 0xa8302a, 0x8a5634]
/** Light teal, kept well away from every customer and owner shirt. */
export const STAFF_SHIRT = 0x8fd3c1
export const PANTS = 0x3b2b26
/** The inspector's navy shirt, unlike any customer's, owner's or staff's. */
export const INSPECTOR_SHIRT = 0x3d4a66
/** An elder customer's grey hair. */
export const ELDER_HAIR = 0xd8d2c8
/** A backpacker's blond hair. */
export const BACKPACKER_HAIR = 0xe8c468

export interface CharacterColors {
  skin: number
  hair: number
  hairStyle: number
  shirt: number
  /** The owner's outfit; the shirt colour counts only in the bà ba, which is also what unset means. */
  outfit?: OutfitId
  apron?: boolean
  /** A customer's kind, which decides what they wear. */
  kind?: CustomerKind
  /** The regular a customer is, who wears their own things in place of the kind's. */
  regular?: RegularId
  /** The VIP a customer is, who wears her own things ahead of the regular's and the kind's. */
  vip?: VipId
  /** An event's visitor, who holds her own thing ahead of everything else worn: Mi Mi's phone or the inspector's clipboard. */
  visitor?: 'kol' | 'inspector'
}

export function lookColors(look: Look): CharacterColors {
  return { skin: SKIN[look.skin], hair: HAIR[look.hair], hairStyle: look.hairStyle, shirt: SHIRT[look.shirt] }
}

/** A customer's colors: their look, with an elder's hair grey, a backpacker's blond, a lady's hair in a bun, their kind, the regular they are, the VIP they are, and Mi Mi's mark, if any. */
export function customerColors(look: Look, kind: CustomerKind, regular: RegularId | null = null, vip: VipId | null = null, kol = false): CharacterColors {
  const colors = lookColors(look)
  return {
    ...colors,
    hair: kind === 'elder' ? ELDER_HAIR : kind === 'backpacker' ? BACKPACKER_HAIR : colors.hair,
    ...(kind === 'lady' ? { hairStyle: 3 } : {}),
    kind,
    ...(regular ? { regular } : {}),
    ...(vip ? { vip } : {}),
    ...(kol ? { visitor: 'kol' as const } : {}),
  }
}

export function ownerColors(look: Look, outfit: OutfitId = 'baba'): CharacterColors {
  return { skin: SKIN[look.skin], hair: HAIR[look.hair], hairStyle: look.hairStyle, shirt: OWNER_SHIRT[look.shirt], ...(outfit === 'baba' ? {} : { outfit }) }
}

/** The hygiene inspector: dark hair in a bun and a navy shirt, with the clipboard. */
export function inspectorColors(): CharacterColors {
  return { skin: SKIN[1], hair: HAIR[0], hairStyle: 3, shirt: INSPECTOR_SHIRT, visitor: 'inspector' }
}

export function staffColors(look: Look): CharacterColors {
  return { skin: SKIN[look.skin], hair: HAIR[look.hair], hairStyle: look.hairStyle, shirt: STAFF_SHIRT, apron: true }
}
