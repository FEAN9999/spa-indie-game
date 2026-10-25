import { C } from './palette'

// Splits a tinted part into its fills and its brown lines, so setTint colours the fills
// without darkening the lines. Works on SVG made of self-closing elements.

const ELEMENT = /<[^>]*\/>/g
const INK_STROKE = `stroke="${C.ink}"`
const STROKE_ATTRS = / stroke(-width|-linejoin|-linecap)?="[^"]*"/g

const elements = (body: string) => body.match(ELEMENT) ?? []
const inked = (el: string) => el.includes(INK_STROKE)

/** Everything but the ink lines: shapes lose their ink stroke, other strokes (hair strands) stay. */
export function fillsOnly(body: string): string {
  return elements(body)
    .filter(el => !(inked(el) && el.includes('fill="none"')))
    .map(el => (inked(el) ? el.replace(STROKE_ATTRS, '') : el))
    .join('')
}

/** Only the ink lines, unfilled. */
export function linesOnly(body: string): string {
  return elements(body)
    .filter(inked)
    .map(el => (/ fill="[^"]*"/.test(el) ? el.replace(/ fill="[^"]*"/, ' fill="none"') : el.replace('/>', ' fill="none"/>')))
    .join('')
}
