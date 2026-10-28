import { describe, expect, it } from 'vitest'
import fixture from '../fixtures/run-before-quests.json'
import { runLog } from './helpers'

describe('the shop draws', () => {
  it('brings the same customers and candidates as before quests, day after day', () => {
    // From day 8 the festivals bring more customers and one more draw each on the shop's stream,
    // so only the days before the first festival can match the old recording.
    expect(runLog(7)).toEqual(fixture.slice(0, 7))
  })
})
