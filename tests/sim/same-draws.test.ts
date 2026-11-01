import { describe, expect, it } from 'vitest'
import fixture from '../fixtures/run-before-quests.json'
import sixFixture from '../fixtures/draws-six-services.json'
import sevenFixture from '../fixtures/draws-seven-services.json'
import eightFixture from '../fixtures/draws-eight-services.json'
import nineFixture from '../fixtures/draws-nine-services.json'
import { learnFoot, learnNails, learnScrub, runLog, sixServiceLog } from './helpers'

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

  it('draws the same in a 4-star chain with Chà muối biển learned while Ngâm chân is not', () => {
    expect(sixServiceLog(4, learnScrub)).toEqual(sevenFixture)
  })

  it('draws the same when the Ngâm chân tuition is paid and the lesson not passed', () => {
    expect(sixServiceLog(4, c => { learnScrub(c); expect(c.main.payLesson('foot')).toBeNull() })).toEqual(sevenFixture)
  })

  it('draws the same in a 5-star chain with Chà muối biển and Ngâm chân learned while Sơn móng is not', () => {
    expect(sixServiceLog(4, learnFoot)).toEqual(eightFixture)
  })

  it('draws the same when the Sơn móng tuition is paid and the lesson not passed', () => {
    expect(sixServiceLog(4, c => { learnFoot(c); expect(c.main.payLesson('nails')).toBeNull() })).toEqual(eightFixture)
  })

  it('draws the same in a 5-star chain with Chà muối biển, Ngâm chân and Sơn móng learned while Giác hơi is not', () => {
    expect(sixServiceLog(4, learnNails)).toEqual(nineFixture)
  })

  it('draws the same when the Giác hơi tuition is paid and the lesson not passed', () => {
    expect(sixServiceLog(4, c => { learnNails(c); expect(c.main.payLesson('cupping')).toBeNull() })).toEqual(nineFixture)
  })
})
