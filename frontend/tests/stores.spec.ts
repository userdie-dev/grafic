import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({ registerDevice: vi.fn(), setToken: vi.fn() }))

import { registerDevice, setToken } from '@/lib/api'
import { usePresetsStore } from '@/stores/presets'
import { useScheduleStore } from '@/stores/schedule'

const device = { userId: 'u1', token: 'tok', shareCode: 'ABC234' }

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('schedule store', () => {
  it('starts without a device on the current month', () => {
    const s = useScheduleStore()
    expect(s.state.device).toBeNull()
    expect(s.month.getMonth()).toBe(new Date().getMonth())
    expect(setToken).not.toHaveBeenCalled()
  })

  it('restores the token from a persisted device', () => {
    localStorage.setItem('grafic.store', JSON.stringify({ device, month: '2030-01-15', labels: {}, hidden: [] }))
    const s = useScheduleStore()
    expect(setToken).toHaveBeenCalledWith('tok')
    expect(s.month.getFullYear()).toBe(2030)
  })

  it('registers the device once', async () => {
    vi.mocked(registerDevice).mockResolvedValue(device)
    const s = useScheduleStore()
    await s.ensureDevice()
    expect(s.state.device).toEqual(device)
    expect(setToken).toHaveBeenCalledWith('tok')
    await s.ensureDevice()
    expect(registerDevice).toHaveBeenCalledTimes(1)
  })

  it('shifts months', () => {
    const s = useScheduleStore()
    s.state.month = '2030-01-31'
    s.shiftMonth(1)
    expect(s.state.month).toBe('2030-02-28')
    s.shiftMonth(-2)
    expect(s.state.month).toBe('2029-12-28')
  })

  it('toggles hidden people', () => {
    const s = useScheduleStore()
    s.toggle('a')
    s.toggle('b')
    expect(s.state.hidden).toEqual(['a', 'b'])
    s.toggle('a')
    expect(s.state.hidden).toEqual(['b'])
  })

  it('renames friends', () => {
    const s = useScheduleStore()
    s.rename('o1', 'Аня')
    expect(s.state.labels).toEqual({ o1: 'Аня' })
  })

  it('updates the share code only when a device exists', () => {
    const s = useScheduleStore()
    s.setShareCode('NEW222')
    expect(s.state.device).toBeNull()
    s.state.device = { ...device }
    s.setShareCode('NEW222')
    expect(s.state.device.shareCode).toBe('NEW222')
  })
})

describe('presets store', () => {
  it('lists built-in presets and adds / removes custom ones', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000)
    const p = usePresetsStore()
    const builtin = p.all.length
    const created = p.add({ label: 'X', hint: '', rule: { type: 'cycle', work: 1, off: 1 }, day: ['08:00', '16:00'], night: ['20:00', '04:00'] })
    expect(created).toMatchObject({ id: 'custom-rs', custom: true, label: 'X' })
    expect(p.all).toHaveLength(builtin + 1)
    p.remove(created.id)
    expect(p.all).toHaveLength(builtin)
    vi.restoreAllMocks()
  })
})
