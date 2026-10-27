import type { RegularId } from '../sim/regulars'

/** The longest a speech line may be, so it fits in two bubble lines. */
export const BUBBLE_MAX_CHARS = 60

export interface RegularText { name: string; job: string; intro: string; story: readonly [string, string, string, string, string] }

/** Each regular's name, job and first words, and their story, told one line per heart: the card at 3, the gift at 5. */
export const REGULAR_TEXT: Record<RegularId, RegularText> = {
  hanh: {
    name: 'Cô Hạnh',
    job: 'Bán bánh mì đầu hẻm',
    intro: 'Cô bán bánh mì đầu hẻm nè. Nghe nói tiệm mới mở, cô ghé thử!',
    story: [
      'Đứng bán từ sáng tới trưa, cái lưng cô muốn gãy luôn.',
      'Tay con mát ghê, về cô ngủ một giấc tới sáng.',
      'Con Thảo nhà cô sắp cưới rồi! Cô làm thẻ ở đây luôn nha.',
      'Lo đám cưới mệt ghê. Cô để dành ổ bánh mì cho con nè.',
      'Cưới xong rồi! Bữa sau cô dắt con Thảo qua làm đẹp nha.',
    ],
  },
  vy: {
    name: 'Vy',
    job: 'Sinh viên mỹ thuật',
    intro: 'Em là Vy, học mỹ thuật. Tiệm mình xinh quá trời!',
    story: [
      'Em nhịn trà sữa cả tuần để đi gội đó chị.',
      'Cho em ngồi vẽ ký họa tiệm mình một bữa nha?',
      'Bức ký họa tiệm được thầy khen! Em làm thẻ luôn nè.',
      'Tranh em được chọn đi triển lãm rồi chị ơi!',
      'Em vẽ tặng tiệm một bức, treo cho em vui nha!',
    ],
  },
  sau: {
    name: 'Chú Sáu',
    job: 'Chạy xe ôm',
    intro: 'Chú chạy xe ôm ngoài ngã tư. Bụi quá, gội giùm chú cái đầu!',
    story: [
      'Chạy xe cả ngày, gội cái là mát rượi.',
      'Hồi nãy chú chở mối quen, chú giới thiệu tiệm mình rồi đó.',
      'Thằng cháu nội chú sắp thi đại học. Chú làm thẻ nghen!',
      'Nó ôn tới khuya, chú thương nó quá.',
      'Cháu chú đậu rồi! Từ giờ chú chở khách tới tiệm mỗi ngày!',
    ],
  },
  khoa: {
    name: 'Anh Khoa',
    job: 'Lập trình viên',
    intro: 'Khoa nè, làm IT. Mặt mũi bơ phờ quá, cứu em với!',
    story: [
      'Chạy dự án ba đêm liền, da mặt khô như bánh tráng.',
      'Bị sếp la nhưng đắp mặt nạ xong thấy đời tươi lại.',
      'Dự án xong rồi! Em làm thẻ, tuần nào cũng ghé.',
      'Em được lên trưởng nhóm rồi đó!',
      'Cả phòng em muốn làm thẻ. Em gửi trước tiền cho tiệm nha!',
    ],
  },
  tu: {
    name: 'Bà Tư',
    job: 'Chủ sạp vải chợ Bến Thành',
    intro: 'Tiệm mới hả? Để bà coi làm ăn ra sao.',
    story: [
      'Khăn hơi cứng. Mà thôi, tay nghề cũng được.',
      'Ừ... lần này làm khá đó.',
      'Bà bán vải chợ Bến Thành năm chục năm rồi. Làm thẻ cho bà.',
      'Hồi xưa sạp bà đông lắm, cô dâu nào cũng ghé mua lụa.',
      'Bà tặng tấm bình phong lụa, tiệm cho sang. Nhớ giữ kỹ!',
    ],
  },
  ba: {
    name: 'Ông Ba',
    job: 'Thầy giáo về hưu',
    intro: 'Tôi dạy học bốn chục năm, giờ về hưu. Cái vai nó mỏi quá.',
    story: [
      'Cầm phấn mấy chục năm, cái vai không còn nghe lời.',
      'Học trò cũ của tôi giờ làm bác sĩ, kỹ sư đủ cả.',
      'Tiệm này làm có tâm. Cho tôi làm cái thẻ.',
      'Hôm qua học trò cũ về thăm, tôi mừng muốn khóc.',
      'Tôi gửi chút lì xì, chúc tiệm làm ăn phát đạt.',
    ],
  },
  thao: {
    name: 'Thảo',
    job: 'Kế toán, cô dâu sắp cưới',
    intro: 'Con là Thảo, con gái má Hạnh. Má khen tiệm hoài!',
    story: [
      'Sắp cưới mà da nổi mụn, con lo quá trời.',
      'Chụp ảnh cưới xong rồi, da đẹp hơn hẳn đó!',
      'Con làm thẻ luôn, má với con giờ là khách ruột.',
      'Đám cưới vui lắm! Con khoe ảnh nè.',
      'Con rủ Lan, bạn phù dâu của con, qua tiệm nha!',
    ],
  },
  lan: {
    name: 'Lan',
    job: 'Bán hoa chợ Hồ Thị Kỷ',
    intro: 'Lan bán hoa ở chợ Hồ Thị Kỷ. Thảo rủ ghé, Lan tới liền!',
    story: [
      'Lan dậy 3 giờ sáng lấy hoa, mặt mũi phờ phạc hết.',
      'Lan để dành tiền, mơ mở một tiệm hoa nho nhỏ.',
      'Gom góp gần đủ rồi! Lan làm thẻ cho tiệm luôn.',
      'Lan thuê được mặt bằng rồi, sắp khai trương!',
      'Tiệm hoa mở rồi! Lan tặng tiệm một bình hoa nè.',
    ],
  },
}

/** What a regular says on a later visit, shown as `greetingLine` after their name. */
export const GREETINGS: readonly string[] = ['Ghé nè!', 'Hôm nay đông ghê ha!', 'Lại là tui nè!', 'Nhớ tiệm quá nên ghé.', 'Làm như lần trước nha!']
