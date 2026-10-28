import { svgDoc } from './svg'

/** A circle as a path, so it joins the rest of an icon's strokes. */
const ring = (cx: number, cy: number, r: number) => `M${cx - r},${cy} a${r},${r} 0 1 0 ${2 * r},0 a${r},${r} 0 1 0 ${-2 * r},0`

/** The badge icons from the sketch, drawn in a 60 box around 0,0. */
const ICONS: Record<string, string> = {
  person: `${ring(0, -8, 11)} M-20,22 Q-20,6 0,6 Q20,6 20,22`,
  people: `${ring(-9, -8, 9)} M-24,20 Q-24,6 -9,6 Q4,6 6,14 ${ring(12, -4, 8)} M2,22 Q2,10 12,10 Q24,10 24,22`,
  star: 'M0,-22 L6.5,-7 L22,-6 L10,4 L14,20 L0,11 L-14,20 L-10,4 L-22,-6 L-6.5,-7Z',
  heart: 'M0,20 C-26,2 -22,-20 -8,-18 C-3,-17 0,-12 0,-9 C0,-12 3,-17 8,-18 C22,-20 26,2 0,20Z',
  coins: 'M-18,-12 a18,7 0 1 0 36,0 a18,7 0 1 0 -36,0 M-18,-12 V12 a18,7 0 0 0 36,0 V-12 M-18,0 a18,7 0 0 0 36,0',
  lotus: 'M0,-24 Q22,0 0,24 Q-22,0 0,-24 M0,-10 V18',
  card: 'M-24,-15 H24 V15 H-24Z M-24,-6 H24 M-16,7 H-4',
  book: 'M0,-14 Q-12,-20 -24,-16 V18 Q-12,14 0,20 Q12,14 24,18 V-16 Q12,-20 0,-14 V20',
  photo: `M-22,-18 H22 V18 H-22Z M-16,12 L-5,-2 L4,8 L9,3 L16,12 ${ring(8, -8, 4)}`,
  plaque: 'M-24,-16 H24 V16 H-24Z M0,-9 L3,-2 L10,-2 L4,3 L6,10 L0,6 L-6,10 L-4,3 L-10,-2 L-3,-2Z',
  bowl: 'M-24,-2 H24 Q22,20 0,20 Q-22,20 -24,-2Z M-8,-8 Q-4,-16 0,-8 Q4,-16 8,-8',
  stairs: 'M-22,20 V10 H-10 V0 H2 V-10 H14 V-20 H22 V20Z',
  flower: `${ring(0, -12, 8)} ${ring(12, 0, 8)} ${ring(0, 12, 8)} ${ring(-12, 0, 8)} ${ring(0, 0, 5)}`,
  sparkle: 'M0,-22 Q3,-3 22,0 Q3,3 0,22 Q-3,3 -22,0 Q-3,-3 0,-22Z',
  medal: `M-10,-24 L0,-6 L10,-24 ${ring(0, 8, 14)}`,
  chart: 'M-22,18 H22 M-18,10 L-6,-2 L4,6 L18,-12 M10,-12 H18 V-4',
  list: 'M-18,-22 H18 V22 H-18Z M-9,-6 H9 M-9,6 H9',
  cake: 'M-20,0 H20 V20 H-20Z M-20,8 Q-10,14 0,8 Q10,14 20,8 M0,0 V-12 M0,-16 Q-4,-20 0,-24 Q4,-20 0,-16',
}

/** One white line icon per badge picture, keyed `badge-<icon>`; the view tints it. */
export function badgeTextures(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(ICONS).map(([name, d]) => [
      `badge-${name}`,
      svgDoc([-30, -30, 60, 60], 1.15, `<path d="${d}" fill="none" stroke="#FFFFFF" stroke-width="4.35" stroke-linecap="round" stroke-linejoin="round"/>`),
    ]),
  )
}
