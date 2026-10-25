export function formatMoney(n: number): string {
  const digits = String(Math.round(n))
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' đ'
}
