import fc from 'fast-check'
import { addDays, getDay, getDaysInMonth, parseISO } from 'date-fns'
import { afterAll, describe, expect, it } from 'vitest'
import { freeDays } from '@/lib/commonOff'
import { iso, monthGrid } from '@/lib/dates'
import { isNightShift } from '@/lib/night'
import { BUILTIN_PRESETS, works } from '@/lib/presets'
import { toLocalShift, toUtcInput } from '@/lib/tz'

const ZONES = ['UTC', 'Europe/Moscow', 'Asia/Vladivostok', 'America/New_York', 'Asia/Kathmandu', 'Australia/Lord_Howe', 'Pacific/Auckland']
const originalTz = process.env.TZ
afterAll(() => {
  if (originalTz === undefined) delete process.env.TZ
  else process.env.TZ = originalTz
})

const p2 = (n: number) => String(n).padStart(2, '0')
const time = fc.tuple(fc.integer({ min: 0, max: 23 }), fc.integer({ min: 0, max: 59 })).map(([h, m]) => `${p2(h)}:${p2(m)}`)
const date = fc.date({ min: new Date('2020-01-01T12:00:00Z'), max: new Date('2032-12-31T12:00:00Z'), noInvalidDate: true }).map((d) => d.toISOString().slice(0, 10))
const shift = fc.record({ date, start: time, end: time })

/** `HH:mm` on `day` that falls into a DST gap does not exist locally; the Date constructor silently moves it. */
const existsLocally = (day: string, t: string) => {
  const [y, m, d] = day.split('-').map(Number)
  const at = new Date(y!, m! - 1, d!, +t.slice(0, 2), +t.slice(3))
  return at.getHours() === +t.slice(0, 2) && at.getMinutes() === +t.slice(3)
}

describe('tz conversion properties', () => {
  it.each(ZONES)('emits well-formed UTC fields in %s', (tz) => {
    process.env.TZ = tz
    fc.assert(
      fc.property(shift, (s) => {
        const u = toUtcInput(s)
        expect(u.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(u.start).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/)
        expect(u.end).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/)
      }),
    )
  })

  it.each(ZONES)('local -> UTC -> local keeps the shift in %s', (tz) => {
    process.env.TZ = tz
    fc.assert(
      fc.property(
        shift.filter((s) => s.start !== s.end && existsLocally(s.date, s.start) && existsLocally(s.date, s.end)),
        (s) => {
          // an overnight shift ends on the next day; that wall-clock time must exist too
          const endDay = s.end <= s.start ? iso(addDays(parseISO(s.date), 1)) : s.date
          fc.pre(existsLocally(endDay, s.end))
          expect(toLocalShift(toUtcInput(s))).toEqual({ ...s, note: undefined })
        },
      ),
      { numRuns: 500 },
    )
  })

  it.each(ZONES)('UTC -> local -> UTC returns the stored shift in %s', (tz) => {
    process.env.TZ = tz
    fc.assert(
      fc.property(
        shift.filter((s) => s.start !== s.end),
        (s) => {
          const local = toLocalShift(s)
          const endDay = local.end <= local.start ? iso(addDays(parseISO(local.date), 1)) : local.date
          fc.pre(existsLocally(local.date, local.start) && existsLocally(endDay, local.end))
          expect(toUtcInput(local)).toEqual({ ...s, note: undefined })
        },
      ),
      { numRuns: 500 },
    )
  })
})

describe('isNightShift', () => {
  it('is always true for shifts crossing midnight', () => {
    fc.assert(
      fc.property(time, time, (start, end) => {
        fc.pre(end <= start)
        expect(isNightShift({ start, end })).toBe(true)
      }),
    )
  })

  it('is false for daytime shifts that finish before 22:00 start', () => {
    fc.assert(
      fc.property(time, time, (start, end) => {
        fc.pre(end > start && start < '22:00')
        expect(isNightShift({ start, end })).toBe(false)
      }),
    )
  })
})

describe('freeDays', () => {
  const range = fc.tuple(date, fc.integer({ min: 0, max: 60 })).map(([from, n]) => ({ from, to: iso(addDays(parseISO(from), n)), n }))

  it('returns exactly the days of the range that are not busy, in order', () => {
    fc.assert(
      fc.property(range, fc.array(date, { maxLength: 40 }), ({ from, to, n }, busy) => {
        const free = freeDays(busy, from, to)
        const inRange = new Set(Array.from({ length: n + 1 }, (_, i) => iso(addDays(parseISO(from), i))))
        const busyInRange = new Set(busy.filter((d) => inRange.has(d)))
        expect(free).toHaveLength(inRange.size - busyInRange.size)
        expect(free.every((d) => inRange.has(d) && !busy.includes(d))).toBe(true)
        expect([...free].sort()).toEqual(free)
      }),
    )
  })
})

describe('monthGrid', () => {
  it('is whole Monday-first weeks that cover the month without gaps', () => {
    fc.assert(
      fc.property(fc.date({ min: new Date('2000-01-01'), max: new Date('2060-01-01'), noInvalidDate: true }), (month) => {
        const days = monthGrid(month)
        expect(days.length % 7).toBe(0)
        expect(getDay(days[0]!)).toBe(1)
        expect(getDay(days.at(-1)!)).toBe(0)
        days.slice(1).forEach((d, i) => expect(iso(d)).toBe(iso(addDays(days[i]!, 1))))
        const inMonth = days.filter((d) => d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear())
        expect(inMonth).toHaveLength(getDaysInMonth(month))
      }),
    )
  })
})

describe('presets', () => {
  const cycles = BUILTIN_PRESETS.filter((p) => p.rule.type === 'cycle')
  const weekdays = BUILTIN_PRESETS.filter((p) => p.rule.type === 'weekdays')

  it('cycle presets work exactly `work` days out of every `work + off`', () => {
    fc.assert(
      fc.property(fc.constantFrom(...cycles), fc.integer({ min: 1, max: 30 }), fc.integer({ min: 0, max: 6 }), (p, periods, dow) => {
        if (p.rule.type !== 'cycle') return
        const len = p.rule.work + p.rule.off
        const days = Array.from({ length: periods * len }, (_, i) => works(p, i, (dow + i) % 7))
        expect(days.filter(Boolean)).toHaveLength(periods * p.rule.work)
        expect(days.slice(0, p.rule.work).every(Boolean)).toBe(true)
      }),
    )
  })

  it('weekday presets depend on the weekday only', () => {
    fc.assert(
      fc.property(fc.constantFrom(...weekdays), fc.integer({ min: 0, max: 400 }), fc.integer({ min: 0, max: 6 }), (p, offset, dow) => {
        if (p.rule.type !== 'weekdays') return
        expect(works(p, offset, dow)).toBe(p.rule.days.includes(dow))
      }),
    )
  })

  it('the plain preset only marks the first day', () => {
    const plain = BUILTIN_PRESETS.find((p) => p.rule.type === 'weekly')!
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 400 }), fc.integer({ min: 0, max: 6 }), (o, d) => {
        expect(works(plain, o, d)).toBe(o === 0)
      }),
    )
  })
})
