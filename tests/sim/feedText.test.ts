import { describe, expect, it } from 'vitest'
import { CUSTOMER_KINDS } from '../../src/sim/customers'
import { COMPLAINT_REASONS, POST_KINDS } from '../../src/sim/feed'
import { FESTIVAL_IDS } from '../../src/sim/festivals'
import { IDOL_IDS } from '../../src/sim/idols'
import { BREED_IDS } from '../../src/sim/pets'
import { PLACE_IDS } from '../../src/sim/places'
import { createRng } from '../../src/sim/rng'
import { SERVICE_IDS, SERVICES } from '../../src/sim/services'
import { VIP_IDS } from '../../src/sim/vips'
import {
  commentsFor, complaintText, idolText, kolText, managerText, praiseText, REASON_LINE, rivalText, shopText, strangerName, vipText, wardText,
} from '../../src/sim/feedText'
import type { ShopNews } from '../../src/sim/feedText'
import {
  COMMENT_LINES, COMPLAINT_PIECES, IDOL_PIECES, KOL_PIECES, PRAISE_CLOSERS, PRAISE_PIECES, STRANGER_NAMES, WARD_OPENERS, PHAY_KOL_NAME, PHAY_WARD_NAME, VIP_PIECES, managerName,
} from '../../src/strings/phay'
import { IDOL_TEXT } from '../../src/strings/idols'
import { t } from '../../src/strings/vi'

const LONG_SHOP = 'Spa Hoa Sen Vàng Rực Rỡ 24' // the longest a shop name can be is 24 letters
const NEWS: ShopNews[] = [
  { kind: 'rank', stars: 4 }, { kind: 'year', place: 1 }, { kind: 'year', place: 3 },
  ...PLACE_IDS.flatMap((place): ShopNews[] => [{ kind: 'branch', place }, { kind: 'house', place }]),
  { kind: 'house', place: null }, { kind: 'floor', floor: 2 }, { kind: 'floor', floor: 3 },
  ...BREED_IDS.map((breed): ShopNews => ({ kind: 'pet', name: 'Bánh Mì Nướng 12', breed })),
  ...FESTIVAL_IDS.map((festival): ShopNews => ({ kind: 'festival', festival })),
]

function everyText(seed: number): string[] {
  const rng = createRng(seed)
  const out: string[] = []
  for (const s of SERVICE_IDS) {
    for (const k of CUSTOMER_KINDS) out.push(praiseText(s, k, rng))
    for (const r of COMPLAINT_REASONS) out.push(complaintText(r, s, rng))
    for (const i of IDOL_IDS) out.push(idolText(i, s, LONG_SHOP, rng))
    for (const v of VIP_IDS) out.push(vipText(v, s, rng))
    out.push(kolText(s, rng))
  }
  for (const r of COMPLAINT_REASONS) for (const i of IDOL_IDS) out.push(managerText(IDOL_TEXT[i].name, r, rng))
  out.push(rivalText('morning', rng), rivalText('beaten', rng), wardText(LONG_SHOP, rng))
  for (const n of NEWS) out.push(shopText(n, LONG_SHOP, rng))
  return out
}

