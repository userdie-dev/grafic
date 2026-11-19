import { createPinia, setActivePinia } from 'pinia'
import { QueryClient } from '@tanstack/vue-query'
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
const friends = vi.hoisted(() => {
  let snapshot: string | undefined
  return {
    read: async () => ({ snapshot }),
    write: async (value: { snapshot: string }) => { snapshot = value.snapshot },
  }
})
vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => 'android', isPluginAvailable: () => true },
  registerPlugin: (name: string) => name === 'ScheduleStorage' ? friends : native,
}))

import { useLocalShiftsStore } from '@/stores/localShifts'
import { useScheduleStore } from '@/stores/schedule'
import { restoreAndroidFriends } from '@/app/config/friendStorage'

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

it('restores saved friends and the existing device after losing WebView storage', async () => {
  const device = { userId: 'owner', token: 'token', shareCode: 'ABC123' }
  const subscription = { id: 'sub', ownerId: 'friend' }
  const store = useScheduleStore(createPinia())
  const client = new QueryClient()
  store.state.device = device
  store.rename('friend', 'Анна')
  store.setColor('friend', '#123456')
  client.setQueryData(['subs', device.userId], [subscription])
  const save = await restoreAndroidFriends(store, client)
  await save!()

  localStorage.removeItem('grafic.store')
  const restored = useScheduleStore(createPinia())
  const offline = new QueryClient()
  await restoreAndroidFriends(restored, offline)
  expect(restored.state.device).toEqual(device)
  expect(restored.state.labels).toEqual({ friend: 'Анна' })
  expect(restored.state.colors).toEqual({ friend: '#123456' })
  expect(offline.getQueryData(['subs', device.userId])).toEqual([subscription])
  expect(offline.getQueryData(['subs', 'another-owner'])).toBeUndefined()
})
