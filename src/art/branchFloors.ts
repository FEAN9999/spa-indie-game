import { FLOOR_ROWS, TILE } from '../config'
import type { PlaceId } from '../sim/places'
import { BEACH_TILES, lifeRing, porthole, SAND_PLANKS, seashell } from './beach'
import { pot } from './floors'
import { silkLantern } from './lantern'
import { lanternString, PHO_PLANKS, PHO_TILES, shutters } from './oldTown'
import { C } from './palette'
import { f } from './round'
import { FINE, outline, rect, STREET_TILES } from './room'
import { svgDoc } from './svg'
import { CAO_PLANKS, glassWall, landscape, MARBLE } from './uptown'

const COLS = 13
const ROWS = FLOOR_ROWS

/** Each place's upper floors: the patterns they use, floor 2's and the rooftop's floor, the rooftop's low walls and their cap. */
export const BRANCH_UPPER: Record<PlaceId, { defs: () => string; floor2: string; roof: string; parapet: string; cap: string }> = {
  oldTown: { defs: () => PHO_PLANKS + PHO_TILES, floor2: 'phoplanks', roof: 'photiles', parapet: C.phoWall, cap: C.terracotta },
  beach: { defs: () => SAND_PLANKS + BEACH_TILES, floor2: 'sandplanks', roof: 'beachtiles', parapet: C.cream, cap: C.sea },
  uptown: { defs: () => CAO_PLANKS + MARBLE, floor2: 'marble', roof: 'caoplanks', parapet: C.caoGlass, cap: C.silver },
}

/** The balcony in front of floor 2 from x0, `w` wide: the place's deck, its railing and the road below. */
export function balcony(place: PlaceId, x0: number, w: number): string {
  const out: string[] = []
  const x1 = x0 + w
  if (place === 'oldTown') {
    // a dark wood deck, turned wooden balusters between two rails
    out.push(rect(x0, ROWS, w, 1.1, 'url(#phoplanks)'))
    for (let x = x0 + 0.2; x < x1 - 0.1; x += 0.3) out.push(rect(f(x), ROWS + 1.12, 0.12, 0.66, C.wood, `rx="0.05" ${outline(0.02)}`))
    out.push(rect(x0, ROWS + 1, w, 0.14, C.phoWood, outline(0.03)), rect(x0, ROWS + 1.78, w, 0.1, C.phoWood, outline(0.03)))
  } else if (place === 'beach') {
    // a sand-coloured deck, white posts with two ropes sagging between them
    out.push(rect(x0, ROWS, w, 1.1, 'url(#sandplanks)'))
    const posts: number[] = []
    for (let x = x0 + 0.15; x < x1; x += 1.5) posts.push(x)
    const ropes: string[] = []
    for (let i = 1; i < posts.length; i++)
      for (const y of [ROWS + 1.2, ROWS + 1.55]) ropes.push(`M${f(posts[i - 1])},${y} Q${f((posts[i - 1] + posts[i]) / 2)},${f(y + 0.18)} ${f(posts[i])},${y}`)
    out.push(`<path d="${ropes.join(' ')}" fill="none" stroke="${C.woodLight}" stroke-width="0.06"/>`)
    for (const x of posts) out.push(rect(f(x - 0.07), ROWS + 1.02, 0.14, 0.86, C.cream, `rx="0.04" ${outline(0.03)}`))
  } else {
    // marble, a glass railing on silver posts
    out.push(rect(x0, ROWS, w, 1.1, 'url(#marble)'))
    out.push(rect(x0, ROWS + 1.05, w, 0.8, C.caoGlass, `opacity="0.8" ${outline(0.03)}`))
    const glints: string[] = []
    for (let x = x0 + 0.5; x < x1 - 0.3; x += 2) glints.push(`M${f(x)},${ROWS + 1.7} l0.3,-0.45`)
    out.push(`<path d="${glints.join(' ')}" stroke="${C.caoGlassShine}" stroke-width="0.06"/>`)
    for (let x = x0 + 0.1; x < x1; x += 2) out.push(rect(f(x), ROWS + 1, 0.1, 0.88, C.silver, outline(0.025)))
    out.push(rect(x0, ROWS + 0.98, w, 0.1, C.silver, outline(0.03)))
  }
  out.push(rect(x0, ROWS + 1.88, w, STREET_TILES - 1.88, C.road))
  return out.join('')
}

