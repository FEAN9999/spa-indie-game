import { describe, expect, it } from 'vitest'
import { decodeSaveCode, encodeSaveCode } from '../../src/save/code'
import { FEED_MAX_POSTS } from '../../src/config'
import { Chain } from '../../src/sim/chain'
import { CUSTOMER_KINDS } from '../../src/sim/customers'
import { addPost, openFeed, REPLY_KINDS, type PostDraft } from '../../src/sim/feed'
import { commentsFor, complaintText, praiseText, strangerName } from '../../src/sim/feedText'
import { createRng } from '../../src/sim/rng'
import { SAVE_VERSION, SaveError, type SaveData } from '../../src/sim/save'
import { SERVICE_IDS } from '../../src/sim/services'
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
    expect(code.length).toBeLessThan(2250)
  })

  it('keeps a shop with a full feed of 50 posts under 10.000 characters', async () => {
    const sim = busyShop()
    openFeed(sim.feed)
    const rng = createRng(3)
    const n = (k: number) => Math.floor(rng() * k)
    for (let i = 0; i < FEED_MAX_POSTS + 5; i++) {
      const service = SERVICE_IDS[i % SERVICE_IDS.length]
      const kind = CUSTOMER_KINDS[i % CUSTOMER_KINDS.length]
      const bad = i % 3 === 0
      const face = { look: { skin: n(4), hair: n(6), hairStyle: n(6), shirt: n(8) }, kind, regular: null, vip: null, idol: null }
      const complaint = bad ? { reason: 'wait' as const, customerId: 100 + i, replies: [...REPLY_KINDS], answered: null, manager: false } : null
      const text = bad ? complaintText('wait', service, rng) : praiseText(service, kind, rng)
      const draft: PostDraft = { kind: bad ? 'complaint' : 'praise', name: strangerName(kind, rng), face, tick: false, stars: bad ? 1 : 5, text, pic: null, comments: commentsFor(bad ? 'complaint' : 'praise', [], rng), complaint, boostable: true, notify: false }
      addPost(sim.feed, draft, 10 + Math.floor(i / 3), 480 + i * 7, rng)
    }
    expect(sim.feed.posts).toHaveLength(FEED_MAX_POSTS)
    expect((await encodeSaveCode(sim.toSave())).length).toBeLessThan(10_000)
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
