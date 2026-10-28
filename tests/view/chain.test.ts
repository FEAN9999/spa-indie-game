import { describe, expect, it } from 'vitest'
import { C } from '../../src/art/palette'
import { DAY_END_MIN } from '../../src/config'
import { Chain } from '../../src/sim/chain'
import { VIP_TEXT } from '../../src/strings/vips'
import { closingCard, mapSub, noTechCard, pinLabel, pinState, placeName, sheetOf, signedMoney, unlockCard, vipCallCard } from '../../src/view/chain'
import { hireStaff, starShop } from '../sim/helpers'

/** A 3-star main shop with `money` in the purse and 1.840.000 đ made today; the owner is there. */
const atMain = (money = 6_000_000, stars: 3 | 4 | 5 = 3) => {
  const chain = new Chain(starShop(stars, money), 7)
  chain.main.stats.income = 1_840_000
  return chain
}

/** The same with the beach open, whose price leaves 1.000.000 đ in the purse. */
const withBeach = () => {
  const chain = atMain()
  expect(chain.open('beach')).toBeNull()
  return { chain, beach: chain.shop('beach')! }
}

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

describe('the map pins', () => {
  it('shows the owner at the main shop, the beach to open and the next places locked at 3 stars', () => {
    const chain = atMain()
    expect([pinState(chain, null), pinLabel(chain, null)]).toEqual(['here', '+1.840.000 đ hôm nay'])
    expect([pinState(chain, 'beach'), pinLabel(chain, 'beach')]).toEqual(['can', 'Mở được · 5.000.000 đ'])
    expect([pinState(chain, 'oldTown'), pinLabel(chain, 'oldTown')]).toEqual(['lock', 'Cần 4★ · 8.000.000 đ'])
    expect([pinState(chain, 'uptown'), pinLabel(chain, 'uptown')]).toEqual(['lock', 'Cần 5★ · 12.000.000 đ'])
  })

  it('keeps the beach to open, button off, while the purse is short', () => {
    expect(pinState(atMain(4_000_000), 'beach')).toBe('can')
  })

  it("labels an open branch with its profit today, or Tạm nghỉ while it has no technician", () => {
    const { chain, beach } = withBeach()
    expect([pinState(chain, 'beach'), pinLabel(chain, 'beach')]).toEqual(['open', 'Tạm nghỉ'])
    hireStaff(beach, 'technician')
    beach.stats.income = 300_000
    expect(pinLabel(chain, 'beach')).toBe('+300.000 đ hôm nay')
  })

  it('puts the owner on the branch she went to, and rests the main shop she left with no technician', () => {
    const { chain } = withBeach()
    chain.goTo('beach')
    expect([pinState(chain, 'beach'), pinState(chain, null)]).toEqual(['here', 'open'])
    expect(pinLabel(chain, null)).toBe('Tạm nghỉ')
    hireStaff(chain.main, 'technician')
    expect(pinLabel(chain, null)).toBe('+1.840.000 đ hôm nay')
  })

  it('shows the places of the next release as coming soon once the stars are there', () => {
    const chain = atMain(20_000_000, 5)
    expect([pinState(chain, 'oldTown'), pinLabel(chain, 'oldTown')]).toEqual(['soon', 'Sắp có'])
    expect([pinState(chain, 'uptown'), pinLabel(chain, 'uptown')]).toEqual(['soon', 'Sắp có'])
  })
})

describe('the map subtitle', () => {
  it("gives the main shop's stars and how many of the four shops are open", () => {
    expect(mapSub(atMain())).toBe('Tiệm gốc 3★ · 1/4 tiệm')
    expect(mapSub(withBeach().chain)).toBe('Tiệm gốc 3★ · 2/4 tiệm')
  })
})