/** What shows beyond the rooftop from x0, `w` wide, over the sky: the old town's tiled roofs, the beach's sea (with a sail and gulls on a room's width), uptown's towers. */
export function beyond(place: PlaceId, x0: number, w: number): string {
  const out: string[] = []
  if (place === 'oldTown') {
    for (let x = x0 + 0.2, i = 0; x + 2.7 <= x0 + w; x += 3.1, i++) {
      const top = i % 2 ? 1.0 : 0.85
      out.push(`<path d="M${f(x)},1.5 L${f(x + 0.45)},${top} H${f(x + 2.25)} L${f(x + 2.7)},1.5Z" fill="${C.terracotta}" ${outline(0.03)}/>`)
      out.push(`<path d="M${f(x + 0.45)},${top} H${f(x + 2.25)} M${f(x + 0.25)},${f(top + 0.3)} H${f(x + 2.45)}" stroke="${C.lanternDark}" stroke-width="0.04"/>`)
    }
  } else if (place === 'beach') {
    out.push(rect(x0, 1.0, w, 0.5, C.sea), `<path d="M${x0},1.18 H${x0 + w}" stroke="${C.seaPale}" stroke-width="0.04" stroke-dasharray="0.4 0.3"/>`)
    if (w > 8) out.push(`<path d="M${x0 + 9.2},0.98 L${x0 + 9.55},0.35 L${x0 + 9.9},0.98Z" fill="${C.cream}" ${outline(0.03)}/>`, rect(x0 + 9.0, 0.98, 1.1, 0.12, C.wood, outline(0.025)))
    if (w > 8) out.push(`<path d="M${x0 + 1.4},0.5 q0.12,-0.1 0.24,0 q0.12,-0.1 0.24,0 M${x0 + 2.3},0.35 q0.1,-0.08 0.2,0 q0.1,-0.08 0.2,0" fill="none" stroke="${C.ink}" stroke-width="0.03"/>`)
  } else {
    const towers = [[0.2, 0.7, C.towerFar], [1.0, 0.5, C.towerMid], [1.6, 0.9, C.towerNear], [2.7, 0.6, C.towerFar], [3.4, 1.05, C.towerMid]] as const
    for (let base = x0; base < x0 + w; base += 4.4) {
      for (const [dx, tw, col] of towers) {
        const x = base + dx
        if (x + tw > x0 + w) continue
        const top = 1.5 - (0.55 + ((dx * 7) % 5) * 0.12)
        out.push(rect(f(x), f(top), tw, f(1.5 - top), col, `stroke="${C.ink}" stroke-width="0.026"`))
        for (let y = top + 0.13; y < 1.4; y += 0.18) out.push(`<path d="M${f(x + 0.1)},${f(y)} h${f(tw - 0.2)}" stroke="${C.caoGlassShine}" stroke-width="0.038" stroke-dasharray="0.077 0.077"/>`)
      }
    }
  }
  return out.join('')
}

/** The neighbour's roof below the rooftop from x0, `w` wide: tiles in the old town, tin at the beach, flat concrete uptown. */
export function roofBelow(place: PlaceId, x0: number, w: number): string {
  const y0 = ROWS
  if (place === 'oldTown') {
    const courses: string[] = []
    for (let y = y0 + 0.5, row = 0; y < y0 + STREET_TILES; y += 0.5, row++) {
      courses.push(`M${x0},${y} H${x0 + w}`)
      for (let x = x0 + (row % 2 ? 0.25 : 0.5); x < x0 + w; x += 0.5) courses.push(`M${f(x)},${f(y - 0.5)} V${y}`)
    }
    return rect(x0, y0, w, STREET_TILES, C.terracotta) + `<path d="${courses.join(' ')}" stroke="${C.lanternDark}" stroke-width="0.045"/>`
  }
  if (place === 'beach') {
    const ribs: string[] = []
    for (let x = x0 + 0.15; x < x0 + w; x += 0.3) ribs.push(`M${f(x)},${y0} V${y0 + STREET_TILES}`)
    return rect(x0, y0, w, STREET_TILES, C.tin) + `<path d="${ribs.join(' ')}" stroke="${C.tinRib}" stroke-width="0.05"/>`
  }
  const joints: string[] = []
  for (let x = x0 + 1.5; x < x0 + w; x += 1.5) joints.push(`M${f(x)},${y0} V${y0 + STREET_TILES}`)
  joints.push(`M${x0},${y0 + 1} H${x0 + w}`)
  return rect(x0, y0, w, STREET_TILES, C.roofConcrete) + `<path d="${joints.join(' ')}" stroke="${C.roofConcreteLine}" stroke-width="0.04"/>`
}

