import { HIGHLIGHT } from './aplus'
import { C } from './palette'

// Splits a tinted part into its fills and its brown lines, so setTint colours the fills
// without darkening the lines. Works on SVG made of self-closing elements. An A+ highlight goes with the
// lines, since tinting would turn its white into the fill's own colour.

const ELEMENT = /<[^>]*\/>/g
const INK_STROKE = `stroke="${C.ink}"`
const STROKE_ATTRS = / stroke(-width|-linejoin|-linecap)?="[^"]*"/g

const BOX = 'x="-1000" y="-1000" width="2000" height="2000"'

const elements = (body: string) => body.match(ELEMENT) ?? []
const inked = (el: string) => el.includes(INK_STROKE)
const lit = (el: string) => el.includes(HIGHLIGHT)
const filled = (el: string) => !el.includes('fill="none"') && !lit(el)
const withFill = (el: string, fill: string) =>
  / fill="[^"]*"/.test(el) ? el.replace(/ fill="[^"]*"/, ` fill="${fill}"`) : el.replace('/>', ` fill="${fill}"/>`)

/** Everything but the ink lines and the highlights: shapes lose their ink stroke, other strokes (hair strands) stay. */
export function fillsOnly(body: string): string {
  return elements(body)
    .filter(el => !(inked(el) && el.includes('fill="none"')) && !lit(el))
    .map(el => (inked(el) ? el.replace(STROKE_ATTRS, '') : el))
    .join('')
}

/**
 * Only the ink lines, unfilled, and the highlights as they are. Lines sit above every fill once split, so each
 * is masked by the shapes drawn after it, which hid it in the whole part (the head over the near ear).
 */
export function linesOnly(body: string): string {
  const els = elements(body)
  return els
    .map((el, i) => {
      if (!inked(el) && !lit(el)) return ''
      const line = lit(el) ? el : withFill(el, 'none')
      const covers = els.slice(i + 1).filter(filled)
      if (!covers.length) return line
      const shapes = covers.map(c => withFill(c.replace(STROKE_ATTRS, ''), '#000')).join('')
      return `<mask id="m${i}" maskUnits="userSpaceOnUse" ${BOX}><rect ${BOX} fill="#fff"/>${shapes}</mask>` + line.replace('/>', ` mask="url(#m${i})"/>`)
    })
    .join('')
}
