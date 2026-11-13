export interface TimelinePerson {
  id: string
  name: string
  color: string
}

export interface TimelineEntry {
  who: string
  start: string
  end: string
}

/** Half-open time range in decimal hours, 0 ≤ from < to ≤ 24. */
export interface Segment {
  from: number
  to: number
}

export interface BarDatum {
  value: [index: number, from: number, to: number]
  name: string
  color: string
  start: string
  end: string
}

const TIME_RE = /^(\d{1,2}):(\d{2})$/

/** Converts `HH:mm` to decimal hours; `null` for malformed or out-of-range input. */
export function parseTime(value: string): number | null {
  const match = TIME_RE.exec(value)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours + minutes / 60
}

/**
 * Splits a shift into segments that fit inside a single 24-hour axis.
 * A shift that ends at or before its start is treated as a full-day shift (as before),
 * so `22:00–06:00` becomes `22:00–24:00` + `00:00–06:00`.
 */
export function shiftSegments(start: string, end: string): Segment[] | null {
  const from = parseTime(start)
  let to = parseTime(end)
  if (from === null || to === null) return null
  if (to <= from) to += 24
  if (to <= 24) return [{ from, to }]
  return [
    { from, to: 24 },
    { from: 0, to: to - 24 },
  ]
}

/** Flattens people's entries into chart data; `value` is `[personIndex, from, to]`. */
export function buildBarData(
  people: TimelinePerson[],
  entries: TimelineEntry[],
): BarDatum[] {
  return people.flatMap((person, index) =>
    entries
      .filter((entry) => entry.who === person.id)
      .flatMap((entry) => {
        const segments = shiftSegments(entry.start, entry.end)
        if (!segments) return []
        return segments.map((segment) => ({
          value: [index, segment.from, segment.to] as [number, number, number],
          name: person.name,
          color: person.color,
          start: entry.start,
          end: entry.end,
        }))
      }),
  )
}
