/** A whole count with its thousands grouped by dots: 1.000. */
export function formatCount(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function formatMoney(n: number): string {
  return formatCount(n) + ' đ'
}
