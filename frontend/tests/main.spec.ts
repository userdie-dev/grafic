import { flushPromises } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'

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

it('has sane vue-query defaults', async () => {
  const { vueQueryOptions } = await import('@/app/config/query')
  expect(vueQueryOptions.queryClientConfig?.defaultOptions?.queries?.retry).toBe(1)
})
