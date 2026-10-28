import type { SpaSim } from '../sim/spa'
import { eventLine, hotLine } from './events'
import { festivalLine } from './festivals'
import { goalLine } from './starter'

/** One line over the floor buttons: a picture in a coloured disc and a short sentence. */
export interface TodayLine {
  icon: { texture: string; disc: string }
  text: string
}

/** What today is about, the first that applies: an event, the festival, a hot day, then the starter goal. */
export function todayLine(sim: SpaSim): TodayLine | null {
  return eventLine(sim) ?? festivalLine(sim) ?? hotLine(sim) ?? goalLine(sim)
}

/** Today's line while the shop is in view: none once the day is over or while a panel covers the shop. */
export function todayShown(sim: SpaSim, covered: boolean): TodayLine | null {
  return covered || sim.dayOver ? null : todayLine(sim)
}
