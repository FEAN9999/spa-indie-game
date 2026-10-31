import * as Phaser from 'phaser'
import { BUILD_ID } from './update'

/** One frame as the ?perf overlay sees it. */
export interface FrameSample {
  /** Time since the frame before, as the browser showed them. */
  gapMs: number
  /** Phaser's update of every scene. */
  updateMs: number
  /** Phaser's draw of every scene. */
  renderMs: number
  /** WebGL draw calls. */
  draws: number
}

export interface FrameSummary {
  fps: number
  /** Share of frames shown a refresh late, in percent. */
  slowPct: number
  worstGapMs: number
  updateMs: number
  renderMs: number
  draws: number
}

/** A frame shown this long after the one before missed the screen's 60 Hz refresh. */
export const SLOW_GAP_MS = 20
/** The overlay averages about the last two seconds. */
const WINDOW = 120

export function summarize(frames: readonly FrameSample[]): FrameSummary {
  const n = frames.length
  if (n === 0) return { fps: 0, slowPct: 0, worstGapMs: 0, updateMs: 0, renderMs: 0, draws: 0 }
  const sum = (f: (s: FrameSample) => number) => frames.reduce((a, s) => a + f(s), 0)
  return {
    fps: (1000 * n) / sum(s => s.gapMs),
    slowPct: (100 * frames.filter(s => s.gapMs > SLOW_GAP_MS).length) / n,
    worstGapMs: Math.max(...frames.map(s => s.gapMs)),
    updateMs: sum(s => s.updateMs) / n,
    renderMs: sum(s => s.renderMs) / n,
    draws: sum(s => s.draws) / n,
  }
}

/**
 * Developer timing over the game, for measuring on a phone: the frame rate, the slow frames, Phaser's update and draw time and the draw
 * calls, with switches that skip drawing Graphics and circles, stop Text redrawing, and bring in ten customers.
 */
export function showPerf(game: Phaser.Game): void {
  const frames: FrameSample[] = []
  let last = 0
  let stepAt = 0
  let updateMs = 0
  let renderAt = 0
  let draws = 0
  const E = Phaser.Core.Events
  game.events.on(E.PRE_STEP, () => (stepAt = performance.now()))
  game.events.on(E.POST_STEP, () => (updateMs = performance.now() - stepAt))
  game.events.on(E.PRE_RENDER, () => (renderAt = performance.now()))
  game.events.on(E.POST_RENDER, () => {
    const now = performance.now()
    if (last > 0) frames.push({ gapMs: stepAt - last, updateMs, renderMs: now - renderAt, draws })
    if (frames.length > WINDOW) frames.shift()
    last = stepAt
    draws = 0
  })

  const gl = (game.renderer as Partial<Phaser.Renderer.WebGL.WebGLRenderer>).gl as unknown as Record<string, (...a: unknown[]) => unknown> | undefined
  for (const name of ['drawArrays', 'drawElements']) {
    if (!gl) break
    const draw = gl[name].bind(gl)
    gl[name] = (...a) => {
      draws++
      return draw(...a)
    }
  }

  const skip = { shapes: false, text: false }
  for (const cls of [Phaser.GameObjects.Graphics, Phaser.GameObjects.Arc]) {
    const proto = cls.prototype as unknown as { renderWebGLStep: (...a: unknown[]) => void }
    const step = proto.renderWebGLStep
    proto.renderWebGLStep = function (this: unknown, ...a: unknown[]) {
      if (!skip.shapes) step.apply(this, a)
    }
  }
  const text = Phaser.GameObjects.Text.prototype
  const updateText = text.updateText
  text.updateText = function (this: Phaser.GameObjects.Text) {
    return skip.text ? this : updateText.call(this)
  }

  const panel = document.createElement('div')
  panel.style.cssText =
    'position:fixed;left:4px;top:calc(env(safe-area-inset-top) + 4px);z-index:10;padding:6px 8px;border-radius:8px;background:rgba(0,0,0,.75);color:#fff;font:12px/1.4 ui-monospace,monospace'
  const lines = document.createElement('div')
  lines.style.whiteSpace = 'pre'
  panel.append(lines)
  const button = (label: () => string, onTap: () => void) => {
    const b = document.createElement('button')
    b.style.cssText = 'margin:6px 6px 0 0;padding:6px 8px;font:12px sans-serif'
    b.textContent = label()
    b.onclick = () => {
      onTap()
      b.textContent = label()
    }
    panel.append(b)
  }
  const spa = () => game.scene.getScene('SpaScene') as unknown as { sim: { customers: unknown[]; spawnCustomer(): unknown } }
  button(
    () => `Hình vẽ: ${skip.shapes ? 'TẮT' : 'bật'}`,
    () => (skip.shapes = !skip.shapes),
  )
  button(
    () => `Chữ: ${skip.text ? 'ĐỨNG' : 'chạy'}`,
    () => (skip.text = !skip.text),
  )
  button(
    () => '+10 khách',
    () => {
      for (let i = 0; i < 10; i++) spa().sim.spawnCustomer()
    },
  )
  document.body.append(panel)

  setInterval(() => {
    const s = summarize(frames)
    const ms = (v: number) => v.toFixed(1)
    lines.textContent = [
      `FPS ${Math.round(s.fps)} · chậm ${Math.round(s.slowPct)}% · tệ nhất ${Math.round(s.worstGapMs)}ms`,
      `update ${ms(s.updateMs)} · render ${ms(s.renderMs)} ms · draw ${Math.round(s.draws)}`,
      `khách ${spa().sim.customers.length} · bản ${BUILD_ID}`,
    ].join('\n')
  }, 1000)
}
