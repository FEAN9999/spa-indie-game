import { describe, expect, it } from 'vitest'
import fixture from '../fixtures/run-before-quests.json'
import { runLog } from './helpers'

describe('the shop draws', () => {
  it('brings the same customers and candidates as before quests, day after day', () => {
    expect(runLog()).toEqual(fixture)
  })
})
