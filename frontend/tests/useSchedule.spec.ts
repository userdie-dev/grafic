import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref, type App } from 'vue'

const es = vi.hoisted(() => ({ current: null as null | EventTarget }))

vi.mock('@/lib/api', () => ({
  registerDevice: vi.fn(),
  setToken: vi.fn(),
  eventsUrl: (t: string) => `http://x/events?token=${t}`,
  api: {
    subscriptions: vi.fn(),
    myShifts: vi.fn(),
    friendShifts: vi.fn(),
    saveShifts: vi.fn(),
    deleteShift: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    regenerateCode: vi.fn(),
  },
}))
vi.mock('@vueuse/core', async (orig) => {
  const actual = await orig<typeof import('@vueuse/core')>()
  return {
    ...actual,
    useEventSource: () => {
      const eventSource = ref<EventTarget | null>(null)
      es.current = new EventTarget()
      eventSource.value = es.current
      return { eventSource }
    },
  }
})

import { api, registerDevice } from '@/lib/api'
import { COLORS, ME, useSchedule, useScheduleSync } from '@/composables/useSchedule'
import { useConnection } from '@/composables/useConnection'
import { useScheduleStore } from '@/stores/schedule'

const device = { userId: 'u1', token: 'tok', shareCode: 'ABC234' }
const shift = (id: string, date: string, start: string) => ({ id, date, start, end: '18:00', note: null })

let qc: QueryClient

function setup<T>(fn: () => T) {
  let result!: T
  let app!: App
  const wrapper = mount(
    defineComponent({
      setup() {
        result = fn()
        return () => h('div')
      },
    }),
    { global: { plugins: [[VueQueryPlugin, { queryClient: qc }]] } },
  )
  app = wrapper.vm.$.appContext.app
  return { result, wrapper, app }
}

beforeEach(() => {
  setActivePinia(createPinia())
  qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
  vi.clearAllMocks()
  vi.mocked(api.subscriptions).mockResolvedValue([])
  vi.mocked(api.myShifts).mockResolvedValue([])
  vi.mocked(api.friendShifts).mockResolvedValue([])
  vi.mocked(api.saveShifts).mockResolvedValue([])
  vi.mocked(api.deleteShift).mockResolvedValue({ deleted: true })
  vi.mocked(api.regenerateCode).mockResolvedValue({ shareCode: 'NEW222' })
  vi.mocked(api.unsubscribe).mockResolvedValue({ deleted: true })
  vi.mocked(api.subscribe).mockResolvedValue({ id: 'sub-new', ownerId: 'owner-new' })
})

afterEach(() => vi.unstubAllEnvs())

const withDevice = () => {
  localStorage.setItem(
    'grafic.store',
    JSON.stringify({ device, month: '2030-01-15', labels: { o1: 'Аня' }, hidden: [] }),
  )
}