describe('the sheet under the map', () => {
  it('offers the beach with its own customers, its prices and its room', () => {
    expect(sheetOf(atMain(), 'beach')).toEqual({
      title: 'Bãi biển',
      status: 'Mở được · tiệm gốc đang 3★',
      rows: ['Khách riêng: Khách du lịch · lượng khách ×1,2', 'Giá dịch vụ ×1,0', '1 tầng, bày sẵn như tiệm ngày đầu, thêm ván lướt sóng.'],
      button: { text: 'Mở chi nhánh · 5.000.000 đ', on: true },
      short: null,
      warn: null,
    })
  })

  it('turns the button off and says what is missing while the purse is short', () => {
    const sheet = sheetOf(atMain(4_000_000), 'beach')
    expect(sheet.button).toEqual({ text: 'Mở chi nhánh · 5.000.000 đ', on: false })
    expect(sheet.short).toBe('Còn thiếu 1.000.000 đ')
  })

  it("tells an open branch's day, staff and stock, and goes there until closing time", () => {
    const { chain } = withBeach()
    const sheet = sheetOf(chain, 'beach')
    expect(sheet.status).toBe('Tạm nghỉ · chưa có thợ')
    expect(sheet.rows).toEqual(expect.arrayContaining(['Hôm nay: 0 khách · 0 bỏ về', 'Lãi hôm nay: 0 đ', '0/3 thợ · 0/1 lễ tân', 'Kho đủ']))
    expect(sheet.button).toEqual({ text: 'Đến tiệm', on: true })
    chain.main.clock.minutes = DAY_END_MIN
    expect(sheetOf(chain, 'beach').button).toEqual({ text: 'Đã đóng cửa', on: false })
  })

  it('counts the customers lost, the staff and what runs low at an open branch', () => {
    const { chain, beach } = withBeach()
    hireStaff(beach, 'technician')
    beach.stats.served = 9
    beach.stats.angry = 1
    beach.stats.walkedAway = 1
    beach.stock.shampoo = 3
    const sheet = sheetOf(chain, 'beach')
    expect(sheet.status).toBe('Đang mở')
    expect(sheet.rows).toEqual(expect.arrayContaining(['Hôm nay: 9 khách · 2 bỏ về', '1/3 thợ · 0/1 lễ tân', 'Kho sắp hết: dầu gội']))
  })

  it('says the owner is already at the branch she is in', () => {
    const { chain } = withBeach()
    chain.goTo('beach')
    expect(sheetOf(chain, 'beach').button).toEqual({ text: 'Chủ tiệm đang ở đây', on: false })
  })

  it('warns that the customers of a shop with no technician leave if the owner goes', () => {
    const { chain, beach } = withBeach()
    chain.goTo('beach')
    for (let i = 0; i < 3; i++) beach.spawnCustomer({ kind: 'office', service: 'shampoo' })
    expect(sheetOf(chain, null).warn).toBe('Rời Bãi biển: 3 khách đang chờ sẽ về, không đánh giá')
    hireStaff(beach, 'technician')
    expect(sheetOf(chain, null).warn).toBeNull()
  })

  it("gives the main shop's rank, its day and its staff", () => {
    expect(sheetOf(atMain(), null)).toEqual({
      title: 'Tiệm gốc',
      status: 'Hạng 3★ · đủ các kiểu khách',
      rows: ['Hôm nay: 0 khách · 0 bỏ về', 'Lãi hôm nay: +1.840.000 đ', '0/3 thợ · 0/1 lễ tân', 'Kho đủ'],
      button: { text: 'Chủ tiệm đang ở đây', on: false },
      short: null,
      warn: null,
    })
  })

  it('locks a place until the main shop has its stars, then says it is coming', () => {
    expect(sheetOf(atMain(), 'oldTown')).toEqual({
      title: 'Phố cổ',
      status: 'Mở khi tiệm gốc đạt 4★ · 8.000.000 đ',
      rows: ['Giá dịch vụ ×1,2'],
      button: { text: 'Cần 4★', on: false },
      short: null,
      warn: null,
    })
    const soon = sheetOf(atMain(20_000_000, 5), 'uptown')
    expect([soon.status, soon.rows, soon.button]).toEqual(['Sắp có', ['Giá dịch vụ ×1,6'], { text: 'Sắp có', on: false }])
  })
})

describe('the unlock card', () => {
  it('opens the chain with the chain icon on a mustard disc', () => {
    expect(unlockCard()).toEqual({
      icon: { texture: 'icon-chain', disc: C.mustard },
      head: 'Tiệm gốc đạt 3★',
      name: 'Mở chuỗi spa',
      line: 'Tiệm đạt 3 sao. Giờ chủ tiệm mở được chi nhánh ở nơi khác.',
    })
  })
})
