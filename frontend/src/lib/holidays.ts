/**
 * Non-working public holidays of Russia. Everything is keyed by the *local* calendar
 * day, so the device timezone decides which date a holiday falls on (for example,
 * a UTC instant late on 31 December is already 1 January in UTC+3).
 */
const HOLIDAYS: Record<string, string> = {
  '01-01': 'Новый год',
  '01-02': 'Новогодние каникулы',
  '01-03': 'Новогодние каникулы',
  '01-04': 'Новогодние каникулы',
  '01-05': 'Новогодние каникулы',
  '01-06': 'Новогодние каникулы',
  '01-07': 'Рождество Христово',
  '01-08': 'Новогодние каникулы',
  '02-23': 'День защитника Отечества',
  '03-08': 'Международный женский день',
  '05-01': 'Праздник Весны и Труда',
  '05-09': 'День Победы',
  '06-12': 'День России',
  '11-04': 'День народного единства',
}

/** Name of the holiday on an ISO date (`yyyy-MM-dd`), if any. */
export const holidayName = (date: string): string | undefined => HOLIDAYS[date.slice(5)]

/** The device's IANA timezone; `UTC` when the runtime cannot report one. */
export const deviceTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

/** ISO calendar day of an instant as seen in `timeZone`. */
export function zonedIso(instant: Date, timeZone = deviceTimeZone()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)!.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

/** Holiday on the local calendar day of an instant (timezone-aware). */
export const holidayAt = (instant: Date, timeZone = deviceTimeZone()): string | undefined =>
  holidayName(zonedIso(instant, timeZone))