describe('useSchedule', () => {
  it('does not query before a device exists', async () => {
    const { result } = setup(useSchedule)
    await flushPromises()
    expect(api.myShifts).not.toHaveBeenCalled()
    expect(result.shareCode).toBe('')
    expect(result.myShifts).toEqual([])
    expect(result.loading).toBe(false)
    expect(result.error).toBe('')
  })

  it('merges my shifts, friends and mock friends by date, sorted by start', async () => {
    withDevice()
    vi.mocked(api.subscriptions).mockResolvedValue([
      { id: 's1', ownerId: 'o1' },
      { id: 's2', ownerId: 'o2' },
    ])
    vi.mocked(api.myShifts).mockResolvedValue([shift('m1', '2030-01-07', '12:00')])
    vi.mocked(api.friendShifts).mockImplementation(async (id) =>
      id === 'o1' ? [shift('f1', '2030-01-07', '08:00')] : [],
    )
    const { result } = setup(useSchedule)
    await flushPromises()

    expect(api.myShifts).toHaveBeenCalledWith('2029-12-31', '2030-02-03')
    expect(result.shareCode).toBe('ABC234')
    expect(result.month.getFullYear()).toBe(2030)
    expect(result.myShifts).toHaveLength(1)

    const ids = result.people.map((p) => p.id)
    expect(ids.slice(0, 3)).toEqual([ME, 'o1', 'o2'])
    expect(ids.some((i) => i.startsWith('mock-'))).toBe(true)
    expect(result.people[1]).toMatchObject({ name: 'Аня', subId: 's1', color: COLORS[1] })
    expect(result.people[2]).toMatchObject({ name: 'Друг', subId: 's2', color: COLORS[2] })

    const day = result.byDate['2030-01-07']!
    const real = day.filter((e) => !e.who.startsWith('mock-'))
    expect(real.map((e) => e.who)).toEqual(['o1', ME]) // 08:00 before 12:00
    // 2030-01-07 is a Monday and the mock friends work Mondays
    expect(day.some((e) => e.who.startsWith('mock-'))).toBe(true)
  })

  it('uses a local label for a mock friend', async () => {
    localStorage.setItem('grafic.store', JSON.stringify({ device, month: '2030-01-15', labels: { 'mock-anna': 'Нюта' }, hidden: [] }))
    const { result } = setup(useSchedule)
    await flushPromises()
    expect(result.people.find((p) => p.id === 'mock-anna')!.name).toBe('Нюта')
  })

  it('hides toggled people', async () => {
    withDevice()
    vi.mocked(api.myShifts).mockResolvedValue([shift('m1', '2030-01-07', '12:00')])
    const { result } = setup(useSchedule)
    await flushPromises()
    result.toggle(ME)
    expect(result.hidden).toEqual([ME])
    expect(result.byDate['2030-01-07']?.some((e) => e.who === ME)).toBeFalsy()
  })

  it('tolerates friend queries with no data yet', async () => {
    withDevice()
    vi.mocked(api.subscriptions).mockResolvedValue([{ id: 's1', ownerId: 'o1' }])
    vi.mocked(api.friendShifts).mockReturnValue(new Promise(() => {}))
    const { result } = setup(useSchedule)
    await flushPromises()
    expect(result.byDate).toBeTypeOf('object')
  })

  it('skips mock friends outside dev mode', async () => {
    vi.stubEnv('DEV', false)
    vi.resetModules()
    const mod = await import('@/composables/useSchedule')
    withDevice()
    const { result } = setup(mod.useSchedule)
    await flushPromises()
    expect(result.people.map((p) => p.id)).toEqual([ME])
  })

  it('saves: deletes replaced rows then upserts, and skips the upsert when empty', async () => {
    withDevice()
    const { result } = setup(useSchedule)
    await flushPromises()

    const items = [{ date: '2030-01-07', start: '09:00', end: '18:00' }]
    result.saveShifts(items, ['old1', 'old2'])
    await flushPromises()
    expect(api.deleteShift).toHaveBeenCalledWith('old1')
    expect(api.deleteShift).toHaveBeenCalledWith('old2')
    expect(api.saveShifts).toHaveBeenCalledWith(items)

    vi.mocked(api.saveShifts).mockClear()
    result.saveShifts([])
    await flushPromises()
    expect(api.saveShifts).not.toHaveBeenCalled()
    // my shifts are refetched after settling
    expect(vi.mocked(api.myShifts).mock.calls.length).toBeGreaterThan(1)
  })

  it('deletes a single shift', async () => {
    withDevice()
    const { result } = setup(useSchedule)
    await flushPromises()
    result.deleteShift('x')
    await flushPromises()
    expect(vi.mocked(api.deleteShift).mock.calls[0]![0]).toBe('x')
  })

  it('adds a friend: normalises the code, labels it, refreshes subscriptions', async () => {
    withDevice()
    const { result } = setup(useSchedule)
    await flushPromises()
    expect(await result.addFriend(' abc234 ', '  Боря ')).toBe(true)
    expect(vi.mocked(api.subscribe).mock.calls[0]![0]).toBe('ABC234')
    expect(useScheduleStore().state.labels['owner-new']).toBe('Боря')

    await result.addFriend('zzz999', '   ')
    expect(useScheduleStore().state.labels['owner-new']).toBe('ZZZ999') // empty label falls back to the code
    expect(vi.mocked(api.subscriptions).mock.calls.length).toBeGreaterThan(1)
  })

  it('reports a failed subscribe through error', async () => {
    withDevice()
    vi.mocked(api.subscribe).mockRejectedValue(new Error('Unknown code'))
    const { result } = setup(useSchedule)
    await flushPromises()
    expect(await result.addFriend('nope', '')).toBe(false)
    expect(result.error).toBe('Unknown code')
  })

  it('ignores non-Error failures in error', async () => {
    withDevice()
    vi.mocked(api.subscriptions).mockRejectedValue('weird')
    const { result } = setup(useSchedule)
    await flushPromises()
    expect(result.error).toBe('')
  })

  it('removes a friend by subscription id, ignoring empty ids', async () => {
    withDevice()
    const { result } = setup(useSchedule)
    await flushPromises()
    result.removeFriend('')
    await flushPromises()
    expect(api.unsubscribe).not.toHaveBeenCalled()
    result.removeFriend('s1')
    await flushPromises()
    expect(vi.mocked(api.unsubscribe).mock.calls[0]![0]).toBe('s1')
  })

  it('regenerates the share code', async () => {
    withDevice()
    const { result } = setup(useSchedule)
    await flushPromises()
    result.regenerate()
    await flushPromises()
    expect(result.shareCode).toBe('NEW222')
  })

  it('renames and shifts months through the store', async () => {
    withDevice()
    const { result } = setup(useSchedule)
    result.rename('o1', 'Лена')
    expect(useScheduleStore().state.labels.o1).toBe('Лена')
    result.shiftMonth(1)
    expect(result.month.getMonth()).toBe(1)
  })
})

