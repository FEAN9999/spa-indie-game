import { afterEach, describe, expect, it } from 'vitest'
import {
  currentHouse,
  homeLink,
  knockAll,
  newVisitCode,
  openHouse,
  parseVisitCode,
  showVisitCode,
  visitCodeIn,
  VisitError,
  visitHouse,
  visitLink,
  type Hello,
  type JoinVisitRoom,
  type VisitProblem,
  type VisitRoom,
} from '../../src/net/visit'
import { encodeSaveCode } from '../../src/save/code'
import { emptyFriends } from '../../src/sim/friends'
import { SAVE_VERSION } from '../../src/sim/save'
import { busyShop } from '../sim/helpers'

/** Rooms by code in memory: everyone already in a room and each newcomer hear of each other once, a beat after it joins, as on the network. */
function fakeNet(onJoin?: (code: string, onError: () => void) => void) {
  const rooms = new Map<string, Map<string, VisitRoom>>()
  let next = 0
  const join: JoinVisitRoom = (code, onError) => {
    onJoin?.(code, onError)
    const peers = rooms.get(code) ?? new Map<string, VisitRoom>()
    rooms.set(code, peers)
    const id = `p${next++}`
    const room: VisitRoom = {
      onJoin: null,
      onShop: null,
      onHello: null,
      onKnock: null,
      onAnswer: null,
      sendShop: (text, peer) => void setTimeout(() => peers.get(peer)?.onShop?.(text, id)),
      sendHello: (hello, peer) => void setTimeout(() => peers.get(peer)?.onHello?.(hello, id)),
      sendKnock: peer => void setTimeout(() => peers.get(peer)?.onKnock?.(id)),
      sendAnswer: peer => void setTimeout(() => peers.get(peer)?.onAnswer?.(id)),
      leave: () => void peers.delete(id),
    }
    const before = [...peers.keys()]
    setTimeout(() => {
      for (const other of before) {
        const r = peers.get(other)
        if (!r || !peers.has(id)) continue
        r.onJoin?.(id)
        room.onJoin?.(other)
      }
    })
    peers.set(id, room)
    return room
  }
  return { join, size: (code: string) => rooms.get(code)?.size ?? 0 }
}

const problemOf = (p: Promise<unknown>): Promise<VisitProblem> =>
  p.then(
    () => {
      throw new Error('the visit should have failed')
    },
    (e: unknown) => {
      if (!(e instanceof VisitError)) throw e
      return e.problem
    },
  )

afterEach(() => currentHouse()?.close())

describe('visit codes and links', () => {
  it('makes six-character codes it reads back', () => {
    for (let i = 0; i < 50; i++) {
      const code = newVisitCode()
      expect(code).toMatch(/^[A-Z2-9]{6}$/)
      expect(parseVisitCode(code)).toBe(code)
    }
  })

  it('reads a code typed in small letters, with the dash it is shown with and stray spaces', () => {
    expect(showVisitCode('K7P2QX')).toBe('K7P-2QX')
    expect(parseVisitCode(' k7p-2qx\n')).toBe('K7P2QX')
  })

  it('refuses a code of the wrong length or with a letter it never uses', () => {
    for (const bad of ['', 'K7P2Q', 'K7P2QXA', 'K7P2Q0', 'K7P2QO', 'K7P2Q1', 'K7P2QI', 'K7P2QL', 'K7P2Q!']) expect(parseVisitCode(bad), bad).toBeNull()
  })

  it('links to the game with only the code, and back home without it', () => {
    const link = visitLink('https://fean9999.github.io/spa-indie-game/?perf#top', 'K7P2QX')
    expect(link).toBe('https://fean9999.github.io/spa-indie-game/?ghe=K7P2QX')
    expect(visitCodeIn(link)).toBe('K7P2QX')
    expect(visitCodeIn('https://fean9999.github.io/spa-indie-game/')).toBeNull()
    expect(visitCodeIn('https://fean9999.github.io/spa-indie-game/?ghe=nope')).toBeNull()
    expect(homeLink('https://fean9999.github.io/spa-indie-game/?perf=1&ghe=K7P2QX')).toBe('https://fean9999.github.io/spa-indie-game/?perf=1')
  })
})

