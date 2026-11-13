import { shiftSegments, type Segment } from './dayTimeline'

/** Minimum useful shared window; shorter gaps between shifts do not count as free hours. */
export const MIN_FREE_HOURS = 1

/**
 * Windows of the day (0–24) when nobody has a shift, i.e. the intersection of
 * everyone's free hours. Overnight shifts are split at midnight, so their tail
 * lands on the same calendar day as the shift itself.
 */
export function commonFreeWindows(
  shifts: Iterable<{ start: string; end: string }>,
  minHours = MIN_FREE_HOURS,
): Segment[] {
  const busy = [...shifts]
    .flatMap((shift) => shiftSegments(shift.start, shift.end) ?? [])
    .sort((a, b) => a.from - b.from)

  const free: Segment[] = []
  let cursor = 0
  for (const window of busy) {
    if (window.from - cursor >= minHours) free.push({ from: cursor, to: window.from })
    cursor = Math.max(cursor, window.to)
  }
  if (24 - cursor >= minHours) free.push({ from: cursor, to: 24 })
  return free
}