describe('useScheduleSync', () => {
  it('registers the device and refetches a friend on schedule.changed', async () => {
    vi.mocked(registerDevice).mockResolvedValue(device)
    const spy = vi.spyOn(qc, 'invalidateQueries')
    setup(() => useScheduleSync())
    await flushPromises()
    await nextTick()
    expect(registerDevice).toHaveBeenCalled()

    es.current!.dispatchEvent(new MessageEvent('schedule.changed', { data: JSON.stringify({ ownerId: 'o1' }) }))
    expect(spy).toHaveBeenCalledWith({ queryKey: ['shifts', 'o1'] })

    spy.mockClear()
    es.current!.dispatchEvent(new MessageEvent('schedule.changed', { data: 'not json' }))
    expect(spy).not.toHaveBeenCalled()
  })

  it('tracks the backend connection state from the event stream', async () => {
    vi.mocked(registerDevice).mockResolvedValue(device)
    const conn = useConnection()
    setup(() => useScheduleSync())
    await flushPromises()
    expect(conn.value).toBe('connecting')
    es.current!.dispatchEvent(new Event('open'))
    expect(conn.value).toBe('online')
    vi.mocked(api.subscriptions).mockRejectedValue(new Error('down'))
    es.current!.dispatchEvent(new Event('error'))
    await flushPromises()
    expect(conn.value).toBe('offline')
  })

  it('stays online when the stream drops but the server still answers', async () => {
    vi.mocked(registerDevice).mockResolvedValue(device)
    const conn = useConnection()
    setup(() => useScheduleSync())
    await flushPromises()
    es.current!.dispatchEvent(new Event('open'))
    vi.mocked(api.subscriptions).mockResolvedValue([])
    es.current!.dispatchEvent(new Event('error'))
    await flushPromises()
    expect(conn.value).toBe('online')
  })

  it('reports offline when device registration fails', async () => {
    vi.mocked(registerDevice).mockRejectedValue(new Error('down'))
    const conn = useConnection()
    setup(() => useScheduleSync())
    await flushPromises()
    expect(conn.value).toBe('offline')
  })

  it('stays idle without an event source and detaches on unmount', async () => {
    withDevice()
    const { wrapper } = setup(() => useScheduleSync())
    await flushPromises()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    wrapper.unmount()
    es.current!.dispatchEvent(new MessageEvent('schedule.changed', { data: JSON.stringify({ ownerId: 'o1' }) }))
    expect(spy).not.toHaveBeenCalled()
  })
})
