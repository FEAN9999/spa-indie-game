import { SERVICE_IDS, SERVICES, type ServiceId } from '../sim/services'
import type { SpaSim } from '../sim/spa'
import { courses, tuition, type Candidate, type Course, type Staff } from '../sim/staff'
import { t } from '../strings/vi'

/** The services a person has a tier in, in service order; `dim` when the shop has not opened them. */
export function specialtyOf(person: Pick<Candidate, 'tiers'>, open: readonly ServiceId[]): { service: ServiceId; tier: number; dim: boolean }[] {
  return SERVICE_IDS.filter(id => person.tiers[id] > 0).map(id => ({ service: id, tier: person.tiers[id], dim: !open.includes(id) }))
}

/** A course in lower case, for the middle of a sentence. */
export const courseName = (course: Course): string => (course === 'greet' ? t('courseGreet') : t(SERVICES[course].name).toLocaleLowerCase('vi'))

export type StudyButton = { kind: 'booked'; course: Course } | { kind: 'best' } | { kind: 'noMoney' } | { kind: 'open'; courses: Course[] }

/** What the study button shows for `s`: tonight's course, nothing left to learn, too little money, or the courses to pick from. */
export function studyButton(sim: SpaSim, s: Staff): StudyButton {
  if (s.study) return { kind: 'booked', course: s.study.course }
  const open = courses(s, sim.services)
  if (open.length === 0) return { kind: 'best' }
  if (sim.money < Math.min(...open.map(c => tuition(s, c)))) return { kind: 'noMoney' }
  return { kind: 'open', courses: open }
}
