import { describe, expect, it } from 'vitest'
import { FRIENDS_MAX } from '../../src/config'
import { addFriend, emptyFriends, friendCodeFrom, parseFriendCode, removeFriend, repairFriends, type FriendBook } from '../../src/sim/friends'

const book = (code = 'K7P2QX'): FriendBook => ({ ...emptyFriends(), code })
/** The nth valid code: a different one for each n. */
const codeOf = (n: number) => friendCodeFrom([n, n + 1, n + 2, n + 3, n + 4, n + 5].map(k => k * 7))

describe('friend codes', () => {
  it('reads a code whatever its case, dash and spaces, and refuses one it would never give', () => {
    expect(parseFriendCode(' k7p-2qx\n')).toBe('K7P2QX')
    for (const bad of ['', 'K7P2Q', 'K7P2QXA', 'K7P2Q0', 'K7P2QO', 'K7P2Q1', 'K7P2QI', 'K7P2QL']) expect(parseFriendCode(bad), bad).toBeNull()
  })

  it('makes a code it reads back from any numbers', () => {
    for (let n = 0; n < 40; n++) expect(parseFriendCode(codeOf(n))).toBe(codeOf(n))
  })
})

describe('the list of friends', () => {
  it('puts the friend just met at the top, once, under the name they have now', () => {
    const b = book()
    addFriend(b, 'B2KCG2', 'Spa Sen')
    addFriend(b, 'WHUURP', 'Tiệm Lan')
    addFriend(b, 'b2k-cg2', 'Spa Sen Hồng')
    expect(b.list).toEqual([
      { code: 'B2KCG2', name: 'Spa Sen Hồng' },
      { code: 'WHUURP', name: 'Tiệm Lan' },
    ])
  })

  it("never lists the shop's own code nor one that is not a code", () => {
    const b = book('K7P2QX')
    addFriend(b, 'K7P2QX', 'me')
    addFriend(b, 'nope', 'x')
    expect(b.list).toEqual([])
  })

  it('gives a nameless friend a name', () => {
    const b = book()
    addFriend(b, 'B2KCG2', '   ')
    expect(b.list[0].name).toBe('Một người bạn')
  })

  it(`keeps the ${FRIENDS_MAX} met last`, () => {
    const b = book()
    for (let n = 0; n < FRIENDS_MAX + 3; n++) addFriend(b, codeOf(n), `Tiệm ${n}`)
    expect(b.list).toHaveLength(FRIENDS_MAX)
    expect(b.list[0].name).toBe(`Tiệm ${FRIENDS_MAX + 2}`)
    expect(b.list.at(-1)!.name).toBe('Tiệm 3')
  })

  it('takes a friend off', () => {
    const b = book()
    addFriend(b, 'B2KCG2', 'Spa Sen')
    addFriend(b, 'WHUURP', 'Tiệm Lan')
    removeFriend(b, 'B2KCG2')
    expect(b.list.map(f => f.code)).toEqual(['WHUURP'])
  })

  it('repairs a saved list in its order, keeping the first of two with one code and the latest past the limit', () => {
    const list = Array.from({ length: FRIENDS_MAX + 2 }, (_, n) => ({ code: codeOf(n), name: `Tiệm ${n}` }))
    list.splice(1, 0, { code: codeOf(0), name: 'older name' })
    const b = repairFriends({ code: 'K7P2QX', open: true, list })
    expect(b.code).toBe('K7P2QX')
    expect(b.open).toBe(true)
    expect(b.list.map(f => f.name)).toEqual(Array.from({ length: FRIENDS_MAX }, (_, n) => `Tiệm ${n}`))
    expect(repairFriends('junk')).toEqual(emptyFriends())
  })
})
