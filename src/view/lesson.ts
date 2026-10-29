import { ITEMS } from '../sim/items'
import { SERVICES, type LessonService } from '../sim/services'
import { t, type StringKey } from '../strings/vi'

const HOW_TO: Record<LessonService, readonly [StringKey, StringKey]> = { scrub: ['learnHowScrub1', 'learnHowScrub2'], foot: ['learnHowFoot1', 'learnHowFoot2'], nails: ['learnHowNails1', 'learnHowNails2'] }

/** "Học Chà muối biển". */
export const lessonTitle = (id: LessonService): string => t('learnTitle', { name: t(SERVICES[id].name) })

/** The two lines that say how the lesson game is played. */
export const lessonHowTo = (id: LessonService): readonly [string, string] => [t(HOW_TO[id][0]), t(HOW_TO[id][1])]

/** The pass card's line: the service now learned and the bed given in the gift box. */
export const lessonPassLine = (id: LessonService): string => t('learnPassLine', { name: t(SERVICES[id].name), bed: t(ITEMS[SERVICES[id].bed].name) })
