import type { CustomerKind } from '../sim/customers'
import type { ComplaintReason, PostKind } from '../sim/feed'

/** Names Phây posts under that are not a guest, star or VIP. */
export const PHAY_KOL_NAME = 'Mi Mi Review'
export const PHAY_WARD_NAME = 'Phường 3'
/** A star never complains in their own name: their manager does. */
export const managerName = (idolName: string): string => `Quản lý của ${idolName}`

/**
 * Every line below is a piece of a post. `{service}` is the service's name in lower case, `{shop}` the shop's name, `{rival}` SPA MỚI,
 * `{name}` a star's or pet's name, `{title}` a VIP's title, `{song}` a star's song, `{place}`, `{stars}`, `{floor}`, `{breed}`, `{festival}` the fact of a news.
 * Openers end with a comma or a colon, pieces start in lower case and end with a full stop, closers are sentences of their own.
 */

/** About 6 names per kind of guest, for a guest the book does not know. */
export const STRANGER_NAMES: Record<CustomerKind, readonly string[]> = {
  student: ['Bạn Lan', 'Bạn Minh', 'Em Hà', 'Em Tuấn', 'Bạn Khoa', 'Em Thảo'],
  office: ['Chị Thu', 'Anh Tuấn', 'Chị Mai', 'Anh Hùng', 'Chị Ngân', 'Anh Dũng'],
  picky: ['Chị Diễm', 'Anh Khôi', 'Cô Quyên', 'Anh Phong', 'Chị Trinh', 'Chú Sáu'],
  elder: ['Bác Ba', 'Bác Tư', 'Cô Sáu', 'Chú Bảy', 'Bà Năm', 'Ông Tám'],
  celeb: ['Chị Linh Đan', 'Anh Quốc', 'Chị Mỹ Hoa', 'Anh Thiên Ân', 'Chị Ngọc Trâm', 'Anh Gia Bảo'],
  tourist: ['Anh Long', 'Chị Vân', 'Cô Thủy', 'Anh Kiên', 'Chị Oanh', 'Chú Hải'],
  backpacker: ['Bạn Nam', 'Bạn Phương', 'Anh Đạt', 'Bạn Trang', 'Anh Quân', 'Bạn Việt'],
  lady: ['Chị Hoa', 'Cô Lệ', 'Chị Yến', 'Chị Nhung', 'Cô Thanh', 'Chị Tâm'],
}

/** The line under a complaint saying why. */
export const REASON_LINE: Record<ComplaintReason, string> = {
  wait: 'Lý do: chờ lâu rồi bỏ về',
  stock: 'Lý do: hết hàng',
  power: 'Lý do: cúp điện',
  sloppy: 'Lý do: thợ làm vội',
  tech: 'Lý do: thợ làm chưa tới',
  owner: 'Lý do: chủ tiệm làm chưa tới',
}

