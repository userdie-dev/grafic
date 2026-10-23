import { iso } from './dates'
import type { Shift, ShiftInput } from './dto'

/** The server stores shift dates and times in UTC; the UI shows them in the device's zone. */

const p2 = (n: number) => String(n).padStart(2, '0')
const hm = (d: Date) => `${p2(d.getHours())}:${p2(d.getMinutes())}`
const hmUtc = (d: Date) => `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`
const DAY = 24 * 3600_000

/** Instants of a stored shift; an end that is not after the start means it crosses midnight. */
function span(date: string, start: string, end: string, offset: (ms: number, time: string) => number) {
  const s = offset(Date.parse(`${date}T00:00:00Z`), start)
  let e = offset(Date.parse(`${date}T00:00:00Z`), end)
  if (e <= s) e += DAY
  return [s, e] as const
}

const addTime = (day: number, time: string) => day + (+time.slice(0, 2) * 60 + +time.slice(3)) * 60_000

/** UTC shift from the server -> device-local shift. */
export function toLocalShift<T extends Pick<Shift, 'date' | 'start' | 'end'>>(shift: T): T {
  const [s, e] = span(shift.date, shift.start, shift.end, addTime)
  const start = new Date(s)
  return { ...shift, date: iso(start), start: hm(start), end: hm(new Date(e)) }
}

/** Device-local shift being saved -> UTC shift for the server. */
export function toUtcInput(shift: ShiftInput): ShiftInput {
  const [y, m, d] = shift.date.split('-').map(Number)
  // an overnight shift ends on the next calendar day, not 24 hours later: the two differ on DST change nights
  const at = (day: number) => (time: string) => new Date(y!, m! - 1, day, +time.slice(0, 2), +time.slice(3))
  const start = at(d!)(shift.start)
  const end = at(shift.end <= shift.start ? d! + 1 : d!)(shift.end)
  return {
    ...shift,
    date: `${start.getUTCFullYear()}-${p2(start.getUTCMonth() + 1)}-${p2(start.getUTCDate())}`,
    start: hmUtc(start),
    end: hmUtc(end),
  }
}
