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
  
  // Parse time, supporting hours >= 24 for next-day end times
  const parseTime = (time: string) => {
    const [h, min] = time.split(':').map(Number)
    return { hours: h!, minutes: min! }
  }
  
  const startTime = parseTime(shift.start)
  const endTime = parseTime(shift.end)
  
  // Start time on the selected day
  const start = new Date(y!, m! - 1, d!, startTime.hours, startTime.minutes)
  
  // End time: if hours >= 24, it's next day
  let endDay = d!
  let endHours = endTime.hours
  if (endHours >= 24) {
    endDay = d! + 1
    endHours = endHours - 24
  } else if (endTime.hours < startTime.hours || (endTime.hours === startTime.hours && endTime.minutes <= startTime.minutes)) {
    // End time is earlier than start, so it's next day
    endDay = d! + 1
  }
  
  const end = new Date(y!, m! - 1, endDay, endHours, endTime.minutes)
  
  return {
    ...shift,
    date: `${start.getUTCFullYear()}-${p2(start.getUTCMonth() + 1)}-${p2(start.getUTCDate())}`,
    start: hmUtc(start),
    end: hmUtc(end),
  }
}
