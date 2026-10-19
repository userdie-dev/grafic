import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

const cap = vi.hoisted(() => ({ native: true }))
const ln = vi.hoisted(() => ({
  checkPermissions: vi.fn(),
  requestPermissions: vi.fn(),
  getPending: vi.fn(),
  cancel: vi.fn(),
  schedule: vi.fn(),
}))

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => cap.native } }))
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: ln }))
vi.mock('@/lib/api', () => ({
  registerDevice: vi.fn(),
  setToken: vi.fn(),
  api: { subscriptions: vi.fn(), myShifts: vi.fn(), friendShifts: vi.fn() },
}))

import { api } from '@/lib/api'
import SettingsPage from '@/pages/SettingsPage.vue'
import {
  notificationsSupported,
  requestNotifyPermission,
  scheduleCommonOff,
  useCommonOffNotify,
} from '@/composables/useCommonOffNotify'
import { useScheduleStore } from '@/stores/schedule'

const device = { userId: 'u1', token: 'tok', shareCode: 'ABC234' }
const shift = (date: string) => ({ id: date, date, start: '09:00', end: '18:00', note: null })
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const inDays = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return ymd(d)
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  cap.native = true
  ln.checkPermissions.mockResolvedValue({ display: 'prompt' })
  ln.requestPermissions.mockResolvedValue({ display: 'granted' })
  ln.getPending.mockResolvedValue({ notifications: [] })
  ln.cancel.mockResolvedValue(undefined)
  ln.schedule.mockResolvedValue(undefined)
  vi.mocked(api.subscriptions).mockResolvedValue([])
  vi.mocked(api.myShifts).mockResolvedValue([])
  vi.mocked(api.friendShifts).mockResolvedValue([])
})

function mountWith(setup: () => void) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return mount(defineComponent({ setup: () => (setup(), () => h('div')) }), {
    global: { plugins: [[VueQueryPlugin, { queryClient: qc }]] },
  })
}

describe('permission', () => {
  it('is unsupported outside the native app', async () => {
    cap.native = false
    expect(notificationsSupported()).toBe(false)
    expect(await requestNotifyPermission()).toBe(false)
  })

  it('skips the prompt when already granted, asks otherwise', async () => {
    ln.checkPermissions.mockResolvedValueOnce({ display: 'granted' })
    expect(await requestNotifyPermission()).toBe(true)
    expect(ln.requestPermissions).not.toHaveBeenCalled()
    expect(await requestNotifyPermission()).toBe(true)
    ln.requestPermissions.mockResolvedValueOnce({ display: 'denied' })
    expect(await requestNotifyPermission()).toBe(false)
  })
})

describe('scheduleCommonOff', () => {
  it('replaces only our pending reminders with one per future day, 19:00 the evening before', async () => {
    ln.getPending.mockResolvedValue({ notifications: [{ id: 7_000_001 }, { id: 5 }, { id: 8_000_000 }] })
    await scheduleCommonOff(['2030-01-10', '2020-01-10'], new Date(2030, 0, 1))
    expect(ln.cancel).toHaveBeenCalledWith({ notifications: [{ id: 7_000_001 }] })
    const { notifications } = ln.schedule.mock.calls[0]![0]
    expect(notifications).toHaveLength(1)
    expect(notifications[0].schedule.at).toEqual(new Date(2030, 0, 9, 19, 0, 0, 0))
    expect(notifications[0].body).toContain('10.01')
  })

  it('schedules nothing when no day qualifies', async () => {
    await scheduleCommonOff([], new Date())
    expect(ln.cancel).not.toHaveBeenCalled()
    expect(ln.schedule).not.toHaveBeenCalled()
  })
})

