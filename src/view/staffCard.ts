import type { Chain } from '../sim/chain'
import type { PlaceId } from '../sim/places'
import { SERVICE_IDS, SERVICES, type ServiceId } from '../sim/services'
import type { SpaSim } from '../sim/spa'
import { courses, tuition, type Candidate, type Course, type Staff, type TraitId } from '../sim/staff'
import { t, type StringKey } from '../strings/vi'

/** The services a person has a tier in, in service order; `dim` when the shop has not opened them. */
export function specialtyOf(person: Pick<Candidate, 'tiers'>, open: readonly ServiceId[]): { service: ServiceId; tier: number; dim: boolean }[] {
  return SERVICE_IDS.filter(id => person.tiers[id] > 0).map(id => ({ service: id, tier: person.tiers[id], dim: !open.includes(id) }))
}

/** A course in lower case, for the middle of a sentence. */
export const courseName = (course: Course): string => (course === 'greet' ? t('courseGreet') : t(SERVICES[course].name).toLocaleLowerCase('vi'))

const TRAIT_KEYS: Record<TraitId, [StringKey, StringKey]> = {
  deft: ['traitDeft', 'flawDeft'],
  quick: ['traitQuick', 'flawQuick'],
  jolly: ['traitJolly', 'flawJolly'],
  diligent: ['traitDiligent', 'flawDiligent'],
  calm: ['traitCalm', 'flawCalm'],
  studious: ['traitStudious', 'flawStudious'],
}

/** A trait's good side and its flaw, for the two lines of the pill on a staff card. */
export const traitLines = (trait: TraitId): [string, string] => [t(TRAIT_KEYS[trait][0]), t(TRAIT_KEYS[trait][1])]

export type StudyButton = { kind: 'booked'; course: Course } | { kind: 'best' } | { kind: 'noMoney' } | { kind: 'open'; courses: Course[] }

/** What the study button shows for `s`: tonight's course, nothing left to learn, too little money, or the courses to pick from. */
export function studyButton(sim: SpaSim, s: Staff): StudyButton {
  if (s.study) return { kind: 'booked', course: s.study.course }
  const open = courses(s, sim.services)
  if (open.length === 0) return { kind: 'best' }
  if (sim.money < Math.min(...open.map(c => tuition(s, c)))) return { kind: 'noMoney' }
  return { kind: 'open', courses: open }
}

/** The shops `id` can be sent to from `from`: every open one but `from`, the main shop first, then the branches in place order, `full` when it has no room. */
export const moveOptions = (chain: Chain, from: PlaceId | null, id: number): { place: PlaceId | null; full: boolean }[] =>
  [null, ...chain.branches.map(b => b.place!)]
    .filter(place => place !== from)
    .map(place => ({ place, full: chain.moveProblem(from, id, place) === 'full' }))
