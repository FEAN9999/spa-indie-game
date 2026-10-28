import { DAYS_PER_MONTH, RANK_FROM_DAY, RANK_PRICE_STEP, RANK_STAR_AT, RIVAL_SCORE_MAX, RIVAL_YEAR_STEP } from '../config'
import { monthStart } from '../sim/calendar'
import { rivalsFor, starsFor, type MonthResult, type RankInput, type RivalId, type Stars, type YearResult, type YearRow } from '../sim/rank'
import { formatMoney } from '../strings/format'
import { t } from '../strings/vi'

export const RANK_PART_ICON = ['badge-star', 'badge-sparkle', 'badge-lotus', 'badge-people', 'badge-heart']

const RIVAL_NAME: Record<RivalId, Parameters<typeof t>[0]> = {
  coBa: 'rankRivalCoBa', ngocLan: 'rankRivalNgocLan', hoaSen: 'rankRivalHoaSen', spaMoi: 'rivalSignName',
}

const pricePct = (stars: Stars): number => Math.round(RANK_PRICE_STEP * (stars - 1) * 100)

/** The five parts of the grade as rows: name, the shop's number and the points it earned. */
export function partRows(input: RankInput, parts: number[]): { icon: string; name: string; value: string; pts: number }[] {
  const values = [
    input.rating === null ? t('rankNoRating') : String(Math.round(input.rating * 10) / 10).replace('.', ','),
    String(Math.round(input.beauty)),
    t('rankServicesValue', { n: input.services }),
    t('rankServedValue', { n: Math.round(input.servedPerDay) }),
    `${Math.round((input.lostShare ?? 0) * 100)}%`,
  ]
  const names = ['rankPartRating', 'rankPartBeauty', 'rankPartServices', 'rankPartServed', 'rankPartLost'] as const
  return names.map((name, i) => ({ icon: RANK_PART_ICON[i], name: t(name), value: values[i], pts: parts[i] }))
}

export const starsLine = (stars: Stars): string =>
  stars === 1 ? t('rankStars', { n: stars }) : t('rankStarsPrice', { n: stars, pct: pricePct(stars) })

/** The last day of the month `day` is in, but never before the first judged day. */
export const judgeDayOf = (day: number): number => Math.max(RANK_FROM_DAY, monthStart(day) + DAYS_PER_MONTH - 1)

export function totalLine(total: number, stars: Stars, judgeDay: number): string {
  if (stars === 5) return t('rankTotalTop', { total })
  const next = stars + 1
  if (starsFor(total) > stars) return t('rankTotalEnough', { total, next, day: judgeDay })
  return t('rankTotalNeed', { total, need: RANK_STAR_AT[stars - 1], next })
}

export function monthOutcome(r: MonthResult): { head: string; sub: string } {
  if (r.after > r.before) {
    const more = starsFor(r.total) > r.after ? t('rankUpMore') : ''
    return {
      head: t('rankUpHead', { n: r.after }),
      sub: t('rankUpSub', { money: formatMoney(r.reward), pct: pricePct(r.after) }) + more,
    }
  }
  const head = t('rankKeepHead', { n: r.after })
  if (r.after === 5) return { head, sub: t('rankKeepTop') }
  return { head, sub: t('rankKeepSub', { left: RANK_STAR_AT[r.after - 1] - r.total, next: r.after + 1 }) }
}

/** A year table's rows as texts: the name (the shop's own for its row), the points and whether it is the shop. */
export const yearRows = (table: YearRow[], shopName: string): { name: string; pts: string; me: boolean }[] =>
  table.map(row => ({
    name: row.rival === null ? shopName : t(RIVAL_NAME[row.rival]),
    pts: t('rankRowPts', { n: row.pts }),
    me: row.rival === null,
  }))

export function yearLines(r: YearResult, shopName: string): { rows: { name: string; pts: string; me: boolean }[]; lines: string[]; button: string } {
  const rows = yearRows(r.table, shopName)
  const money = formatMoney(r.reward)
  const lines: string[] = []
  if (r.place === 1) {
    lines.push(t('yearFirst', { money }))
    if (r.gifts.includes('trophy')) lines.push(t('yearTrophy'))
  } else if (r.place === 2) lines.push(t(r.gifts.includes('merit') ? 'yearSecondMerit' : 'yearSecond', { money }))
  else if (r.place === 3) lines.push(t('yearThird', { money }))
  else lines.push(t('yearLast'))
  if (rivalsFor(r.year + 1).some(x => x.pts < RIVAL_SCORE_MAX)) lines.push(t('yearNext', { next: r.year + 1, step: RIVAL_YEAR_STEP }))
  lines.push(t('yearScore', { score: r.score }))
  return { rows, lines, button: t(r.place <= 3 ? 'yearClaim' : 'yearClose') }
}