describe('feed text', () => {
  it('every composer gives text of 1–120 characters with no emoji', () => {
    for (let seed = 1; seed <= 200; seed++) {
      for (const s of everyText(seed)) {
        expect(s.length).toBeGreaterThan(0)
        expect(s.length, s).toBeLessThanOrEqual(120)
        expect(/\p{Extended_Pictographic}/u.test(s), s).toBe(false)
        expect(/[{}]/.test(s), s).toBe(false)
      }
    }
  })

  it('the longest shop name and service still fit, whatever the pieces drawn', () => {
    for (let seed = 1; seed <= 3000; seed++) {
      const rng = createRng(seed)
      for (const i of IDOL_IDS) expect(idolText(i, 'foot', LONG_SHOP, rng).length).toBeLessThanOrEqual(120)
      for (const n of NEWS) expect(shopText(n, LONG_SHOP, rng).length).toBeLessThanOrEqual(120)
      expect(wardText(LONG_SHOP, rng).length).toBeLessThanOrEqual(120)
      for (const k of CUSTOMER_KINDS) expect(praiseText('foot', k, rng).length).toBeLessThanOrEqual(120)
      for (const v of VIP_IDS) expect(vipText(v, 'foot', rng).length).toBeLessThanOrEqual(120)
      expect(kolText('foot', rng).length).toBeLessThanOrEqual(120)
    }
  })

  it('no piece asks to "làm", "từng" or "đi" a service or calls it "êm", which only some service names allow', () => {
    const pieces = [PRAISE_PIECES, IDOL_PIECES, KOL_PIECES, VIP_PIECES, ...Object.values(COMPLAINT_PIECES)].flat()
    for (const id of SERVICE_IDS) {
      const name = t(SERVICES[id].name).toLocaleLowerCase('vi')
      for (const piece of pieces) {
        const s = piece.replaceAll('{service}', name)
        expect(s, `${id}: ${s}`).not.toContain(`làm ${name}`)
        expect(s, `${id}: ${s}`).not.toContain(`từng ${name}`)
        expect(s, `${id}: ${s}`).not.toContain(`đi ${name}`)
        expect(piece, `${id}: ${s}`).not.toMatch(/(^|\s)êm(\s|,|\.|$)/)
      }
    }
  })

  it('rival comments fit both the challenge and the defeat', () => {
    for (const line of COMMENT_LINES.rival) expect(line).not.toMatch(/thách|\{/)
  })

  it('same rng, same words', () => {
    expect(praiseText('mask', 'student', createRng(5))).toBe(praiseText('mask', 'student', createRng(5)))
    expect(everyText(9)).toEqual(everyText(9))
  })

  it('praise names the service', () => {
    for (const s of SERVICE_IDS) {
      for (let seed = 1; seed <= 20; seed++) {
        const name = t(SERVICES[s].name)
        const text = praiseText(s, 'office', createRng(seed))
        expect(text.includes(name) || text.includes(name.toLocaleLowerCase('vi')), text).toBe(true)
      }
    }
  })

  it('does not always say the same thing', () => {
    const seen = new Set<string>()
    for (let seed = 1; seed <= 50; seed++) seen.add(praiseText('massage', 'office', createRng(seed)))
    expect(seen.size).toBeGreaterThan(20)
  })

  it('a pet breed keeps its proper noun: only the first letter is lowered', () => {
    expect(shopText({ kind: 'pet', name: 'Vàng', breed: 'phuquoc' }, 'Spa Sen', createRng(1))).toContain('chó Phú Quốc')
    expect(shopText({ kind: 'pet', name: 'Tuyết', breed: 'xiem' }, 'Spa Sen', createRng(1))).toContain('mèo Xiêm')
  })

  it("an old guest's closer fits any name, a walk-out in a power cut was never served, and the ward is the UBND", () => {
    for (const line of PRAISE_CLOSERS.elder) expect(line).not.toMatch(/^(Bác|Bà|Ông|Cô|Chú) /)
    for (const piece of COMPLAINT_PIECES.power) expect(piece).not.toContain('dở dang')
    expect(WARD_OPENERS.join(' ')).not.toContain('chỉ huy')
    expect(WARD_OPENERS).toContain('UBND phường xin báo:')
  })

  it('managerText speaks for the star', () => {
    for (const r of COMPLAINT_REASONS) {
      for (let seed = 1; seed <= 20; seed++) expect(managerText('Sơn Tùng M-TP', r, createRng(seed))).toContain('Sơn Tùng M-TP')
    }
    expect(managerName('Jennie')).toBe('Quản lý của Jennie')
  })

  it('a complaint is about its reason', () => {
    for (let seed = 1; seed <= 30; seed++) {
      expect(complaintText('stock', 'mask', createRng(seed))).toMatch(/hết|thiếu|hàng/)
      expect(complaintText('power', 'steam', createRng(seed))).toMatch(/điện|cúp/)
      expect(complaintText('wait', 'mask', createRng(seed))).toMatch(/chờ|đợi/)
    }
  })

  it('a star, VIP, Mi Mi or ward text names the shop or the service', () => {
    expect(idolText('taylor', 'massage', 'Spa Sen', createRng(2))).toContain('Spa Sen')
    expect(vipText('miss', 'mud', createRng(2)).toLocaleLowerCase('vi')).toContain(t(SERVICES.mud.name).toLocaleLowerCase('vi'))
    expect(kolText('mud', createRng(2)).toLocaleLowerCase('vi')).toContain(t(SERVICES.mud.name).toLocaleLowerCase('vi'))
    expect(wardText('Spa Sen', createRng(2))).toContain('Spa Sen')
  })

  it('shop news tells its fact', () => {
    expect(shopText({ kind: 'rank', stars: 4 }, 'Spa Sen', createRng(1))).toMatch(/4/)
    expect(shopText({ kind: 'pet', name: 'Mướp', breed: 'muop' }, 'Spa Sen', createRng(1))).toContain('Mướp')
    expect(shopText({ kind: 'branch', place: 'beach' }, 'Spa Sen', createRng(1))).toContain('Bãi biển')
    expect(shopText({ kind: 'festival', festival: 'tet' }, 'Spa Sen', createRng(1))).toContain('Tết')
  })

  it('the rival is SPA MỚI', () => {
    expect(rivalText('morning', createRng(1))).toContain(t('rivalSignName'))
    expect(rivalText('beaten', createRng(1))).toContain(t('rivalSignName'))
  })

  it('rival comments defend the shop', () => {
    const c = commentsFor('rival', ['Bác Ba'], createRng(4))
    expect(c).toHaveLength(2)
    expect(c[0][0]).toBe('Bác Ba')
    expect(c[1][0]).not.toBe('Bác Ba')
    const strangers = commentsFor('rival', [], createRng(4))
    expect(strangers).toHaveLength(2)
    expect(strangers[0][0]).not.toBe(strangers[1][0])
  })

  it('comments are 0 to 2 with real words, for every kind', () => {
    for (const kind of POST_KINDS) {
      const counts = new Set<number>()
      for (let seed = 1; seed <= 100; seed++) {
        const c = commentsFor(kind, ['Cô Hạnh', 'Vy'], createRng(seed))
        counts.add(c.length)
        expect(c.length).toBeLessThanOrEqual(2)
        for (const [who, said] of c) {
          expect(who.length).toBeGreaterThan(0)
          expect(said.length).toBeGreaterThan(0)
          expect(said.length).toBeLessThanOrEqual(120)
        }
      }
      expect(Math.max(...counts), kind).toBeGreaterThan(0)
    }
  })

  it('strangerName returns a name from that kind list', () => {
    for (const kind of CUSTOMER_KINDS) {
      expect(STRANGER_NAMES[kind].length).toBeGreaterThanOrEqual(6)
      for (let seed = 1; seed <= 30; seed++) expect(STRANGER_NAMES[kind]).toContain(strangerName(kind, createRng(seed)))
    }
  })

  it('has one reason line per reason and the fixed author names', () => {
    expect(REASON_LINE.wait).toBe('Lý do: chờ lâu rồi bỏ về')
    expect(REASON_LINE.stock).toBe('Lý do: hết hàng')
    expect(REASON_LINE.power).toBe('Lý do: cúp điện')
    expect(REASON_LINE.sloppy).toBe('Lý do: thợ làm vội')
    expect(REASON_LINE.tech).toBe('Lý do: thợ làm chưa tới')
    expect(REASON_LINE.owner).toBe('Lý do: chủ tiệm làm chưa tới')
    expect([PHAY_KOL_NAME, PHAY_WARD_NAME]).toEqual(['Mi Mi Review', 'Phường 3'])
  })
})
