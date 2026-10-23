import { describe, expect, it } from 'vitest'
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
