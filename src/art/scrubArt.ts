import { SCRUB_PATCH_R } from '../config'
import { ink } from './aplus'
import { C } from './palette'
import { svgDoc } from './svg'

/** Drawn round the patch's centre at (0, 0); the box leaves room for the blob's widest side and its outline. */
const BOX: [number, number, number, number] = [-110, -110, 220, 220]
/** How far each of the twelve points of the blob sits from the centre, as a share of the patch radius. */
const BLOB = [1, 0.9, 1.06, 0.86, 1.02, 0.93, 1.07, 0.88, 1, 0.92, 1.05, 0.9]
/** The eight grains: offset from the centre, and whether the grain is blue. */
const GRAINS: [number, number, boolean][] = [[-40, -30, true], [20, -48, false], [44, 6, true], [-12, 18, false], [-50, 30, false], [16, 44, true], [-22, -6, true], [50, -24, false]]
/** Vài hạt muối nhỏ rơi ra ngoài vệt: toạ độ tâm trên. */
const SPILLED: [number, number][] = [[-100, 70], [96, -80], [88, 92]]
const SQUASH = 0.92
const f = (n: number) => n.toFixed(1)

/** A smear of coarse salt: a rounded blob, wet grey in its lower right, with eight diamond grains, a shine and a few grains spilled. */
function saltPatch(): string {
  const pts = BLOB.map((k, i) => {
    const a = (i / BLOB.length) * Math.PI * 2
    return [Math.cos(a) * SCRUB_PATCH_R * k, Math.sin(a) * SCRUB_PATCH_R * k * SQUASH]
  })
  const last = pts[pts.length - 1]
  let d = `M${f((last[0] + pts[0][0]) / 2)},${f((last[1] + pts[0][1]) / 2)} `
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length]
    d += `Q${f(p[0])},${f(p[1])} ${f((p[0] + q[0]) / 2)},${f((p[1] + q[1]) / 2)} `
  })
  d += 'Z'
  // nền xám ướt, phần sáng là chính vệt ấy dịch lên trái, chừa mảng bóng mép cứng ở dưới phải
  const blob =
    `<clipPath id="salt"><path d="${d}"/></clipPath>` +
    `<path d="${d}" fill="${C.saltGrey}"/>` +
    `<path d="${d}" fill="${C.saltWhite}" transform="translate(-14 -12)" clip-path="url(#salt)"/>` +
    `<path d="M-64,-30 Q-50,-58 -18,-66" stroke="#FFFFFF" stroke-width="8" fill="none" stroke-linecap="round"/>` +
    `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="5" stroke-opacity=".85" stroke-linejoin="round"/>`
  const grains = GRAINS.map(
    ([x, y, blue], i) =>
      `<path d="M${x},${y - 9} l7,9 l-7,9 l-7,-9Z" fill="${blue ? C.seaPale : i % 2 ? C.saltGrey : C.saltWhite}" ${ink(2.5)}/>`,
  ).join('')
  const spilled = SPILLED.map(([x, y]) => `<path d="M${x},${y} l4,5 l-4,5 l-4,-5Z" fill="${C.seaPale}" ${ink(2)}/>`).join('')
  const sparkle = `<path d="M31,-35 l4,-10 l4,10 l10,4 l-10,4 l-4,10 l-4,-10 l-10,-4Z" fill="#FFFFFF" ${ink(2)}/>`
  return blob + grains + spilled + sparkle
}

/** The Chà muối biển picture: the salt patch on the back. */
export function scrubTextures(): Record<string, string> {
  return { 'scrub-salt': svgDoc(BOX, 1, saltPatch()) }
}
