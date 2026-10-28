import { describe, expect, it, vi } from 'vitest'
import { createRng } from '../../src/sim/rng'
import { SpaSim } from '../../src/sim/spa'
import { EVENT_ICON } from '../../src/view/events'
import { festivalLine } from '../../src/view/festivals'
import { todayLine, todayShown } from '../../src/view/today'

// the lines name textures, and svg.ts imports Phaser for loading textures, which needs a browser
vi.mock('phaser', () => ({}))

/** A shop that has just started `day`. */
function on(day: number, prep: (sim: SpaSim) => void = () => {}): SpaSim {
  const sim = new SpaSim({ rng: createRng(1), autoSpawn: false })
  prep(sim)
  sim.day = day - 1
  sim.startDay()
  return sim
}

describe("today's line", () => {
  it('names the inspection until it is done', () => {
    const sim = on(13, s => (s.eventBook.plan = { kind: 'inspect', day: 13, minute: 900 }))
    expect(todayLine(sim)).toEqual({ icon: EVENT_ICON.inspect, text: 'Thanh tra ghé lúc 15:00' })
    sim.eventBook.inspected = true
    expect(todayLine(sim)).toBeNull()
  })

  it("follows Mi Mi's day: booked, here, then gone", () => {
    const sim = on(13, s => (s.eventBook.plan = { kind: 'kol', day: 13, minute: 870 }))
    expect(todayLine(sim)).toEqual({ icon: EVENT_ICON.kol, text: 'KOL Mi Mi hẹn 14:30' })
    const mimi = sim.spawnCustomer({ kol: true })
    expect(todayLine(sim)).toEqual({ icon: EVENT_ICON.kol, text: 'Mi Mi đang ở tiệm' })
    // gone once she is on her way out
    for (const state of ['leaving', 'exiting'] as const) {
      mimi.state = state
      expect(todayLine(sim), state).toBeNull()
    }
    sim.customers = []
    expect(todayLine(sim)).toBeNull()
  })

  it('tells the power cut before and during, then nothing, ahead of a hot day', () => {
    const sim = on(13, s => {
      s.eventBook.plan = { kind: 'power', day: 13, minute: 840 }
      s.eventBook.hotUntil = 13
    })
    sim.clock.minutes = 839
    expect(todayLine(sim)).toEqual({ icon: EVENT_ICON.power, text: 'Cúp điện 14:00 – 16:00' })
    sim.clock.minutes = 900
    expect(todayLine(sim)).toEqual({ icon: EVENT_ICON.power, text: 'Đang cúp điện · có lại lúc 16:00' })
    sim.clock.minutes = 960
    expect(todayLine(sim)?.icon).toEqual(EVENT_ICON.hot)
  })

  it("counts the rival's 3-star customers, then says they were kept", () => {
    const sim = on(13, s => (s.eventBook.plan = { kind: 'rival', day: 13, minute: 0 }))
    const target = sim.rivalTarget()
    sim.eventBook.count = 2
    expect(todayLine(sim)).toEqual({ icon: EVENT_ICON.rival, text: `Giữ khách · 2/${target} khách 3 sao` })
    sim.eventBook.count = target
    expect(todayLine(sim)).toEqual({ icon: EVENT_ICON.rival, text: 'Đã giữ được khách' })
  })

  it('counts the hot days down', () => {
    const hot = (s: SpaSim) => (s.eventBook.hotUntil = 14)
    expect(todayLine(on(13, hot))).toEqual({ icon: EVENT_ICON.hot, text: 'Đang hot · còn 2 ngày' })
    expect(todayLine(on(14, hot))).toEqual({ icon: EVENT_ICON.hot, text: 'Đang hot · còn hôm nay' })
  })

  it('puts an event before the festival, and the festival before a hot day', () => {
    const festive = on(38, s => (s.eventBook.hotUntil = 39))
    expect(todayLine(festive)).toEqual(festivalLine(festive))
    festive.eventBook.plan = { kind: 'inspect', day: 38, minute: 900 }
    expect(todayLine(festive)?.icon).toEqual(EVENT_ICON.inspect)
  })

  it('has nothing to say on a plain day', () => {
    expect(todayLine(on(13))).toBeNull()
  })
})

describe("today's line on screen", () => {
  it('hides while a panel covers the shop and once the day is over', () => {
    const sim = on(37)
    expect(todayShown(sim, false)).toEqual(todayLine(sim))
    expect(todayShown(sim, true)).toBeNull()
    sim.dayOver = true
    expect(todayShown(sim, false)).toBeNull()
  })

  it('never shows at a branch, whose day has no festival or event', () => {
    const main = on(38)
    expect(todayShown(main, false)).not.toBeNull()
    expect(todayShown(SpaSim.newBranch('beach', main, createRng(2)), false)).toBeNull()
  })
})
