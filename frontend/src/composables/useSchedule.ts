import { computed, onScopeDispose, reactive, watch } from 'vue'
import { useEventSource } from '@vueuse/core'
import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/vue-query'
import { api, eventsUrl } from '@/lib/api'
import type { Shift, ShiftInput } from '@/lib/dto'
import { gridRange } from '@/lib/dates'
import { freeDays } from '@/lib/commonOff'
import { MOCK_FRIENDS, USE_MOCK_FRIENDS, mockShifts } from '@/lib/mock'
import { useScheduleStore } from '@/stores/schedule'
import { setConnection } from '@/composables/useConnection'

export const COLORS = ['#2563eb', '#16a34a', '#d97706', '#db2777', '#7c3aed', '#0891b2', '#dc2626', '#65a30d']
export const ME = 'me'

export type Entry = { who: string; name: string; color: string; shift: Shift }

/** Queries, mutations and derived calendar data on top of the client store. */
export function useSchedule() {
  const store = useScheduleStore()
  const qc = useQueryClient()

  const enabled = computed(() => !!store.state.device)
  const range = computed(() => gridRange(store.month))

  const subsQuery = useQuery({ queryKey: ['subs'], queryFn: api.subscriptions, enabled })

  const mineQuery = useQuery({
    queryKey: computed(() => ['shifts', ME, range.value.from, range.value.to]),
    queryFn: () => api.myShifts(range.value.from, range.value.to),
    enabled,
    placeholderData: keepPreviousData,
  })

  const subs = computed(() => subsQuery.data.value ?? [])

  const friendQueries = useQueries({
    queries: computed(() =>
      subs.value.map((s) => ({
        queryKey: ['shifts', s.ownerId, range.value.from, range.value.to],
        queryFn: () => api.friendShifts(s.ownerId, range.value.from, range.value.to),
        placeholderData: keepPreviousData,
      })),
    ),
  })

  const mockPeople = USE_MOCK_FRIENDS
    ? MOCK_FRIENDS.map((f) => ({ id: f.id, name: store.state.labels[f.id] ?? f.name, subId: '' }))
    : []

  const people = computed(() => [
    { id: ME, name: 'Я', color: COLORS[0]!, subId: '' },
    ...subs.value.map((s, i) => ({
      id: s.ownerId,
      name: store.state.labels[s.ownerId] ?? 'Друг',
      color: store.state.colors[s.ownerId] ?? COLORS[(i + 1) % COLORS.length]!,
      subId: s.id,
    })),
    ...mockPeople.map((m, i) => ({ ...m, color: COLORS[(subs.value.length + i + 1) % COLORS.length]! })),
  ])

  const myShifts = computed(() => mineQuery.data.value ?? [])

  /** date -> entries of all visible people */
  const byDate = computed(() => {
    const map: Record<string, Entry[]> = {}
    people.value.forEach((p, i) => {
      if (store.state.hidden.includes(p.id)) return
      const list =
        p.id === ME
          ? myShifts.value
          : p.id.startsWith('mock-')
            ? mockShifts(p.id, range.value.from, range.value.to)
            : (friendQueries.value[i - 1]?.data ?? [])
      for (const shift of list) (map[shift.date] ??= []).push({ who: p.id, name: p.name, color: p.color, shift })
    })
    for (const list of Object.values(map)) list.sort((a, b) => a.shift.start.localeCompare(b.shift.start))
    return map
  })

  /** days of the shown grid when every visible person is off; empty until all their schedules have loaded */
  const commonOff = computed(() => {
    const visible = people.value.filter((p) => !store.state.hidden.includes(p.id))
    const loaded = people.value.every((p, i) => p.id === ME || p.id.startsWith('mock-') || friendQueries.value[i - 1]?.data)
    if (!loaded || !mineQuery.data.value) return []
    // with a single visible person every free day would be "common"
    if (visible.length < 2) return []
    return freeDays(Object.keys(byDate.value), range.value.from, range.value.to)
  })

  const invalidateMine = () => qc.invalidateQueries({ queryKey: ['shifts', ME] })

  const save = useMutation({
    mutationFn: async ({ items, removeIds }: { items: ShiftInput[]; removeIds: string[] }) => {
      await Promise.all(removeIds.map((id) => api.deleteShift(id)))
      if (items.length) await api.saveShifts(items)
    },
    onSettled: invalidateMine,
  })
  const remove = useMutation({ mutationFn: api.deleteShift, onSettled: invalidateMine })
  const subscribe = useMutation({
    mutationFn: ({ code }: { code: string; label: string }) => api.subscribe(code),
    onSuccess: (sub, { code, label }) => {
      store.rename(sub.ownerId, label.trim() || code)
      return qc.invalidateQueries({ queryKey: ['subs'] })
    },
  })
  const unsubscribe = useMutation({
    mutationFn: api.unsubscribe,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subs'] }),
  })
  const regenerate = useMutation({
    mutationFn: api.regenerateCode,
    onSuccess: (r) => store.setShareCode(r.shareCode),
  })

  const error = computed(() => {
    const e = [subsQuery, mineQuery, save, remove, subscribe, unsubscribe, regenerate]
      .map((q) => q.error.value)
      .find(Boolean)
    return e instanceof Error ? e.message : ''
  })

  return reactive({
    month: computed(() => store.month),
    hidden: computed(() => store.state.hidden),
    shareCode: computed(() => store.state.device?.shareCode ?? ''),
    loading: computed(() => mineQuery.isFetching.value || subsQuery.isFetching.value),
    people,
    byDate,
    commonOff,
    myShifts,
    error,
    shiftMonth: store.shiftMonth,
    toggle: store.toggle,
    rename: store.rename,
    setColor: store.setColor,
    saveShifts: (items: ShiftInput[], removeIds: string[] = []) => save.mutate({ items, removeIds }),
    deleteShift: (id: string) => remove.mutate(id),
    addFriend: async (code: string, label: string) => {
      try {
        await subscribe.mutateAsync({ code: code.trim().toUpperCase(), label })
        return true
      } catch {
        return false // surfaced through `error`
      }
    },
    removeFriend: (subId: string) => subId && unsubscribe.mutate(subId),
    regenerate: () => regenerate.mutate(),
  })
}

