import { describe, expect, it } from 'vitest'
import { cleanShopName, suggestShopName } from '../../src/sim/profile'
import { createRng } from '../../src/sim/rng'
import { SHOP_NAME_IDEAS } from '../../src/strings/vi'

describe('shop names', () => {
  it('trims and squeezes spaces', () => expect(cleanShopName('  Spa   Hoa  Sen ', 'X')).toBe('Spa Hoa Sen'))
  it('stores marks typed as separate characters as single letters', () =>
    expect(cleanShopName('Spa Hoà Bình Ặ'.normalize('NFD'), 'X')).toBe('Spa Hoà Bình Ặ'.normalize('NFC')))
  it('keeps at most 24 letters', () => expect(cleanShopName('Spa Thảo Mộc Hương Quê Nhà Mình', 'X')).toBe('Spa Thảo Mộc Hương Quê N'))
  it('uses the fallback for an empty name', () => expect(cleanShopName(' \n ', 'Tiệm Spa')).toBe('Tiệm Spa'))
  it('has ideas that fit as they are', () => {
    for (const n of SHOP_NAME_IDEAS) expect(cleanShopName(n, 'X')).toBe(n)
  })
  it('suggests another idea than the current one', () => {
    const rng = createRng(4)
    for (const current of [...SHOP_NAME_IDEAS, ...SHOP_NAME_IDEAS]) {
      const s = suggestShopName(rng, current)
      expect(SHOP_NAME_IDEAS).toContain(s)
      expect(s).not.toBe(current)
    }
  })
})
