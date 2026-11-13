import { describe, expect, it } from 'vitest'
import { WEEKDAYS, gridRange, iso, monthGrid } from '@/lib/dates'
import { MOCK_FRIENDS, mockShifts } from '@/lib/mock'
import { BUILTIN_PRESETS, describe as describePreset, works, type Preset } from '@/lib/presets'
import { freeDays } from '@/lib/commonOff'
import { commonFreeWindows } from '@/lib/freeHours'
import { deviceTimeZone, holidayAt, holidayName, zonedIso } from '@/lib/holidays'
import { cn } from '@/lib/utils'

describe('dates', () => {
  it('formats iso dates', () => expect(iso(new Date(2030, 0, 5))).toBe('2030-01-05'))

  it('builds a Monday-first grid covering the month', () => {
    const days = monthGrid(new Date(2030, 0, 15)) // Jan 2030 starts on Tuesday
    expect(iso(days[0]!)).toBe('2029-12-31')
    expect(iso(days.at(-1)!)).toBe('2030-02-03')
    expect(days.length % 7).toBe(0)
  })

  it('exposes the grid range', () => expect(gridRange(new Date(2030, 0, 15))).toEqual({ from: '2029-12-31', to: '2030-02-03' }))

  it('has 7 weekday labels', () => expect(WEEKDAYS).toHaveLength(7))
})

describe('utils', () => {
  it('re-exports cn', () => expect(cn('a', 'b')).toContain('a'))
})

describe('mock friends', () => {
  it('returns nothing for unknown ids', () => expect(mockShifts('x', '2030-01-01', '2030-01-31')).toEqual([]))

  it('generates shifts from the weekly pattern', () => {
    // 2030-01-07 is a Monday; Anna works Mon/Tue/Thu/Fri (Fri with a note)
    const shifts = mockShifts('mock-anna', '2030-01-07', '2030-01-13')
    expect(shifts.map((s) => s.date)).toEqual(['2030-01-07', '2030-01-08', '2030-01-10', '2030-01-11'])
    expect(shifts[0]).toEqual({ id: 'mock-anna:2030-01-07', date: '2030-01-07', start: '09:00', end: '18:00', note: null })
    expect(shifts[3]!.note).toBe('Короткий день')
    expect(MOCK_FRIENDS.length).toBeGreaterThan(0)
  })
})

describe('presets', () => {
  const [once, weekly, five, , twoTwo] = BUILTIN_PRESETS as [Preset, Preset, Preset, Preset, Preset]

  it('describes presets', () => {
    expect(describePreset(five)).toBe(five.hint) // explicit hint wins
    expect(describePreset(twoTwo)).toBe('2 раб., 2 вых., начиная с выбранного дня')
    expect(describePreset(weekly)).toBe('')
    expect(describePreset(once)).toBe('Только на выбранный день')
    const wd: Preset = { ...five, hint: '', rule: { type: 'weekdays', days: [0, 3, 1] } }
    expect(describePreset(wd)).toBe('Рабочие дни: Пн, Ср, Вс')
  })

  it('decides working days', () => {
    expect([0, 1, 2, 3, 4].map((i) => works(twoTwo, i, 0))).toEqual([true, true, false, false, true])
    expect(works(five, 0, 1)).toBe(true)
    expect(works(five, 0, 6)).toBe(false)
    expect(works(weekly, 0, 3)).toBe(true)
    expect(works(weekly, 1, 3)).toBe(false)
    expect(works(once, 0, 3)).toBe(true)
    expect(works(once, 1, 3)).toBe(false)
  })
})

describe('commonFreeWindows', () => {
  it('is the whole day when nobody works', () => {
    expect(commonFreeWindows([])).toEqual([{ from: 0, to: 24 }])
  })

  it('returns the gaps between shifts of all people', () => {
    expect(commonFreeWindows([{ start: '09:00', end: '18:00' }])).toEqual([
      { from: 0, to: 9 },
      { from: 18, to: 24 },
    ])
    // overlapping shifts are merged before the gaps are computed
    expect(
      commonFreeWindows([
        { start: '08:00', end: '20:00' },
        { start: '14:00', end: '22:00' },
      ]),
    ).toEqual([
      { from: 0, to: 8 },
      { from: 22, to: 24 },
    ])
  })

  it('splits overnight shifts at midnight', () => {
    expect(commonFreeWindows([{ start: '20:00', end: '06:00' }])).toEqual([{ from: 6, to: 20 }])
  })

  it('has no free hours when the day is busy around the clock', () => {
    expect(commonFreeWindows([{ start: '10:00', end: '10:00' }])).toEqual([])
    expect(
      commonFreeWindows([
        { start: '00:00', end: '12:00' },
        { start: '12:00', end: '00:00' },
      ]),
    ).toEqual([])
  })

  it('ignores unusable gaps and malformed times', () => {
    expect(
      commonFreeWindows(
        [
          { start: '09:00', end: '18:00' },
          { start: '18:30', end: '22:30' },
        ],
        1,
      ),
    ).toEqual([
      { from: 0, to: 9 },
      { from: 22.5, to: 24 },
    ])
    expect(commonFreeWindows([{ start: 'nope', end: '18:00' }])).toEqual([{ from: 0, to: 24 }])
  })
})

describe('holidays', () => {
  it('knows the fixed public holidays', () => {
    expect(holidayName('2030-01-01')).toBe('Новый год')
    expect(holidayName('2030-01-07')).toBe('Рождество Христово')
    expect(holidayName('2030-02-23')).toBe('День защитника Отечества')
    expect(holidayName('2030-03-08')).toBe('Международный женский день')
    expect(holidayName('2030-05-01')).toBe('Праздник Весны и Труда')
    expect(holidayName('2030-05-09')).toBe('День Победы')
    expect(holidayName('2030-06-12')).toBe('День России')
    expect(holidayName('2030-11-04')).toBe('День народного единства')
    expect(holidayName('2030-01-09')).toBeUndefined()
  })

  it('resolves the holiday on the local calendar day of an instant', () => {
    // 22:30 UTC on 31 December is already New Year in Moscow
    const instant = new Date('2030-12-31T22:30:00Z')
    expect(zonedIso(instant, 'UTC')).toBe('2030-12-31')
    expect(zonedIso(instant, 'Europe/Moscow')).toBe('2031-01-01')
    expect(holidayAt(instant, 'Europe/Moscow')).toBe('Новый год')
    expect(holidayAt(instant, 'UTC')).toBeUndefined()
    expect(deviceTimeZone()).toBeTruthy()
  })
})

describe('freeDays', () => {
  it('lists the days of the range that are not busy', () => {
    expect(freeDays(['2030-01-02', '2030-01-02', '2029-12-01'], '2030-01-01', '2030-01-04')).toEqual(['2030-01-01', '2030-01-03', '2030-01-04'])
  })
  it('is empty when every day is busy', () => expect(freeDays(['2030-01-01'], '2030-01-01', '2030-01-01')).toEqual([]))
})
