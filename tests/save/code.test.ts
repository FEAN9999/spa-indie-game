import { describe, expect, it } from 'vitest'
import { decodeSaveCode, encodeSaveCode } from '../../src/save/code'
import { Chain } from '../../src/sim/chain'
import { SAVE_VERSION, SaveError, type SaveData } from '../../src/sim/save'
import v1 from '../fixtures/save-v1.json'
import { busyShop, starShop } from '../sim/helpers'

describe('save codes', () => {
  it('turns a shop into a code and back', async () => {
    const d = busyShop().toSave()
    expect(await decodeSaveCode(await encodeSaveCode(d))).toEqual(d)
  })

  it("keeps a chain's branches in the code the pause card exports", async () => {
    const chain = new Chain(starShop(), 7)
    chain.open('beach')
    const back = Chain.fromSave(await decodeSaveCode(await encodeSaveCode(chain.toSave())), 8)
    expect(back.branches.map(b => b.place)).toEqual(['beach'])
  })

  it('makes a code short enough to paste in a chat', async () => {
    const code = await encodeSaveCode(busyShop().toSave())
    expect(code).toMatch(/^SPA1\.[A-Za-z0-9_-]+$/)
    expect(code.length).toBeLessThan(2000)
  })

  it('accepts a code that a chat app broke into lines and padded with spaces', async () => {
    const d = busyShop().toSave()
    const code = await encodeSaveCode(d)
    const mangled = '  ' + code.slice(0, 40) + '\n' + code.slice(40, 90) + ' \r\n' + code.slice(90) + '\n'
    expect(await decodeSaveCode(mangled)).toEqual(d)
  })

  it('rejects anything that is not a save code', async () => {
    const code = await encodeSaveCode(busyShop().toSave())
    const notAShop = await encodeSaveCode({ v: 1 } as unknown as SaveData)
    for (const bad of ['', 'hello', 'SPA1.', 'SPA1.!!!!', code.slice(0, -10), notAShop])
      await expect(decodeSaveCode(bad)).rejects.toThrow(SaveError)
  })

  it('reads a code made before owners and names', async () => {
    const d = await decodeSaveCode(await encodeSaveCode(v1 as unknown as SaveData))
    expect([d.v, d.shopName, d.profileDone, d.money]).toEqual([SAVE_VERSION, 'Tiệm Spa', false, v1.money])
  })
})
