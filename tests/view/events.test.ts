import { describe, expect, it, vi } from 'vitest'
import { C } from '../../src/art/palette'
import { VIP_WARN_MIN } from '../../src/config'
import { emptyEventBook, type EventBook, type EventPlan } from '../../src/sim/events'
import type { SimEvent } from '../../src/sim/types'
import { emptyVipBook } from '../../src/sim/vips'
import { formatMoney } from '../../src/strings/format'
import { t } from '../../src/strings/vi'
import { EVENT_ICON, eventCard, eventNote, hotCard, inspectResult, inspectRows, powerWarnText, rivalBeatenCard } from '../../src/view/events'
import { festivalStartCard } from '../../src/view/festivals'
import { clockStar, summaryNotes } from '../../src/view/vip'

// the cards name textures, and svg.ts imports Phaser for loading textures, which needs a browser
vi.mock('phaser', () => ({}))

const kol: EventPlan = { kind: 'kol', day: 13, minute: 870 }
const inspect: EventPlan = { kind: 'inspect', day: 13, minute: 900 }
const rival: EventPlan = { kind: 'rival', day: 13, minute: 0 }
const power: EventPlan = { kind: 'power', day: 13, minute: 840 }
const withPlan = (plan: EventPlan): EventBook => ({ ...emptyEventBook(), plan })

describe("tomorrow's event on the summary", () => {
  it('says what comes, and when', () => {
    expect(eventNote(kol, 4)).toBe('Ngày mai: KOL Mi Mi ghé review lúc 14:30 · được 3 sao thì 2 ngày sau khách đông hơn.')
    expect(eventNote(inspect, 4)).toBe('Ngày mai: Thanh tra vệ sinh ghé khoảng 15:00 · xem kho, khách bỏ về và độ gọn đẹp.')
    expect(eventNote(rival, 5)).toBe('Ngày mai: Spa Mới khai trương sát bên · khách khó tính ghé nhiều gấp đôi. Làm 5 khách 3 sao là giữ được khách.')
    expect(eventNote(power, 4)).toBe('Ngày mai: Cúp điện 14:00 – 16:00 · máy nghỉ 2 tiếng.')
  })

  it('is a marked note the day before only', () => {
    expect(summaryNotes(false, emptyVipBook(), withPlan(kol), 12, true, 4)).toEqual([{ text: eventNote(kol, 4), booking: true }])
    expect(summaryNotes(false, emptyVipBook(), withPlan(kol), 13, true, 4)).toEqual([])
    expect(summaryNotes(false, emptyVipBook(), withPlan(rival), 12, true, 7)).toEqual([{ text: eventNote(rival, 7), booking: true }])
  })
})

describe("the clock star for Mi Mi", () => {
  it('lights from an hour before her minute, and never for the inspector', () => {
    expect(clockStar(emptyVipBook(), withPlan(kol), 13, 870 - VIP_WARN_MIN - 1)).toBe(false)
    expect(clockStar(emptyVipBook(), withPlan(kol), 13, 870 - VIP_WARN_MIN)).toBe(true)
    expect(clockStar(emptyVipBook(), withPlan(kol), 12, 870)).toBe(false)
    expect(clockStar(emptyVipBook(), withPlan(inspect), 13, 900)).toBe(false)
  })
})

describe('event cards', () => {
  it("tells the morning's event, quietly", () => {
    expect(eventCard(kol, 4)).toEqual({
      icon: EVENT_ICON.kol,
      head: 'Hôm nay',
      name: 'KOL Mi Mi ghé review',
      line: 'Hẹn 14:30. Làm cho Mi Mi được 3 sao thì 2 ngày sau khách đông hơn.',
      quiet: true,
    })
    expect(eventCard(inspect, 4)).toMatchObject({
      icon: EVENT_ICON.inspect,
      name: 'Thanh tra vệ sinh ghé',
      line: 'Khoảng 15:00. Xem kho, khách bỏ về và độ gọn đẹp. Đạt có thưởng, chưa đạt không phạt.',
      quiet: true,
    })
    expect(eventCard(rival, 6)).toEqual({
      icon: EVENT_ICON.rival,
      head: 'Hôm nay',
      name: 'Spa Mới khai trương sát bên',
      line: 'Khách khó tính ghé nhiều gấp đôi để so hai tiệm. Làm 6 khách 3 sao là giữ được khách, có thưởng.',
      quiet: true,
    })
    expect(eventCard(power, 4)).toEqual({
      icon: EVENT_ICON.power,
      head: 'Hôm nay',
      name: 'Cúp điện 14:00 – 16:00',
      line: 'Máy nghỉ 2 tiếng. Khách đang chờ không sốt ruột, khách làm tay tip gấp rưỡi.',
      quiet: true,
    })
  })

  it('cheers the rival beaten, out loud', () => {
    expect(rivalBeatenCard({ type: 'rivalBeaten', reward: 456_000 })).toEqual({
      icon: { texture: 'heart-full', disc: C.lotus },
      head: `Giữ được khách · +${formatMoney(456_000)}`,
      name: 'Khách vẫn chọn tiệm mình!',
      line: 'Spa Mới khai trương đông mấy cũng không lấy được khách quen.',
    })
  })

  it('tells the first hot morning, quietly, and leaves the festival card loud', () => {
    expect(hotCard('kol')).toEqual({
      icon: EVENT_ICON.hot,
      head: 'Video của Mi Mi lên sóng',
      name: 'Tiệm đang hot!',
      line: 'Hôm nay và ngày mai khách tới đông hơn khoảng 1/4.',
      quiet: true,
    })
    expect(festivalStartCard({ type: 'festivalStarted', festival: 'tet', service: 'shampoo' }, 1).quiet).toBeUndefined()
  })
})

