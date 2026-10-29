import { describe, expect, it } from 'vitest'
import { KEEPSAKE_BEAUTY } from '../../src/config'
import { FESTIVAL_IDS, FESTIVALS } from '../../src/sim/festivals'
import { IDOLS, IDOL_IDS } from '../../src/sim/idols'
import { buildGrid, parseLayout } from '../../src/sim/grid'
import { DEFAULT_ITEMS, ITEMS, ITEM_KINDS, type Item, beautyOf, bedTile, canTurn, footprint, nextFacing, size, setProgress, shellOf, workTile } from '../../src/sim/items'
import { SPA_LAYOUT_1A } from '../../src/sim/layout'
import { t } from '../../src/strings/vi'

describe('items', () => {
  it('reads the furniture of the default shop', () => {
    expect(DEFAULT_ITEMS).toHaveLength(13)
    const at = (kind: string) => DEFAULT_ITEMS.filter(i => i.kind === kind).map(i => [i.id, i.x, i.y, i.flip])
    expect(at('bed')).toEqual([[1, 2, 2, false], [2, 4, 2, false]])
    expect(at('cabinet')).toEqual([[3, 9, 2, false]])
    expect(at('plant').map(p => [p[1], p[2]])).toEqual([[11, 5], [1, 16], [11, 16]])
    expect(at('shelf').map(p => [p[1], p[2]])).toEqual([[2, 7]])
    expect(at('lotus').map(p => [p[1], p[2]])).toEqual([[9, 7]])
    expect(at('vase').map(p => [p[1], p[2]])).toEqual([[11, 11]])
    expect(at('planter').map(p => [p[1], p[2]])).toEqual([[2, 12]])
    expect(at('bench').map(p => [p[1], p[2]])).toEqual([[2, 13]])
    expect(at('tea').map(p => [p[1], p[2]])).toEqual([[3, 15]])
    expect(at('slippers').map(p => [p[1], p[2]])).toEqual([[4, 16]])
    expect(DEFAULT_ITEMS.map(i => i.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13])
  })

  it('builds the same grid the old layout gave', () => {
    const old = parseLayout(SPA_LAYOUT_1A)
    const g = buildGrid(shellOf(SPA_LAYOUT_1A), DEFAULT_ITEMS)
    expect(g.cells).toEqual(old.cells)
    expect(g.door).toEqual(old.door)
    expect(g.seats).toEqual(old.seats)
    expect(g.beds).toEqual(old.beds)
    expect(g.works).toEqual(old.works)
    expect(g.desks).toEqual(old.desks)
    expect(g.plants).toEqual(old.plants)
    expect(g.bedSlots).toEqual(old.bedSlots)
    expect(g.decor.screen).toEqual(old.decor.screen)
    expect(Object.values(g.decor).flat()).toEqual(g.decor.screen) // the old decor kinds are items now
  })

  it("puts a flipped bed's work tile on its left", () => {
    const bed = { kind: 'bed' as const, x: 6, y: 2, flip: true, id: 9 }
    expect(workTile(bed)).toEqual({ x: 5, y: 3 })
    const g = buildGrid(shellOf(SPA_LAYOUT_1A), [bed])
    expect(g.cells[3][5]).toBe('work')
    expect(g.cells[3][6]).toBe('bed')
  })

  it('gives the mask and massage beds a work tile like a bed, and lists the beds together', () => {
    expect(workTile({ id: 9, kind: 'maskBed', x: 6, y: 2, flip: false })).toEqual({ x: 7, y: 3 })
    expect(workTile({ id: 9, kind: 'massageBed', x: 6, y: 2, flip: true })).toEqual({ x: 5, y: 3 })
    const g = buildGrid(shellOf(SPA_LAYOUT_1A), [{ id: 9, kind: 'massageBed', x: 6, y: 2, flip: true }])
    expect([g.cells[3][6], g.cells[3][5], g.beds.length, g.works.length]).toEqual(['bed', 'work', 1, 1])
    expect(ITEM_KINDS.slice(0, 3)).toEqual(['bed', 'maskBed', 'massageBed'])
    expect(ITEMS.maskBed).toMatchObject({ w: 1, h: 3, price: 350000, beauty: 0, group: 'bed' })
    expect(ITEMS.massageBed).toMatchObject({ price: 450000, name: 'itemMassageBed' })
  })

  it('gives the 2×2 steam tent its bed and work tiles by its width, either way round', () => {
    expect(ITEMS.steamTent).toEqual({ w: 2, h: 2, price: 500000, beauty: 0, group: 'bed', name: 'itemSteamTent' })
    expect(ITEM_KINDS.slice(0, 4)).toEqual(['bed', 'maskBed', 'massageBed', 'steamTent'])
    const tent = { id: 9, kind: 'steamTent' as const, x: 8, y: 8, flip: false }
    expect(footprint(tent)).toEqual([{ x: 8, y: 8 }, { x: 9, y: 8 }, { x: 8, y: 9 }, { x: 9, y: 9 }])
    expect([workTile(tent), bedTile(tent)]).toEqual([{ x: 10, y: 9 }, { x: 9, y: 9 }])
    const flipped = { ...tent, flip: true }
    expect([workTile(flipped), bedTile(flipped)]).toEqual([{ x: 7, y: 9 }, { x: 8, y: 9 }])
  })

  it('gives the 1×3 stone bed the massage bed tiles and the 2×3 mud tub a work tile beside its second row, either way round', () => {
    expect(ITEMS.stoneBed).toEqual({ w: 1, h: 3, price: 550000, beauty: 0, group: 'bed', name: 'itemStoneBed' })
    expect(ITEMS.mudTub).toEqual({ w: 2, h: 3, price: 700000, beauty: 0, group: 'bed', name: 'itemMudTub' })
    expect(ITEM_KINDS.slice(0, 6)).toEqual(['bed', 'maskBed', 'massageBed', 'steamTent', 'stoneBed', 'mudTub'])
    const stone = { id: 9, kind: 'stoneBed' as const, x: 6, y: 2, flip: false }
    const massage = { ...stone, kind: 'massageBed' as const }
    expect(footprint(stone)).toEqual(footprint(massage))
    expect([workTile(stone), bedTile(stone)]).toEqual([workTile(massage), bedTile(massage)])
    const tub = { id: 9, kind: 'mudTub' as const, x: 8, y: 8, flip: false }
    expect(footprint(tub)).toEqual([{ x: 8, y: 8 }, { x: 9, y: 8 }, { x: 8, y: 9 }, { x: 9, y: 9 }, { x: 8, y: 10 }, { x: 9, y: 10 }])
    expect([workTile(tub), bedTile(tub)]).toEqual([{ x: 10, y: 9 }, { x: 9, y: 9 }])
    const flipped = { ...tub, flip: true }
    expect([workTile(flipped), bedTile(flipped)]).toEqual([{ x: 7, y: 9 }, { x: 8, y: 9 }])
  })

  it("keeps the 1×3 beds' tiles: the customer on the second row, the work tile beside it", () => {
    for (const kind of ['bed', 'maskBed', 'massageBed'] as const) {
      const item = { id: 9, kind, x: 6, y: 2, flip: false }
      expect([workTile(item), bedTile(item)], kind).toEqual([{ x: 7, y: 3 }, { x: 6, y: 3 }])
      expect([workTile({ ...item, flip: true }), bedTile({ ...item, flip: true })], kind).toEqual([{ x: 5, y: 3 }, { x: 6, y: 3 }])
    }
  })

  it("knows every kind's price, beauty and set", () => {
    expect(ITEMS.teaChest).toMatchObject({ price: 250000, beauty: 5, set: 'saigon' })
    expect(ITEMS.areca).toMatchObject({ price: 80000, beauty: 3, set: 'bamboo' })
    expect(ITEMS.bed).toMatchObject({ price: 300000, beauty: 0 })
    expect(ITEMS.bed.set).toBeUndefined()
    expect(ITEM_KINDS.filter(k => ITEMS[k].set === 'saigon')).toHaveLength(6)
    expect(ITEM_KINDS.filter(k => ITEMS[k].set === 'bamboo')).toHaveLength(6)
  })

  it('keeps thirty free gift-only decor pieces out of the sets', () => {
    expect(ITEM_KINDS.filter(k => ITEMS[k].giftOnly)).toEqual([
      'vyPainting', 'silkScreen', 'regularsBoard', 'photoSinger', 'photoMiss', 'photoStar', 'photoChef', 'goldBoard',
      'photoIdolSontung', 'photoIdolTaylor', 'photoIdolGd', 'photoIdolJennie', 'photoIdolHieuthuhai', 'photoIdolWeeknd', 'photoIdolTaeyang', 'photoIdolBieber', 'photoIdolDaesung', 'starWall',
      'maiBranch', 'heartFrame', 'roseVase', 'starLantern', 'flowerBasket', 'xmasTree', 'certificate',
      'trophy', 'merit', 'surfboard', 'lanternString', 'orchid',
    ])
    expect(ITEMS.certificate).toEqual({ w: 1, h: 1, price: 0, beauty: 4, group: 'decor', giftOnly: true, name: 'itemCertificate' })
    expect(ITEMS.vyPainting).toEqual({ w: 1, h: 1, price: 0, beauty: 4, group: 'decor', giftOnly: true, name: 'itemVyPainting' })
    expect(ITEMS.silkScreen).toEqual({ w: 2, h: 1, price: 0, beauty: 5, group: 'decor', giftOnly: true, name: 'itemSilkScreen' })
    expect(ITEMS.regularsBoard).toEqual({ w: 2, h: 1, price: 0, beauty: 6, group: 'decor', giftOnly: true, name: 'itemRegularsBoard' })
  })

  it('makes each star photo a 1-tile gift of beauty 5 and the wall a 2-tile gift of beauty 9', () => {
    for (const id of IDOL_IDS) {
      const kind = IDOLS[id].photo
      expect(ITEMS[kind]).toEqual({ w: 1, h: 1, price: 0, beauty: 5, group: 'decor', giftOnly: true, name: `item${kind[0].toUpperCase()}${kind.slice(1)}` })
    }
    expect(ITEMS.starWall).toEqual({ w: 2, h: 1, price: 0, beauty: 9, group: 'decor', giftOnly: true, name: 'itemStarWall' })
    expect(new Set(IDOL_IDS.map(id => IDOLS[id].photo)).size).toBe(9)
  })

  it('the gold cup and the bằng khen are gift-only 1×1 decor, never sold', () => {
    expect(ITEMS.trophy).toEqual({ w: 1, h: 1, price: 0, beauty: 8, group: 'decor', giftOnly: true, name: 'itemTrophy' })
    expect(ITEMS.merit).toEqual({ w: 1, h: 1, price: 0, beauty: 5, group: 'decor', giftOnly: true, name: 'itemMerit' })
    expect(ITEM_KINDS.filter(k => ITEMS[k].group === 'decor' && !ITEMS[k].giftOnly)).not.toContain('trophy')
  })

  it("the beach's surfboard is gift-only 1×1 decor, as pretty as the jar", () => {
    expect(ITEMS.surfboard).toEqual({ w: 1, h: 1, price: 0, beauty: 3, group: 'decor', giftOnly: true, name: 'itemSurfboard' })
    expect(t(ITEMS.surfboard.name)).toBe('Ván lướt sóng')
  })

  it('the photos are one tile and the gold board two', () => {
    for (const k of ['photoSinger', 'photoMiss', 'photoStar', 'photoChef'] as const) {
      expect(ITEMS[k], k).toEqual({ w: 1, h: 1, price: 0, beauty: 4, group: 'decor', giftOnly: true, name: `item${k[0].toUpperCase()}${k.slice(1)}` })
    }
    expect(ITEMS.goldBoard).toEqual({ w: 2, h: 1, price: 0, beauty: 7, group: 'decor', giftOnly: true, name: 'itemGoldBoard' })
  })

  it('scores the default shop 21 with Sài Gòn xưa at 4 of 6', () => {
    expect(beautyOf(DEFAULT_ITEMS)).toBe(21)
    expect(setProgress(DEFAULT_ITEMS, 'saigon')).toBe(4)
    expect(setProgress(DEFAULT_ITEMS, 'bamboo')).toBe(0)
  })

  it('adds half again for a full set', () => {
    const items = [
      ...DEFAULT_ITEMS,
      { id: 100, kind: 'teaChest' as const, x: 0, y: 0, flip: false },
      { id: 101, kind: 'jar' as const, x: 0, y: 0, flip: false },
    ]
    expect(setProgress(items, 'saigon')).toBe(6)
    expect(beautyOf(items)).toBe(21 + 5 + 3 + (3 + 3 + 4 + 2 + 5 + 3) * 0.5)
    expect(beautyOf(items)).toBe(39)
  })
})

