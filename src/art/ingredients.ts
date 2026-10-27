import { TILE } from '../config'
import { C } from './palette'
import { svgDoc } from './svg'

const S = `stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"`
const VEIN = (d: string, color: string) => `<path d="${d}" stroke="${color}" stroke-width="2" stroke-linecap="round" fill="none"/>`

/** One icon on a 40-unit square, shown a tile wide. */
const icon = (body: string) => svgDoc([0, 0, 40, 40], TILE / 40, body)

const THINGS: Record<string, string> = {
  // a pointed pomelo leaf with a pale midrib
  pomelo: `<path d="M7,33 C6,17 18,6 34,6 C34,22 24,33 7,33Z" fill="${C.leaf}" ${S}/>` + VEIN('M10,30 L29,11', C.tealDark),
  // three tall stalks tied in a cucumber-green band
  lemongrass:
    `<g stroke-linecap="round" fill="none"><path d="M15,32 C15,22 12,13 7,4" stroke="${C.ink}" stroke-width="6.5"/><path d="M20,32 C20,20 21,11 23,3" stroke="${C.ink}" stroke-width="6.5"/><path d="M25,32 C26,23 29,14 34,6" stroke="${C.ink}" stroke-width="6.5"/>` +
    `<path d="M15,32 C15,22 12,13 7,4" stroke="${C.leafLight}" stroke-width="4"/><path d="M20,32 C20,20 21,11 23,3" stroke="${C.leaf}" stroke-width="4"/><path d="M25,32 C26,23 29,14 34,6" stroke="${C.leafLight}" stroke-width="4"/></g>` +
    `<rect x="11" y="27" width="18" height="9" rx="3" fill="${C.cucumber}" ${S}/>`,
  // a knobby ginger root
  ginger:
    `<path d="M5,26 C5,19 12,17 16,20 C17,12 25,11 27,16 C33,14 37,21 33,27 C30,32 9,33 5,26Z" fill="${C.weave}" ${S}/>` +
    VEIN('M13,25 h3 M22,22 h3 M27,27 h2', C.wood),
  // a few salt crystals in a pale dish
  salt:
    `<ellipse cx="20" cy="31" rx="15" ry="5" fill="${C.water}" ${S}/>` +
    `<g fill="${C.cream}" ${S}><rect x="10" y="20" width="8" height="8" rx="2"/><rect x="19" y="21" width="8" height="8" rx="2"/><rect x="14" y="12" width="8" height="8" rx="2"/><rect x="24" y="13" width="7" height="7" rx="2"/></g>`,
  // a bowl of mineral mud with a bubble
  mineralMud:
    `<path d="M5,18 H35 C35,28 28,35 20,35 C12,35 5,28 5,18Z" fill="${C.clayLight}" ${S}/>` +
    `<ellipse cx="20" cy="18" rx="15" ry="5" fill="${C.clay}" ${S}/>` +
    `<circle cx="25" cy="11" r="3" fill="${C.clay}" ${S}/>`,
  // a honey jar with a wooden lid
  honey:
    `<rect x="10" y="13" width="20" height="23" rx="6" fill="${C.mustard}" ${S}/>` +
    `<rect x="12" y="6" width="16" height="8" rx="2" fill="${C.wood}" ${S}/>` +
    `<rect x="14" y="20" width="12" height="8" rx="2" fill="${C.paper}" stroke="${C.ink}" stroke-width="1.5"/>`,
  // half a coconut: brown shell, white flesh, a drop of water
  coconut:
    `<path d="M4,19 H36 C36,30 29,36 20,36 C11,36 4,30 4,19Z" fill="${C.woodDark}" ${S}/>` +
    `<ellipse cx="20" cy="19" rx="16" ry="6" fill="${C.cream}" ${S}/>` +
    `<path d="M17,8 q3,4 0,7" stroke="${C.waterDeep}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  // a teal dropper bottle with a black bulb and a label
  cajeput:
    `<rect x="12" y="16" width="16" height="20" rx="4" fill="${C.teal}" ${S}/>` +
    `<rect x="16" y="10" width="8" height="7" fill="${C.mint}" ${S}/>` +
    `<rect x="15" y="4" width="10" height="7" rx="2" fill="${C.ink}"/>` +
    `<rect x="15" y="22" width="10" height="7" rx="1.5" fill="${C.paper}"/>`,
  // decoys: a round, pale guava leaf, a red curved chili and a long banana leaf
  guava:
    `<ellipse cx="20" cy="20" rx="10" ry="15" transform="rotate(35 20 20)" fill="${C.cucumber}" ${S}/>` +
    VEIN('M12,29 L28,11', C.leaf),
  chili:
    `<path d="M11,11 C15,9 18,12 18,15 C20,24 26,30 34,34 C22,36 12,29 10,19Z" fill="${C.lantern}" ${S}/>` +
    `<path d="M12,12 C10,8 12,5 15,4" stroke="${C.leaf}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
  banana:
    `<path d="M4,36 C9,20 21,8 36,4 C33,19 22,31 4,36Z" fill="${C.green}" ${S}/>` +
    VEIN('M6,34 L33,7 M13,27 l-2,-6 M19,21 l-2,-7 M25,15 l-1,-6 M14,28 l6,1 M20,22 l7,1 M26,16 l6,0', C.tealDark),
}

/** The 8 ingredients and the 3 leaf-game decoys, one icon each, keyed `ing-<id>`. */
export function ingredientTextures(): Record<string, string> {
  return Object.fromEntries(Object.entries(THINGS).map(([id, body]) => [`ing-${id}`, icon(body)]))
}
