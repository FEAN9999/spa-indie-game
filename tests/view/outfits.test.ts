import { describe, expect, it } from 'vitest'
import { OUTFIT_IDS } from '../../src/sim/outfits'
import { t } from '../../src/strings/vi'
import { OUTFIT_NAME, newOutfitHead, newOutfitMore, outfitStatus, outfitTileTag, wardrobeHead } from '../../src/view/outfits'

describe('wardrobe texts', () => {
  it('names all nine outfits', () => {
    expect(OUTFIT_IDS.map(id => t(OUTFIT_NAME[id]))).toEqual([
      'Áo bà ba',
      'Đồng phục spa',
      'Bà ba khăn rằn',
      'Áo dài xanh ngọc',
      'Áo dài hồng sen',
      'Áo dài gạch bông',
      'Áo dài hoa mai',
      'Áo dài gấm',
      'Áo dài Spa của năm',
    ])
  })

  it('heads the wardrobe with the badge count and the open outfits', () => {
    expect(wardrobeHead(9, 5)).toBe('Có 9/20 huy hiệu · mở 5/9 bộ')
  })

  it('tells the four states of an outfit', () => {
    const open = ['baba', 'uniform', 'khanran'] as const
    expect(outfitStatus('baba', 'baba', [...open], 5)).toEqual({ text: 'Đang mặc', ok: true })
    expect(outfitStatus('uniform', 'baba', [...open], 5)).toEqual({ text: 'Bấm Mặc bộ này để thay', ok: true })
    expect(outfitStatus('tile', 'baba', [...open], 9)).toEqual({ text: 'Cần 12 huy hiệu · còn 3 nữa', ok: false })
    expect(outfitStatus('year', 'baba', [...open], 9)).toEqual({ text: 'Chỉ có khi đoạt Spa của năm', ok: false })
  })

  it('tags the corner of a tile by what it asks for', () => {
    expect(outfitTileTag('baba')).toBeNull()
    expect(outfitTileTag('uniform')).toBe('Cần 2')
    expect(outfitTileTag('gam')).toBe('Cần 20')
    expect(outfitTileTag('year')).toBe('Spa của năm')
  })

  it('heads the new outfit card', () => {
    expect(newOutfitHead('teal')).toBe('Áo mới · đủ 6 huy hiệu')
    expect(newOutfitHead('year')).toBe('Áo mới · quà Spa của năm')
  })

  it('counts the other new outfits', () => {
    expect(newOutfitMore(0)).toBeNull()
    expect(newOutfitMore(2)).toBe('và 2 bộ khác trong Tủ áo')
  })
})
