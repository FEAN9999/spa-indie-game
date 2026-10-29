import { describe, expect, it } from 'vitest'
import { ITEMS, ITEM_KINDS, type ItemGroup, type ItemKind } from '../../src/sim/items'
import type { ServiceId } from '../../src/sim/services'
import { catalogPage } from '../../src/view/catalog'

const kinds = (p: ReturnType<typeof catalogPage>) => p.entries.map(e => e.kind)

describe('build mode catalogue', () => {
  it('fits the beds and the seats on one page each', () => {
    expect(catalogPage('bed', 0, ['shampoo'], [])).toEqual({ entries: [{ kind: 'bed', gift: false }], page: 0, pages: 1 })
    expect(catalogPage('bed', 0, ['shampoo', 'mask'], [])).toEqual({
      entries: [{ kind: 'bed', gift: false }, { kind: 'maskBed', gift: false }],
      page: 0,
      pages: 1,
    })
    expect(catalogPage('seat', 0, ['shampoo'], [])).toEqual({
      entries: [{ kind: 'bench', gift: false }, { kind: 'bambooBench', gift: false }],
      page: 0,
      pages: 1,
    })
  })

  it('lists only the beds of services that are open', () => {
    expect(kinds(catalogPage('bed', 0, ['shampoo'], []))).toEqual(['bed'])
    expect(kinds(catalogPage('bed', 0, ['shampoo', 'mask'], []))).toEqual(['bed', 'maskBed'])
  })

  it('lists the steam tent only once Xông lá is open', () => {
    expect(kinds(catalogPage('bed', 0, ['shampoo', 'mask', 'massage'], []))).toEqual(['bed', 'maskBed', 'massageBed'])
    expect(kinds(catalogPage('bed', 0, ['shampoo', 'mask', 'massage', 'steam'], []))).toEqual(['bed', 'maskBed', 'massageBed', 'steamTent'])
  })

  it('shows the decor four at a time, the tea chest and the jar on the third page', () => {
    expect(catalogPage('decor', 0, ['shampoo'], []).pages).toBe(4)
    expect(kinds(catalogPage('decor', 2, ['shampoo'], []))).toEqual(['teaChest', 'jar', 'bambooTea', 'bambooShelf'])
    expect(kinds(catalogPage('decor', 3, ['shampoo'], []))).toEqual(['bambooLamp', 'clayJar', 'areca'])
  })

  it('turns past either end to the other', () => {
    expect(catalogPage('decor', -1, ['shampoo'], [])).toEqual(catalogPage('decor', 3, ['shampoo'], []))
    expect(catalogPage('decor', 4, ['shampoo'], [])).toEqual(catalogPage('decor', 0, ['shampoo'], []))
  })

  it('lists the stone bed only once Đá nóng is open, and the mud tub only once Tắm bùn is', () => {
    const base = ['shampoo', 'mask', 'massage', 'steam'] as const
    const beds = (open: ServiceId[]) => {
      const { pages } = catalogPage('bed', 0, open, [])
      return Array.from({ length: pages }, (_, p) => kinds(catalogPage('bed', p, open, []))).flat()
    }
    expect(beds([...base])).toEqual(['bed', 'maskBed', 'massageBed', 'steamTent'])
    expect(beds([...base, 'stone'])).toEqual(['bed', 'maskBed', 'massageBed', 'steamTent', 'stoneBed'])
    expect(beds([...base, 'mud'])).toEqual(['bed', 'maskBed', 'massageBed', 'steamTent', 'mudTub'])
    expect(beds([...base, 'stone', 'mud'])).toEqual(['bed', 'maskBed', 'massageBed', 'steamTent', 'stoneBed', 'mudTub'])
  })

  it('lists the salt bed only once Chà muối biển is open', () => {
    const six = ['shampoo', 'mask', 'massage', 'steam', 'stone', 'mud'] as const
    const beds = (open: ServiceId[]) => {
      const { pages } = catalogPage('bed', 0, open, [])
      return Array.from({ length: pages }, (_, p) => kinds(catalogPage('bed', p, open, []))).flat()
    }
    expect(beds([...six, 'scrub'])).toContain('scrubBed')
    expect(beds([...six])).not.toContain('scrubBed')
  })

  it('lists the foot chair only once Ngâm chân thảo mộc is open', () => {
    const six = ['shampoo', 'mask', 'massage', 'steam', 'stone', 'mud'] as const
    const beds = (open: ServiceId[]) => {
      const { pages } = catalogPage('bed', 0, open, [])
      return Array.from({ length: pages }, (_, p) => kinds(catalogPage('bed', p, open, []))).flat()
    }
    expect(beds([...six, 'foot'])).toContain('footChair')
    expect(beds([...six])).not.toContain('footChair')
  })

  it('offers every kind but the gifts exactly once', () => {
    const shown = (['bed', 'seat', 'decor'] as ItemGroup[]).flatMap(g => {
      const all = ['shampoo', 'mask', 'massage', 'steam', 'stone', 'mud', 'scrub', 'foot'] as const
      const { pages } = catalogPage(g, 0, [...all], [])
      return Array.from({ length: pages }, (_, p) => kinds(catalogPage(g, p, [...all], []))).flat()
    })
    expect([...shown].sort()).toEqual(ITEM_KINDS.filter(k => !ITEMS[k].giftOnly).sort())
  })

  it('shows a gift bed first on the bed tab, not on the decor tab', () => {
    expect(catalogPage('bed', 0, ['shampoo', 'mask'], ['maskBed']).entries[0]).toEqual({ kind: 'maskBed', gift: true })
    expect(kinds(catalogPage('decor', 0, ['shampoo', 'mask'], ['maskBed']))).not.toContain('maskBed')
  })

  it('shows pending gifts first on the decor tab and never the gift-only kinds otherwise', () => {
    const gifts: ItemKind[] = ['silkScreen', 'vyPainting']
    const first = catalogPage('decor', 0, ['shampoo'], gifts)
    expect(first.entries).toEqual([
      { kind: 'silkScreen', gift: true },
      { kind: 'vyPainting', gift: true },
      { kind: 'plant', gift: false },
      { kind: 'tea', gift: false },
    ])
    expect(first.pages).toBe(5)
    expect(kinds(catalogPage('decor', 4, ['shampoo'], gifts))).toEqual(['areca'])

    const all = ['shampoo', 'mask', 'massage'] as const
    for (const g of ['bed', 'seat', 'decor'] as ItemGroup[]) {
      const { pages } = catalogPage(g, 0, [...all], gifts)
      const entries = Array.from({ length: pages }, (_, p) => catalogPage(g, p, [...all], gifts).entries).flat()
      expect(entries.filter(e => e.gift), g).toEqual(g === 'decor' ? gifts.map(kind => ({ kind, gift: true })) : [])
      expect(entries.filter(e => ITEMS[e.kind].giftOnly && !e.gift), g).toEqual([])
    }
  })
})
