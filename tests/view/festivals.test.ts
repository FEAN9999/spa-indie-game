import { describe, expect, it, vi } from 'vitest'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import type { Quest } from '../../src/sim/quests'
import { festivalDoneCard, festivalStartCard, keepsakeLine, monthToast, todayLine } from '../../src/view/festivals'

// the cards name their keepsake's texture, and svg.ts imports Phaser for loading textures, which needs a browser
vi.mock('phaser', () => ({}))

/** A shop that has just started `day`. */
function on(day: number): SpaSim {
  const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
  sim.day = day - 1
  sim.startDay()
  return sim
}

describe("today's line", () => {
  it('shows how far the festival quest has got', () => {
    const sim = on(37)
    const q = sim.progress.monthly!
    sim.progress.total.services.shampoo += 3
    expect(todayLine(sim)).toEqual({ festival: 'tet', text: `Dịp Tết · Gội đầu 3/${q.target}` })
  })

  it('says when the festival quest is done', () => {
    const sim = on(37)
    sim.progress.monthly!.state = 'done'
    expect(todayLine(sim)?.text).toBe('Dịp Tết · đã xong nhiệm vụ lễ')
  })

  it('names only the festival service when the month has no festival quest', () => {
    const sim = on(37)
    sim.progress.monthly = { ...sim.progress.monthly!, kind: 'earn', service: null, festival: null }
    expect(todayLine(sim)?.text).toBe('Dịp Tết · món lễ Gội đầu')
  })

  it('has nothing to say outside a festival', () => {
    expect(todayLine(on(46))).toBeNull()
  })
})

const tetQuest: Quest = { kind: 'service', period: 'month', service: 'shampoo', target: 6, reward: 300_000, base: 0, state: 'done', festival: 'tet' }

describe('festival cards', () => {
  it('opens a festival with what it brings', () => {
    expect(festivalStartCard({ type: 'festivalStarted', festival: 'tet', service: 'shampoo' }, 1)).toMatchObject({
      head: 'Tháng 1 · cả tháng là dịp Tết',
      name: 'Tết tới rồi!',
      line: 'Khách đông hơn, nửa số khách gọi Gội đầu (đầu năm gội cho sạch), giá lễ cao hơn 20%.',
    })
  })

  it('says why customers ask for another service when the shop lacks the festival one', () => {
    const card = festivalStartCard({ type: 'festivalStarted', festival: 'noel', service: 'shampoo' }, 12)
    expect(card.line).toBe('Khách đông hơn, nửa số khách gọi Gội đầu, giá lễ cao hơn 20%. Tiệm chưa có Đá nóng nên khách gọi Gội đầu.')
  })

  it('hands over the keepsake the first time, and only money after', () => {
    expect(festivalDoneCard({ type: 'festivalQuestDone', quest: tetQuest, festival: 'tet', gift: true })).toMatchObject({
      head: 'Xong nhiệm vụ lễ · +300.000 đ',
      name: 'Quà lưu niệm: Cành mai',
      line: 'Đã cất vào Xây dựng, đặt đâu tùy anh.',
    })
    expect(festivalDoneCard({ type: 'festivalQuestDone', quest: tetQuest, festival: 'tet', gift: false })).toMatchObject({
      name: 'Đã có Cành mai từ trước',
      line: 'Quà lưu niệm mỗi món chỉ một lần, lần này nhận tiền thưởng.',
    })
  })
})

describe('the new month toast', () => {
  it('says the keepsake waits for next year when its festival quest was missed', () => {
    expect(monthToast({ type: 'monthStarted', month: 2, ended: 'tet' }, [])).toBe('Hết dịp Tết · Cành mai chờ dịp Tết năm sau')
  })

  it('is the plain month toast when the keepsake is owned or no festival quest was missed', () => {
    expect(monthToast({ type: 'monthStarted', month: 2, ended: 'tet' }, ['tet'])).toBe('Tháng 2: có nhiệm vụ tháng mới')
    expect(monthToast({ type: 'monthStarted', month: 4, ended: null }, [])).toBe('Tháng 4: có nhiệm vụ tháng mới')
  })
})

describe('the keepsake line on the festival quest', () => {
  it('names the keepsake, or says this time pays only money', () => {
    expect(keepsakeLine('tet', false)).toBe('Quà lưu niệm: Cành mai')
    expect(keepsakeLine('tet', true)).toBe('Đã có Cành mai · lần này chỉ tiền')
  })
})
