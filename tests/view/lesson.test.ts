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
  it('texts the Sơn móng lesson', () => {
    expect(lessonTitle('nails')).toBe('Học Sơn móng')
    expect(lessonHowTo('nails')).toEqual(['Chọn lọ sơn đúng màu thẻ mẫu.', 'Kéo ngón theo nét chấm, đừng lem ra ngoài móng.'])
    expect(lessonPassLine('nails')).toBe('Tiệm đã có Sơn móng. Quà: một Bàn làm móng trong hộp quà.')
    expect(lessonTitle('cupping')).toBe('Học Giác hơi')
    expect(lessonHowTo('cupping')).toEqual(['Chạm điểm sáng trên lưng để đặt ống giác.', 'Chạm ống để gỡ khi da vừa đỏ, đừng để thâm.'])
    expect(lessonPassLine('cupping')).toBe('Tiệm đã có Giác hơi. Quà: một Giường giác hơi trong hộp quà.')
    expect(lessonTitle('lashes')).toBe('Học Nối mi')
    expect(lessonHowTo('lashes')).toEqual(['Xem thẻ mẫu: chỗ nào mi ngắn, vừa hay dài.', 'Kéo sợi mi đúng độ dài lên từng chấm trên mí.'])
    expect(lessonPassLine('lashes')).toBe('Tiệm đã có Nối mi. Quà: một Giường nối mi trong hộp quà.')
    expect(lessonTitle('acupressure')).toBe('Học Bấm huyệt')
    expect(lessonHowTo('acupressure')).toEqual(['Huyệt nào sáng thì đặt ngón tay lên và giữ.', 'Thả tay khi vòng lực vào vạch xanh, giữ lâu quá là đau.'])
    expect(lessonPassLine('acupressure')).toBe('Tiệm đã có Bấm huyệt. Quà: một Giường bấm huyệt trong hộp quà.')
  })
  it('passes at 2 stars', () => {
    expect(LESSON_PASS_STARS).toBe(2)
  })
})
