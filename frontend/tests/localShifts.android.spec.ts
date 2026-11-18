import { createPinia, setActivePinia } from 'pinia'
import { expect, it, vi } from 'vitest'
import type { ShiftCache, ShiftJournal } from '@/lib/syncService'

const native = vi.hoisted(() => {
  let cache: ShiftCache | null = null
  let overrides: ShiftJournal['overrides'] = {}
  return {
    open: vi.fn(async () => ({ cache, overrides })),
    cacheShifts: vi.fn(async (next: ShiftCache) => { cache = next }),
    append: vi.fn(async (next: Pick<ShiftJournal, 'overrides'>) => {
      overrides = { ...overrides, ...next.overrides }
    }),
  }
})
vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => 'android', isPluginAvailable: () => true },
  registerPlugin: () => native,
}))

import { useLocalShiftsStore } from '@/stores/localShifts'
import { useScheduleStore } from '@/stores/schedule'

it('restores server shifts and local edits from Android storage without writing the graph to localStorage', async () => {
  const device = { userId: 'owner', token: 'token', shareCode: 'ABC123' }
  const stored = { id: 'server', date: '2030-01-07', start: '08:00', end: '17:00', note: null }
  setActivePinia(createPinia())
  useScheduleStore().state.device = device
  const store = useLocalShiftsStore()

  await store.remember({ owner: device.userId, shifts: [stored] })
  await store.edit([{ date: '2030-01-08', start: '09:00', end: '18:00', note: 'Локальная смена' }], [])
  expect(native.cacheShifts).toHaveBeenCalledOnce()
  expect(native.append).toHaveBeenCalledOnce()
  expect(localStorage.getItem('grafic.shiftJournal')).toBeNull()
  expect(localStorage.getItem('grafic.shiftCache')).toBeNull()

  setActivePinia(createPinia())
  useScheduleStore().state.device = device
  const reopened = useLocalShiftsStore()
  await reopened.open()
  expect(reopened.shifts).toEqual([stored, expect.objectContaining({ note: 'Локальная смена' })])
})