export const PRAISE_OPENERS: readonly string[] = [
  'Tiệm này được nha,',
  'Hôm nay mới ghé thử,',
  'Review nhanh nè:',
  'Mình vừa đi về,',
  'Chấm 5 sao luôn,',
  'Nói thiệt nha,',
  'Công nhận,',
]
export const PRAISE_PIECES: readonly string[] = [
  'làm {service} ở đây êm ru, thợ nhẹ tay.',
  '{service} xong người nhẹ hẳn, đáng đồng tiền.',
  'thợ làm {service} kỹ lắm, còn dễ thương.',
  'tiệm sạch sẽ thơm tho, {service} đã ghê.',
  'không phải chờ lâu, {service} xong gọn lẹ.',
  'đi {service} về ngủ một giấc tới sáng.',
  'giá hợp lý mà {service} chất lượng ghê.',
]
/** A closing sentence in the voice of each kind of guest. */
export const PRAISE_CLOSERS: Record<CustomerKind, readonly string[]> = {
  student: ['Giá sinh viên mà xịn quá.', 'Sinh viên như mình đi được nha.', 'Cuối tuần rủ bạn đi tiếp.'],
  office: ['Dân văn phòng nên ghé một lần.', 'Hết giờ làm ghé là vừa.', 'Cổ vai gáy được cứu rồi.'],
  picky: ['Mình khó tính mà vẫn chấm 5 sao.', 'Khó tính như mình còn chịu.', 'Chỗ nào sạch mới được mình khen.'],
  elder: ['Tuổi này được chiều vậy là quý.', 'Bác khen, con cháu nhớ ghé nha.', 'Dặn con cháu dẫn đi tiếp.'],
  celeb: ['Người của công chúng cũng yên tâm.', 'Kín đáo và chuyên nghiệp.', 'Mình sẽ quay lại.'],
  tourist: ['Đi du lịch ghé là đúng bài.', 'Du khách như mình rất hài lòng.', 'Chuyến này nhớ nhất tiệm này.'],
  backpacker: ['Đi bụi mà được chiều là hết ý.', 'Đi bụi mỏi chân, ghé là hết mệt.', 'Balo nặng mấy cũng đỡ.'],
  lady: ['Chị em đi cùng nhau là hết ý.', 'Chị em nên rủ nhau tới.', 'Các chị nhớ đặt trước nha.'],
}

export const COMPLAINT_OPENERS: readonly string[] = [
  'Hơi tiếc,',
  'Góp ý nhẹ nha,',
  'Chưa vừa lòng lắm,',
  'Mình thất vọng xíu,',
  'Tiệm nên xem lại,',
  'Lần này chưa tốt,',
]
export const COMPLAINT_PIECES: Record<ComplaintReason, readonly string[]> = {
  wait: ['chờ lâu quá nên mình bỏ về luôn.', 'đợi cả buổi không tới lượt, đành về.', 'ngồi chờ {service} mãi, hết kiên nhẫn rồi.'],
  stock: ['{service} mà hết hàng, đi uổng công.', 'hỏi {service} thì nghe thiếu hàng, tiếc ghê.', 'tới nơi mới biết hết hàng, mất công.'],
  power: ['hôm đó cúp điện nên {service} dở dang.', 'gặp ngày mất điện, chờ {service} không có máy.', 'điện cúp suốt, đợi {service} hoài không được.'],
  sloppy: ['thợ làm {service} vội quá, như chạy cho xong.', '{service} mà làm lẹ cho kịp, hơi cẩu thả.', 'thợ làm vội, {service} chưa tới nơi tới chốn.'],
  tech: ['thợ làm {service} chưa tới, còn lóng ngóng.', '{service} chưa kỹ, tay nghề thợ cần học thêm.', 'thợ làm {service} còn vụng, chưa vừa ý.'],
  owner: ['chủ tiệm làm {service} chưa tới, hơi tiếc.', 'chính chủ tiệm làm {service} mà chưa kỹ lắm.', 'tưởng chủ tiệm làm {service} sẽ kỹ hơn, tiếc ghê.'],
}

/** The manager of a star writes about the star in the third person, politely. */
export const MANAGER_OPENERS: readonly string[] = [
  'Xin phép góp ý nhẹ nhàng ạ.',
  'Bên mình xin phản hồi một chút ạ.',
  'Cảm ơn tiệm đã tiếp đón.',
  'Xin gửi tiệm vài lời góp ý.',
  'Mong tiệm lượng thứ cho góp ý này.',
  'Xin chia sẻ chút về buổi hôm nay.',
]
export const MANAGER_PIECES: Record<ComplaintReason, readonly string[]> = {
  wait: ['{name} phải chờ khá lâu.', 'Lịch của {name} khá chặt mà phải đợi lâu ạ.', '{name} chờ mãi không tới lượt nên phải về.'],
  stock: ['{name} muốn dùng dịch vụ nhưng bên tiệm hết hàng ạ.', 'Tiệm thiếu hàng nên {name} chưa dùng được.', '{name} tới nơi thì dịch vụ đã hết hàng.'],
  power: ['{name} gặp ngày cúp điện nên chưa dùng được máy.', 'Hôm nay mất điện, {name} đành ra về.', '{name} ghé đúng hôm cúp điện, rất tiếc.'],
  sloppy: ['{name} thấy thợ làm hơi vội so với mong đợi.', 'Thợ làm hơi gấp nên {name} chưa hài lòng.', '{name} mong thợ làm kỹ hơn, không vội.'],
  tech: ['{name} thấy tay nghề thợ chưa tới, mong tiệm rèn thêm.', 'Thợ còn lóng ngóng nên {name} chưa hài lòng.', '{name} mong thợ của tiệm học thêm tay nghề.'],
  owner: ['{name} mong chính chủ tiệm làm kỹ hơn lần sau.', 'Chủ tiệm làm chưa tới nên {name} hơi tiếc.', '{name} thấy chủ tiệm làm chưa được kỹ.'],
}

