import { afterEach, describe, expect, it } from 'vitest'
import { toLocalShift, toUtcInput } from '@/lib/tz'

describe('UTC <-> local shifts', () => {
  it('round-trips a shift, including an overnight one', () => {
    for (const s of [
      { date: '2026-10-22', start: '09:00', end: '17:00' },
      { date: '2026-10-22', start: '23:00', end: '07:00' },
    ]) {
      const back = toLocalShift(toUtcInput(s))
      expect(back).toEqual(s)
    }
  })

  it('shows UTC times at the device offset', () => {
    const utc = { date: '2026-10-22', start: '09:00', end: '17:00' }
    const local = toLocalShift(utc)
    const off = -new Date(2026, 9, 22, 9).getTimezoneOffset() / 60
    expect(+local.start.slice(0, 2)).toBe((9 + off + 24) % 24)
  })
})

describe('DST change nights', () => {
  const original = process.env.TZ
  afterEach(() => {
    if (original === undefined) delete process.env.TZ
    else process.env.TZ = original
  })

  // found by the property tests: an overnight shift ended 24h after the start day's end time, which is an hour off when the clocks change
  it('keeps an overnight shift ending at the same wall-clock time when clocks go back', () => {
    process.env.TZ = 'America/New_York'
    const local = { date: '2025-11-02', start: '20:00', end: '08:00' }
    expect(toLocalShift(toUtcInput(local))).toEqual(local)
  })

  it('keeps an overnight shift ending at the same wall-clock time when clocks go forward', () => {
    process.env.TZ = 'America/New_York'
    const local = { date: '2026-03-08', start: '20:00', end: '08:00' }
    expect(toLocalShift(toUtcInput(local))).toEqual(local)
  })
})
