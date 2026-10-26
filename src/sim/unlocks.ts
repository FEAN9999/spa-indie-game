import { UNLOCK_DAY } from '../config'

export type Feature = keyof typeof UNLOCK_DAY

export const isUnlocked = (f: Feature, day: number): boolean => day >= UNLOCK_DAY[f]
