import { expect, it, vi } from 'vitest'
// oldTown is the first src import on purpose: the art files must not depend on which of them loads first
import { oldTownRoomTexture } from '../../src/art/oldTown'
import { buildGrid } from '../../src/sim/grid'
import { shellOf } from '../../src/sim/items'
import { BRANCH_LAYOUT } from '../../src/sim/places'

vi.mock('phaser', () => ({}))

it('draws the old town room when it is the first art file loaded', () => {
  expect(oldTownRoomTexture(buildGrid(shellOf(BRANCH_LAYOUT), []))).toContain('<svg')
})
