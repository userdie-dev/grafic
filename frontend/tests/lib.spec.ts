import { describe, expect, it } from 'vitest'
import { WEEKDAYS, gridRange, iso, monthGrid } from '@/lib/dates'
import { MOCK_FRIENDS, mockShifts } from '@/lib/mock'
import { BUILTIN_PRESETS, describe as describePreset, works, type Preset } from '@/lib/presets'
import { freeDays } from '@/lib/commonOff'
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
  const [weekly, five, , twoTwo] = BUILTIN_PRESETS as [Preset, Preset, Preset, Preset]

  it('describes presets', () => {
    expect(describePreset(five)).toBe(five.hint) // explicit hint wins
    expect(describePreset(twoTwo)).toBe('2 раб., 2 вых., начиная с выбранного дня')
    expect(describePreset(weekly)).toBe('')
    const wd: Preset = { ...five, hint: '', rule: { type: 'weekdays', days: [0, 3, 1] } }
    expect(describePreset(wd)).toBe('Рабочие дни: Пн, Ср, Вс')
  })

  it('decides working days', () => {
    expect([0, 1, 2, 3, 4].map((i) => works(twoTwo, i, 0))).toEqual([true, true, false, false, true])
    expect(works(five, 0, 1)).toBe(true)
    expect(works(five, 0, 6)).toBe(false)
    expect(works(weekly, 0, 3)).toBe(true)
    expect(works(weekly, 1, 3)).toBe(false)
  })
})

describe('freeDays', () => {
  it('lists the days of the range that are not busy', () => {
    expect(freeDays(['2030-01-02', '2030-01-02', '2029-12-01'], '2030-01-01', '2030-01-04')).toEqual(['2030-01-01', '2030-01-03', '2030-01-04'])
  })
  it('is empty when every day is busy', () => expect(freeDays(['2030-01-01'], '2030-01-01', '2030-01-01')).toEqual([]))
})
