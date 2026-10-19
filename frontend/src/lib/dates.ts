import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'

export const iso = (d: Date) => format(d, 'yyyy-MM-dd')

/** Monday-first grid of days covering the month. */
export function monthGrid(month: Date) {
  return eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  })
}

export const gridRange = (month: Date) => {
  const days = monthGrid(month)
  return { from: iso(days[0]!), to: iso(days[days.length - 1]!) }
}

export const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
