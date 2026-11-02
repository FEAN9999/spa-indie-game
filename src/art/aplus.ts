import { C } from './palette'

// Nét vẽ A+ (bảng "Bảng nét vẽ A+"): giữ viền nâu và bảng màu cũ, thêm một mảng bóng mép cứng,
// một điểm sáng và bóng sàn. Các hình vẽ lại theo A+ lấy màu và nét từ đây để đồng đều với nhau.

const WARM_DARK = '#3A2418'
const channels = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))

/** Màu của mảng bóng: `hex` tối đi `t` (mặc định 16%) về phía nâu ấm, không ngả xám. */
export function shade(hex: string, t = 0.16): string {
  const dark = channels(WARM_DARK)
  return '#' + channels(hex).map((v, i) => Math.round(v + (dark[i] - v) * t).toString(16).padStart(2, '0')).join('').toUpperCase()
}

/** Bóng của phần vẽ trắng để tô màu da, tóc: nhân với màu tô ra màu đó tối hơn 16%. */
export const TINT_SHADE = shade('#FFFFFF')

/** Điểm sáng: trắng 45%, không viền. Trên phần được tô màu thì đặt ở lớp nét, vì lớp nét không bị tô. */
export const HIGHLIGHT = 'fill="#FFFFFF" opacity=".45"'

/** Bóng sàn: elip nâu 18%. */
export const GROUND = `fill="${C.ink}" opacity=".18"`

/** Nét nâu dày `w` điểm ảnh; viền ngoài dày nhất, nét trong khoảng 60%, nét chi tiết khoảng 40%. */
export const ink = (w: number) => `stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`
