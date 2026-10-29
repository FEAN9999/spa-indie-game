import { describe, expect, it } from 'vitest'
import { LESSON_PASS_STARS } from '../../src/config'
import { lessonHowTo, lessonPassLine, lessonTitle } from '../../src/view/lesson'

describe('lesson texts', () => {
  it('names the lesson after the service', () => {
    expect(lessonTitle('scrub')).toBe('Học Chà muối biển')
  })
  it('gives the two how-to lines', () => {
    expect(lessonHowTo('scrub')).toEqual(['Đặt ngón lên vệt muối rồi xoay vòng tròn.', 'Xoay vừa tay thôi, nhanh quá khách kêu rát.'])
  })
  it('names the bed given as a gift', () => {
    expect(lessonPassLine('scrub')).toBe('Tiệm đã có Chà muối biển. Quà: một Giường chà muối trong hộp quà.')
  })
  it('texts the Ngâm chân lesson', () => {
    expect(lessonTitle('foot')).toBe('Học Ngâm chân thảo mộc')
    expect(lessonHowTo('foot')).toEqual(['Nhìn các huyệt sáng lên lần lượt.', 'Rồi bấm lại đúng thứ tự đó.'])
    expect(lessonPassLine('foot')).toBe('Tiệm đã có Ngâm chân thảo mộc. Quà: một Ghế ngâm chân trong hộp quà.')
  })
  it('passes at 2 stars', () => {
    expect(LESSON_PASS_STARS).toBe(2)
  })
})
