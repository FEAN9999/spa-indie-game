import { GROUND, HIGHLIGHT, shade } from './aplus'
import { C } from './palette'

// Lượt A+ tự động cho hình đã vẽ phẳng: mỗi mảng có viền nâu được thêm mảng bóng mép cứng ở dưới phải,
// mảng gỗ thêm vân, và một mảng lớn trên cùng thêm điểm sáng. Hình không đổi khung, khoá hay vị trí.

const n = (v: number) => +v.toFixed(3)
/** An ellipse as a path, so it can be shaded and clipped like any shape. */
const ell = (cx: number, cy: number, rx: number, ry = rx) => `M${n(cx - rx)},${n(cy)} a${n(rx)},${n(ry)} 0 1 0 ${n(2 * rx)},0 a${n(rx)},${n(ry)} 0 1 0 ${n(-2 * rx)},0Z`
/** A rounded rectangle as a path. */
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  r <= 0
    ? `M${n(x)},${n(y)} H${n(x + w)} V${n(y + h)} H${n(x)}Z`
    : `M${n(x + r)},${n(y)} H${n(x + w - r)} Q${n(x + w)},${n(y)} ${n(x + w)},${n(y + r)} V${n(y + h - r)} Q${n(x + w)},${n(y + h)} ${n(x + w - r)},${n(y + h)} H${n(x + r)} Q${n(x)},${n(y + h)} ${n(x)},${n(y + h - r)} V${n(y + r)} Q${n(x)},${n(y)} ${n(x + r)},${n(y)}Z`

/** The box round a path's end and control points, walking its commands; an arc adds its radii either side. */
export function bounds(d: string): [number, number, number, number] {
  const toks = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g) ?? []
  const xs: number[] = []
  const ys: number[] = []
  let i = 0
  let cmd = 'M'
  let x = 0
  let y = 0
  let sx = 0
  let sy = 0
  const num = () => parseFloat(toks[i++])
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++]
    const up = cmd.toUpperCase()
    const ox = cmd === up ? 0 : x
    const oy = cmd === up ? 0 : y
    if (up === 'Z') {
      x = sx
      y = sy
      continue
    }
    if (up === 'H') x = num() + ox
    else if (up === 'V') y = num() + oy
    else if (up === 'A') {
      const rx = num()
      const ry = num()
      i += 3
      const nx = num() + ox
      const ny = num() + oy
      xs.push(Math.min(x, nx) - rx, Math.max(x, nx) + rx)
      ys.push(Math.min(y, ny) - ry, Math.max(y, ny) + ry)
      x = nx
      y = ny
    } else {
      const pairs = up === 'C' ? 3 : up === 'Q' || up === 'S' ? 2 : 1
      for (let k = 0; k < pairs; k++) {
        const px = num() + ox
        const py = num() + oy
        xs.push(px)
        ys.push(py)
        if (k === pairs - 1) {
          x = px
          y = py
        }
      }
      if (up === 'M') {
        sx = x
        sy = y
        cmd = cmd === 'M' ? 'L' : 'l'
      }
    }
    xs.push(x)
    ys.push(y)
  }
  const x0 = Math.min(...xs)
  const y0 = Math.min(...ys)
  return [x0, y0, Math.max(...xs) - x0, Math.max(...ys) - y0]
}

export const SHAPE_EL = /<(?:rect|circle|ellipse|path)\b[^>]*\/>/g
export const attr = (el: string, name: string) => el.match(new RegExp(` ${name}="([^"]*)"`))?.[1]
/** A self-closing shape's outline as a path. */
export function shapeD(el: string): string {
  const tag = el.slice(1, el.search(/[\s/]/))
  const a = (k: string) => parseFloat(attr(el, k) ?? '0')
  if (tag === 'rect') return rr(a('x'), a('y'), a('width'), a('height'), Math.min(a('rx') || a('ry'), a('width') / 2, a('height') / 2))
  if (tag === 'circle') return ell(a('cx'), a('cy'), a('r'))
  if (tag === 'ellipse') return ell(a('cx'), a('cy'), a('rx'), a('ry'))
  return attr(el, 'd') ?? ''
}

