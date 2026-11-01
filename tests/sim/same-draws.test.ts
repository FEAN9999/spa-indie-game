import { describe, expect, it } from 'vitest'
import fixture from '../fixtures/run-before-quests.json'
import sixFixture from '../fixtures/draws-six-services.json'
import sevenFixture from '../fixtures/draws-seven-services.json'
import eightFixture from '../fixtures/draws-eight-services.json'
import nineFixture from '../fixtures/draws-nine-services.json'
import restaurantFixture from '../fixtures/draws-restaurant.json'
import restaurantBunChaFixture from '../fixtures/draws-restaurant-bun-cha.json'
import tenFixture from '../fixtures/draws-ten-services.json'
import elevenFixture from '../fixtures/draws-eleven-services.json'
import restaurantGoiCuonFixture from '../fixtures/draws-restaurant-goi-cuon.json'
import twelveFixture from '../fixtures/draws-twelve-services.json'
import restaurantComTamFixture from '../fixtures/draws-restaurant-com-tam.json'
import { learnAcupressure, learnCupping, learnFoot, learnLashes, learnNails, learnScrub, restaurantLog, runLog, sixServiceLog } from './helpers'

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

  it('draws the same in a 5-star chain with every lesson up to Giác hơi learned while Nối mi is not', () => {
    expect(sixServiceLog(4, learnCupping)).toEqual(tenFixture)
  })

  it('draws the same when the Nối mi tuition is paid and the lesson not passed', () => {
    expect(sixServiceLog(4, c => { learnCupping(c); expect(c.main.payLesson('lashes')).toBeNull() })).toEqual(tenFixture)
  })

  it('draws the same in a 5-star chain with every lesson up to Nối mi learned while Bấm huyệt is not', () => {
    expect(sixServiceLog(4, learnLashes)).toEqual(elevenFixture)
  })

  it('draws the same when the Bấm huyệt tuition is paid and the lesson not passed', () => {
    expect(sixServiceLog(4, c => { learnLashes(c); expect(c.main.payLesson('acupressure')).toBeNull() })).toEqual(elevenFixture)
  })

  it('draws the same in a 5-star chain with every lesson up to Bấm huyệt learned while Lấy nhân mụn is not', () => {
    expect(sixServiceLog(4, learnAcupressure)).toEqual(twelveFixture)
  })

  it('draws the same when the Lấy nhân mụn tuition is paid and the lesson not passed', () => {
    expect(sixServiceLog(4, c => { learnAcupressure(c); expect(c.main.payLesson('acne')).toBeNull() })).toEqual(twelveFixture)
  })
})

describe('the restaurant draws', () => {
  it('seats the same diners with the same tickets and offers the same cooks while Bún chả is not bought', () => {
    expect(restaurantLog()).toEqual(restaurantFixture)
  })

  it('draws the same with Bún chả bought while Gỏi cuốn is not', () => {
    expect(restaurantLog(r => { r.buyDish('bunCha') })).toEqual(restaurantBunChaFixture)
  })

  it('draws the same with Bún chả and Gỏi cuốn bought while Cơm tấm is not', () => {
    expect(restaurantLog(r => { r.buyDish('bunCha'); r.buyDish('goiCuon') })).toEqual(restaurantGoiCuonFixture)
  })

  it('draws the same with Bún chả, Gỏi cuốn and Cơm tấm bought while Cà phê sữa đá is not', () => {
    expect(restaurantLog(r => { r.buyDish('bunCha'); r.buyDish('goiCuon'); r.buyDish('comTam') })).toEqual(restaurantComTamFixture)
  })

  it('draws differently once Cà phê sữa đá is on the menu too, with diners ordering it', () => {
    const log = restaurantLog(r => {
      for (const dish of ['bunCha', 'goiCuon', 'comTam'] as const) r.buyDish(dish)
      expect(r.buyDish('caPhe')).toBeNull()
    })
    expect(log).not.toEqual(restaurantComTamFixture)
    expect(log.diners.some(d => d.includes(':caPhe:'))).toBe(true)
  })

  it('draws differently once Cơm tấm is on the menu too, with diners ordering it', () => {
    const log = restaurantLog(r => {
      r.buyDish('bunCha')
      r.buyDish('goiCuon')
      expect(r.buyDish('comTam')).toBeNull()
    })
    expect(log).not.toEqual(restaurantGoiCuonFixture)
    expect(log.diners.some(d => d.includes(':comTam:'))).toBe(true)
  })

  it('draws differently once Gỏi cuốn is on the menu too, with diners ordering it', () => {
    const log = restaurantLog(r => {
      r.buyDish('bunCha')
      expect(r.buyDish('goiCuon')).toBeNull()
    })
    expect(log).not.toEqual(restaurantBunChaFixture)
    expect(log.diners.some(d => d.includes(':goiCuon:'))).toBe(true)
  })

  it('draws differently once Bún chả is on the menu, with diners ordering it', () => {
    const log = restaurantLog(r => {
      expect(r.buyDish('bunCha')).toBeNull()
    })
    expect(log).not.toEqual(restaurantFixture)
    expect(log.diners.some(d => d.includes(':bunCha:'))).toBe(true)
  })
})