describe('visiting a friend', () => {
  const hi = (name: string, code: string | null = null): Hello => ({ name, code })

  it("brings the host's shop over and tells the host who came, with the code to visit back", async () => {
    const net = fakeNet()
    const sim = busyShop()
    const guests: Hello[] = []
    openHouse('K7P2QX', () => sim.toSave(), h => guests.push(h), net.join)
    const shop = await visitHouse('K7P2QX', hi('Spa Lan', 'b2k-cg2'), 1000, net.join)
    expect(shop).toEqual(sim.toSave())
    await new Promise(r => setTimeout(r, 10))
    expect(guests).toEqual([{ name: 'Spa Lan', code: 'B2KCG2' }])
    // the visitor leaves the room once it has the shop; the host stays for the next friend
    expect(net.size('K7P2QX')).toBe(1)
  })

  it("sends the shop without its own code and list of friends, which stay the host's", async () => {
    const net = fakeNet()
    const sim = busyShop()
    sim.friends = { code: 'K7P2QX', open: true, list: [{ code: 'WHUURP', name: 'Tiệm Lan' }] }
    openHouse('K7P2QX', () => sim.toSave(), () => {}, net.join)
    const shop = await visitHouse('K7P2QX', hi('A'), 1000, net.join)
    expect(shop.friends).toEqual(emptyFriends())
    expect(sim.friends.list).toHaveLength(1)
  })

  it('sends the shop as it is when each friend comes', async () => {
    const net = fakeNet()
    const sim = busyShop()
    openHouse('K7P2QX', () => sim.toSave(), () => {}, net.join)
    expect((await visitHouse('K7P2QX', hi('A'), 1000, net.join)).money).toBe(123456)
    sim.money = 777
    expect((await visitHouse('K7P2QX', hi('B'), 1000, net.join)).money).toBe(777)
  })

  it('serves two friends who come at once, who never take each other for the host', async () => {
    const net = fakeNet()
    const sim = busyShop()
    const guests: string[] = []
    openHouse('K7P2QX', () => sim.toSave(), h => guests.push(h.name), net.join)
    const [a, b] = await Promise.all([visitHouse('K7P2QX', hi('A'), 1000, net.join), visitHouse('K7P2QX', hi('B'), 1000, net.join)])
    expect(a).toEqual(sim.toSave())
    expect(b).toEqual(sim.toSave())
    await new Promise(r => setTimeout(r, 10))
    expect(guests.sort()).toEqual(['A', 'B'])
  })

  it("shortens a long visitor name and drops a visitor's code that is not one", async () => {
    const net = fakeNet()
    const guests: Hello[] = []
    openHouse('K7P2QX', () => busyShop().toSave(), h => guests.push(h), net.join)
    await visitHouse('K7P2QX', hi('x'.repeat(200), 'nope'), 1000, net.join)
    await new Promise(r => setTimeout(r, 10))
    expect(guests[0].name).toHaveLength(40)
    expect(guests[0].code).toBeNull()
  })

  it('keeps one invitation per page: the same code keeps the room, another code moves to a new one, closing leaves it', async () => {
    const net = fakeNet()
    const first = openHouse('K7P2QX', () => busyShop().toSave(), () => {}, net.join)
    expect(openHouse('K7P2QX', () => busyShop().toSave(), () => {}, net.join)).toBe(first)
    await new Promise(r => setTimeout(r, 10))
    expect(net.size('K7P2QX')).toBe(1)
    const second = openHouse('B2KCG2', () => busyShop().toSave(), () => {}, net.join)
    await new Promise(r => setTimeout(r, 10))
    expect([net.size('K7P2QX'), net.size('B2KCG2'), currentHouse()?.code]).toEqual([0, 1, 'B2KCG2'])
    second.close()
    expect(currentHouse()).toBeNull()
    expect(net.size('B2KCG2')).toBe(0)
  })

  it('gives up when nobody hosts the code', async () => {
    const net = fakeNet()
    expect(await problemOf(visitHouse('K7P2QX', { name: 'A', code: null }, 30, net.join))).toBe('notFound')
    expect(net.size('K7P2QX')).toBe(0)
  })

  it('says the network would not connect when a peer was found but never reached', async () => {
    const net = fakeNet((_, onError) => setTimeout(onError))
    expect(await problemOf(visitHouse('K7P2QX', { name: 'A', code: null }, 30, net.join))).toBe('noLink')
  })

  it('says so when the network cannot be joined at all', async () => {
    const join: JoinVisitRoom = () => Promise.reject(new Error('offline'))
    expect(await problemOf(visitHouse('K7P2QX', { name: 'A', code: null }, 1000, join))).toBe('noLink')
  })

  it('tells a shop from a newer version from one that is broken', async () => {
    const net = fakeNet()
    const newer = await encodeSaveCode({ ...busyShop().toSave(), v: SAVE_VERSION + 1 })
    const host = net.join('K7P2QX', () => {}) as VisitRoom
    host.onJoin = peer => host.sendShop(newer, peer)
    expect(await problemOf(visitHouse('K7P2QX', { name: 'A', code: null }, 1000, net.join))).toBe('tooNew')
    host.onJoin = peer => host.sendShop('SPA1.notashop', peer)
    expect(await problemOf(visitHouse('K7P2QX', { name: 'A', code: null }, 1000, net.join))).toBe('bad')
  })
})

