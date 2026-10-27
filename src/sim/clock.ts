import { DAY_END_MIN, DAY_START_MIN, REAL_MS_PER_GAME_MIN } from '../config'

/** "HH:MM" from the whole minute of the day. */
export function clockLabel(minutes: number): string {
  const m = Math.floor(minutes)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
}

export class DayClock {
  minutes = DAY_START_MIN

  advance(realMs: number): void {
    this.minutes = Math.min(DAY_END_MIN, this.minutes + realMs / REAL_MS_PER_GAME_MIN)
  }

  get isClosed(): boolean {
    return this.minutes >= DAY_END_MIN
  }

  label(): string {
    return clockLabel(this.minutes)
  }

  reset(): void {
    this.minutes = DAY_START_MIN
  }
}
