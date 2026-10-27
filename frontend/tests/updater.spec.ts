import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

const cap = vi.hoisted(() => ({ native: true }))
const upd = vi.hoisted(() => ({ notifyAppReady: vi.fn(), download: vi.fn(), set: vi.fn(), list: vi.fn(), current: vi.fn(), delete: vi.fn() }))
const http = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => cap.native }, CapacitorHttp: http }))
vi.mock('@capgo/capacitor-updater', () => ({ CapacitorUpdater: upd }))
vi.mock('@/lib/api', () => ({
  registerDevice: vi.fn().mockResolvedValue({ userId: 'u', token: 't', shareCode: 'ABC234' }),
  setToken: vi.fn(),
  eventsUrl: () => undefined,
  api: { subscriptions: vi.fn().mockResolvedValue([]), myShifts: vi.fn().mockResolvedValue([]), friendShifts: vi.fn().mockResolvedValue([]) },
}))

import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises } from '@vue/test-utils'
import App from '@/app/App.vue'
import { checkForUpdates, initUpdater } from '@/app/config/updater'
import { setUpdateStatus, useUpdateStatus } from '@/composables/useUpdateStatus'

// the test config defines __BUILD_ID__ implicitly as undefined; give it a value for the comparison
vi.stubGlobal('__BUILD_ID__', 'build-1')
vi.stubGlobal('__APP_VERSION__', '9.9.9')

const status = useUpdateStatus()

beforeEach(() => {
  cap.native = true
  vi.clearAllMocks()
  setUpdateStatus(null)
  upd.notifyAppReady.mockResolvedValue(undefined)
  upd.download.mockResolvedValue({ id: 'b2' })
  upd.set.mockResolvedValue(undefined)
  upd.list.mockResolvedValue({ bundles: [] })
  upd.current.mockResolvedValue({ bundle: { id: 'builtin' } })
  upd.delete.mockResolvedValue(undefined)
  http.get.mockResolvedValue({ status: 200, data: { build: 'build-2', url: 'http://x/dist.zip', checksum: 'abc' } })
})

