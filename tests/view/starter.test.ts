import { describe, expect, it, vi } from 'vitest'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import { STARTER_GOAL_IDS, type StarterFeature, type StarterGoalId } from '../../src/sim/starter'
import { EVENT_ICON } from '../../src/view/events'
import { GOAL_ICON, goalCard, goalLine, lockedText } from '../../src/view/starter'
import { todayLine } from '../../src/view/today'

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

describe('the goal line', () => {
  it('names the current goal with its count, without one when it needs one thing, and nothing once the chain is past', () => {
    const sim = chainShop()
    expect(goalLine(sim)).toEqual({ icon: GOAL_ICON, text: 'Gội đầu cho Chú Sáu' })
    sim.starter.at = STARTER_GOAL_IDS.indexOf('serveFew')
    sim.progress.total.served = 2
    expect(goalLine(sim)?.text).toBe('Phục vụ 4 khách · 2/4')
    sim.starter.at = STARTER_GOAL_IDS.length
    sim.starter.doneDay = 3
    expect(goalLine(sim)).toBeNull()
    expect(goalLine(plainShop())).toBeNull()
  })

  it('gives way to an event, a festival or a hot day', () => {
    const sim = chainShop()
    expect(todayLine(sim)?.icon).toEqual(GOAL_ICON)
    sim.eventBook.hotUntil = 2
    expect(todayLine(sim)?.icon).toEqual(EVENT_ICON.hot)
  })
})

describe('the goal card', () => {
  const card = (goal: StarterGoalId, reward: number, opens: StarterFeature | null) => goalCard({ type: 'goalDone', goal, reward, opens })

  it('names the goal, its reward, and a button it opened with a line of story', () => {
    expect(card('firstGuest', 20_000, null)).toEqual({ icon: GOAL_ICON, head: 'Xong mục tiêu', name: 'Gội đầu cho Chú Sáu', line: '+20.000 đ' })
    expect(card('serveFew', 30_000, 'build').line).toBe('+30.000 đ · Mở nút Xây dựng. Có tiền rồi thì sắm đồ cho tiệm đẹp hơn!')
    expect(card('serveMany', 50_000, null).line).toBe('+50.000 đ')
  })

  it('names the mask gift, or the opening price paid back, and the Dịch vụ button', () => {
    expect(card('serveMore', 0, 'services').line).toBe('Quà khai trương: mở Đắp mặt nạ, tặng 1 giường mặt nạ · Mở nút Dịch vụ. Tiệm đông rồi, làm thêm món mới cho khách chọn thôi!')
    expect(card('serveMore', 200_000, null).line).toBe('+200.000 đ · Quà khai trương: trả lại tiền mở Đắp mặt nạ, tặng 1 giường mặt nạ')
  })
})
