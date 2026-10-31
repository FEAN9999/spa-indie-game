import { PHO_CUT_X } from '../config'
import { C } from './palette'
import { svgDoc } from './svg'

type Box = [number, number, number, number]

// The board, the pot, the dial and the bowl are drawn in the card's own pixels, so each is placed at its box's top left corner;
// the beef slice, the toppings and the ticket are small pictures placed by their centres.
export const PHO_BOX = {
  board: [120, 800, 840, 680] as Box,
  pot: [120, 840, 600, 600] as Box,
  dial: [800, 820, 140, 640] as Box,
  bowl: [190, 820, 700, 420] as Box,
  ticket: [0, 0, 470, 270] as Box,
}

/** The dotted lines run this far down the board, over the beef. */
export const PHO_LINES = { top: 880, bottom: 1400 }
/** The dial's tube: its centre x, and where its needle's run starts (empty) and ends (full). */
export const PHO_DIAL = { x: 870, empty: 1420, full: 860, inner: 26 }
/** The broth's top in the bowl, where the beef and the toppings land. */
export const PHO_BROTH = { x: 540, y: 950, rx: 300, ry: 56 }

const ink = (w: number) => `stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round"`
const wave = (d: string, col: string, w: number) => `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`

// thớt: a plank board with its hanging hole, the beef on it with two streaks of fat, and the four dotted lines to cut along
const BOARD =
  `<rect x="130" y="810" width="820" height="660" rx="42" fill="${C.plank}" ${ink(6)}/>` +
  wave('M170,900 H420 M600,1440 H900 M180,1430 H330', C.plankLine, 5) +
  `<circle cx="900" cy="860" r="18" fill="${C.sand}" ${ink(5)}/>` +
  `<rect x="210" y="950" width="660" height="380" rx="80" fill="${C.terracotta}" ${ink(6)}/>` +
  wave('M285,1045 q120,-40 240,0 t240,0 M300,1220 q120,-30 240,0 t210,0', C.wrongPink, 15) +
  PHO_CUT_X.map(x => `<path d="M${x},${PHO_LINES.top} V${PHO_LINES.bottom}" stroke="${C.cream}" stroke-width="9" stroke-dasharray="14 18" stroke-linecap="round"/>`).join('')

// nồi: the stove's flame under a steel pot of broth, the noodle basket dipped in it on its long handle, and steam
const POT =
  `<rect x="190" y="1380" width="460" height="40" rx="16" fill="${C.deepBrown}" ${ink(5)}/>` +
  wave('M260,1380 v-26 M340,1380 v-30 M420,1380 v-32 M500,1380 v-30 M580,1380 v-26', C.stoneHot, 14) +
  `<ellipse cx="420" cy="1120" rx="270" ry="78" fill="${C.waterDeep}" ${ink(6)}/>` +
  wave('M500,1010 L660,880', C.woodDark, 16) +
  `<rect x="320" y="980" width="200" height="190" rx="26" fill="${C.weave}" ${ink(6)}/>` +
  wave('M345,1030 q40,22 75,0 t75,0 M345,1070 q40,22 75,0 t75,0', C.tile, 9) +
  `<path d="M150,1120 v170 q270,130 540,0 v-170 q-270,110 -540,0Z" fill="${C.tin}" ${ink(6)}/>` +
  wave('M190,1190 q230,80 460,0', C.tinRib, 8) +
  wave('M250,960 q-24,-40 0,-80 t0,-80 M600,980 q-24,-40 0,-80 t0,-80', C.cloud, 10)

// thước độ chín: a cream tube on its stand; the ticket's band and the needle are drawn over it in the game
const DIAL =
  `<rect x="${PHO_DIAL.x - 36}" y="840" width="72" height="600" rx="36" fill="${C.cream}" ${ink(6)}/>` +
  `<rect x="${PHO_DIAL.x - 60}" y="1436" width="120" height="20" rx="10" fill="${C.woodDark}" ${ink(4)}/>`

// tô: a cream bowl with a blue band, its top full of broth and noodles
const BOWL =
  `<path d="M210,950 H870 Q840,1220 540,1230 Q240,1220 210,950Z" fill="${C.cream}" ${ink(6)}/>` +
  wave('M250,1060 Q540,1130 830,1060', C.cobalt, 10) +
  `<ellipse cx="${PHO_BROTH.x}" cy="${PHO_BROTH.y}" rx="330" ry="70" fill="${C.wall}" ${ink(6)}/>` +
  wave('M330,950 q50,-24 100,0 t100,0 t100,0 t100,0 M380,985 q50,-20 100,0 t100,0 t100,0', C.tile, 10)

// a slice of beef in white with a grey grain, tinted to the doneness
const BEEF = `<ellipse cx="60" cy="30" rx="54" ry="22" fill="#FFFFFF" ${ink(4)}/>` + wave('M24,30 q18,-8 36,0 t30,0', '#DCDCDC', 5)

// hành: a ring of spring onion; ớt: a slice of chilli with its seeds; rau: a basil leaf
const ONION = `<circle cx="30" cy="30" r="24" fill="${C.leafLight}" ${ink(4)}/><circle cx="30" cy="30" r="12" fill="${C.cucumber}" ${ink(3)}/>`
const CHILI =
  `<circle cx="30" cy="30" r="22" fill="${C.lantern}" ${ink(4)}/><circle cx="30" cy="30" r="12" fill="${C.burnPale}"/>` +
  [[26, 26], [35, 28], [29, 36]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="${C.mustard}"/>`).join('')
const HERB = `<path d="M8,48 Q8,10 52,8 Q52,50 8,48Z" fill="${C.leaf}" ${ink(4)}/>` + wave('M12,44 L44,14', C.leafLight, 4)

// the order ticket: cream paper with a dashed ink edge; its lines are written over it in the game
const TICKET = `<rect x="4" y="4" width="462" height="262" rx="24" fill="${C.cream}" stroke="${C.ink}" stroke-width="4" stroke-dasharray="14 10"/>`

/** The Phở pictures: the board, the pot, the dial, the bowl, a beef slice, the three toppings and the ticket. */
export function phoTextures(): Record<string, string> {
  return {
    'pho-board': svgDoc(PHO_BOX.board, 1, BOARD),
    'pho-pot': svgDoc(PHO_BOX.pot, 1, POT),
    'pho-dial': svgDoc(PHO_BOX.dial, 1, DIAL),
    'pho-bowl': svgDoc(PHO_BOX.bowl, 1, BOWL),
    'pho-beef': svgDoc([0, 0, 120, 60], 1, BEEF),
    'pho-onion': svgDoc([0, 0, 60, 60], 1, ONION),
    'pho-chili': svgDoc([0, 0, 60, 60], 1, CHILI),
    'pho-herb': svgDoc([0, 0, 60, 60], 1, HERB),
    'pho-ticket': svgDoc(PHO_BOX.ticket, 1, TICKET),
  }
}
