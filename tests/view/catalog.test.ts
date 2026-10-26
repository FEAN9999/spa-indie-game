import { describe, expect, it } from 'vitest'
import { ITEM_KINDS, type ItemGroup } from '../../src/sim/items'
import { catalogPage } from '../../src/view/catalog'

describe('build mode catalogue', () => {
  it('fits the beds and the seats on one page each', () => {
    expect(catalogPage('bed', 0, ['shampoo'])).toEqual({ kinds: ['bed'], page: 0, pages: 1 })
    expect(catalogPage('bed', 0, ['shampoo', 'mask'])).toEqual({ kinds: ['bed', 'maskBed'], page: 0, pages: 1 })
    expect(catalogPage('seat', 0, ['shampoo'])).toEqual({ kinds: ['bench', 'bambooBench'], page: 0, pages: 1 })
  })

  it('lists only the beds of services that are open', () => {
    expect(catalogPage('bed', 0, ['shampoo']).kinds).toEqual(['bed'])
    expect(catalogPage('bed', 0, ['shampoo', 'mask']).kinds).toEqual(['bed', 'maskBed'])
  })

  it('shows the decor four at a time, the tea chest and the jar on the third page', () => {
    expect(catalogPage('decor', 0, ['shampoo']).pages).toBe(4)
    expect(catalogPage('decor', 2, ['shampoo']).kinds).toEqual(['teaChest', 'jar', 'bambooTea', 'bambooShelf'])
    expect(catalogPage('decor', 3, ['shampoo']).kinds).toEqual(['bambooLamp', 'clayJar', 'areca'])
  })

  it('turns past either end to the other', () => {
    expect(catalogPage('decor', -1, ['shampoo'])).toEqual(catalogPage('decor', 3, ['shampoo']))
    expect(catalogPage('decor', 4, ['shampoo'])).toEqual(catalogPage('decor', 0, ['shampoo']))
  })

  it('offers every kind exactly once', () => {
    const shown = (['bed', 'seat', 'decor'] as ItemGroup[]).flatMap(g => {
      const all = ['shampoo', 'mask', 'massage'] as const
      const { pages } = catalogPage(g, 0, [...all])
      return Array.from({ length: pages }, (_, p) => catalogPage(g, p, [...all]).kinds).flat()
    })
    expect([...shown].sort()).toEqual([...ITEM_KINDS].sort())
  })
})
