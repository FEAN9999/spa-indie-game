import { LESSON_STARS } from '../config'
import { LESSON_SERVICES, SERVICE_IDS, SERVICES, type LessonService } from '../sim/services'
import { stockItemsFor } from '../sim/stock'
import type { SpaSim } from '../sim/spa'
import { formatMoney } from '../strings/format'
import { t } from '../strings/vi'

export type Tab = 'services' | 'stock'

/** Rows a page of the services and stock panels. */
export const PANEL_ROWS = 6

/** One page of `rows`, `page` wrapped both ways. */
export function panelPage<T>(rows: readonly T[], page: number): { rows: T[]; page: number; pages: number } {
  const pages = Math.max(1, Math.ceil(rows.length / PANEL_ROWS))
  const wrapped = ((page % pages) + pages) % pages
  return { rows: rows.slice(wrapped * PANEL_ROWS, (wrapped + 1) * PANEL_ROWS), page: wrapped, pages }
}

export const rowPage = (index: number): number => Math.floor(index / PANEL_ROWS)

/** Where the panel opens: the stock intro first, then a service to learn, then low stock (on the page of its first item); else a paid lesson's page. */
export function servicesOpening(sim: SpaSim, stock: boolean, stockIntro: boolean): { tab: Tab; page: number } {
  const learn = sim.learnable()
  const low = sim.lowStock()
  if (stock && (stockIntro || (!learn && low.length > 0))) {
    return { tab: 'stock', page: low.length > 0 ? rowPage(stockItemsFor(sim.services).indexOf(low[0])) : 0 }
  }
  const target = learn ?? LESSON_SERVICES.find(id => sim.lessonState(id) === 'paid')
  return { tab: 'services', page: target ? rowPage(SERVICE_IDS.indexOf(target)) : 0 }
}

export type LessonAction =
  | { kind: 'note'; text: string }
  | { kind: 'learn'; label: string; faded: boolean }
  | { kind: 'goOn'; label: string }
  | { kind: 'learned' }

/** What a lesson service's action column shows. A paid lesson always goes on, whatever the stars now. */
export function lessonAction(sim: SpaSim, id: LessonService): LessonAction {
  const state = sim.lessonState(id)
  if (state === 'yes') return { kind: 'learned' }
  const problem = sim.lessonProblem(id)
  if (problem === 'main') return { kind: 'note', text: t('serviceAtMain') }
  if (state === 'paid') return { kind: 'goOn', label: t('learnGoOn') }
  if (problem === 'stars') return { kind: 'note', text: t('learnNeedStars', { n: LESSON_STARS[id] }) }
  if (problem === 'order') return { kind: 'note', text: t('serviceOrder', { name: t(SERVICES.massage.name) }) }
  return { kind: 'learn', label: t('learnButton', { money: formatMoney(SERVICES[id].openCost) }), faded: problem !== null }
}
