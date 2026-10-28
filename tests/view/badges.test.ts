import { describe, expect, it, vi } from 'vitest'
import { badgeTextures } from '../../src/art/badges'
import { BADGE_IDS } from '../../src/sim/badges'
import { t } from '../../src/strings/vi'
import { BADGE_ICON, BADGE_TEXT, badgeStatus } from '../../src/view/badges'
import { zeroShop } from '../sim/helpers'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

describe('badge status lines', () => {
  it('gives the day a badge came, or that an old shop had it before', () => {
    expect(badgeStatus('million', { million: 9 }, zeroShop())).toEqual({ text: 'Có từ ngày 9', done: true })
    expect(badgeStatus('million', { million: 0 }, zeroShop())).toEqual({ text: 'Có từ trước', done: true })
  })

  it('counts how far a ring badge has come', () => {
    expect(badgeStatus('served100', {}, { ...zeroShop(), served: 63 })).toEqual({ text: 'Đã được 63/100', done: false })
    expect(badgeStatus('served1000', {}, { ...zeroShop(), served: 120 })).toEqual({ text: 'Đã được 120/1.000', done: false })
    expect(badgeStatus('bigProfit', {}, { ...zeroShop(), bestProfit: 450_000 })).toEqual({ text: 'Đã được 450.000 đ / 1.000.000 đ', done: false })
  })

  it('says not yet for a badge without a ring', () => {
    expect(badgeStatus('vipPhoto', {}, zeroShop())).toEqual({ text: 'Chưa có', done: false })
  })
})

describe('badge names and icons', () => {
  it('gives every badge its own name, a condition and a drawn icon', () => {
    const icons = badgeTextures()
    for (const id of BADGE_IDS) {
      expect(t(BADGE_TEXT[id].cond), id).toMatch(/\.$/)
      expect(icons[BADGE_ICON[id]], id).toBeDefined()
    }
    expect(new Set(BADGE_IDS.map(id => t(BADGE_TEXT[id].name))).size).toBe(BADGE_IDS.length)
  })

  it('words the goals as the sketch does', () => {
    expect([t(BADGE_TEXT.served1000.name), t(BADGE_TEXT.served1000.cond)]).toEqual(['Nghìn khách', 'Phục vụ 1.000 khách.'])
    expect(t(BADGE_TEXT.fullYear.cond)).toBe('Tiệm mở tròn một năm, 36 ngày.')
  })
})