describe('keepsakes', () => {
  it('gives each festival its own gift-only 1×1 keepsake', () => {
    const kinds = FESTIVAL_IDS.map(id => FESTIVALS[id].keepsake)
    expect(new Set(kinds).size).toBe(6)
    for (const kind of kinds) {
      expect(ITEMS[kind]).toMatchObject({ w: 1, h: 1, price: 0, beauty: KEEPSAKE_BEAUTY, group: 'decor', giftOnly: true })
    }
  })
})

describe('the salt bed', () => {
  it('is a 1×3 bed listed right after the mud tub', () => {
    expect(ITEMS.scrubBed).toEqual({ w: 1, h: 3, price: 600_000, beauty: 0, group: 'bed', name: 'itemScrubBed' })
    expect(ITEM_KINDS.indexOf('scrubBed')).toBe(ITEM_KINDS.indexOf('mudTub') + 1)
  })
})

describe('the foot chair', () => {
  it('is a 1×2 bed listed right after the salt bed', () => {
    expect(ITEMS.footChair).toEqual({ w: 1, h: 2, price: 650_000, beauty: 0, group: 'bed', name: 'itemFootChair' })
    expect(ITEM_KINDS.indexOf('footChair')).toBe(ITEM_KINDS.indexOf('scrubBed') + 1)
  })
})

