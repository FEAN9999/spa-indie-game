/** Top bar row in canvas px: money from moneyX, then the star and rating, then day/time right-aligned at dayRight. */
export const TOP_BAR = { moneyX: 135, starLeft: 441, starW: 38, dayRight: 935 }
const GAP = 16
const DAY_GAP = 24

export interface TopBarLayout {
  moneyScale: number
  starX: number
  ratingX: number
}

/** Keeps the star at the board's spot, pushes it right of long money, and shrinks the money only if the row would reach the day/time. */
export function layoutTopBar(moneyW: number, ratingW: number, dayW: number): TopBarLayout {
  // the furthest right the star can sit with the rating still clear of the day/time
  const latestStar = TOP_BAR.dayRight - dayW - DAY_GAP - ratingW - GAP - TOP_BAR.starW
  const moneyScale = Math.min(1, (latestStar - GAP - TOP_BAR.moneyX) / moneyW)
  const starLeft = Math.max(Math.min(TOP_BAR.starLeft, latestStar), TOP_BAR.moneyX + moneyW * moneyScale + GAP)
  return { moneyScale, starX: starLeft + TOP_BAR.starW / 2, ratingX: starLeft + TOP_BAR.starW + GAP }
}
