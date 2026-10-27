import { describe, expect, it } from 'vitest'
import { customerColors, ELDER_HAIR, HAIR, lookColors, OWNER_SHIRT, ownerColors, SHIRT, SKIN, STAFF_SHIRT, staffColors } from '../../src/art/palette'
import { LOOK_COUNTS, OWNER_LOOK_COUNTS } from '../../src/config'

describe('look palettes', () => {
  it('has a color for every look choice', () => {
    expect([SKIN.length, HAIR.length, SHIRT.length]).toEqual([LOOK_COUNTS.skin, LOOK_COUNTS.hair, LOOK_COUNTS.shirt])
    expect([SKIN.length, HAIR.length, OWNER_SHIRT.length]).toEqual([OWNER_LOOK_COUNTS.skin, OWNER_LOOK_COUNTS.hair, OWNER_LOOK_COUNTS.shirt])
    expect([LOOK_COUNTS.hairStyle, OWNER_LOOK_COUNTS.hairStyle]).toEqual([4, 4])
  })

  it('never dresses a customer like the owner', () => {
    const rgb = (c: number) => [c >> 16, (c >> 8) & 255, c & 255]
    for (const o of OWNER_SHIRT)
      for (const s of SHIRT) expect(Math.hypot(...rgb(o).map((v, i) => v - rgb(s)[i]))).toBeGreaterThan(50)
  })

  it('turns an owner look into colors', () =>
    expect(ownerColors({ skin: 3, hair: 1, hairStyle: 2, shirt: 2 })).toEqual({ skin: SKIN[3], hair: HAIR[1], hairStyle: 2, shirt: 0xa8302a }))

  it('dresses staff in a shirt unlike any customer or owner shirt, with an apron', () => {
    const rgb = (c: number) => [c >> 16, (c >> 8) & 255, c & 255]
    for (const o of [...SHIRT, ...OWNER_SHIRT]) expect(Math.hypot(...rgb(STAFF_SHIRT).map((v, i) => v - rgb(o)[i]))).toBeGreaterThan(50)
    const look = { skin: 1, hair: 2, hairStyle: 3, shirt: 4 }
    expect(staffColors(look)).toEqual({ skin: SKIN[1], hair: HAIR[2], hairStyle: 3, shirt: STAFF_SHIRT, apron: true })
    expect(ownerColors(look).apron).toBeUndefined()
    expect(lookColors(look).apron).toBeUndefined()
  })

  it("greys an elder's hair and keeps every other kind's own, with the kind attached", () => {
    const look = { skin: 2, hair: 1, hairStyle: 0, shirt: 3 }
    expect(ELDER_HAIR).toBe(0xd8d2c8)
    expect(customerColors(look, 'elder')).toEqual({ ...lookColors(look), hair: ELDER_HAIR, kind: 'elder' })
    expect(customerColors(look, 'student').hair).toBe(lookColors(look).hair)
    expect(customerColors(look, 'celeb')).toEqual({ ...lookColors(look), kind: 'celeb' })
  })

  it('names the regular a customer is, on top of their kind', () => {
    const look = { skin: 2, hair: 1, hairStyle: 0, shirt: 3 }
    expect(customerColors(look, 'elder', 'sau')).toEqual({ ...customerColors(look, 'elder'), regular: 'sau' })
    expect(customerColors(look, 'picky').regular).toBeUndefined()
  })
})
