import { describe, expect, it } from 'vitest'
import { zeroCounts, type Quest, type QuestKind } from '../../src/sim/quests'
import { questCount, questTitle, shortMoney } from '../../src/view/quests'

const quest = (kind: QuestKind, target: number, over: Partial<Quest> = {}): Quest => ({ kind, period: 'day', service: null, target, reward: 30_000, base: 0, state: 'open', ...over })

describe('quest titles', () => {
  it('names each quest as the panel and the toast show it', () => {
    expect(questTitle(quest('serve', 10))).toBe('Phục vụ 10 khách')
    expect(questTitle(quest('earn', 12_000_000, { period: 'month' }))).toBe('Kiếm 12.000.000 đ trong tháng')
    expect(questTitle(quest('service', 3, { service: 'massage' }))).toBe('Làm 3 lượt massage')
    expect(questTitle(quest('owner3', 15, { period: 'month' }))).toBe('Tự tay làm 15 khách 3 sao trong tháng')
    expect(questTitle(quest('noWalk', 1))).toBe('Không để khách nào bỏ về')
  })
})

describe('progress numbers', () => {
  it('shortens money to k and tr, never rounding up', () => {
    expect([310_000, 699_999, 2_000_000, 1_250_000, 12_000_000].map(shortMoney)).toEqual(['310k', '699k', '2tr', '1,2tr', '12tr'])
  })

  it('shows counts as a fraction, and money quests in short money', () => {
    const t = zeroCounts()
    t.served = 4
    t.earned = 310_000
    expect(questCount(quest('serve', 10), t)).toBe('4/10')
    expect(questCount(quest('earn', 700_000), t)).toBe('310k/700k')
  })
})
