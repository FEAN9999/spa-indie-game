import type { BustleId } from '../sim/bustle'

export interface BustleText { name: string; where: string; line: string }

/** Each piece of the street: its name, where it goes, and the line on its card. */
export const BUSTLE_TEXT: Record<BustleId, BustleText> = {
  trees: { name: 'Hàng cây me', where: 'Vỉa hè', line: 'Năm cây me che mát vỉa hè trước các tiệm.' },
  lamps: { name: 'Đèn đường', where: 'Vỉa hè', line: 'Bốn cột đèn, sáng lên lúc chiều tối cùng đèn trong tiệm.' },
  benches: { name: 'Ghế đá', where: 'Vỉa hè', line: 'Hai ghế đá cho người qua đường ngồi nghỉ.' },
  banhMi: { name: 'Xe bánh mì Cô Hạnh', where: 'Vỉa hè', line: 'Cô Hạnh bán bánh mì đầu hẻm dời xe ra trước tiệm.' },
  sugarcane: { name: 'Xe nước mía', where: 'Vỉa hè', line: 'Xe nước mía kèm vài ghế nhựa đỏ.' },
  busStop: { name: 'Trạm xe buýt', where: 'Bên kia đường', line: 'Xe buýt dừng bên kia đường, thả người xuống ngay trước tiệm.' },
  park: { name: 'Công viên hồ sen', where: 'Bên kia đường', line: 'Bãi đất trống thành công viên nhỏ có hồ sen, cây và ghế đá.' },
  nightMarket: { name: 'Chợ đêm', where: 'Bên kia đường', line: 'Bốn sạp hàng giăng đèn lồng, dọn hàng từ 17:00. Ban ngày sạp phủ bạt.' },
}