/**
 * Copies the stroke of an unturned `<g>` onto each shape inside it that has no stroke of its own, so a picture drawn
 * with one shared outline can be lifted shape by shape; it draws the same.
 */
export function inheritStroke(body: string): string {
  return body.replace(/<g( [^>]*)>((?:(?!<\/?g[\s>]).)*)<\/g>/gs, (g, attrs: string, inner: string) => {
    if (/ transform=/.test(attrs) || !/ stroke="/.test(attrs)) return g
    const stroke = attrs.match(/ stroke(?:-width|-linejoin|-linecap)?="[^"]*"/g) ?? []
    const add = (el: string) => stroke.filter(a => !el.includes(a.slice(0, a.indexOf('=') + 1))).join('')
    return `<g${attrs}>${inner.replace(SHAPE_EL, el => (/ stroke="/.test(el) ? el : el.replace(/\/>$/, `${add(el)}/>`)))}</g>`
  })
}

const WOODS =new Set([C.wood, C.woodDark, C.woodLight, C.bambooDark].map(c => c.toUpperCase()))
const FABRICS = new Set([C.teal, C.tealLight, C.tealDark, C.terracotta, C.lotus, C.mustard].map(c => c.toUpperCase()))
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
/** A short hash of a body, so its clip ids come out the same each time it is drawn and apart from other bodies'. */
function tagOf(s: string): string {
  let h = 5381
  for (let k = 0; k < s.length; k++) h = (h * 33 + s.charCodeAt(k)) | 0
  return (h >>> 0).toString(36)
}

/**
 * A+ for a flat picture drawn at `px` canvas pixels per unit. Each solid shape with an ink outline of at least about
 * 2 pixels and big enough to read gets its hard-edged shade at the lower right (itself in the shade colour, then
 * itself moved up and left in its own colour, clipped to it), wood gets two grain lines, a cushion or sheet a stitched seam, and the highest big shape
 * gets a thin white shine inside its top edge. The old 15–20% ink ground shadows become the A+ 18%. See-through,
 * faded, patterned and transformed shapes stay as they are.
 */
export function liftPiece(body: string, px: number): string {
  return lift(body, px, false)
}

/**
 * A+ for a room, a house front or the street, drawn at `px` canvas pixels per unit: the floors, walls and other
 * shapes wider or taller than 3 tiles stay flat, as on the approved shop corner. Each thing on them that `liftPiece`
 * would shade (a window, a clock, a lantern, a cart, a tree) gets its shade and its own shine, no seams, and casts an
 * 18% shadow a few pixels to its lower right. The thin ink band under a back wall becomes an 18% shadow 0.22 tile deep.
 */
export function liftScene(body: string, px: number): string {
  return lift(body, px, true)
}

function lift(body: string, px: number, scene: boolean): string {
  const els = body.match(SHAPE_EL) ?? []
  const solidShape = (el: string) => {
    if (!/^#[0-9a-fA-F]{3,6}$/.test(attr(el, 'fill') ?? '') || / (transform|opacity|fill-opacity|stroke-dasharray)=/.test(el)) return false
    return attr(el, 'stroke')?.toUpperCase() === C.ink.toUpperCase() && parseFloat(attr(el, 'stroke-width') ?? '0') * px >= 1.9
  }
  const boxes = els.map(el => {
    if (!solidShape(el)) return null
    const b = bounds(shapeD(el))
    return b[2] * px >= 10 && b[3] * px >= 8 && (!scene || Math.max(b[2], b[3]) * px <= 3 * 78) ? b : null
  })
  const area = (b: [number, number, number, number]) => b[2] * b[3]
  const biggest = Math.max(0, ...boxes.map(b => (b && b[2] * px >= 14 && b[3] * px >= 12 ? area(b) : 0)))
  // the shine goes on the highest of the big shapes, the top that faces the light; a later one wins a tie
  let lit = -1
  boxes.forEach((b, i) => {
    if (b && b[2] * px >= 14 && b[3] * px >= 12 && area(b) >= biggest * 0.3 && (lit < 0 || b[1] <= boxes[lit]![1] + 2 / px)) lit = i
  })
  const shines = (i: number) => (scene ? !!boxes[i] && boxes[i]![2] * px >= 20 && boxes[i]![3] * px >= 16 : i === lit)
  const tag = tagOf(body)
  let clips = 0
  let i = -1
  return body.replace(SHAPE_EL, el => {
    i++
    const b = boxes[i]
    if (!b) {
      if (attr(el, 'fill') !== C.ink) return el
      const o = attr(el, 'opacity') ?? ''
      if (scene && el.startsWith('<rect') && /^0?\.1[0-4]$/.test(o) && parseFloat(attr(el, 'width') ?? '0') * px >= 150) {
        const h = Math.max(parseFloat(attr(el, 'height') ?? '0'), 17 / px)
        return el.replace(/ opacity="[^"]*"/, ' opacity=".18"').replace(/ height="[^"]*"/, ` height="${n(h)}"`)
      }
      return /^0?\.(1[5-9]|2)$/.test(o) ? el.replace(/ opacity="[^"]*"/, ' opacity=".18"') : el
    }
    const [bx, by, bw, bh] = b
    const d = shapeD(el)
    const fill = attr(el, 'fill')!
    const dx = n(clamp(bw * 0.1, 2 / px, 7 / px))
    const dy = n(clamp(bh * 0.1, 2 / px, 6 / px))
    let inner = ''
    if (WOODS.has(fill.toUpperCase()) && bw * px >= 24 && bh * px >= 14) {
      const along = bw >= bh
      const grain = (t: number) =>
        along
          ? `M${n(bx + bw * 0.08)},${n(by + bh * t)} Q${n(bx + bw * 0.35)},${n(by + bh * (t - 0.08))} ${n(bx + bw * 0.55)},${n(by + bh * t)} T${n(bx + bw * 0.9)},${n(by + bh * t)}`
          : `M${n(bx + bw * t)},${n(by + bh * 0.08)} Q${n(bx + bw * (t - 0.08))},${n(by + bh * 0.35)} ${n(bx + bw * t)},${n(by + bh * 0.55)} T${n(bx + bw * t)},${n(by + bh * 0.9)}`
      inner += `<path d="${grain(0.36)} ${grain(0.7)}" fill="none" stroke="${shade(fill, 0.3)}" stroke-width="${n(1.1 / px)}" stroke-linecap="round"/>`
    }
    if (!scene && FABRICS.has(fill.toUpperCase()) && el.startsWith('<rect') && bw * px >= 22 && bh * px >= 16) {
      // a cushion or a sheet: a stitched seam just inside its edge
      const g = 3.5 / px
      const r = Math.max(0, Math.min(parseFloat(attr(el, 'rx') ?? '0'), bw / 2, bh / 2) - g)
      inner += `<path d="${rr(bx + g, by + g, bw - 2 * g, bh - 2 * g, r)}" fill="none" stroke="${shade(fill, 0.35)}" stroke-width="${n(1 / px)}" stroke-dasharray="${n(3 / px)} ${n(2 / px)}"/>`
    }
    if (shines(i)) {
      // a thin shine just inside the lit edge: along the top, or down the left of a tall shape
      const t = 2.6 / px
      const gap = Math.min(4 / px, (bh > bw * 1.6 ? bw : bh) * 0.12)
      inner +=
        bh > bw * 1.6
          ? `<path d="${rr(bx + gap, by + bh * 0.1, t, bh * 0.26, t / 2)}" ${HIGHLIGHT}/>`
          : `<path d="${rr(bx + Math.max(gap * 2, bw * 0.07), by + gap, bw * 0.26, t, t / 2)}" ${HIGHLIGHT}/>`
    }
    const id = `l${tag}-${clips++}`
    const outline = el.replace(/ fill="[^"]*"/, ' fill="none"')
    const cast = scene ? `<path d="${d}" transform="translate(${n(4 / px)} ${n(4 / px)})" ${GROUND}/>` : ''
    return (
      cast +
      `<clipPath id="${id}"><path d="${d}"/></clipPath><path d="${d}" fill="${shade(fill)}"/>` +
      `<g clip-path="url(#${id})"><path d="${d}" transform="translate(${-dx} ${-dy})" fill="${fill}"/>${inner}</g>${outline}`
    )
  })
}
