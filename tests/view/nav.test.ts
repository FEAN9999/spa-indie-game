import { describe, expect, it } from 'vitest'
import { Chain } from '../../src/sim/chain'
import { navIds, navX } from '../../src/view/nav'
import { starShop } from '../sim/helpers'

describe('the bottom bar', () => {
  it('spreads the plates over the width, four where they were and five narrower', () => {
    expect([navX(0, 4), navX(3, 4)]).toEqual([135, 945])
    expect([navX(0, 5), navX(4, 5)]).toEqual([108, 972])
  })

  it('has four buttons below 3 stars, a fifth from 3 stars, and four at a branch with the map and no quests', () => {
    expect(navIds(new Chain(starShop(2), 7))).toEqual(['build', 'staff', 'services', 'quests'])
    const chain = new Chain(starShop(3), 7)
    expect(navIds(chain)).toEqual(['build', 'staff', 'services', 'quests', 'chain'])
    expect(chain.open('beach')).toBeNull()
    expect(chain.goTo('beach')).toBeNull()
    expect(navIds(chain)).toEqual(['build', 'staff', 'services', 'chain'])
  })
})
