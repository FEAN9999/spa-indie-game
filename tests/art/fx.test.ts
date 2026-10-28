import { describe, expect, it, vi } from 'vitest'
import { fxTextures } from '../../src/art/fx'
import { C } from '../../src/art/palette'
import { STOCK_ITEMS } from '../../src/sim/stock'

// svg.ts imports Phaser for loading textures, which needs a browser; building the SVG text does not
vi.mock('phaser', () => ({}))

describe('fx art', () => {
  it('draws an icon for every stock item', () => {
    const fx = fxTextures()
    for (const item of STOCK_ITEMS) expect(fx[`stock-${item}`], item).toBeDefined()
  })

  it("has the three event icons: Mi Mi's phone, the inspector's clipboard and the hot days' sparkle", () =>
    expect(Object.keys(fxTextures())).toEqual(expect.arrayContaining(['event-phone', 'event-clip', 'event-spark'])))

  it("has the rival's shop and the power cut's bolt, the candle with its glow, and the machines' off mark", () =>
    expect(Object.keys(fxTextures())).toEqual(expect.arrayContaining(['event-shop', 'event-bolt', 'fx-candle', 'fx-glow', 'power-off'])))

  it('has the Chuỗi map pin', () => expect(Object.keys(fxTextures())).toContain('icon-chain'))

  it("has an icon for the head of each place's pin on the map", () =>
    expect(Object.keys(fxTextures())).toEqual(expect.arrayContaining(['pin-main', 'pin-beach', 'pin-oldTown', 'pin-uptown'])))

  it("has the closing card's scooter, standing on its viewBox's origin, in the game colours", () => {
    const scooter = fxTextures()['fx-scooter']
    expect(scooter).toBeDefined()
    const [x, y, w, h] = /viewBox="([^"]+)"/.exec(scooter)![1].split(' ').map(Number)
    expect([x < 0 && x + w > 0, y < 0 && y + h >= 0]).toEqual([true, true])
    const palette = Object.values(C).map(c => c.toLowerCase())
    for (const colour of scooter.match(/#[0-9a-fA-F]{6}/g) ?? []) expect(palette).toContain(colour.toLowerCase())
  })

  it('has the heart, card and book icons', () =>
    expect(Object.keys(fxTextures())).toEqual(expect.arrayContaining(['heart-full', 'heart-empty', 'icon-card', 'icon-book'])))

  it('has the steam service badge, the herbs stock badge and the steam curls', () =>
    expect(Object.keys(fxTextures())).toEqual(expect.arrayContaining(['svc-steam', 'stock-herbs', 'fx-steam'])))

  it('has the stone and mud service badges, the mud stock badge and the stones on a back', () =>
    expect(Object.keys(fxTextures())).toEqual(expect.arrayContaining(['svc-stone', 'svc-mud', 'stock-mud', 'fx-stones'])))
})
