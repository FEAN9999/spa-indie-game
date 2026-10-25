import { describe, expect, it } from 'vitest'
import { textStyle } from '../../src/view/text'

describe('text style', () => {
  it('measures the tallest Vietnamese capitals and the lowest dots', () => {
    for (const ch of ['Ẳ', 'Ẵ', 'Ỵ']) expect(textStyle(40).testString).toContain(ch)
  })
})
