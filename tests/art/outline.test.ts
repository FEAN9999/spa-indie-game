import { describe, expect, it } from 'vitest'
import { fillsOnly, linesOnly } from '../../src/art/outline'

const SHAPE = '<rect x="0" y="0" width="5" height="11" rx="2.3" fill="#ffffff" stroke="#4A2E22" stroke-width="1.3" stroke-linejoin="round"/>'
const SEAM = '<path d="M0,2.6 V17" stroke="#4A2E22" stroke-width="0.9" stroke-linecap="round" fill="none"/>'
const STRAND = '<path d="M-6,-8.5 Q-2,-11 3,-9.8" stroke="#e6e6e6" stroke-width="1.1" fill="none" stroke-linecap="round"/>'

describe('outline split', () => {
  it('keeps the fills and the hair strands for tinting', () => {
    expect(fillsOnly(SHAPE + SEAM + STRAND)).toBe('<rect x="0" y="0" width="5" height="11" rx="2.3" fill="#ffffff"/>' + STRAND)
  })

  it('keeps only the brown lines, unfilled', () => {
    expect(linesOnly(SHAPE + SEAM + STRAND)).toBe(
      '<rect x="0" y="0" width="5" height="11" rx="2.3" fill="none" stroke="#4A2E22" stroke-width="1.3" stroke-linejoin="round"/>' + SEAM,
    )
  })
})