describe('the nail desk', () => {
  it('is a 2×2 bed listed right after the foot chair', () => {
    expect(ITEMS.nailDesk).toEqual({ w: 2, h: 2, price: 750_000, beauty: 0, group: 'bed', name: 'itemNailDesk' })
    expect(ITEM_KINDS.indexOf('nailDesk')).toBe(ITEM_KINDS.indexOf('footChair') + 1)
  })

  it('has its bed tile in the lower row beside the work tile', () => {
    const desk = { id: 1, kind: 'nailDesk', x: 4, y: 6, flip: false } as const
    expect([bedTile(desk), workTile(desk)]).toEqual([{ x: 5, y: 7 }, { x: 6, y: 7 }])
    const flipped = { ...desk, flip: true }
    expect([bedTile(flipped), workTile(flipped)]).toEqual([{ x: 4, y: 7 }, { x: 3, y: 7 }])
  })
})

describe('facings', () => {
  const bench: Item = { id: 1, kind: 'bench', x: 2, y: 13, flip: false }
  it('stands a turned piece on its side', () => {
    expect(size({ kind: 'bench', turned: true })).toEqual({ w: 1, h: 3 })
    expect(footprint({ ...bench, x: 3, y: 12, turned: true })).toEqual([{ x: 3, y: 12 }, { x: 3, y: 13 }, { x: 3, y: 14 }])
  })
  it('turns a long piece through four facings about its middle tile', () => {
    const a = nextFacing(bench)
    expect(a).toEqual({ ...bench, x: 3, y: 12, turned: true })
    const b = nextFacing(a)
    expect(b).toEqual({ ...bench, flip: true })
    expect('turned' in b).toBe(false)
    const c = nextFacing(b)
    expect(c).toEqual({ ...bench, x: 3, y: 12, flip: true, turned: true })
    expect(nextFacing(c)).toEqual(bench)
  })
  it('turns a two-tile piece back onto its own tiles', () => {
    const tea: Item = { id: 2, kind: 'tea', x: 2, y: 10, flip: false }
    expect(footprint(nextFacing(tea))).toEqual([{ x: 3, y: 9 }, { x: 3, y: 10 }])
    expect(nextFacing(nextFacing(tea))).toEqual({ ...tea, flip: true })
  })
  it('only mirrors square pieces and beds', () => {
    expect(ITEM_KINDS.filter(canTurn).sort()).toEqual(['bambooBench', 'bambooShelf', 'bambooTea', 'bench', 'cabinet', 'goldBoard', 'lotus', 'planter', 'regularsBoard', 'shelf', 'silkScreen', 'slippers', 'starWall', 'tea', 'teaChest'])
    const plant: Item = { id: 3, kind: 'plant', x: 1, y: 16, flip: false }
    expect(nextFacing(plant)).toEqual({ ...plant, flip: true })
    const bed: Item = { id: 4, kind: 'bed', x: 2, y: 2, flip: false }
    expect(nextFacing(bed)).toEqual({ ...bed, flip: true })
  })
})
