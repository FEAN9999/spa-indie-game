import { C } from './palette'
import { svgDoc } from './svg'

type Box = [number, number, number, number]

/**
 * The basin and the board are drawn in the card's own pixels, so each is placed at its box's top left corner; the noodles are a small picture placed by its centre.
 * The rice paper, the fillings on it and the roll are drawn in the game; shrimp, pork and greens reuse Bánh xèo's and Bún chả's pictures.
 */
export const GC_BOX = {
  basin: [130, 840, 820, 520] as Box,
  board: [110, 820, 860, 560] as Box,
}

/** The water in the basin, where a dip is drawn across. */
export const GC_WATER = { x: 540, y: 1100, rx: 360, ry: 210 }
/** The rice paper on the board, and the band near its bottom where the fillings are laid. */
export const GC_PAPER = { x: 540, y: 1080, r: 230, bandY: 1170, bandHalf: 150 }

const ink = (w: number) => `stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round"`
const wave = (d: string, col: string, w: number) => `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`

// a wide shallow basin of water seen from above: a blue enamel rim, the water and two ripples
const BASIN =
  `<ellipse cx="${GC_WATER.x}" cy="${GC_WATER.y}" rx="${GC_WATER.rx + 40}" ry="${GC_WATER.ry + 36}" fill="${C.cobalt}" ${ink(6)}/>` +
  `<ellipse cx="${GC_WATER.x}" cy="${GC_WATER.y}" rx="${GC_WATER.rx}" ry="${GC_WATER.ry}" fill="${C.water}" ${ink(4)}/>` +
  wave(`M${GC_WATER.x - 240},${GC_WATER.y - 60} q60,-24 120,0 t120,0`, C.cloud, 7) +
  wave(`M${GC_WATER.x - 40},${GC_WATER.y + 90} q60,-24 120,0 t120,0`, C.waterDeep, 7)

// a round wooden board with its grain
const BOARD =
  `<ellipse cx="540" cy="1100" rx="420" ry="270" fill="${C.plank}" ${ink(6)}/>` +
  wave('M220,1000 q80,-20 160,0 M640,1240 q90,-20 180,0 M300,1260 q60,-14 120,0', C.plankLine, 6)

// bún: a little nest of white rice noodles
const BUN =
  `<ellipse cx="30" cy="34" rx="24" ry="17" fill="${C.paper}" ${ink(3.5)}/>` +
  wave('M12,32 q6,-6 12,0 t12,0 t12,0 M14,40 q6,-6 12,0 t12,0 t10,0', C.tileSeam, 3)

/** The Gỏi cuốn pictures: the basin, the board and the noodles. */
export function goiCuonTextures(): Record<string, string> {
  return {
    'gc-basin': svgDoc(GC_BOX.basin, 1, BASIN),
    'gc-board': svgDoc(GC_BOX.board, 1, BOARD),
    'gc-bun': svgDoc([0, 0, 60, 60], 1, BUN),
  }
}