describe("knocking at friends' doors", () => {
  const knocks = (codes: string[], waitMs: number, join: JoinVisitRoom) =>
    new Promise<Record<string, boolean>>(resolve => {
      const heard: Record<string, boolean> = {}
      knockAll(codes, waitMs, (code, open) => {
        expect(code in heard).toBe(false)
        heard[code] = open
        if (Object.keys(heard).length === codes.length) resolve(heard)
      }, join)
    })

  it('hears an open door at once and a closed one after the wait, without fetching the shop or greeting the host', async () => {
    const net = fakeNet()
    const guests: Hello[] = []
    let sent = 0
    const sim = busyShop()
    openHouse('K7P2QX', () => (sent++, sim.toSave()), h => guests.push(h), net.join)
    const started = Date.now()
    expect(await knocks(['K7P2QX', 'B2KCG2'], 60, net.join)).toEqual({ K7P2QX: true, B2KCG2: false })
    expect(Date.now() - started).toBeGreaterThanOrEqual(55)
    expect([sent, guests]).toEqual([0, []])
    // every knock leaves its room; the host stays
    expect([net.size('K7P2QX'), net.size('B2KCG2')]).toEqual([1, 0])
  })

  it('takes nobody but the host for an open door: another visitor in the room never answers', async () => {
    const net = fakeNet()
    const visitor = net.join('K7P2QX', () => {}) as VisitRoom
    visitor.onJoin = peer => visitor.sendHello({ name: 'A', code: null }, peer)
    expect(await knocks(['K7P2QX'], 40, net.join)).toEqual({ K7P2QX: false })
  })

  it('answers no more once stopped, and leaves every room', async () => {
    const net = fakeNet()
    openHouse('K7P2QX', () => busyShop().toSave(), () => {}, net.join)
    const heard: string[] = []
    const stop = knockAll(['K7P2QX', 'B2KCG2'], 40, code => heard.push(code), net.join)
    stop()
    await new Promise(r => setTimeout(r, 80))
    expect(heard).toEqual([])
    expect([net.size('K7P2QX'), net.size('B2KCG2')]).toEqual([1, 0])
  })

  it('takes a door it cannot reach for closed', async () => {
    const join: JoinVisitRoom = () => Promise.reject(new Error('offline'))
    expect(await knocks(['K7P2QX'], 1000, join)).toEqual({ K7P2QX: false })
  })
})