/** Floor 2's back wall across the room, in the place's style, with what hangs on it. */
function backWall2(place: PlaceId): string {
  const w = COLS - 0.6
  const out: string[] = []
  if (place === 'oldTown') {
    out.push(rect(0.3, 0, w, 2, C.phoWall, outline()))
    for (const [x, y, rx, ry] of [[3.2, 1.55, 0.8, 0.25], [7.9, 0.5, 0.5, 0.17], [11.2, 1.45, 0.6, 0.2]]) out.push(`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${C.phoWallPatch}" opacity="0.7"/>`)
    out.push(rect(0.3, 0, w, 0.26, C.phoWood, outline(0.04)), rect(0.3, 1.79, w, 0.21, C.phoWood, outline(0.04)))
    for (const x of [0.3, 4.6, 8.17, COLS - 0.53]) out.push(rect(x, 0, 0.23, 2, C.phoWood, outline(0.04)))
    out.push(shutters(1.75, 0.55), shutters(9.55, 0.55), silkLantern(5.75, 0.36, C.lantern, 20), silkLantern(7.25, 0.36, C.tealLight, 20))
  } else if (place === 'beach') {
    out.push(rect(0.3, 0, w, 2, C.cream, outline()), rect(0.3, 1.42, w, 0.58, C.seaWash))
    const boards: string[] = []
    for (let x = 0.3 + 1 / 3; x < COLS - 0.3; x += 1 / 3) boards.push(`M${f(x)},1.42 V2`)
    out.push(`<path d="${boards.join(' ')}" stroke="${C.seaWashLine}" stroke-width="0.026"/>`)
    out.push(rect(0.3, 1.12, w, 0.06, C.sea), rect(0.3, 1.24, w, 0.18, C.sea, outline(0.04)))
    out.push(porthole(2.2, 0.75, 'up1'), porthole(3.5, 0.75, 'up2'), lifeRing(6.5, 0.72), seashell(8.6, 0.9), seashell(9.05, 0.98, 0.75), porthole(10.8, 0.75, 'up3'))
  } else {
    out.push(rect(0.3, 0, w, 2, C.caoWall, outline()))
    const panels: string[] = []
    for (let x = 1.3; x < COLS - 0.3; x += 1) panels.push(`M${f(x)},0.18 V1.84`)
    out.push(`<path d="${panels.join(' ')}" stroke="${C.caoWallLine}" stroke-width="0.04"/>`)
    out.push(rect(0.3, 0, w, 0.15, C.caoGold, outline(0.04)), rect(0.3, 1.85, w, 0.15, C.caoGold, outline(0.04)))
    out.push(glassWall(0.95, 0.4, 2.45, 1.2), landscape(5.54, 0.5), glassWall(9.6, 0.4, 2.45, 1.2))
  }
  out.push(rect(0.3, 0, w, 2, 'none', outline()))
  return out.join('')
}

/** The wall a branch's floor 2 has at its sides and front: dark wood, pale sea blue, gold. */
const SIDE_WALL: Record<PlaceId, string> = { oldTown: C.phoWood, beach: C.seaWall, uptown: C.caoGold }

/** The front wall in `wall` from x0, `w` wide, with a two-tile glass door onto the balcony at each of `doors`. */
export function frontWall(x0: number, w: number, wall: string, doors: number[]): string {
  const out = [rect(x0, ROWS - 0.45, w, 0.45, wall, outline(0.04))]
  for (const x of doors) out.push(rect(x, ROWS - 0.4, 2, 0.36, C.glass, outline(FINE)), `<path d="M${x + 1},${ROWS - 0.4} V${ROWS - 0.04}" ${outline(FINE)}/>`)
  return out.join('')
}

/**
 * A branch's floor 2, drawn like 'room-2': top-left at the map origin, 13 × (18 + STREET_TILES) tiles. The place's floor, its back wall
 * with two windows and what hangs between them, its side walls, two glass doors onto its own balcony, and the road below.
 */