/** Registers the device and refetches a friend's shifts whenever the server pushes a change. Call once. */
export function useScheduleSync() {
  const store = useScheduleStore()
  const qc = useQueryClient()

  store.ensureDevice().catch(() => setConnection('offline'))

  // The stream alone is a poor signal (webviews and proxies drop it while plain requests work),
  // so after a stream error we ask the server directly and only then declare it unreachable.
  let streamOpen = false
  const probe = async () => {
    try {
      await api.subscriptions()
      setConnection('online')
    } catch {
      if (!streamOpen) setConnection('offline')
    }
  }
  // without a live stream, poll so the calendar still picks up changes
  const poll = setInterval(() => {
    if (streamOpen || !store.state.device) return
    qc.invalidateQueries({ queryKey: ['shifts'] })
    probe()
  }, 30_000)
  onScopeDispose(() => clearInterval(poll))

  const url = computed(() => (store.state.device ? eventsUrl(store.state.device.token) : undefined))
  const { eventSource } = useEventSource(url, ['schedule.changed'], { autoReconnect: true })

  // listen on the raw EventSource: `data` would swallow two identical payloads in a row
  watch(
    eventSource,
    (es, _, onCleanup) => {
      if (!es) return
      // no 'connecting' here: the state starts as 'connecting', and resetting it on every
      // stream reconnect made the label flicker between states
      const onOpen = () => {
        streamOpen = true
        setConnection('online')
      }
      const onError = () => {
        streamOpen = false
        probe()
      }
      es.addEventListener('open', onOpen)
      es.addEventListener('error', onError)
      const handler = (e: Event) => {
        try {
          const { ownerId } = JSON.parse((e as MessageEvent).data)
          qc.invalidateQueries({ queryKey: ['shifts', ownerId] })
        } catch {
          /* ignore malformed event */
        }
      }
      es.addEventListener('schedule.changed', handler)
      onCleanup(() => {
        es.removeEventListener('schedule.changed', handler)
        es.removeEventListener('open', onOpen)
        es.removeEventListener('error', onError)
      })
    },
    { immediate: true },
  )
}
