import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

const sched = vi.hoisted(() => ({ error: '' }))
const theme = vi.hoisted(() => ({ setTheme: vi.fn() }))

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

import AppNav from '@/components/AppNav.vue'
import App from '@/app/App.vue'
import SettingsPage from '@/pages/SettingsPage.vue'
import SharePage from '@/pages/SharePage.vue'

beforeEach(() => {
  setActivePinia(createPinia())
  sched.error = ''
})

const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<p>home</p>' } },
      { path: '/share', component: { template: '<p>share</p>' } },
      { path: '/settings', component: { template: '<p>settings</p>' } },
    ],
  })

describe('AppNav', () => {
  it('renders the tabs and highlights the active one', async () => {
    const router = makeRouter()
    router.push('/share')
    await router.isReady()
    const w = mount(AppNav, { global: { plugins: [router] } })
    const spans = w.findAll('a > span')
    expect(spans.map((s) => s.text())).toEqual(['Календарь', 'Поделиться', 'Настройки'])
    expect(spans.map((s) => s.classes().includes('text-primary'))).toEqual([false, true, false])
  })
})

describe('App', () => {
  it('shows the router view and an error banner when there is an error', async () => {
    const router = makeRouter()
    router.push('/')
    await router.isReady()
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const w = mount(App, { global: { plugins: [router, [VueQueryPlugin, { queryClient: qc }]] } })
    await flushPromises()
    expect(w.text()).toContain('home')
    expect(w.find('p.text-destructive').exists()).toBe(false)

    // a failing subscription query surfaces its message
    const { api } = await import('@/lib/api')
    vi.mocked(api.subscriptions).mockRejectedValueOnce(new Error('Server down'))
    await qc.invalidateQueries({ queryKey: ['subs'] })
    await flushPromises()
    expect(w.find('p.text-destructive').text()).toBe('Server down')
  })
})

describe('SharePage', () => {
  it('wraps ShareView', () => {
    const w = mount(SharePage, { global: { plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]] } })
    expect(w.text()).toContain('Поделиться графиком')
  })
})

describe('SettingsPage', () => {
  it('lists theme options, marks the current one and switches theme', async () => {
    const w = mount(SettingsPage)
    const buttons = w.findAll('button').slice(0, 3) // theme options; the 4th opens the network info
    expect(buttons).toHaveLength(3)
    expect(w.text()).toContain('0.0.0-test')
    expect(w.text()).toContain('Интернет и данные')

    const marked = () => buttons.map((b) => b.find('svg.size-3\\.5').exists())
    expect(marked().filter(Boolean)).toHaveLength(1)
    const before = marked()
    const target = before.indexOf(false)
    await buttons[target]!.trigger('click')
    const after = buttons.map((b) => b.find('svg.size-3\\.5').exists())
    expect(after[target]).toBe(true)
    expect(after.filter(Boolean)).toHaveLength(1)
    expect(localStorage.getItem('theme')).toBeTruthy()
  })
})

