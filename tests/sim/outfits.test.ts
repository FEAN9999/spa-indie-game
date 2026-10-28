import { describe, expect, it } from 'vitest'
import { OUTFIT_IDS, isOutfitId, outfitNeed, unlockedOutfits } from '../../src/sim/outfits'
import { createRng } from '../../src/sim/rng'
import { parseSave } from '../../src/sim/save'
import { SpaSim } from '../../src/sim/spa'
import type { BadgeId } from '../../src/sim/badges'
import { BADGE_IDS } from '../../src/sim/badges'

const opts = () => ({ rng: createRng(1), autoSpawn: false })

/** A shop that has just started `day`, with `n` badges. */
function onDay(day: number, n = 0): SpaSim {
  const sim = new SpaSim(opts())
  giveBadges(sim, n)
  sim.day = day - 1
  sim.startDay()
  sim.drainEvents()
  return sim
}

const giveBadges = (sim: SpaSim, n: number) => {
  sim.badges = Object.fromEntries(BADGE_IDS.slice(0, n).map(id => [id, 0])) as Partial<Record<BadgeId, number>>
}

const reload = (sim: SpaSim) => SpaSim.fromSave(parseSave(structuredClone(sim.toSave())), opts())

describe('which outfits a shop has', () => {
  it('opens the bà ba at the start and the rest by badge count', () => {
    expect(unlockedOutfits(0, 0)).toEqual(['baba'])
    expect(unlockedOutfits(1, 0)).toEqual(['baba'])
    expect(unlockedOutfits(2, 0)).toEqual(['baba', 'uniform'])
    expect(unlockedOutfits(9, 0)).toEqual(['baba', 'uniform', 'khanran', 'teal', 'lotus'])
    expect(unlockedOutfits(20, 0)).toEqual(OUTFIT_IDS.filter(id => id !== 'year'))
  })

  it('gives the year dress for a win, whatever the badges', () => {
    expect(unlockedOutfits(0, 1)).toEqual(['baba', 'year'])
    expect(unlockedOutfits(25, 3)).toEqual([...OUTFIT_IDS])
  })

  it('says what each outfit asks for', () => {
    expect(outfitNeed('baba')).toBe(0)
    expect(outfitNeed('gam')).toBe(20)
    expect(outfitNeed('year')).toBe('year')
  })

  it('knows its ids', () => {
    expect(isOutfitId('teal')).toBe(true)
    expect(isOutfitId('cape')).toBe(false)
    expect(isOutfitId(3)).toBe(false)
  })
})

describe('the owner wearing outfits', () => {
  it('refuses an outfit the shop does not have', () => {
    const sim = onDay(8, 5)
    expect(sim.wearOutfit('teal')).toBe(false)
    expect(sim.ownerOutfit).toBe('baba')
    giveBadges(sim, 6)
    expect(sim.wearOutfit('teal')).toBe(true)
    expect(sim.ownerOutfit).toBe('teal')
  })

  it('announces new outfits only from day 8, until they are marked seen', () => {
    expect(onDay(5, 9).newOutfits()).toEqual([])
    const sim = onDay(8, 9)
    expect(sim.newOutfits()).toEqual(['uniform', 'khanran', 'teal', 'lotus'])
    sim.markOutfitsSeen(['lotus', 'uniform', 'khanran', 'teal'])
    expect(sim.newOutfits()).toEqual([])
    expect(sim.outfitsSeen).toEqual(['baba', 'uniform', 'khanran', 'teal', 'lotus'])
  })

  it('keeps the outfit worn and the outfits seen through a reload', () => {
    const sim = onDay(8, 9)
    sim.wearOutfit('khanran')
    sim.markOutfitsSeen(['uniform'])
    const copy = reload(sim)
    expect(copy.ownerOutfit).toBe('khanran')
    expect(copy.outfitsSeen).toEqual(['baba', 'uniform'])
  })

  it('still announces what was unseen when the shop was saved', () => {
    const sim = onDay(8, 9)
    expect(reload(sim).newOutfits()).toEqual(['uniform', 'khanran', 'teal', 'lotus'])
  })

  it('tells an old shop of every outfit once its quests open, the year dress last', () => {
    const sim = onDay(5, 20)
    sim.rank.wins = 1
    const old = reload(sim)
    expect(old.newOutfits()).toEqual([])
    old.day = 7
    old.startDay()
    old.drainEvents()
    const ids = old.newOutfits()
    expect(ids).toHaveLength(8)
    expect(ids[7]).toBe('year')
  })
})