export const IDOL_OPENERS: readonly string[] = [
  'Chia sẻ chút nè:',
  'Thư giãn xíu,',
  'Xong lịch trình,',
  'Gửi các bạn nè:',
  'Nghỉ một chút,',
  'Cuối ngày rồi,',
]
export const IDOL_PIECES: readonly string[] = [
  'ghé {shop} làm {service}, đã lắm.',
  '{shop} làm {service} êm hết sức.',
  'được {shop} chiều với {service} nè.',
  'tới {shop} thử {service}, đáng tiền.',
  '{service} ở {shop} nhẹ nhàng ghê.',
  'nhờ {shop} làm {service} mà khỏe.',
]
export const IDOL_CLOSERS: readonly string[] = [
  'Tối nay hát {song} phê lắm.',
  'Ai nghe {song} chưa?',
  'Nhớ nghe {song} nha!',
  'Sẽ ghé lại sớm thôi!',
  'Mai chạy show, {song} nha.',
  'Hát {song} khỏe re luôn.',
]

export const VIP_OPENERS: readonly string[] = [
  'Mình mới ghé,',
  'Mới làm xong,',
  'Nói nhỏ nghe nha,',
  'Cuối ngày rồi,',
  'Chia sẻ nè,',
  'Dành chút thời gian,',
]
export const VIP_PIECES: readonly string[] = [
  'làm {title} phải giữ gìn, {service} ở đây đúng chuẩn.',
  '{service} xong thấy trẻ ra mấy tuổi.',
  'nghề {title} bận, có chỗ {service} thế này là quý.',
  '{service} ở đây làm kỹ, {title} như mình cũng yên tâm.',
  'giới {title} chắc hợp lắm, {service} nhẹ tay ghê.',
  'tiệm sạch sẽ, {service} đâu ra đấy.',
]
export const VIP_CLOSERS: readonly string[] = [
  'Chấm điểm cao nha.',
  'Mình sẽ quay lại.',
  'Rất đáng để thử.',
  'Cảm ơn tiệm nhiều.',
  'Chắc mình giới thiệu bạn bè.',
  'Hẹn tiệm lần sau.',
]

export const KOL_OPENERS: readonly string[] = [
  'Review nóng hổi:',
  'Mi Mi quay thử nè:',
  'Cả nhà ơi,',
  'Mi Mi đi trải nghiệm,',
  'Mi Mi đi một vòng,',
  'Có bạn nhắn Mi Mi,',
]
export const KOL_PIECES: readonly string[] = [
  'thử {service} ở spa này, đáng tiền không nè.',
  '{service} xong da dẻ khác hẳn, xem video nha.',
  'chấm điểm {service} của tiệm, bất ngờ lắm.',
  'đi {service} đúng bài, quay video cho cả nhà.',
  'tiệm này {service} nhẹ tay, Mi Mi khen thật lòng.',
  'có ai từng {service} chỗ này chưa, kể Mi Mi nghe.',
]
export const KOL_CLOSERS: readonly string[] = [
  'Thả tim và theo dõi Mi Mi nha!',
  'Xem hết video rồi bình luận nha.',
  'Chia sẻ cho bạn bè xem cùng nè.',
  'Mi Mi nói thật, không ai trả tiền.',
]

