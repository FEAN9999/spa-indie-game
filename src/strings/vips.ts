import type { VipId } from '../sim/vips'

export interface VipText { name: string; role: string; title: string; arrive: string; thanks: string }

/** Each VIP's name, her role in the book, her title in a sentence, her words on arriving and her thanks after a 3-star visit. */
export const VIP_TEXT: Record<VipId, VipText> = {
  singer: {
    name: 'Mây Chiều',
    role: 'Ca sĩ phòng trà',
    title: 'ca sĩ',
    arrive: 'Tối nay chị hát phòng trà, làm cho chị cái vai nha!',
    thanks: 'Tay cưng mát quá! Bữa nào ghé phòng trà nghe chị hát nha.',
  },
  miss: {
    name: 'Ngân Sa',
    role: 'Hoa hậu',
    title: 'hoa hậu',
    arrive: 'Mai em đi trao vương miện, da phải thật đẹp nha!',
    thanks: 'Da em sáng bừng luôn! Lên sân khấu tự tin rồi.',
  },
  star: {
    name: 'Bích Câu',
    role: 'Minh tinh điện ảnh xưa',
    title: 'minh tinh',
    arrive: 'Hồi xưa chị đóng phim, giờ vẫn phải đẹp như xưa!',
    thanks: 'Đẹp như thời đóng phim! Tiệm này chị nhớ rồi nha.',
  },
  chef: {
    name: 'Tám Lửa',
    role: 'Đầu bếp nổi tiếng',
    title: 'đầu bếp',
    arrive: 'Đứng bếp cả ngày, tóc toàn mùi khói. Gội giùm anh!',
    thanks: 'Thơm phức! Bữa nào ghé quán anh nấu cho ăn nha.',
  },
}