describe('useCommonOffNotify', () => {
  const enable = (on = true) => {
    const store = useScheduleStore()
    store.state.device = device
    store.state.notifyCommonOff = on
  }

  it('does nothing on the web, and does not clean up there', async () => {
    cap.native = false
    enable()
    mountWith(useCommonOffNotify)
    await flushPromises()
    expect(api.myShifts).not.toHaveBeenCalled()
    expect(ln.getPending).not.toHaveBeenCalled()
  })

  it('clears reminders when the setting is off', async () => {
    ln.getPending.mockResolvedValue({ notifications: [{ id: 7_000_001 }] })
    enable(false)
    mountWith(useCommonOffNotify)
    await flushPromises()
    expect(ln.cancel).toHaveBeenCalled()
    expect(ln.schedule).not.toHaveBeenCalled()
  })

  it('swallows errors while clearing', async () => {
    ln.getPending.mockRejectedValue(new Error('boom'))
    enable(false)
    mountWith(useCommonOffNotify)
    await flushPromises()
    expect(ln.cancel).not.toHaveBeenCalled()
  })

  it('waits until I have a friend and every schedule is loaded', async () => {
    enable()
    mountWith(useCommonOffNotify)
    await flushPromises()
    expect(ln.schedule).not.toHaveBeenCalled() // no friends: nobody to meet

    vi.mocked(api.subscriptions).mockResolvedValue([{ id: 's1', ownerId: 'o1' }])
    vi.mocked(api.friendShifts).mockReturnValue(new Promise(() => {}))
    setActivePinia(createPinia())
    enable()
    mountWith(useCommonOffNotify)
    await flushPromises()
    expect(ln.schedule).not.toHaveBeenCalled() // friend not loaded yet
  })

  it('schedules reminders only for days free for me and all friends', async () => {
    enable()
    vi.mocked(api.subscriptions).mockResolvedValue([
      { id: 's1', ownerId: 'o1' },
      { id: 's2', ownerId: 'o2' },
    ])
    vi.mocked(api.myShifts).mockResolvedValue([shift(inDays(3))])
    vi.mocked(api.friendShifts).mockImplementation(async (id) => [shift(id === 'o1' ? inDays(4) : inDays(5))])
    mountWith(useCommonOffNotify)
    await flushPromises()

    const { notifications } = ln.schedule.mock.calls.at(-1)![0]
    const days = notifications.map((n: { schedule: { at: Date } }) => ymd(new Date(n.schedule.at.getTime() + 24 * 3600_000)))
    expect(days).not.toContain(inDays(3))
    expect(days).not.toContain(inDays(4))
    expect(days).not.toContain(inDays(5))
    expect(days).toContain(inDays(6))
  })

  it('logs when scheduling fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    ln.schedule.mockRejectedValue(new Error('boom'))
    enable()
    vi.mocked(api.subscriptions).mockResolvedValue([{ id: 's1', ownerId: 'o1' }])
    mountWith(useCommonOffNotify)
    await flushPromises()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('Settings toggle', () => {
  const mountSettings = () => mount(SettingsPage)
  const toggle = (w: ReturnType<typeof mountSettings>) => w.get('button[role="switch"]')

  it('turns on after the permission is granted and off again', async () => {
    const w = mountSettings()
    expect(toggle(w).attributes('aria-checked')).toBe('false')
    await toggle(w).trigger('click')
    await flushPromises()
    expect(toggle(w).attributes('aria-checked')).toBe('true')
    expect(useScheduleStore().state.notifyCommonOff).toBe(true)

    await toggle(w).trigger('click')
    expect(toggle(w).attributes('aria-checked')).toBe('false')
  })

  it('stays off and explains when the permission is denied', async () => {
    ln.requestPermissions.mockResolvedValue({ display: 'denied' })
    const w = mountSettings()
    await toggle(w).trigger('click')
    await flushPromises()
    expect(toggle(w).attributes('aria-checked')).toBe('false')
    expect(w.text()).toContain('Разрешите уведомления')
  })

  it('explains that notifications need the phone app', async () => {
    cap.native = false
    const w = mountSettings()
    await toggle(w).trigger('click')
    expect(toggle(w).attributes('aria-checked')).toBe('false')
    expect(w.text()).toContain('только в приложении на телефоне')
  })
})