export const RIVAL_OPENERS: Record<'morning' | 'beaten', readonly string[]> = {
  morning: ['Cả phố ơi,', 'Tin nóng sáng nay:', 'Hôm nay có hẹn với tiệm bên cạnh,', 'Sáng nay,', 'Alo alo,', 'Thông báo nhỏ:'],
  beaten: ['Thua rồi,', 'Ừ thì,', 'Chúc mừng tiệm bên đó,', 'Hôm nay chịu thua,', 'Hơi tiếc nhưng', 'Công nhận,'],
}
export const RIVAL_PIECES: Record<'morning' | 'beaten', readonly string[]> = {
  morning: [
    '{rival} xin thách đấu, ai được khen nhiều hơn thắng.',
    '{rival} đã sẵn sàng, mong tiệm bên kia đừng ngủ quên.',
    'ghế êm giá mềm, {rival} tin hôm nay là ngày của mình.',
    'hôm nay {rival} quyết thắng, nhưng chơi đẹp nha.',
    '{rival} mời cả phố xem hai tiệm so tài.',
    'thách tiệm bên cạnh một trận, thua không giận nha.',
  ],
  beaten: [
    '{rival} nhận thua, tiệm bên kia làm tốt thật.',
    '{rival} về luyện thêm, hẹn tái đấu nha.',
    'lần này {rival} chịu thua, lần sau đừng hòng.',
    '{rival} cúi đầu, khách khen tiệm bên đó hơi nhiều.',
    'hôm nay {rival} thua, ngày mai tính tiếp.',
    '{rival} thua mà vui, phố mình có tiệm giỏi.',
  ],
}

export const SHOP_OPENERS: readonly string[] = ['Tin vui:', 'Cả nhà ơi,', 'Báo cả nhà,', 'Có chuyện vui nè:', 'Thông báo nhỏ,', 'Mừng quá,']
export const SHOP_PIECES = {
  rank: ['{shop} vừa lên hạng {stars} sao, cảm ơn khách.', 'tiệm {shop} đạt {stars} sao rồi, cảm ơn mọi người.', 'nhờ mọi người, {shop} lên {stars} sao.'],
  year: ['{shop} đứng hạng {place} Spa của năm.', 'cả năm cố gắng, {shop} đạt hạng {place} Spa của năm.', 'Spa của năm hạng {place} thuộc về {shop}.'],
  branch: ['{shop} mở chi nhánh ở {place}, ghé chơi nha.', 'chi nhánh mới của {shop} ở {place} đã mở cửa.', '{shop} có thêm chi nhánh tại {place}.'],
  houseMain: ['{shop} mua thêm nhà kế bên, rộng hơn rồi.', 'tiệm {shop} được mở rộng, mua thêm nhà bên cạnh.', '{shop} có thêm nhà, thêm chỗ cho khách.'],
  houseBranch: ['chi nhánh {place} mua thêm nhà, rộng rãi hơn.', 'chi nhánh {place} của {shop} vừa mở rộng.', '{shop} thêm nhà ở {place}, chỗ rộng hơn.'],
  floor: ['{shop} mở thêm {floor}, thêm chỗ cho khách.', '{floor} của {shop} đã mở cửa.', 'tiệm {shop} cao thêm rồi, mở {floor}.'],
  pet: ['{shop} có thêm bé {breed} tên {name}.', 'bé {name} ({breed}) vừa về {shop}, ghé chơi nha.', 'nhà mình có thành viên mới: {name}, một bé {breed}.'],
  festival: ['dịp {festival} tới rồi, {shop} trang trí đón khách.', '{shop} đón {festival} cùng mọi người.', 'mùa {festival} đã về, ghé {shop} chơi nha.'],
} as const

