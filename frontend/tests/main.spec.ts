import { flushPromises } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'
import { onlineManager } from '@tanstack/vue-query'

vi.mock('@/lib/api', () => ({
  registerDevice: vi.fn().mockResolvedValue({ userId: 'u', token: 't', shareCode: 'ABC234' }),
  setToken: vi.fn(),
  eventsUrl: () => undefined,
  api: {
    subscriptions: vi.fn().mockResolvedValue([]),
    myShifts: vi.fn().mockResolvedValue([]),
    friendShifts: vi.fn().mockResolvedValue([]),
  },
}))

it('boots the app into #app and routes unknown paths home', async () => {
  document.body.innerHTML = '<div id="app"></div>'
  await import('@/app/main')
  const { router } = await import('@/app/router')
  await router.push('/nowhere')
  await flushPromises()
  expect(router.currentRoute.value.path).toBe('/')
  await router.push('/settings')
  await flushPromises()
  expect(document.querySelector('#app')!.textContent).toContain('Версия приложения')
  expect(document.documentElement.classList.contains('dark')).toBe(true)
})

it('persists successful queries and restores them on startup', async () => {
  vi.useFakeTimers()
  const { createQueryClient } = await import('@/app/config/query')
  const a = createQueryClient()
  expect(a.getDefaultOptions().queries?.retry).toBe(1)
  a.setQueryData(['shifts', 'me'], [{ id: '1' }])
  vi.advanceTimersByTime(600)
  const b = createQueryClient()
  expect(b.getQueryData(['shifts', 'me'])).toEqual([{ id: '1' }])
})

it('sends saves and refreshes even when the WebView reports offline', async () => {
  const { createQueryClient } = await import('@/app/config/query')
  const client = createQueryClient()
  onlineManager.setOnline(false)
  try {
    const mutationFn = vi.fn().mockResolvedValue('saved')
    const mutation = client.getMutationCache().build(client, { mutationFn })
    const saving = mutation.execute(undefined)
    await flushPromises()
    expect(mutationFn).toHaveBeenCalledOnce()
    expect(mutation.state.isPaused).toBe(false)
    await expect(saving).resolves.toBe('saved')
    await expect(client.fetchQuery({ queryKey: ['offline-refresh'], queryFn: async () => 'fresh' })).resolves.toBe('fresh')
  } finally {
    onlineManager.setOnline(true)
    client.clear()
  }
})
