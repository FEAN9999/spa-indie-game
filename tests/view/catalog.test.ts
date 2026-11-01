import { describe, expect, it } from 'vitest'
import { placeableIn, type ShopSide } from '../../src/sim/dining'
import { ITEMS, ITEM_KINDS, type ItemGroup, type ItemKind } from '../../src/sim/items'
import type { ServiceId } from '../../src/sim/services'
import { buildTabs, catalogPage, DECOR_FILTERS, petPage, type DecorFilter } from '../../src/view/catalog'

const ALL_SERVICES: ServiceId[] = ['shampoo', 'mask', 'massage', 'steam', 'stone', 'mud', 'scrub', 'foot', 'nails', 'cupping', 'lashes', 'acupressure', 'acne']
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
      entries: [{ kind: 'bench', gift: false }, { kind: 'bambooBench', gift: false }, { kind: 'velvetSofa', gift: false }, { kind: 'rattanArmchair', gift: false }],
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

  it('shows the decor four at a time, the lotus to the jar on the third page, the new pieces after the areca', () => {
    expect(catalogPage('decor', 0, ['shampoo'], []).pages).toBe(16)
    expect(kinds(catalogPage('decor', 2, ['shampoo'], []))).toEqual(['lotus', 'vase', 'teaChest', 'jar'])
    expect(kinds(catalogPage('decor', 4, ['shampoo'], []))).toEqual(['areca', 'waterfall', 'bonsai', 'stoneLamp'])
    expect(kinds(catalogPage('decor', 10, ['shampoo'], []))).toEqual(['roundRug', 'brocadeRug', 'vanity', 'towelSteamer'])
    expect(kinds(catalogPage('decor', 11, ['shampoo'], []))).toEqual(['aromaDiffuser', 'tileRug', 'tearCalendar', 'pool'])
    expect(kinds(catalogPage('decor', 12, ['shampoo'], []))).toEqual(['lockers', 'towelCart', 'saltLamp', 'snakePlant'])
    expect(kinds(catalogPage('decor', 13, ['shampoo'], []))).toEqual(['lotusPainting', 'windChime', 'fullMirror', 'oilShelf'])
    expect(kinds(catalogPage('decor', 14, ['shampoo'], []))).toEqual(['woodTub', 'towelRack', 'yogaMat', 'eggChair'])
    expect(kinds(catalogPage('decor', 15, ['shampoo'], []))).toEqual(['flowerArch', 'outdoorShower', 'whiteParasol', 'lavender'])
  })

  it('filters the decor by set, wall pieces or rugs, a set taking its pieces from any tab', () => {
    const all = (filter: DecorFilter) => {
      const { pages } = catalogPage('decor', 0, ['shampoo'], [], filter)
      return Array.from({ length: pages }, (_, p) => kinds(catalogPage('decor', p, ['shampoo'], [], filter))).flat()
    }
    expect(DECOR_FILTERS).toEqual(['all', 'saigon', 'bamboo', 'zen', 'retro', 'garden', 'wall', 'rug'])
    expect(all('bamboo')).toEqual(['bambooBench', 'bambooTea', 'bambooShelf', 'bambooLamp', 'clayJar', 'areca'])
    expect(all('zen')).toEqual(['waterfall', 'bonsai', 'stoneLamp', 'inkBamboo', 'candleShelf', 'sedgeRug'])
    expect(all('wall')).toEqual(['inkBamboo', 'candleShelf', 'pendulumClock', 'birdCage', 'fernBasket', 'succulentShelf', 'lacquerPainting', 'rattanMirror', 'wallLantern', 'conicalHat', 'tearCalendar', 'lotusPainting', 'windChime'])
    expect(all('rug')).toEqual(['sedgeRug', 'redRug', 'grassRug', 'runnerRug', 'roundRug', 'brocadeRug', 'tileRug', 'yogaMat'])
    expect(kinds(catalogPage('decor', 0, ['shampoo'], ['silkScreen'], 'rug'))[0]).toBe('sedgeRug')
    expect(catalogPage('seat', 0, ['shampoo'], [], 'rug')).toEqual(catalogPage('seat', 0, ['shampoo'], []))
  })

  it('turns past either end to the other', () => {
    expect(catalogPage('decor', -1, ['shampoo'], [])).toEqual(catalogPage('decor', 15, ['shampoo'], []))
    expect(catalogPage('decor', 16, ['shampoo'], [])).toEqual(catalogPage('decor', 0, ['shampoo'], []))
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

  it('lists the nail desk only once Sơn móng is open', () => {
    const six = ['shampoo', 'mask', 'massage', 'steam', 'stone', 'mud'] as const
    const beds = (open: ServiceId[]) => {
      const { pages } = catalogPage('bed', 0, open, [])
      return Array.from({ length: pages }, (_, p) => kinds(catalogPage('bed', p, open, []))).flat()
    }
    expect(beds([...six, 'nails'])).toContain('nailDesk')
    expect(beds([...six])).not.toContain('nailDesk')
    expect(beds([...six, 'cupping'])).toContain('cuppingBed')
    expect(beds([...six, 'nails'])).not.toContain('cuppingBed')
    expect(beds([...six, 'lashes'])).toContain('lashBed')
    expect(beds([...six, 'cupping'])).not.toContain('lashBed')
    expect(beds([...six, 'acupressure'])).toContain('acuBed')
    expect(beds([...six, 'lashes'])).not.toContain('acuBed')
    expect(beds([...six, 'acne'])).toContain('facialBed')
    expect(beds([...six, 'acupressure'])).not.toContain('facialBed')
  })

  it('offers every kind but the gifts exactly once, shared decor once in each shop', () => {
    const shown = (groups: ItemGroup[], shop: ShopSide) =>
      groups.flatMap(g => {
        const { pages } = catalogPage(g, 0, ALL_SERVICES, [], 'all', shop)
        return Array.from({ length: pages }, (_, p) => kinds(catalogPage(g, p, ALL_SERVICES, [], 'all', shop))).flat()
      })
    const spa = shown(['bed', 'seat', 'decor'], 'spa')
    const restaurant = shown(['dining', 'decor'], 'restaurant')
    const forSale = ITEM_KINDS.filter(k => !ITEMS[k].giftOnly)
    expect([...spa].sort()).toEqual(forSale.filter(k => placeableIn(k, 'spa')).sort())
    expect([...restaurant].sort()).toEqual(forSale.filter(k => placeableIn(k, 'restaurant')).sort())
    for (const k of forSale) {
      const times = spa.filter(x => x === k).length + restaurant.filter(x => x === k).length
      expect(times, k).toBe(placeableIn(k, 'spa') && placeableIn(k, 'restaurant') ? 2 : 1)
    }
  })

  it('shows no restaurant piece on the spa decor tab', () => {
    const { pages } = catalogPage('decor', 0, ALL_SERVICES, [])
    for (let p = 0; p < pages; p++) for (const kind of kinds(catalogPage('decor', p, ALL_SERVICES, []))) expect(placeableIn(kind, 'spa'), kind).toBe(true)
  })

  it('offers the dining pieces and the shared decor at the restaurant', () => {
    expect(kinds(catalogPage('dining', 0, ALL_SERVICES, [], 'all', 'restaurant'))).toEqual(['stove', 'diningTable', 'diningChair', 'umbrellaTable'])
    expect(kinds(catalogPage('dining', 1, ALL_SERVICES, [], 'all', 'restaurant'))).toEqual(['streetTable', 'roundTable', 'plasticStool', 'bambooChair'])
    expect(kinds(catalogPage('dining', 2, ALL_SERVICES, [], 'all', 'restaurant'))).toEqual(['grillTable', 'barTable', 'lowTable', 'barStool'])
    expect(kinds(catalogPage('dining', 3, ALL_SERVICES, [], 'all', 'restaurant'))).toEqual(['foldingChair', 'floorCushion'])
    expect(catalogPage('dining', 0, ALL_SERVICES, [], 'all', 'restaurant').pages).toBe(4)
    const { pages } = catalogPage('decor', 0, ALL_SERVICES, [], 'all', 'restaurant')
    const decor = Array.from({ length: pages }, (_, p) => kinds(catalogPage('decor', p, ALL_SERVICES, [], 'all', 'restaurant'))).flat()
    expect(decor).toEqual(expect.arrayContaining(['servingCounter', 'ingredientShelf', 'sink', 'cashierCounter', 'plant', 'menuBoard', 'drinkFridge', 'icedTeaStand', 'tileRug', 'tearCalendar', 'pool', 'sunLounger', 'charcoalGrill', 'lightArch', 'gardenSwing', 'hammock', 'bananaPlant',
      'dishCabinet', 'wineJarShelf', 'karaoke', 'wallFan', 'calligraphy', 'familyPhotos', 'moneyPlant', 'danTranh']))
    for (const k of ['bed', 'bench', 'desk', 'velvetSofa', 'vanity', 'towelSteamer', 'aromaDiffuser', 'lockers', 'lotusPainting', 'oilShelf'] as const) expect(decor).not.toContain(k)
  })

  it('gives build mode the spa tabs at the spa and the dining and decor tabs at the restaurant', () => {
    expect(buildTabs('spa')).toEqual(['bed', 'seat', 'decor', 'pets'])
    expect(buildTabs('restaurant')).toEqual(['dining', 'decor'])
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
    expect(first.pages).toBe(17)
    expect(kinds(catalogPage('decor', 4, ['shampoo'], gifts))).toEqual(['bambooLamp', 'clayJar', 'areca', 'waterfall'])

    const all = ['shampoo', 'mask', 'massage'] as const
    for (const g of ['bed', 'seat', 'decor'] as ItemGroup[]) {
      const { pages } = catalogPage(g, 0, [...all], gifts)
      const entries = Array.from({ length: pages }, (_, p) => catalogPage(g, p, [...all], gifts).entries).flat()
      expect(entries.filter(e => e.gift), g).toEqual(g === 'decor' ? gifts.map(kind => ({ kind, gift: true })) : [])
      expect(entries.filter(e => ITEMS[e.kind].giftOnly && !e.gift), g).toEqual([])
    }
  })
})

describe('the Thú cưng tab', () => {
  it('shows the eight breeds on two pages', () => {
    expect(petPage([], 0)).toEqual({ entries: [{ breed: 'muop' }, { breed: 'mun' }, { breed: 'tamthe' }, { breed: 'xiem' }], page: 0, pages: 2 })
    expect(petPage([], 1).entries).toEqual([{ breed: 'chota' }, { breed: 'phuquoc' }, { breed: 'corgi' }, { breed: 'poodle' }])
  })

  it('puts the pets of the shop first, and comes round past either end', () => {
    const lu = { id: 1, breed: 'chota' as const, name: 'Lu' }
    const p = petPage([lu], -1)
    expect([p.page, p.pages]).toEqual([2, 3])
    expect(p.entries).toEqual([{ breed: 'poodle' }])
    expect(petPage([lu], 0).entries.slice(0, 2)).toEqual([{ pet: lu }, { breed: 'muop' }])
  })
})