describe('initUpdater', () => {
  it('does nothing outside the native app', async () => {
    cap.native = false
    await initUpdater()
    expect(upd.notifyAppReady).not.toHaveBeenCalled()
  })

  it('downloads and applies a newer build, remembering it for the next start', async () => {
    await initUpdater()
    expect(upd.download).toHaveBeenCalledWith({ url: 'http://x/dist.zip', version: 'build-2', checksum: 'abc' })
    expect(upd.set).toHaveBeenCalledWith({ id: 'b2' })
    expect(status.value).toEqual({ kind: 'downloading', text: 'Скачиваем обновление…' })
    expect(localStorage.getItem('grafic.updatingTo')).toBe('build-2')
  })

  it('parses a string response', async () => {
    http.get.mockResolvedValue({ status: 200, data: JSON.stringify({ build: 'build-2', url: 'u' }) })
    await initUpdater()
    expect(upd.download).toHaveBeenCalledWith({ url: 'u', version: 'build-2' })
  })

  it('stays quiet when already on the latest build or the manifest is empty', async () => {
    http.get.mockResolvedValue({ status: 200, data: { build: 'build-1', url: 'u' } })
    await initUpdater()
    http.get.mockResolvedValue({ status: 200, data: {} })
    await initUpdater()
    expect(upd.download).not.toHaveBeenCalled()
    expect(status.value).toBeNull()
  })

  it('keeps quiet on a bad response at start, but reports it on a manual check', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    http.get.mockResolvedValue({ status: 404, data: '' })
    await initUpdater()
    expect(status.value).toBeNull()
    expect(await checkForUpdates({ manual: true })).toBe('error')
    expect(status.value).toEqual({ kind: 'error', text: 'Не удалось проверить обновление: сервер ответил 404' })
    warn.mockRestore()
  })

  it('tells the user they are up to date on a manual check', async () => {
    http.get.mockResolvedValue({ status: 200, data: { build: 'build-1', url: 'u' } })
    expect(await checkForUpdates({ manual: true })).toBe('latest')
    expect(status.value).toEqual({ kind: 'updated', text: 'У вас последняя версия' })
  })

  it('removes stale bundles before downloading', async () => {
    upd.list.mockResolvedValue({ bundles: [{ id: 'builtin' }, { id: 'cur' }, { id: 'old' }] })
    upd.current.mockResolvedValue({ bundle: { id: 'cur' } })
    await initUpdater()
    expect(upd.delete).toHaveBeenCalledTimes(1)
    expect(upd.delete).toHaveBeenCalledWith({ id: 'old' })
  })

  it('does not bother the user when the check fails for lack of network', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    http.get.mockRejectedValue(new Error('offline'))
    await initUpdater()
    expect(status.value).toBeNull()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('shows the failure when a manual download or apply fails and forgets the pending build', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    upd.download.mockRejectedValue(new Error('disk full'))
    await initUpdater()
    expect(status.value).toBeNull()
    await checkForUpdates({ manual: true })
    expect(status.value).toEqual({ kind: 'error', text: 'Не удалось скачать обновление: disk full' })
    expect(localStorage.getItem('grafic.updatingTo')).toBeNull()

    upd.download.mockRejectedValue('boom')
    await checkForUpdates({ manual: true })
    expect(status.value!.text).toBe('Не удалось скачать обновление: boom')
    warn.mockRestore()
  })

  it('keeps the pending build when set() rejects (webview reload), reports only if still alive', async () => {
    vi.useFakeTimers()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    upd.set.mockRejectedValue(new Error('Failed to fetch'))
    const p = checkForUpdates({ manual: true })
    await vi.advanceTimersByTimeAsync(1000)
    expect(localStorage.getItem('grafic.updatingTo')).not.toBeNull()
    await vi.advanceTimersByTimeAsync(3000)
    await p
    expect(status.value!.text).toBe('Не удалось применить обновление: Failed to fetch')
    expect(localStorage.getItem('grafic.updatingTo')).toBeNull()
    warn.mockRestore()
  })

  it('confirms the update after the restart', async () => {
    vi.useFakeTimers()
    localStorage.setItem('grafic.updatingTo', 'build-1')
    http.get.mockResolvedValue({ status: 200, data: { build: 'build-1', url: 'u' } })
    await initUpdater()
    expect(status.value).toEqual({ kind: 'updated', text: 'Приложение обновлено до версии 9.9.9' })
    expect(localStorage.getItem('grafic.updatingTo')).toBeNull()
    vi.advanceTimersByTime(5001)
    expect(status.value).toBeNull()
  })

  it('works even if storage is unavailable', async () => {
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    await initUpdater()
    expect(upd.set).toHaveBeenCalled()
    get.mockRestore()
    set.mockRestore()
  })
})

describe('update toast', () => {
  const mountApp = async () => {
    setActivePinia(createPinia())
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div />' } }] })
    const w = mount(App, { global: { plugins: [router, [VueQueryPlugin, { queryClient: new QueryClient() }]] } })
    await flushPromises()
    return w
  }

  it('shows progress in blue and errors in red, and hides when cleared', async () => {
    const w = await mountApp()
    expect(w.text()).not.toContain('Скачиваем')

    setUpdateStatus({ kind: 'downloading', text: 'Скачиваем обновление…' })
    await flushPromises()
    const toast = () => w.findAll('[role="status"]').find((t) => t.text().includes('обновлен') || t.text().includes('Не удалось'))!
    expect(toast().classes()).toContain('bg-blue-600')

    setUpdateStatus({ kind: 'error', text: 'Не удалось обновить: x' })
    await flushPromises()
    expect(toast().classes()).toContain('bg-destructive')
  })
})
