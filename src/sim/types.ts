export interface Tile {
  x: number
  y: number
}

export type Facing = 'down' | 'up' | 'left' | 'right'

/** Palette indices; the view maps them to colors. */
export interface Look {
  skin: number
  hair: number
  hairStyle: number
  shirt: number
}