type Inspected = Extract<SimEvent, { type: 'inspected' }>
const passed: Inspected = { type: 'inspected', checks: { stock: true, calm: true, tidy: true }, low: null, lost: 0, beauty: 34, reward: 1_234_000, cert: true }
const failed = (checks: Partial<Inspected['checks']>): Inspected => ({
  ...passed,
  checks: { ...passed.checks, ...checks },
  low: checks.stock === false ? { item: 'oil', count: 3 } : null,
  lost: checks.calm === false ? 2 : 0,
  beauty: checks.tidy === false ? 21.5 : 34,
  reward: 0,
  cert: false,
})

describe('the inspection card', () => {
  it('names each check with what the inspector saw', () => {
    expect(inspectRows(passed)).toEqual([
      { name: 'Kho đủ hàng', detail: 'Món nào cũng còn từ 6 trở lên', ok: true },
      { name: 'Không ai bỏ về', detail: 'Từ sáng chưa khách nào bỏ về', ok: true },
      { name: 'Tiệm gọn đẹp', detail: 'Điểm đẹp 34, cần từ 30', ok: true },
    ])
    expect(inspectRows(failed({ stock: false, calm: false, tidy: false }))).toEqual([
      { name: 'Kho đủ hàng', detail: 'Tinh dầu chỉ còn 3', ok: false },
      { name: 'Không ai bỏ về', detail: 'Có 2 khách bỏ về', ok: false },
      { name: 'Tiệm gọn đẹp', detail: 'Điểm đẹp 21, cần từ 30', ok: false },
    ])
  })

  it('pays with the Giấy khen the first time and money after', () => {
    expect(inspectResult(passed)).toEqual({ ok: true, head: `Đạt! +${formatMoney(1_234_000)}`, line: 'Lần đầu đạt: tặng món trang trí Giấy khen' })
    expect(inspectResult({ ...passed, cert: false }).line).toBe('Thưởng bằng hai nhiệm vụ ngày')
  })

  it("says it is no fine, with the first failed check's hint", () => {
    expect(inspectResult(failed({ stock: false, calm: false }))).toEqual({ ok: false, head: 'Chưa đạt · không bị phạt', line: 'Lần sau nhớ nhập thêm hàng trước giờ hẹn nhé' })
    expect(inspectResult(failed({ calm: false })).line).toBe('Lần sau để ý khách đang chờ nhé')
    expect(inspectResult(failed({ tidy: false })).line).toBe('Lần sau thêm cây, tranh cho tiệm đẹp hơn nhé')
  })
})

describe('the power cut toasts', () => {
  it("names the shop's machines an hour before, lower case and in order", () => {
    expect(powerWarnText(['steam', 'stone'])).toBe('1 tiếng nữa cúp điện · máy xông lá, đá nóng sẽ nghỉ')
    expect(powerWarnText(['mud', 'steam'])).toBe('1 tiếng nữa cúp điện · máy xông lá, tắm bùn sẽ nghỉ')
  })

  it('says when it goes, when it comes back, and asks to wait', () => {
    expect(t('powerOffToast')).toBe('Cúp điện rồi · gội đầu, mặt nạ, massage vẫn làm được')
    expect(t('powerOnToast')).toBe('Có điện lại rồi')
    expect(t('powerWait')).toBe('Đang cúp điện, chờ có điện nhé')
  })

  it("names the star on a star's hot card and changes nothing else", () => {
    const kol = hotCard('kol')
    expect(hotCard('taylor')).toEqual({ ...kol, head: 'Taylor Swift đăng ảnh tiệm mình' })
  })
})
