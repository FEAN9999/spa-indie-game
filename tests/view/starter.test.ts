import { describe, expect, it, vi } from 'vitest'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import { lockedText } from '../../src/view/starter'

// the view's lines name textures, and svg.ts imports Phaser for loading textures, which needs a browser
vi.mock('phaser', () => ({}))

const chainShop = () => new SpaSim({ rng: createRng(1), autoSpawn: false, starter: true })
const plainShop = () => new SpaSim({ rng: createRng(1), autoSpawn: false })

describe('a locked button', () => {
  it('names the goal that opens it in a shop on the starter chain, and its day otherwise', () => {
    const sim = chainShop()
    expect(lockedText(sim, 'build')).toBe('Mở khi xong: Phục vụ 4 khách')
    expect(lockedText(sim, 'services')).toBe('Mở khi xong: Phục vụ 10 khách')
    expect(lockedText(sim, 'staff')).toBe('Mở khi xong: Phục vụ 16 khách')
    expect(lockedText(sim, 'stock')).toBe('Mở vào ngày 5')
    expect(lockedText(plainShop(), 'build')).toBe('Mở vào ngày 2')
  })
})
