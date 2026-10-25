export const vi = {
  loading: 'Đang tải...',
  dayLabel: 'Ngày {day}',
  hintFirstCustomer: 'Chạm vào khách đang chờ để mời gội đầu',
  stationsBusy: 'Giường gội đầu đang bận',
  comingSoon: 'Tính năng này có ở bản sau',
  paused: 'Tạm dừng',
  tapToResume: 'Chạm để chơi tiếp',
  shampooFoam: 'Vuốt qua lại trên tóc để tạo bọt',
  shampooRinse: 'Giữ ngón tay trên tóc để xả nước',
  shampooDry: 'Vuốt để lau khô bằng khăn',
  shampooDone: 'Xong rồi!',
  summaryTitle: 'Tổng kết ngày {day}',
  served: 'Khách đã phục vụ',
  leftUnhappy: 'Khách bỏ về',
  income: 'Tiền dịch vụ',
  tips: 'Tiền tip',
  balance: 'Tiền hiện có',
  rating: 'Đánh giá',
  noRating: 'Chưa có',
  newDay: 'Ngày mới',
  navBuild: 'Xây dựng',
  navStaff: 'Nhân viên',
  navServices: 'Dịch vụ',
  navQuests: 'Nhiệm vụ',
} as const

export type StringKey = keyof typeof vi

export function t(key: StringKey, params?: Record<string, string | number>): string {
  const text: string = vi[key]
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match))
}
