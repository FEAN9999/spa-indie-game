import { describe, expect, it } from 'vitest'
import fixture from '../fixtures/run-before-quests.json'
import sixFixture from '../fixtures/draws-six-services.json'
import { runLog, sixServiceLog } from './helpers'

describe('the shop draws', () => {
  it('brings the same customers and candidates as before quests, day after day', () => {
    // From day 8 the festivals bring more customers and one more draw each on the shop's stream,
    // so only the days before the first festival can match the old recording.
    expect(runLog(7)).toEqual(fixture.slice(0, 7))
  })

  it('draws the same in a 3-star chain with every old service open while Chà muối biển is not learned', () => {
    expect(sixServiceLog(4)).toEqual(sixFixture)
  })

  it('draws the same when the tuition is paid and the lesson not passed', () => {
    expect(sixServiceLog(4, c => { expect(c.main.payLesson('scrub')).toBeNull() })).toEqual(sixFixture)
  })
})
