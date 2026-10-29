import { describe, expect, it } from 'vitest'
import { BADGES, BADGE_IDS, badgeEarned, badgeProgress, newBadges, type BadgeId, type BadgeShop } from '../../src/sim/badges'
import { zeroShop } from './helpers'

/** Each badge with a shop just short of it and a shop that just reaches it. */
const EDGES: Record<BadgeId, [Partial<BadgeShop>, Partial<BadgeShop>]> = {
  served100: [{ served: 99 }, { served: 100 }],
  served1000: [{ served: 999 }, { served: 1000 }],
  goldHands: [{ owner3: 49 }, { owner3: 50 }],
  busyDay: [{ bestServed: 24 }, { bestServed: 25 }],
  cleanDay: [{ cleanDay: false }, { cleanDay: true }],
  firstCard: [{ members: 0 }, { members: 1 }],
  fullBook: [{ fullHearts: 7 }, { fullHearts: 8 }],
  vipPhoto: [{ photos: 0 }, { photos: 1 }],
  vipBoard: [{ boardHung: false }, { boardHung: true }],
  allServices: [{ services: 5 }, { services: 6 }],
  firstRecipe: [{ recipes: 0 }, { recipes: 1 }],
  floor2: [{ floors: 1 }, { floors: 2 }],
  rooftop: [{ floors: 2 }, { floors: 3 }],
  pretty: [{ beauty: 59 }, { beauty: 60 }],
  fullCrew: [{ technicians: 6 }, { technicians: 7 }],
  masterTech: [{ masterTier: 2 }, { masterTier: 3 }],
  million: [{ money: 999_999 }, { money: 1_000_000 }],
  bigProfit: [{ bestProfit: 999_999 }, { bestProfit: 1_000_000 }],
  diligent: [{ dailies: 19 }, { dailies: 20 }],
  fullYear: [{ day: 36 }, { day: 37 }],
}

describe('Đủ món', () => {
  it('asks for six services and any six count', () => {
    expect(BADGES.allServices.goal).toBe(6)
    expect(badgeProgress('allServices', { ...zeroShop(), services: 7 })).toEqual([6, 6])
  })
})

describe('each badge', () => {
  for (const id of BADGE_IDS) {
    it(`${id} is earned at its goal and not one short of it`, () => {
      const [short, reach] = EDGES[id]
      expect(badgeEarned(id, { ...zeroShop(), ...short })).toBe(false)
      expect(badgeEarned(id, { ...zeroShop(), ...reach })).toBe(true)
    })
  }

  it('lists twenty badges in the table order', () => {
    expect(BADGE_IDS).toHaveLength(20)
    expect(BADGE_IDS[0]).toBe('served100')
    expect(BADGE_IDS[19]).toBe('fullYear')
  })
})

describe('progress', () => {
  it('shows how far a counted badge has come, capped at its goal', () => {
    expect(badgeProgress('served100', { ...zeroShop(), served: 63 })).toEqual([63, 100])
    expect(badgeProgress('served100', { ...zeroShop(), served: 250 })).toEqual([100, 100])
    expect(badgeProgress('fullYear', { ...zeroShop(), day: 10 })).toEqual([9, 36])
    expect(badgeProgress('fullYear', { ...zeroShop(), day: 1 })).toEqual([0, 36])
  })

  it('has no ring for a badge that is not counted', () => {
    expect(badgeProgress('million', { ...zeroShop(), money: 500_000 })).toBeNull()
    expect(badgeProgress('vipPhoto', zeroShop())).toBeNull()
  })
})

describe('new badges', () => {
  it('lists only the earned ones not yet given', () => {
    expect(newBadges({ served100: 4 }, { ...zeroShop(), served: 100, money: 1_000_000 })).toEqual(['million'])
  })

  it('keeps the table order', () => {
    expect(newBadges({}, { ...zeroShop(), floors: 2, served: 100 })).toEqual(['served100', 'floor2'])
  })

  it('gives nothing to a new shop', () => {
    expect(newBadges({}, zeroShop())).toEqual([])
  })
})
