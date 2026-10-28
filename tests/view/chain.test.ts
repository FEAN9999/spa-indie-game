import { describe, expect, it } from 'vitest'
import { C } from '../../src/art/palette'
import { VIP_TEXT } from '../../src/strings/vips'
import { closingCard, noTechCard, placeName, signedMoney, vipCallCard } from '../../src/view/chain'

describe('place names', () => {
  it('names the main shop and the beach', () => {
    expect(placeName(null)).toBe('Tiệm gốc')
    expect(placeName('beach')).toBe('Bãi biển')
  })
})

describe('signed money', () => {
  it('puts a plus before a profit only', () => {
    expect(signedMoney(120_000)).toBe('+120.000 đ')
    expect(signedMoney(0)).toBe('0 đ')
    expect(signedMoney(-40_000)).toBe('-40.000 đ')
  })
})

describe('the closing card', () => {
  it('sends the owner home, pictured, and says the staff finish the customers left', () => {
    expect(closingCard('beach', true)).toEqual({
      kicker: '20:00 · Bãi biển',
      title: 'Đóng cửa rồi',
      lines: ['Chủ tiệm về tiệm gốc kiểm sổ.', 'Nhân viên chi nhánh làm nốt khách còn lại.'],
      buttons: ['Về tiệm gốc'],
      figure: { kind: 'owner' },
    })
  })

  it('leaves out the staff line at a branch with no technician, whose customers leave quietly', () => {
    expect(closingCard('beach', false).lines).toEqual(['Chủ tiệm về tiệm gốc kiểm sổ.'])
  })
})

describe('the VIP call', () => {
  it('names and pictures the VIP who came to the main shop, going back first', () => {
    expect(vipCallCard('singer')).toEqual({
      kicker: 'Tiệm gốc · khách VIP',
      title: `${VIP_TEXT.singer.name} đã đến tiệm gốc`,
      lines: ['Chỉ chủ tiệm mới làm được. Chị chờ được một lúc, quá lâu thì chị về.'],
      buttons: ['Về ngay', 'Ở lại'],
      figure: { kind: 'vip', vip: 'singer' },
    })
    expect(vipCallCard('chef').figure).toEqual({ kind: 'vip', vip: 'chef' })
  })
})

describe('the no-technician notice', () => {
  it('says where to hire, quietly, with the staff icon on a mustard disc', () => {
    expect(noTechCard('beach')).toEqual({
      icon: { texture: 'icon-staff', disc: C.mustard },
      head: 'Chi nhánh Bãi biển',
      name: 'Chưa có thợ',
      line: 'Vào Nhân viên để thuê người. Lúc chủ tiệm vắng mà chưa có thợ, tiệm treo biển Tạm nghỉ.',
      quiet: true,
    })
  })
})