function floor2Room(place: PlaceId): string {
  const up = BRANCH_UPPER[place]
  const side = SIDE_WALL[place]
  const out: string[] = [`<defs>${up.defs()}</defs>`]
  out.push(rect(0.5, 2, COLS - 1, ROWS - 2.45, `url(#${up.floor2})`), rect(0.5, 2, COLS - 1, 0.1, C.ink, 'opacity="0.14"'))
  out.push(backWall2(place))
  out.push(rect(0.3, 0, 0.2, ROWS, side, outline(0.04)), rect(COLS - 0.5, 0, 0.2, ROWS, side, outline(0.04)))
  out.push(frontWall(0.3, COLS - 0.6, side, [2.5, 8.5]))
  out.push(balcony(place, 0.3, COLS - 0.6))
  if (place !== 'uptown') for (const x of [1.3, 11.7]) out.push(pot(x, ROWS + 0.35))
  else for (const x of [1.3, 11.7]) out.push(rect(x - 0.25, ROWS + 0.4, 0.5, 0.4, C.silver, outline(0.03)), `<circle cx="${x}" cy="${ROWS + 0.25}" r="0.3" fill="${C.leaf}" ${outline(0.035)}/>`)
  return svgDoc([0, 0, COLS, ROWS + STREET_TILES], TILE, out.join(''))
}

/**
 * A branch's rooftop, drawn like 'room-3': top-left at the map origin, 13 × (18 + STREET_TILES) tiles. Sky with what lies beyond, the
 * place's rooftop floor, low walls in its colour with their cap, its own touch on the back wall, and the neighbour's roof below.
 */
function roofRoom(place: PlaceId): string {
  const up = BRANCH_UPPER[place]
  const out: string[] = [`<defs>${up.defs()}</defs>`]
  out.push(rect(0, 0, COLS, 2, C.glass), `<ellipse cx="4.6" cy="0.3" rx="0.8" ry="0.16" fill="${C.cloud}" opacity="0.8"/>`)
  out.push(beyond(place, 0, COLS))
  out.push(rect(0.5, 2, COLS - 1, ROWS - 2.45, `url(#${up.roof})`), rect(0.5, 2, COLS - 1, 0.12, C.ink, 'opacity="0.12"'))
  out.push(rect(0.3, 1.45, COLS - 0.6, 0.55, up.parapet, outline(0.045)), rect(0.3, 1.4, COLS - 0.6, 0.12, up.cap, outline(0.035)))
  out.push(rect(0.3, 1.45, 0.2, ROWS - 1.45, up.parapet, outline(0.04)), rect(COLS - 0.5, 1.45, 0.2, ROWS - 1.45, up.parapet, outline(0.04)))
  out.push(roofBelow(place, 0, COLS))
  out.push(rect(0.3, ROWS - 0.45, COLS - 0.6, 0.5, up.parapet, outline(0.045)), rect(0.3, ROWS - 0.5, COLS - 0.6, 0.12, up.cap, outline(0.035)))
  if (place === 'oldTown') {
    // a string of silk lanterns between two posts over the back wall
    out.push(rect(0.35, 0.3, 0.12, 1.15, C.phoWood, outline(0.03)), rect(COLS - 0.47, 0.3, 0.12, 1.15, C.phoWood, outline(0.03)), lanternString(COLS))
  } else if (place === 'beach') {
    // little flags strung across the back, a life ring on the front wall
    const flags: string[] = []
    const cols = [C.lantern, C.sea, C.mustard, C.cream]
    for (let x = 0.7, i = 0; x < COLS - 0.6; x += 0.6, i++) {
      const y = 0.55 + 0.35 * Math.sin((Math.PI * (x - 0.4)) / (COLS - 0.8))
      flags.push(`<path d="M${f(x - 0.15)},${f(y)} L${f(x + 0.15)},${f(y)} L${f(x)},${f(y + 0.3)}Z" fill="${cols[i % cols.length]}" ${outline(0.02)}/>`)
    }
    out.push(`<path d="M0.4,0.55 Q${COLS / 2},1.25 ${COLS - 0.4},0.55" fill="none" stroke="${C.ink}" stroke-width="0.03"/>`, ...flags, lifeRing(COLS - 1.4, ROWS - 0.22))
  } else {
    // a clipped tree in a silver planter on each back corner
    for (const x of [1.2, COLS - 1.2]) out.push(rect(x - 0.3, 0.95, 0.6, 0.45, C.silver, outline(0.03)), `<circle cx="${x}" cy="0.7" r="0.36" fill="${C.leaf}" ${outline(0.035)}/>`)
  }
  return svgDoc([0, 0, COLS, ROWS + STREET_TILES], TILE, out.join(''))
}

/** Every branch's upper floors: 'room-<place>-2' and 'room-<place>-3'. */
export function branchFloorTextures(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const place of Object.keys(BRANCH_UPPER) as PlaceId[]) {
    out[`room-${place}-2`] = floor2Room(place)
    out[`room-${place}-3`] = roofRoom(place)
  }
  return out
}
