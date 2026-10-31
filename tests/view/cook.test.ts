import { describe, expect, it, vi } from 'vitest'
import { COOK_SCENE, ticketLines } from '../../src/view/cook'

// cook.ts imports Phaser for its scene parts, which needs a browser; the ticket's lines do not
vi.mock('phaser', () => ({}))

describe('cook scene parts', () => {
  it("lists the Phở ticket's four lines", () => {
    expect(ticketLines('pho', { doneness: 'tai', onion: 'lots', chili: false, extraHerb: true })).toEqual(['phoTai', 'phoOnionLots', 'phoNoChili', 'phoExtraHerb'])
    expect(ticketLines('pho', { doneness: 'chin', onion: 'little', chili: true, extraHerb: false })).toEqual(['phoChin', 'phoOnionLittle', 'phoChili', 'phoHerbLine'])
  })

  it("lists the Bánh xèo ticket's three lines", () => {
    expect(ticketLines('banhXeo', { filling: 'tom', crisp: 'vua', extraSprouts: false })).toEqual(['bxTom', 'bxVua', 'bxGiaLine'])
    expect(ticketLines('banhXeo', { filling: 'thit', crisp: 'ky', extraSprouts: true })).toEqual(['bxThit', 'bxKy', 'bxExtraGia'])
  })

  it('opens each dish in its own scene', () => {
    expect(COOK_SCENE).toEqual({ pho: 'PhoScene', banhXeo: 'BanhXeoScene', che: 'CheScene' })
  })
})
