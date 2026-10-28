import { describe, expect, it, vi } from 'vitest'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import { STARTER_GOAL_IDS, type StarterFeature, type StarterGoalId } from '../../src/sim/starter'
import { EVENT_ICON } from '../../src/view/events'
import { chainRows, GOAL_ICON, goalCard, goalLine, lockedText, starterNotes } from '../../src/view/starter'
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
    expect(card('serveMore', 0, 'services').line).toBe('Quà khai trương: mở Đắp mặt nạ, tặng 1 ghế đắp mặt nạ · Mở nút Dịch vụ. Tiệm đông rồi, làm thêm món mới cho khách chọn thôi!')
    expect(card('serveMore', 200_000, null).line).toBe('+200.000 đ · Quà khai trương: trả lại tiền mở Đắp mặt nạ, tặng 1 ghế đắp mặt nạ')
  })
})

describe('the starter chain list', () => {
  it('marks the done goals, the current one with its count, and later ones with what they give', () => {
    const sim = chainShop()
    sim.starter.at = STARTER_GOAL_IDS.indexOf('serveMore')
    sim.starter.opened.build = 1
    sim.progress.total.served = 6
    const rows = chainRows(sim)
    expect(rows).toHaveLength(11)
    expect(rows[0]).toEqual({ name: 'Gội đầu cho Chú Sáu', state: 'done', have: 1, need: 1, detail: '+20.000 đ' })
    expect(rows[2]).toMatchObject({ state: 'done', detail: '+30.000 đ · Mở nút Xây dựng' })
    expect(rows[4]).toEqual({ name: 'Phục vụ 10 khách', state: 'current', have: 6, need: 10, detail: 'Quà: Đắp mặt nạ + 1 ghế · Mở nút Dịch vụ' })
    expect(rows[7]).toMatchObject({ state: 'later', detail: '+50.000 đ · Mở nút Nhân viên' })
    expect(rows[10]).toMatchObject({ state: 'later', detail: '+100.000 đ · Mở nhiệm vụ mỗi ngày' })
  })

  it('names a button only while it is locked, or on the done goal that opened it early', () => {
    const sim = chainShop()
    sim.day = 2
    sim.starter.at = STARTER_GOAL_IDS.indexOf('serveFew')
    expect(chainRows(sim)[2].detail).toBe('+30.000 đ')
    sim.starter.at = STARTER_GOAL_IDS.indexOf('buyDecor')
    sim.starter.opened.build = 2
    expect(chainRows(sim)[2].detail).toBe('+30.000 đ')
    sim.starter.opened.build = 1
    expect(chainRows(sim)[2].detail).toBe('+30.000 đ · Mở nút Xây dựng')
  })

  it('marks every goal done once the chain is', () => {
    const sim = chainShop()
    sim.starter.at = STARTER_GOAL_IDS.length
    sim.starter.doneDay = 1
    expect(chainRows(sim).every(r => r.state === 'done')).toBe(true)
  })
})

describe('the summary notes of the starter chain', () => {
  const texts = (sim: SpaSim) => starterNotes(sim).map(n => `${n.booking ? 'teal' : 'ink'}: ${n.text}`)

  it('gives day 1 the goal, then Chú Sáu tomorrow', () => {
    const sim = chainShop()
    sim.spawnCustomer({ regular: 'sau' })
    sim.starter.at = STARTER_GOAL_IDS.indexOf('serveMore')
    sim.progress.total.served = 6
    expect(texts(sim)).toEqual(['ink: Mục tiêu: Phục vụ 10 khách (6/10)', 'teal: Ngày mai Chú Sáu ghé lại'])
  })

  it('names the button its day opens tomorrow', () => {
    const sim = chainShop()
    sim.day = 2
    sim.starter.at = STARTER_GOAL_IDS.indexOf('serveMany')
    sim.starter.opened = { build: 1, services: 2 }
    expect(texts(sim)[1]).toBe('teal: Ngày mai mở Nhân viên')
  })

  it('tells of the daily quests the day the chain is done', () => {
    const sim = chainShop()
    sim.day = 4
    sim.starter = { at: STARTER_GOAL_IDS.length, doneDay: 4, bought: 1, opened: { build: 1, services: 2, staff: 2 }, maskNext: false }
    expect(texts(sim)).toEqual(['teal: Từ mai có nhiệm vụ mỗi ngày'])
  })

  it('cheers a record day, served or profit', () => {
    const sim = chainShop()
    sim.starter = { at: STARTER_GOAL_IDS.length, doneDay: 1, bought: 1, opened: { build: 1, services: 1, staff: 1 }, maskNext: false }
    sim.day = 3
    sim.stats.served = 9
    sim.progress.life.record = { day: 3, kind: 'served' }
    expect(texts(sim)).toEqual(['ink: Kỷ lục mới: 9 khách!'])
    sim.stats.income = 350_000
    sim.progress.life.record = { day: 3, kind: 'profit' }
    expect(texts(sim)).toEqual(['ink: Kỷ lục lãi: 350.000 đ!'])
    sim.progress.life.record = { day: 2, kind: 'profit' }
    expect(texts(sim)).toEqual([])
  })

  it('gives a plain shop only its record', () => {
    const sim = plainShop()
    sim.day = 2
    sim.stats.served = 7
    sim.progress.life.record = { day: 2, kind: 'served' }
    expect(texts(sim)).toEqual(['ink: Kỷ lục mới: 7 khách!'])
  })
})
