import { C, SKIN } from './palette'
import { svgDoc } from './svg'

const STAR_PATH = 'M50,6 L62,36 L94,38 L69,58 L78,90 L50,72 L22,90 L31,58 L6,38 L38,36Z'
const HEART_PATH = 'M28,47 C14,38 5,29 5,19 C5,11 11,6 17.5,6 C22,6 26,9 28,13 C30,9 34,6 38.5,6 C45,6 51,11 51,19 C51,29 42,38 28,47Z'
const OUTLINE = `stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"`
const INNER = `stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"`
const ICON = `stroke="${C.ink}" stroke-width="2.6"`
const EVENT = `stroke="${C.ink}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`

const bubble = (inner: string) =>
  svgDoc(
    [0, 0, 70, 64],
    1,
    `<path d="M8,4 H62 Q68,4 68,10 V40 Q68,46 62,46 H42 L35,58 L28,46 H8 Q2,46 2,40 V10 Q2,4 8,4Z" fill="${C.cream}" ${OUTLINE}/>${inner}`,
  )

/** Dark stones `[cx, cy, rx, ry]` glowing warm round their ink rims, each with a pale shine; the glows go under every stone. */
const hotStones = (stones: [number, number, number, number][], w = 2.5) =>
  stones.map(([cx, cy, rx, ry]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx + w * 1.1}" ry="${ry + w * 1.1}" fill="${C.mustard}"/>`).join('') +
  stones
    .map(
      ([cx, cy, rx, ry]) =>
        `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${C.stone}" stroke="${C.ink}" stroke-width="${w}"/>` +
        `<path d="M${cx - rx * 0.55},${cy - ry * 0.15} Q${cx - rx * 0.4},${cy - ry * 0.6} ${cx},${cy - ry * 0.6}" fill="none" stroke="${C.stoneLight}" stroke-width="${w * 0.7}" stroke-linecap="round"/>`,
    )
    .join('')
/** The closing card's scooter, in its own units: it stands on the origin. */
export const SCOOTER_BOX: [number, number, number, number] = [-120, -164, 236, 166]

/** A customer's skin on a badge. */
const SKIN_TONE = `#${SKIN[1].toString(16)}`

/** Each place's line icon on the chain map, in a 64-unit box round the origin: the main shop, then the places in PLACE_IDS order. */
const PIN_ICONS = {
  main: 'M-20,2 L0,-18 L20,2 M-14,-4 V20 H14 V-4 M-5,20 V8 H5 V20',
  beach: 'M-22,6 q7,-8 14,0 t14,0 t14,0 M-22,16 q7,-8 14,0 t14,0 t14,0 M-6,-4 L4,-22 M4,-22 Q-14,-22 -18,-10 M4,-22 Q20,-18 20,-6',
  oldTown: 'M0,-24 V-18 M-8,-18 H8 M-8,16 H8 M0,16 V24 M-14,-1 Q-14,-17 0,-17 Q14,-17 14,-1 Q14,15 0,15 Q-14,15 -14,-1Z',
  uptown: 'M-18,22 V-6 H-6 V22 M-6,22 V-22 H10 V22 M10,22 V2 H20 V22 M-24,22 H24 M0,-14 h4 M0,-6 h4 M0,2 h4',
}

/** A round 56 px service badge on its own color. */
const badge = (fill: string, inner: string) => svgDoc([0, 0, 56, 56], 1, `<circle cx="28" cy="28" r="25" fill="${fill}" ${OUTLINE}/>${inner}`)

export function fxTextures(): Record<string, string> {
  return {
    // a coin with a square hole, like the old xu
    coin: svgDoc(
      [0, 0, 48, 48],
      1,
      `<circle cx="24" cy="24" r="20" fill="${C.mustard}" ${OUTLINE}/>` +
        `<circle cx="24" cy="24" r="14.5" fill="none" stroke="${C.mustardDark}" stroke-width="2.5"/>` +
        `<rect x="18.5" y="18.5" width="11" height="11" fill="${C.paper}" ${INNER}/>`,
    ),
    shadow: svgDoc([0, 0, 60, 20], 1, `<ellipse cx="30" cy="10" rx="28" ry="8" fill="${C.ink}" opacity="0.18"/>`),
    'bubble-happy': bubble(
      `<path d="M35,38 C22,29 20,22 24,17 C28,13 33,15 35,19 C37,15 42,13 46,17 C50,22 48,29 35,38Z" fill="${C.lotusDark}" ${INNER}/>`,
    ),
    'bubble-ok': bubble(
      `<circle cx="35" cy="25" r="15" fill="${C.mustard}" ${INNER}/><circle cx="30" cy="22" r="2" fill="${C.ink}"/><circle cx="40" cy="22" r="2" fill="${C.ink}"/>` +
        `<path d="M29,30 Q35,33 41,30" stroke="${C.ink}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    ),
    'bubble-angry': bubble(
      `<circle cx="35" cy="25" r="15" fill="${C.lantern}" ${INNER}/><path d="M27,19 L33,22 M43,19 L37,22" stroke="${C.cream}" stroke-width="2.4" stroke-linecap="round"/>` +
        `<circle cx="30" cy="25" r="2" fill="${C.cream}"/><circle cx="40" cy="25" r="2" fill="${C.cream}"/>` +
        `<path d="M29,33 Q35,28 41,33" stroke="${C.cream}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    ),
    // a cup of tea on a saucer with two curls of steam, shown above a resting staff member
    'tea-cup': svgDoc(
      [0, 0, 56, 56],
      1,
      `<path d="M19,14 Q15,8 19,4 M31,14 Q27,8 31,4" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>` +
        `<ellipse cx="25" cy="48" rx="21" ry="5" fill="${C.cream}" ${INNER}/>` +
        `<path d="M40,26 H46 Q52,26 52,32 Q52,39 44,40" fill="none" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>` +
        `<path d="M8,20 H42 V32 Q42,44 25,44 Q8,44 8,32Z" fill="${C.cream}" ${OUTLINE}/>` +
        `<path d="M8.5,26 H41.5 V31 H8.5Z" fill="${C.teal}" ${INNER}/>`,
    ),
    // a round wall clock, shown above a technician who walks in late
    'icon-clock': svgDoc(
      [0, 0, 56, 56],
      1,
      `<circle cx="28" cy="30" r="21" fill="${C.cream}" ${OUTLINE}/>` +
        `<path d="M21,6 Q28,1 35,6" fill="none" stroke="${C.ink}" stroke-width="3.5" stroke-linecap="round"/>` +
        `<path d="M28,30 V17 M28,30 L37,35" fill="none" stroke="${C.ink}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<circle cx="28" cy="30" r="2.5" fill="${C.ink}"/>`,
    ),
    // a blue sweat drop, for a sloppy service
    'icon-sweat': svgDoc(
      [0, 0, 56, 56],
      1,
      `<path d="M28,5 Q44,26 44,36 A16,16 0 0 1 12,36 Q12,26 28,5Z" fill="${C.water}" ${OUTLINE}/>` +
        `<path d="M20,37 Q20,31 24,27" fill="none" stroke="${C.cream}" stroke-width="3.5" stroke-linecap="round"/>`,
    ),
    // a four-point sparkle, drawn white so it can be tinted
    spark: svgDoc(
      [0, 0, 24, 24],
      1,
      `<path d="M12,1.5 Q13.5,10.5 22.5,12 Q13.5,13.5 12,22.5 Q10.5,13.5 1.5,12 Q10.5,10.5 12,1.5Z" fill="#ffffff" stroke="${C.ink}" stroke-width="1.5" stroke-linejoin="round"/>`,
    ),
    ripple: svgDoc([0, 0, 80, 80], 1, `<circle cx="40" cy="40" r="34" fill="none" stroke="#ffffff" stroke-width="6"/>`),
    star: svgDoc([0, 0, 100, 96], 0.9, `<path d="${STAR_PATH}" fill="${C.mustard}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>`),
    'star-empty': svgDoc(
      [0, 0, 100, 96],
      0.9,
      `<path d="${STAR_PATH}" fill="${C.tileSeam}" stroke="${C.ink}" stroke-opacity="0.35" stroke-width="6" stroke-linejoin="round"/>`,
    ),
    // bottom bar icons, from the board
    'icon-build': svgDoc(
      [0, 0, 64, 64],
      1,
      `<g transform="rotate(-40 32 32)" ${ICON}><rect x="28.5" y="22" width="7" height="36" rx="3.5" fill="${C.wood}"/><rect x="16" y="9" width="32" height="15" rx="5" fill="${C.terracotta}"/></g>`,
    ),
    'icon-staff': svgDoc(
      [0, 0, 64, 64],
      1,
      `<g ${ICON}><circle cx="43" cy="22" r="7" fill="${C.mustard}"/><rect x="33" y="31" width="20" height="21" rx="9" fill="${C.mustard}"/>` +
        `<circle cx="23" cy="21" r="8" fill="${C.teal}"/><rect x="12" y="31" width="23" height="23" rx="10" fill="${C.teal}"/></g>`,
    ),
    // the events' pictures, on their coloured discs: Mi Mi's phone with a video, the inspector's clipboard with a tick, the hot days' sparkle
    'event-phone': svgDoc(
      [-32, -32, 64, 64],
      1,
      `<g ${EVENT}><rect x="-13" y="-23" width="26" height="46" rx="5" fill="${C.cream}"/><path d="M-5,-8 L7,0 L-5,8Z" fill="${C.lotus}"/></g>`,
    ),
    'event-clip': svgDoc(
      [-32, -32, 64, 64],
      1,
      `<g ${EVENT}><rect x="-17" y="-17" width="34" height="40" rx="4" fill="${C.cream}"/><rect x="-8" y="-23" width="16" height="10" rx="2" fill="${C.woodLight}"/>` +
        `<path d="M-9,2 l6,6 l12,-12" fill="none" stroke="${C.teal}" stroke-width="5"/></g>`,
    ),
    'event-spark': svgDoc([-32, -32, 64, 64], 1, `<path d="M0,-22 Q3,-3 22,0 Q3,3 0,22 Q-3,3 -22,0 Q-3,-3 0,-22Z" fill="${C.cream}" ${EVENT}/>`),
    // the rival's shop with its awning and door, and the power cut's bolt
    'event-shop': svgDoc(
      [-32, -32, 64, 64],
      1,
      `<g ${EVENT}><path d="M-19,-6 V22 H19 V-6Z" fill="${C.cream}"/><path d="M-23,-6 L-17,-21 H17 L23,-6Z" fill="${C.terracotta}"/><path d="M-6,22 V8 H6 V22Z" fill="${C.woodLight}"/></g>`,
    ),
    'event-bolt': svgDoc([-32, -32, 64, 64], 1, `<path d="M5,-24 L-13,3 H1 L-4,24 L14,-4 H0Z" fill="${C.cream}" ${EVENT}/>`),
    // the power cut: a candle, the warm glow round it, and the off mark over an idle machine
    'fx-candle': svgDoc(
      [-10, -31, 20, 54],
      1,
      `<rect x="-7" y="-6" width="14" height="26" rx="3" fill="${C.cream}" stroke="${C.ink}" stroke-width="3"/><path d="M0,-8 q-6,-10 0,-20 q6,10 0,20" fill="${C.mustard}"/>`,
    ),
    'fx-glow': svgDoc(
      [-110, -110, 220, 220],
      1,
      `<defs><radialGradient id="glow"><stop offset="0" stop-color="${C.glow}" stop-opacity="0.75"/><stop offset="1" stop-color="${C.glow}" stop-opacity="0"/></radialGradient></defs><circle r="110" fill="url(#glow)"/>`,
    ),
    'power-off': svgDoc(
      [-38, -38, 76, 76],
      1,
      `<circle r="34" fill="${C.cream}" stroke="${C.ink}" stroke-width="4"/>` +
        `<path d="M5,-24 L-13,3 H1 L-4,24 L14,-4 H0Z" transform="scale(0.8)" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>` +
        `<path d="M-22,-22 L22,22" stroke="${C.terracotta}" stroke-width="7" stroke-linecap="round"/>`,
    ),
    // one customer, for the "serve" quests
    'quest-guest': svgDoc([0, 0, 64, 64], 1, `<g ${ICON}><circle cx="32" cy="21" r="10" fill="${C.lotus}"/><rect x="17" y="34" width="30" height="22" rx="11" fill="${C.lotus}"/></g>`),
    'icon-services': svgDoc(
      [0, 0, 64, 64],
      1,
      `<g ${ICON}><ellipse cx="21" cy="36" rx="7" ry="15" fill="${C.lotus}" transform="rotate(-38 21 36)"/><ellipse cx="43" cy="36" rx="7" ry="15" fill="${C.lotus}" transform="rotate(38 43 36)"/>` +
        `<ellipse cx="32" cy="31" rx="8" ry="18" fill="${C.lotusDark}"/><rect x="14" y="49" width="36" height="5" rx="2.5" fill="${C.teal}"/></g>`,
    ),
    'icon-quests': svgDoc(
      [0, 0, 64, 64],
      1,
      `<g ${ICON}><rect x="13" y="10" width="38" height="47" rx="6" fill="${C.terracotta}"/><rect x="18" y="16" width="28" height="36" rx="3" fill="${C.cream}"/>` +
        `<rect x="24" y="5" width="16" height="10" rx="3" fill="${C.mustard}"/>` +
        `<path d="M23,27 H41 M23,35 H41 M23,43 H34" stroke="${C.terracotta}" stroke-width="3" stroke-linecap="round"/></g>`,
    ),
    // the chain: a map pin on the ground
    'icon-chain': svgDoc(
      [0, 0, 64, 64],
      1,
      `<g ${ICON}><ellipse cx="32" cy="57" rx="12" ry="4" fill="${C.sand}"/>` +
        `<path d="M32,57 C22,44 15,36 15,25 A17,17 0 1 1 49,25 C49,36 42,44 32,57Z" fill="${C.terracotta}"/><circle cx="32" cy="25" r="7" fill="${C.cream}"/></g>`,
    ),
    // in the head of each place's pin on the chain map, from the sketch: the main shop's house, the beach's wave, the old town's lantern, uptown's towers
    ...Object.fromEntries(
      Object.entries(PIN_ICONS).map(([place, d]) => [
        `pin-${place}`,
        svgDoc([-32, -32, 64, 64], 0.8, `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="5.6" stroke-linecap="round" stroke-linejoin="round"/>`),
      ]),
    ),
    // the owner's scooter on the closing card, from the sketch: standing on the origin, facing right
    'fx-scooter': svgDoc(
      SCOOTER_BOX,
      1,
      `<path d="M-112,-34 Q-116,-100 -44,-102 L4,-102 L4,-34Z" fill="${C.teal}" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>` +
        `<rect x="-100" y="-122" width="92" height="24" rx="12" fill="${C.woodDark}" stroke="${C.ink}" stroke-width="4"/>` +
        `<rect x="-6" y="-52" width="70" height="18" rx="6" fill="${C.cream}" stroke="${C.ink}" stroke-width="4"/>` +
        `<path d="M50,-34 Q40,-90 74,-150 L92,-146 Q76,-92 86,-34Z" fill="${C.teal}" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/>` +
        `<path d="M54,-158 H110" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/><circle cx="92" cy="-128" r="9" fill="${C.goldPale}" stroke="${C.ink}" stroke-width="3"/>` +
        `<circle cx="-78" cy="-24" r="24" fill="${C.ink}"/><circle cx="68" cy="-24" r="24" fill="${C.ink}"/>` +
        `<circle cx="-78" cy="-24" r="9" fill="${C.silver}"/><circle cx="68" cy="-24" r="9" fill="${C.silver}"/>`,
    ),
    // the starter goals' flag: a pole with a red pennant
    'icon-flag': svgDoc(
      [0, 0, 64, 64],
      1,
      `<g ${ICON}><rect x="16" y="8" width="6" height="50" rx="3" fill="${C.wood}"/><path d="M22,10 L52,20 L22,31 Z" fill="${C.lantern}"/></g>`,
    ),
    // Safari's share button, for the install steps: an open box with an arrow out of the top
    'icon-share': svgDoc(
      [0, 0, 64, 64],
      1,
      `<g fill="none" stroke="${C.ink}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">` +
        `<path d="M24,26 H19 Q15,26 15,30 V52 Q15,56 19,56 H45 Q49,56 49,52 V30 Q49,26 45,26 H40"/><path d="M32,40 V7 M23,16 L32,7 L41,16"/></g>`,
    ),
    // the guide's hand: points down with the index finger, fingertip at the bottom centre
    hand: svgDoc(
      [0, 0, 100, 130],
      1,
      `<ellipse cx="70" cy="56" rx="8.5" ry="17" transform="rotate(14 70 56)" fill="${C.cream}" ${OUTLINE}/>` +
        `<rect x="12" y="20" width="52" height="58" rx="16" fill="${C.cream}" ${OUTLINE}/>` +
        `<circle cx="20" cy="76" r="9" fill="${C.cream}" ${OUTLINE}/><circle cx="30" cy="78" r="9" fill="${C.cream}" ${OUTLINE}/><circle cx="40" cy="76" r="9" fill="${C.cream}" ${OUTLINE}/>` +
        `<rect x="40" y="58" width="20" height="68" rx="10" fill="${C.cream}" ${OUTLINE}/>` +
        `<rect x="8" y="2" width="60" height="24" rx="8" fill="${C.teal}" ${OUTLINE}/>`,
    ),
    // the service a waiting customer wants: a drop of water with foam, a face under a mint mask, a stack of warm stones
    'svc-shampoo': badge(
      C.water,
      `<path d="M24,12 Q35,25 35,33 A11,11 0 0 1 13,33 Q13,25 24,12Z" fill="${C.cobalt}" ${INNER}/>` +
        `<path d="M18,33 Q18,28 21,25" fill="none" stroke="${C.cream}" stroke-width="2.6" stroke-linecap="round"/>` +
        `<circle cx="39" cy="19" r="6" fill="${C.cream}" ${INNER}/><circle cx="42" cy="32" r="4" fill="${C.cream}" ${INNER}/>`,
    ),
    'svc-mask': badge(
      C.lotus,
      `<circle cx="28" cy="29" r="16" fill="${C.mint}" ${INNER}/>` +
        `<circle cx="21.5" cy="26" r="5" fill="${C.cucumber}" stroke="${C.leaf}" stroke-width="2.4"/><circle cx="34.5" cy="26" r="5" fill="${C.cucumber}" stroke="${C.leaf}" stroke-width="2.4"/>` +
        `<path d="M24,36 Q28,39.5 32,36" fill="none" stroke="${C.ink}" stroke-width="2.4" stroke-linecap="round"/>`,
    ),
    'svc-massage': badge(
      C.mustard,
      `<ellipse cx="28" cy="40" rx="15" ry="6" fill="${C.clay}" ${INNER}/>` +
        `<ellipse cx="28" cy="30" rx="11.5" ry="5.5" fill="${C.woodDark}" ${INNER}/>` +
        `<ellipse cx="28" cy="20.5" rx="8" ry="4.5" fill="${C.clay}" ${INNER}/>` +
        `<path d="M23,19.5 Q26,17.6 29,18 M21,29 Q25,26.8 29,27.2 M19,39 Q24,36.6 29,37" fill="none" stroke="${C.clayLight}" stroke-width="2" stroke-linecap="round"/>` +
        `<path d="M36,17 Q38,8 46,9 Q45,17 36,17Z" fill="${C.leaf}" ${INNER}/>`,
    ),
    // a pot of leaves over a small fire with two curls of steam
    'svc-steam': badge(
      C.mintTeal,
      `<path d="M21,15 q4,-4 0,-8 M35,15 q4,-4 0,-8" fill="none" stroke="${C.cream}" stroke-width="2.6" stroke-linecap="round"/>` +
        `<path d="M12,25 H44 C44,36 38,42 28,42 C18,42 12,36 12,25Z" fill="${C.cobalt}" ${INNER}/>` +
        `<ellipse cx="28" cy="25" rx="16" ry="4.5" fill="${C.leaf}" ${INNER}/>` +
        `<path d="M18,50 l4,-6 l4,6 M26,50 l4,-7 l4,7 M34,50 l3,-5 l3,5" fill="${C.mustard}" stroke="${C.terracotta}" stroke-width="1.5" stroke-linejoin="round"/>`,
    ),
    // three dark stones glowing at the rim along a customer's back, heat rising off them
    'svc-stone': badge(
      C.terracotta,
      `<path d="M8.4,40 A23,23 0 0 0 47.6,40 Q28,30 8.4,40Z" fill="${SKIN_TONE}" ${INNER}/>` +
        `<path d="M16,28 q-2.5,-3.5 0,-7 q2.5,-3.5 0,-7 M28,24 q-2.5,-3.5 0,-7 q2.5,-3.5 0,-7 M40,28 q-2.5,-3.5 0,-7 q2.5,-3.5 0,-7" fill="none" stroke="${C.cream}" stroke-width="2.4" stroke-linecap="round"/>` +
        hotStones([
          [16, 36.5, 7, 5],
          [40, 36.5, 7, 5],
          [28, 33, 8.5, 6],
        ]),
    ),
    // a towel-wrapped head in a wooden tub of mud
    'svc-mud': badge(
      C.glow,
      `<path d="M12,35 H44 V40 Q44,45 39,45 H17 Q12,45 12,40Z" fill="${C.wood}" ${INNER}/>` +
        `<path d="M20,37 V44.5 M28,37 V45 M36,37 V44.5" stroke="${C.woodDark}" stroke-width="2"/>` +
        `<ellipse cx="28" cy="35" rx="16" ry="4" fill="${C.clay}" ${INNER}/>` +
        `<circle cx="28" cy="24.5" r="8.8" fill="${SKIN_TONE}" ${INNER}/>` +
        `<path d="M18.3,23.2 C17.7,15.5 22.8,12.7 28,12.7 C33.2,12.7 38.3,15.5 37.7,23.2 C35.5,21.3 31.8,20.2 28,20.2 C24.2,20.2 20.5,21.3 18.3,23.2Z" fill="${C.paper}" ${INNER}/>` +
        `<path d="M23.4,26 q1.5,1.4 3,0 M29.6,26 q1.5,1.4 3,0" fill="none" stroke="${C.ink}" stroke-width="1.5" stroke-linecap="round"/>` +
        `<path d="M20.5,32 Q28,36 35.5,32" fill="${C.clay}" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round"/>` +
        `<circle cx="17" cy="35.4" r="1.8" fill="${C.clayLight}"/><circle cx="39.5" cy="34.6" r="2" fill="${C.clayLight}"/>`,
    ),
    // a wooden bowl heaped with sea salt, a wave on its side
    'svc-scrub': badge(
      C.sea,
      `<path d="M11,30 H45 Q43,45 28,45 Q13,45 11,30Z" fill="${C.wood}" ${INNER}/>` +
        `<path d="M16,37 q3,-3 6,0 t6,0 t6,0 t6,0" stroke="${C.cream}" stroke-width="2" fill="none" stroke-linecap="round"/>` +
        `<path d="M13,30 Q17,17 28,16 Q39,17 43,30Z" fill="${C.cream}" ${INNER}/>` +
        `<path d="M22,24 l2.2,-3 l2.2,3 l-2.2,3Z M30,21 l2,-2.6 l2,2.6 l-2,2.6Z M33,27 l1.8,-2.4 l1.8,2.4 l-1.8,2.4Z" fill="${C.seaPale}" stroke="${C.ink}" stroke-width="1.2" stroke-linejoin="round"/>`,
    ),
    // a sole rising out of a wooden basin of herb water, a leaf floating
    'svc-foot': badge(
      C.mint,
      `<path d="M10,31 H46 L42,45 Q28,49 14,45Z" fill="${C.wood}" ${INNER}/>` +
        `<path d="M22,32 Q18,20 21,13 Q28,6 35,13 Q38,20 34,32Z" fill="${SKIN_TONE}" ${INNER}/>` +
        `<circle cx="23" cy="11.5" r="3" fill="${SKIN_TONE}" ${INNER}/><circle cx="29" cy="9.5" r="2.4" fill="${SKIN_TONE}" ${INNER}/><circle cx="34" cy="11" r="2.1" fill="${SKIN_TONE}" ${INNER}/>` +
        `<ellipse cx="28" cy="31" rx="17" ry="4" fill="${C.herb}" ${INNER}/>` +
        `<ellipse cx="38" cy="30.5" rx="4" ry="1.8" fill="${C.leaf}" transform="rotate(-20 38 30.5)"/>`,
    ),
    // a bottle of red polish beside a painted nail
    'svc-nails': badge(
      C.pinkPale,
      `<rect x="16" y="9" width="11" height="12" rx="2.5" fill="${C.deepBrown}" ${INNER}/>` +
        `<rect x="12" y="20" width="19" height="25" rx="6" fill="${C.lantern}" ${INNER}/>` +
        `<path d="M16.5,25 V39" stroke="${C.cream}" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>` +
        `<path d="M35,46 V33 Q35,24 41,24 Q47,24 47,33 V46" fill="${SKIN_TONE}" ${INNER}/>` +
        `<path d="M37.2,36 V30.5 Q37.2,27 41,27 Q44.8,27 44.8,30.5 V36Z" fill="${C.lantern}" ${INNER}/>`,
    ),
    // the four things a service uses up: a shampoo bottle, a rolled towel, a mask sachet and an oil dropper bottle
    'stock-shampoo': badge(
      C.water,
      `<rect x="22" y="8" width="12" height="7" rx="2" fill="${C.teal}" ${INNER}/>` +
        `<rect x="16" y="14" width="24" height="33" rx="8" fill="${C.cream}" ${INNER}/>` +
        `<rect x="16" y="25" width="24" height="12" fill="${C.cobalt}" ${INNER}/>`,
    ),
    'stock-towel': badge(
      C.mint,
      `<rect x="11" y="19" width="34" height="22" rx="11" fill="${C.cream}" ${INNER}/>` +
        `<ellipse cx="42" cy="30" rx="5" ry="11" fill="${C.paper}" ${INNER}/>` +
        `<path d="M24,20 V40 M31,20 V40" stroke="${C.teal}" stroke-width="3" stroke-linecap="round"/>`,
    ),
    'stock-mask': badge(
      C.lotus,
      `<rect x="12" y="14" width="32" height="28" rx="5" fill="${C.cream}" ${INNER}/>` +
        `<path d="M12,19 H44 M12,37 H44" stroke="${C.ink}" stroke-width="2" stroke-dasharray="3 2"/>` +
        `<circle cx="28" cy="28" r="6" fill="${C.mint}" ${INNER}/>`,
    ),
    'stock-oil': badge(
      C.mustard,
      `<path d="M25,8 H31 V14 H25Z" fill="${C.clay}" ${INNER}/>` +
        `<rect x="22" y="14" width="12" height="6" rx="2" fill="${C.woodDark}" ${INNER}/>` +
        `<path d="M22,20 H34 L40,32 V43 Q40,48 35,48 H21 Q16,48 16,43 V32Z" fill="${C.clay}" ${INNER}/>` +
        `<path d="M28,28 Q34,35 28,41 Q22,35 28,28Z" fill="${C.mustard}" ${INNER}/>`,
    ),
    // a bundle of herbs: three leaves tied with a cucumber-green band
    'stock-herbs': badge(
      C.cucumber,
      `<path d="M28,40 C14,38 11,24 15,11 C26,14 31,28 28,40Z" fill="${C.leaf}" ${INNER}/>` +
        `<path d="M28,40 C42,38 45,24 41,11 C30,14 25,28 28,40Z" fill="${C.leafLight}" ${INNER}/>` +
        `<path d="M28,41 C26,30 28,19 28,8" stroke="${C.tealDark}" stroke-width="2.6" fill="none" stroke-linecap="round"/>` +
        `<rect x="21" y="38" width="14" height="9" rx="3" fill="${C.mustard}" ${INNER}/>`,
    ),
    // a kraft sack of mineral mud, tied at the neck, a heap of mud on its label
    'stock-mud': badge(
      C.glow,
      `<path d="M20,15 Q18,9 22,10 Q24,7 28,9 Q32,7 34,10 Q38,9 36,15Z" fill="${C.weave}" ${INNER}/>` +
        `<path d="M19,19 C11,27 11,44 17,47 H39 C45,44 45,27 37,19Z" fill="${C.weave}" ${INNER}/>` +
        `<rect x="18" y="14" width="20" height="6" rx="3" fill="${C.terracotta}" ${INNER}/>` +
        `<rect x="19.5" y="27" width="17" height="13" rx="2.5" fill="${C.paper}" ${INNER}/>` +
        `<path d="M23,37 Q23,31 28,31 Q33,31 33,37Z" fill="${C.clay}"/>`,
    ),
    // a glass jar of sea salt with a cobalt lid
    'stock-salt': badge(
      C.seaPale,
      `<rect x="18" y="9" width="20" height="8" rx="2.5" fill="${C.cobalt}" ${INNER}/>` +
        `<rect x="15" y="16" width="26" height="31" rx="7" fill="${C.cream}" ${INNER}/>` +
        `<path d="M15.5,30 q3,-2.5 6,0 t6,0 t6,0 t6,0" stroke="${C.sea}" stroke-width="2" fill="none"/>` +
        `<path d="M21,38 l2,-2.6 l2,2.6 l-2,2.6Z M29,36 l2,-2.6 l2,2.6 l-2,2.6Z M25,23 l1.8,-2.4 l1.8,2.4 l-1.8,2.4Z" fill="${C.seaPale}" stroke="${C.ink}" stroke-width="1.1"/>`,
    ),
    // two bottles of polish, red and teal
    'stock-polish': badge(
      C.pinkPale,
      `<rect x="14" y="11" width="9" height="11" rx="2" fill="${C.deepBrown}" ${INNER}/>` +
        `<rect x="11" y="21" width="15" height="24" rx="5" fill="${C.lantern}" ${INNER}/>` +
        `<rect x="33" y="13" width="9" height="11" rx="2" fill="${C.deepBrown}" ${INNER}/>` +
        `<rect x="30" y="23" width="15" height="22" rx="5" fill="${C.teal}" ${INNER}/>` +
        `<path d="M14.5,26 V38 M33.5,28 V38" stroke="${C.cream}" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>`,
    ),
    // two curls of steam, blue-grey, drawn over a steaming customer
    'fx-steam': svgDoc(
      [0, 0, 56, 64],
      1,
      `<g stroke="${C.steamBlue}" stroke-width="6" fill="none" stroke-linecap="round"><path d="M18,60 q10,-12 0,-24 q-10,-12 0,-24"/><path d="M38,56 q10,-12 0,-24 q-10,-12 0,-24"/></g>`,
    ),
    // a row of three hot stones, laid across a face-down customer's back
    'fx-stones': svgDoc(
      [0, 0, 64, 28],
      1,
      hotStones(
        [
          [12.5, 15, 9, 7],
          [51.5, 15, 9, 7],
          [32, 14, 10, 8],
        ],
        2.4,
      ),
    ),
    'icon-dice': svgDoc(
      [0, 0, 64, 64],
      1,
      `<rect x="7" y="7" width="50" height="50" rx="12" fill="${C.cream}" ${ICON}/>` +
        `<g fill="${C.terracotta}"><circle cx="21" cy="21" r="4.5"/><circle cx="43" cy="21" r="4.5"/><circle cx="32" cy="32" r="4.5"/><circle cx="21" cy="43" r="4.5"/><circle cx="43" cy="43" r="4.5"/></g>`,
    ),
    // a regular's hearts, earned and not yet
    'heart-full': svgDoc(
      [0, 0, 56, 52],
      1,
      `<path d="${HEART_PATH}" fill="${C.lantern}" ${OUTLINE}/>` +
        `<path d="M12,20 Q12,13.5 18,12.5" fill="none" stroke="${C.cream}" stroke-opacity="0.7" stroke-width="3.5" stroke-linecap="round"/>`,
    ),
    'heart-empty': svgDoc([0, 0, 56, 52], 1, `<path d="${HEART_PATH}" fill="${C.cream}" ${OUTLINE}/>`),
    // a regular's member card: teal with a gold stripe and a line for the name
    'icon-card': svgDoc(
      [0, 0, 56, 40],
      1,
      `<rect x="3" y="3" width="50" height="34" rx="6" fill="${C.teal}" ${OUTLINE}/>` +
        `<rect x="5" y="10" width="46" height="7" fill="${C.mustard}"/><path d="M5,10 H51 M5,17 H51" stroke="${C.ink}" stroke-width="2"/>` +
        `<rect x="10" y="25" width="20" height="5" rx="2.5" fill="${C.cream}"/>`,
    ),
    // the guest book, for the top-bar button: a closed brown book with a gạch bông tile on its cover
    'icon-book': svgDoc(
      [0, 0, 64, 64],
      1,
      `<g ${ICON}><rect x="15" y="9" width="40" height="50" rx="4" fill="${C.cream}"/><rect x="10" y="5" width="40" height="50" rx="4" fill="${C.wood}"/>` +
        `<rect x="10" y="5" width="9" height="50" rx="3" fill="${C.woodDark}"/></g>` +
        `<g stroke="${C.ink}" stroke-width="1.5" stroke-linejoin="round"><rect x="23" y="18" width="22" height="22" rx="1.5" fill="${C.cream}" stroke-width="2"/>` +
        `<path d="M23.5,23 A4.5,4.5 0 0 0 28,18.5 H23.5Z M44.5,23 A4.5,4.5 0 0 1 40,18.5 H44.5Z M23.5,35 A4.5,4.5 0 0 1 28,39.5 H23.5Z M44.5,35 A4.5,4.5 0 0 0 40,39.5 H44.5Z" fill="${C.teal}"/>` +
        `<ellipse cx="34" cy="24.2" rx="2.4" ry="3.6" fill="${C.terracotta}"/><ellipse cx="34" cy="33.8" rx="2.4" ry="3.6" fill="${C.terracotta}"/>` +
        `<ellipse cx="29.2" cy="29" rx="3.6" ry="2.4" fill="${C.terracotta}"/><ellipse cx="38.8" cy="29" rx="3.6" ry="2.4" fill="${C.terracotta}"/>` +
        `<circle cx="34" cy="29" r="2.4" fill="${C.mustard}"/></g>`,
    ),
    'icon-lock': svgDoc(
      [0, 0, 40, 46],
      1,
      `<path d="M10,22 V14 Q10,4 20,4 Q30,4 30,14 V22" fill="none" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>` +
        `<path d="M10,22 V14 Q10,4 20,4 Q30,4 30,14 V22" fill="none" stroke="${C.tileSeam}" stroke-width="3" stroke-linecap="round"/>` +
        `<rect x="3" y="20" width="34" height="23" rx="6" fill="${C.mustard}" ${ICON}/>` +
        `<circle cx="20" cy="29.5" r="3.2" fill="${C.ink}"/><rect x="18.6" y="30" width="2.8" height="7" rx="1.2" fill="${C.ink}"/>`,
    ),
    // Phây, from the sketch: the phone on its button with a heart on the screen; the tick in a checked name's disc; a like's heart; a comment's bubble; the video's play mark
    'icon-phone': svgDoc(
      [-32, -32, 64, 64],
      1,
      `<path d="M-15,-26 H15 Q21,-26 21,-20 V20 Q21,26 15,26 H-15 Q-21,26 -21,20 V-20 Q-21,-26 -15,-26Z" fill="${C.tealPale}" ${EVENT}/>` +
        `<path d="M-6,17 H6" ${EVENT}/>` +
        `<path d="M0,6 C-11,-1 -10,-10 -4,-9.5 C-2,-9 0,-7 0,-5.5 C0,-7 2,-9 4,-9.5 C10,-10 11,-1 0,6Z" fill="${C.lotus}" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>`,
    ),
    'icon-tick': svgDoc([-16, -16, 32, 32], 1, `<path d="M-8,0 L-2.5,6 L9,-6" fill="none" stroke="${C.paper}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`),
    'icon-heart': svgDoc([0, 0, 56, 52], 1, `<path d="${HEART_PATH}" fill="${C.lotus}" ${OUTLINE}/>`),
    'icon-comment': svgDoc(
      [0, 0, 56, 52],
      1,
      `<path d="M10,5 H46 Q52,5 52,11 V33 Q52,39 46,39 H24 L13,48 L15,39 H10 Q4,39 4,33 V11 Q4,5 10,5Z" fill="${C.cream}" ${OUTLINE}/>`,
    ),
    'icon-play': svgDoc([-24, -24, 48, 48], 1, `<path d="M-9,-16 L16,0 L-9,16Z" fill="${C.paper}" stroke="${C.paper}" stroke-width="3" stroke-linejoin="round"/>`),
  }
}
