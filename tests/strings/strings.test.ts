import { describe, expect, it } from 'vitest'
import { RECIPE_TRY_COST } from '../../src/config'
import { REGULAR_IDS } from '../../src/sim/regulars'
import { formatCount, formatMoney } from '../../src/strings/format'
import { BUBBLE_MAX_CHARS, GREETINGS, REGULAR_TEXT } from '../../src/strings/regulars'
import { RECIPE_HINT_TEXT, t } from '../../src/strings/vi'
import { IDOL_TEXT } from '../../src/strings/idols'
import { VIP_TEXT } from '../../src/strings/vips'
import { IDOL_IDS } from '../../src/sim/idols'
import { VIP_IDS } from '../../src/sim/vips'

describe('strings', () => {
  it('formats money with dot separators', () => {
    expect(formatMoney(0)).toBe('0 đ')
    expect(formatMoney(40000)).toBe('40.000 đ')
    expect(formatMoney(1234567)).toBe('1.234.567 đ')
  })

  it('groups a count by thousands with dots', () => {
    expect(formatCount(1000)).toBe('1.000')
    expect(formatCount(63)).toBe('63')
  })

  it('fills params into strings', () => {
    expect(t('summaryTitle', { day: 3 })).toBe('Tổng kết ngày 3')
    expect(t('newDay')).toBe('Ngày mới')
  })

  it('fills the save screen strings', () => {
    expect(t('slotSummary', { n: 2, day: 5, money: formatMoney(340000) })).toBe('Ô 2 · Ngày 5 · 340.000 đ')
    expect(t('morningBanner', { name: 'Spa Sen', day: 3 })).toBe('Spa Sen · Ngày 3 · Mở cửa!')
    expect(t('importConfirm', { n: 2, day: 5 })).toBe('Tiệm trong ô 2 (Ngày 5) sẽ bị thay bằng tiệm trong mã. Tiếp tục?')
  })

  it('asks before buying a bed from its slot', () => {
    expect(t('quickBuyBed', { money: formatMoney(300000) })).toBe('Mua giường gội 300.000 đ?')
  })

  it('fills the build panel strings', () => {
    expect(t('beautyTotal', { n: 39 })).toBe('Tiệm đẹp: 39')
    expect(t('setProgress', { name: t('setSaigon'), have: 4 })).toBe('Sài Gòn xưa 4/6')
    expect(t('setDone', { name: t('setSaigon') })).toBe('Sài Gòn xưa · Đủ bộ!')
    expect(t('beautyPlus', { n: 5 })).toBe('Đẹp +5')
    expect(t('sell', { money: formatMoney(Math.floor(150000 / 2)) })).toBe('Bán · 75.000 đ')
  })

  it('every regular has a name, a job, an intro and five story lines, each at most 60 characters', () => {
    expect(BUBBLE_MAX_CHARS).toBe(60)
    for (const id of REGULAR_IDS) {
      const { name, job, intro, story } = REGULAR_TEXT[id]
      expect(name, id).not.toBe('')
      expect(job, id).not.toBe('')
      expect(story, id).toHaveLength(5)
      for (const line of [intro, ...story]) {
        expect(line, id).not.toBe('')
        expect(line.length, line).toBeLessThanOrEqual(BUBBLE_MAX_CHARS)
      }
    }
  })

  it('greetings fit a bubble with the longest name', () => {
    const longest = REGULAR_IDS.map(id => REGULAR_TEXT[id].name).reduce((a, b) => (b.length > a.length ? b : a))
    expect(GREETINGS).toHaveLength(5)
    for (const text of GREETINGS) expect(t('greetingLine', { name: longest, text }).length, text).toBeLessThanOrEqual(BUBBLE_MAX_CHARS)
  })

  it('every VIP has a name, a role, a title and two lines, each line at most 60 characters', () => {
    for (const id of VIP_IDS) {
      const { name, role, title, arrive, thanks } = VIP_TEXT[id]
      for (const field of [name, role, title]) expect(field, id).not.toBe('')
      for (const line of [arrive, thanks]) {
        expect(line, id).not.toBe('')
        expect(line.length, line).toBeLessThanOrEqual(BUBBLE_MAX_CHARS)
      }
    }
  })

  it('gives every star a name, a role, a song, an arrival line and a thanks within two bubble lines', () => {
    expect(IDOL_IDS).toEqual(['sontung', 'taylor', 'gd', 'jennie', 'hieuthuhai', 'weeknd', 'taeyang', 'bieber', 'daesung'])
    for (const id of IDOL_IDS) {
      const { name, role, song, arrive, thanks } = IDOL_TEXT[id]
      for (const field of [name, role, song, arrive, thanks]) expect(field, id).not.toBe('')
      for (const line of [arrive, thanks, `♪ ${song} ♪`]) expect(line.length, line).toBeLessThanOrEqual(BUBBLE_MAX_CHARS)
    }
  })

  it('fills the recipe bench strings', () => {
    expect(t('benchMix', { money: formatMoney(RECIPE_TRY_COST) })).toBe('Pha thử · 20.000 đ')
    expect(t('benchRight', { n: 2 })).toBe('Đúng 2 món')
    expect(t('benchRepeat', { n: 1 })).toBe('Chén này pha rồi: đúng 1 món')
    expect(t('benchSolved', { name: t('serviceSteam') })).toBe('Đúng cả 3 món! Giờ mở được Xông lá.')
    expect(t('benchTry', { n: 2 })).toBe('đúng 2/3')
  })

  it('the steam recipe hints name Lá bưởi and Sả, each line at most 60 characters', () => {
    const hints = RECIPE_HINT_TEXT.steam
    expect(Object.keys(hints).sort()).toEqual(['lemongrass', 'pomelo'])
    for (const line of Object.values(hints)) expect(line.length, line).toBeLessThanOrEqual(BUBBLE_MAX_CHARS)
  })
})
