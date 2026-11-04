import { describe, expect, it } from 'vitest'
import { inDepthOrder } from '../../src/view/depthOrder'

const list = (...depths: number[]) => depths.map(_depth => ({ _depth }))

describe('inDepthOrder', () => {
  it('is true for a list a stable sort would leave as it is, equal depths included', () => {
    expect(inDepthOrder(list())).toBe(true)
    expect(inDepthOrder(list(5))).toBe(true)
    expect(inDepthOrder(list(1, 2, 2, 3))).toBe(true)
  })

  it('is false once any depth goes down', () => {
    expect(inDepthOrder(list(1, 3, 2))).toBe(false)
    expect(inDepthOrder(list(2, 1))).toBe(false)
  })
})
