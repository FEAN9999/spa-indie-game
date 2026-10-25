import { describe, expect, it } from 'vitest'
import { fillsOnly, linesOnly } from '../../src/art/outline'

const SHAPE = '<rect x="0" y="0" width="5" height="11" rx="2.3" fill="#ffffff" stroke="#4A2E22" stroke-width="1.3" stroke-linejoin="round"/>'
const SEAM = '<path d="M0,2.6 V17" stroke="#4A2E22" stroke-width="0.9" stroke-linecap="round" fill="none"/>'
const STRAND = '<path d="M-6,-8.5 Q-2,-11 3,-9.8" stroke="#e6e6e6" stroke-width="1.1" fill="none" stroke-linecap="round"/>'
const EAR = '<circle cx="-11" cy="1.5" r="2.6" fill="#f0f0f0" stroke="#4A2E22" stroke-width="1.3" stroke-linejoin="round"/>'
const HEAD = '<circle cx="0" cy="0" r="11" fill="#ffffff" stroke="#4A2E22" stroke-width="1.3" stroke-linejoin="round"/>'

describe('outline split', () => {
  it('keeps the fills and the hair strands for tinting', () => {
    expect(fillsOnly(SHAPE + SEAM + STRAND)).toBe('<rect x="0" y="0" width="5" height="11" rx="2.3" fill="#ffffff"/>' + STRAND)
  })

  it('keeps only the brown lines, unfilled', () => {
    expect(linesOnly(SHAPE + SEAM + STRAND)).toBe(
      '<rect x="0" y="0" width="5" height="11" rx="2.3" fill="none" stroke="#4A2E22" stroke-width="1.3" stroke-linejoin="round"/>' + SEAM,
    )
  })

  it('hides a line where a later shape covered it, as the head covers the near ear', () => {
    const box = 'x="-1000" y="-1000" width="2000" height="2000"'
    expect(linesOnly(EAR + HEAD)).toBe(
      `<mask id="m0" maskUnits="userSpaceOnUse" ${box}><rect ${box} fill="#fff"/><circle cx="0" cy="0" r="11" fill="#000"/></mask>` +
        '<circle cx="-11" cy="1.5" r="2.6" fill="none" stroke="#4A2E22" stroke-width="1.3" stroke-linejoin="round" mask="url(#m0)"/>' +
        '<circle cx="0" cy="0" r="11" fill="none" stroke="#4A2E22" stroke-width="1.3" stroke-linejoin="round"/>',
    )
  })
})
