import { describe, expect, it, vi } from 'vitest'
import { summarize, type FrameSample } from '../../src/app/perf'

vi.mock('phaser', () => ({}))

const frame = (gapMs: number, updateMs = 2, renderMs = 6, draws = 100): FrameSample => ({ gapMs, updateMs, renderMs, draws })

describe('perf overlay', () => {
  it('reads a steady 60 Hz as 60 FPS with no slow frames', () => {
    const s = summarize(Array.from({ length: 60 }, () => frame(1000 / 60)))
    expect(s.fps).toBeCloseTo(60)
    expect(s.slowPct).toBe(0)
  })

  it('reads every other frame shown a refresh late as 40 FPS with half the frames slow', () => {
    const s = summarize(Array.from({ length: 60 }, (_, i) => frame(i % 2 ? 2000 / 60 : 1000 / 60)))
    expect(s.fps).toBeCloseTo(40)
    expect(s.slowPct).toBe(50)
    expect(s.worstGapMs).toBeCloseTo(2000 / 60)
  })

  it('averages the update and draw time and the draw calls', () => {
    const s = summarize([frame(16, 2, 6, 100), frame(16, 4, 10, 120)])
    expect(s.updateMs).toBe(3)
    expect(s.renderMs).toBe(8)
    expect(s.draws).toBe(110)
  })

  it('reads no frames as zeros', () => {
    expect(summarize([])).toEqual({ fps: 0, slowPct: 0, worstGapMs: 0, updateMs: 0, renderMs: 0, draws: 0 })
  })
})