export const WARD_OPENERS: readonly string[] = [
  'Thông báo từ phường:',
  'Tin vui trong phường:',
  'Ban chỉ huy phường xin báo:',
  'Phường xin thông báo,',
  'Có tin kiểm tra,',
  'Tin từ đoàn thanh tra:',
]
export const WARD_PIECES: readonly string[] = [
  '{shop} đạt giấy khen vệ sinh an toàn.',
  'đoàn thanh tra khen {shop} sạch sẽ, an toàn.',
  '{shop} được thanh tra phường chấm đạt chuẩn.',
  'khen {shop} giữ vệ sinh và an toàn lao động tốt.',
  'giấy khen thanh tra gửi tới {shop}, chúc mừng.',
  '{shop} làm tốt mọi tiêu chí kiểm tra của phường.',
]

/** What people say under a post: 6 or more per kind, always kind. */
export const COMMENT_LINES: Record<PostKind, readonly string[]> = {
  praise: [
    'Đồng ý, mình cũng thích tiệm này.',
    'Để cuối tuần mình ghé thử.',
    'Nghe hấp dẫn quá, chỉ giùm địa chỉ nha.',
    'Chuẩn luôn, thợ ở đó dễ thương lắm.',
    'Mình cũng đi rồi, khen thật.',
    'Lưu lại để đi.',
  ],
  complaint: [
    'Tiếc quá, hy vọng tiệm sửa lại.',
    'Chắc hôm đó đông khách thôi.',
    'Mình đi thấy cũng ổn mà.',
    'Góp ý thẳng thắn, tiệm nên đọc nha.',
    'Hy vọng lần sau tốt hơn.',
    'Tiệm xem lại giúp bạn này nha.',
  ],
  idol: [
    'Trời ơi thần tượng của mình!',
    'Thần tượng ghé tiệm này luôn hả trời!',
    'Mai mình cũng đi gội ở đó!',
    'Xỉu ngang, nhìn đẹp quá chừng!',
    'Yêu quá, ghé tiệm nhớ chụp thêm nha.',
    'Tiệm này nổi rồi nha!',
  ],
  vip: [
    'Tiệm này đúng đẳng cấp luôn.',
    'Nhìn là biết chỗ xịn rồi.',
    'Có cả người nổi tiếng ghé nữa, quá đỉnh.',
    'Xin phép lưu địa chỉ.',
    'Hâm mộ lắm, ghé tiệm nhiều nha.',
    'Chắc phải thử một lần.',
  ],
  kol: [
    'Mi Mi review lúc nào cũng thật.',
    'Đúng gu mình, mai đi liền!',
    'Xem video xong muốn đi ngay.',
    'Mi Mi ơi, review tiếp chỗ khác nha.',
    'Thích cách Mi Mi nói chuyện ghê.',
    'Quay đẹp quá, tiệm này có gì hot?',
  ],
  rival: [
    '{rival} đừng thách nữa, tiệm này làm kỹ lắm.',
    'Mình ủng hộ tiệm này tới cùng!',
    'Mình là khách quen, thấy tiệm này xịn hơn.',
    'Bên đó đông khách mà, ráng lên tiệm ơi!',
    'Thách thì thách, tiệm mình không sợ.',
    'Cố lên tiệm ơi, cả xóm ủng hộ.',
    'Mình đi cả hai nơi, vẫn chọn tiệm này.',
  ],
  shop: [
    'Chúc mừng tiệm nha!',
    'Giỏi quá, tiệm ngày càng đẹp.',
    'Mừng cho tiệm, ráng phát triển nhé.',
    'Tiệm xịn ghê, ghé liền!',
    'Vui lây luôn!',
    'Mấy bữa nữa mình ghé chúc mừng.',
  ],
  ward: [
    'Chúc mừng tiệm đạt giấy khen!',
    'Tiệm sạch sẽ thật, mình thấy rồi.',
    'Phường khen là chuẩn rồi.',
    'Giỏi quá tiệm ơi.',
    'Có giấy khen, khách càng yên tâm.',
    'Hay lắm, giữ vững nha tiệm.',
  ],
}
