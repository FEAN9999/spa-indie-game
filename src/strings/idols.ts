import type { IdolId } from '../sim/idols'

export interface IdolText { name: string; role: string; song: string; arrive: string; thanks: string }

/** Each star's name, role in the book, song title (never its words), words on arriving and thanks after a 3-star visit. */
export const IDOL_TEXT: Record<IdolId, IdolText> = {
  sontung: {
    name: 'Sơn Tùng M-TP',
    role: 'Ca sĩ Việt Nam',
    song: 'Lạc Trôi',
    arrive: 'Chào em! Anh vừa ra bài mới, chạy show mỏi vai quá trời.',
    thanks: 'Nhẹ cả người! Lần sau anh dẫn cả ê-kíp tới luôn nha.',
  },
  taylor: {
    name: 'Taylor Swift',
    role: 'Ca sĩ Mỹ',
    song: 'Shake It Off',
    arrive: 'Hi! Tối nay chị diễn ba tiếng rưỡi, bóp vai giùm chị nha!',
    thanks: 'Amazing! Vai nhẹ tênh, tối nay chị diễn thêm cũng được!',
  },
  gd: {
    name: 'G-Dragon',
    role: 'Ca sĩ Hàn, BIGBANG',
    song: 'Crooked',
    arrive: 'Annyeong! Gội nhẹ tay giùm anh, tóc hồng này mới nhuộm đó.',
    thanks: 'Màu vẫn hồng mà tóc mềm hơn! Tiệm này chất ghê.',
  },
  jennie: {
    name: 'Jennie',
    role: 'Ca sĩ Hàn, BLACKPINK',
    song: 'SOLO',
    arrive: 'Annyeong! Mai chị chụp bìa tạp chí, làm da chị sáng lên nha.',
    thanks: 'Da căng bóng luôn! Mai lên hình khỏi cần chỉnh.',
  },
  hieuthuhai: {
    name: 'HIEUTHUHAI',
    role: 'Rapper Việt Nam',
    song: 'Ngủ Một Mình',
    arrive: 'Mai quay MV rồi, gội cho anh thơm tho bảnh bao nha!',
    thanks: 'Thơm phức! Vô MV tóc vào nếp khỏi cần vuốt.',
  },
  weeknd: {
    name: 'The Weeknd',
    role: 'Ca sĩ Canada',
    song: 'Blinding Lights',
    arrive: 'Hát tới khuya, ngủ chưa đủ giấc… Gội cho anh tỉnh ngủ nha.',
    thanks: 'Tỉnh cả người! Đêm nay anh hát tới sáng cũng được.',
  },
  taeyang: {
    name: 'Taeyang',
    role: 'Ca sĩ Hàn, BIGBANG',
    song: 'Eyes, Nose, Lips',
    arrive: 'Tập nhảy cả ngày, lưng cứng đơ rồi. Massage giùm anh nha!',
    thanks: 'Lưng dẻo lại rồi! Giờ nhảy thêm bài nữa cũng được.',
  },
  bieber: {
    name: 'Justin Bieber',
    role: 'Ca sĩ Canada',
    song: 'Baby',
    arrive: 'Yo! Bay mệt quá. Sorry nếu anh ngủ quên lúc đắp mặt nạ nha!',
    thanks: 'Ngủ ngon thiệt! Da mát rượi, bay về khỏi lo mệt.',
  },
  daesung: {
    name: 'Daesung',
    role: 'Ca sĩ Hàn, BIGBANG',
    song: 'Haru Haru',
    arrive: 'Hehe! Cười nhiều quá mỏi cả mặt, đắp mặt nạ cho anh nha!',
    thanks: 'Mặt mát rượi, cười tiếp được rồi! Hehe!',
  },
}
