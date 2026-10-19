import { addDays, parseISO } from 'date-fns'
import { iso } from '@/lib/dates'

/** Days in [from, to] that are not in `busy` (dates on which at least one person has a shift). */
export function freeDays(busy: Iterable<string>, from: string, to: string): string[] {
  const taken = new Set(busy)
  const days: string[] = []
  for (let d = parseISO(from), end = parseISO(to); d <= end; d = addDays(d, 1)) {
    if (!taken.has(iso(d))) days.push(iso(d))
  }
  return days
}
