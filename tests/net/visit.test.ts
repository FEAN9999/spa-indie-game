import { afterEach, describe, expect, it } from 'vitest'
import {
  currentHouse,
  homeLink,
  newVisitCode,
  openHouse,
  parseVisitCode,
  showVisitCode,
  visitCodeIn,
  VisitError,
  visitHouse,
  visitLink,
  type JoinVisitRoom,
  type VisitProblem,
  type VisitRoom,
} from '../../src/net/visit'
import { encodeSaveCode } from '../../src/save/code'
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
      sendShop: (text, peer) => void setTimeout(() => peers.get(peer)?.onShop?.(text, id)),
      sendHello: (name, peer) => void setTimeout(() => peers.get(peer)?.onHello?.(name, id)),
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
  it("brings the host's shop over and tells the host who came", async () => {
    const net = fakeNet()
    const sim = busyShop()
    const guests: string[] = []
    openHouse(() => sim.toSave(), name => guests.push(name), net.join, 'K7P2QX')
    const shop = await visitHouse('K7P2QX', 'Spa Lan', 1000, net.join)
    expect(shop).toEqual(sim.toSave())
    await new Promise(r => setTimeout(r, 10))
    expect(guests).toEqual(['Spa Lan'])
    // the visitor leaves the room once it has the shop; the host stays for the next friend
    expect(net.size('K7P2QX')).toBe(1)
  })

  it('sends the shop as it is when each friend comes', async () => {
    const net = fakeNet()
    const sim = busyShop()
    openHouse(() => sim.toSave(), () => {}, net.join, 'K7P2QX')
    expect((await visitHouse('K7P2QX', 'A', 1000, net.join)).money).toBe(123456)
    sim.money = 777
    expect((await visitHouse('K7P2QX', 'B', 1000, net.join)).money).toBe(777)
  })

  it('serves two friends who come at once, who never take each other for the host', async () => {
    const net = fakeNet()
    const sim = busyShop()
    const guests: string[] = []
    openHouse(() => sim.toSave(), name => guests.push(name), net.join, 'K7P2QX')
    const [a, b] = await Promise.all([visitHouse('K7P2QX', 'A', 1000, net.join), visitHouse('K7P2QX', 'B', 1000, net.join)])
    expect(a).toEqual(sim.toSave())
    expect(b).toEqual(sim.toSave())
    await new Promise(r => setTimeout(r, 10))
    expect(guests.sort()).toEqual(['A', 'B'])
  })

  it('shortens a long visitor name for the toast', async () => {
    const net = fakeNet()
    const guests: string[] = []
    openHouse(() => busyShop().toSave(), name => guests.push(name), net.join, 'K7P2QX')
    await visitHouse('K7P2QX', 'x'.repeat(200), 1000, net.join)
    await new Promise(r => setTimeout(r, 10))
    expect(guests[0]).toHaveLength(40)
  })

  it('keeps one invitation per page: opening it again keeps the code, closing it leaves the room', async () => {
    const net = fakeNet()
    const first = openHouse(() => busyShop().toSave(), () => {}, net.join, 'K7P2QX')
    expect(openHouse(() => busyShop().toSave(), () => {}, net.join).code).toBe('K7P2QX')
    await new Promise(r => setTimeout(r, 10))
    expect(net.size('K7P2QX')).toBe(1)
    first.close()
    expect(currentHouse()).toBeNull()
    expect(net.size('K7P2QX')).toBe(0)
  })

  it('gives up when nobody hosts the code', async () => {
    const net = fakeNet()
    expect(await problemOf(visitHouse('K7P2QX', 'A', 30, net.join))).toBe('notFound')
    expect(net.size('K7P2QX')).toBe(0)
  })

  it('says the network would not connect when a peer was found but never reached', async () => {
    const net = fakeNet((_, onError) => setTimeout(onError))
    expect(await problemOf(visitHouse('K7P2QX', 'A', 30, net.join))).toBe('noLink')
  })

  it('says so when the network cannot be joined at all', async () => {
    const join: JoinVisitRoom = () => Promise.reject(new Error('offline'))
    expect(await problemOf(visitHouse('K7P2QX', 'A', 1000, join))).toBe('noLink')
  })

  it('tells a shop from a newer version from one that is broken', async () => {
    const net = fakeNet()
    const newer = await encodeSaveCode({ ...busyShop().toSave(), v: SAVE_VERSION + 1 })
    const host = net.join('K7P2QX', () => {}) as VisitRoom
    host.onJoin = peer => host.sendShop(newer, peer)
    expect(await problemOf(visitHouse('K7P2QX', 'A', 1000, net.join))).toBe('tooNew')
    host.onJoin = peer => host.sendShop('SPA1.notashop', peer)
    expect(await problemOf(visitHouse('K7P2QX', 'A', 1000, net.join))).toBe('bad')
  })
})
