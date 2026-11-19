import { computed, onScopeDispose, reactive, watch } from 'vue'
import { useEventSource } from '@vueuse/core'
import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/vue-query'
import { groupBy, uniq } from 'es-toolkit'
import { api, eventsUrl } from '@/lib/api'
import type { Shift, ShiftInput, Subscription } from '@/lib/dto'
import { toLocalShift } from '@/lib/tz'
import { addDays, parseISO } from 'date-fns'
import { gridRange, iso, monthGrid } from '@/lib/dates'
import { freeDays } from '@/lib/commonOff'
import { commonFreeWindows } from '@/lib/freeHours'
import { holidayName } from '@/lib/holidays'
import { MOCK_FRIENDS, USE_MOCK_FRIENDS, mockShifts } from '@/lib/mock'
import { useScheduleStore } from '@/stores/schedule'
import { useLocalShiftsStore } from '@/stores/localShifts'
import { isAndroid } from '@/lib/syncService'
import { setConnection } from '@/composables/useConnection'
import { showAppToast } from '@/composables/useAppToast'

export const COLORS = ['#2563eb', '#16a34a', '#d97706', '#db2777', '#7c3aed', '#0891b2', '#dc2626', '#65a30d']
export const ME = 'me'

export type Entry = { who: string; name: string; color: string; shift: Shift; isGroup?: boolean }

/** Queries, mutations and derived calendar data on top of the client store. */
export function useSchedule() {
  const store = useScheduleStore()
  const local = useLocalShiftsStore()
  const qc = useQueryClient()
  const owner = store.state.device?.userId
  if (owner && !local.cache) {
    // Older versions cached each calendar range separately.
    const cached = qc.getQueriesData<Shift[]>({ queryKey: ['shifts', ME] })
      .filter(([key, shifts]) => key.length === 4 && Array.isArray(shifts))
      .sort(([a], [b]) => (qc.getQueryState(a)?.dataUpdatedAt ?? 0) - (qc.getQueryState(b)?.dataUpdatedAt ?? 0))
    if (cached.length) {
      const legacy = { owner, shifts: cached.flatMap(([, shifts]) => shifts ?? []) }
      if (isAndroid) void local.open(legacy).catch(() => { /* Reported by useScheduleSync. */ })
      else void local.remember(legacy)
    }
  }

  const enabled = computed(() => !!store.state.device)
  const range = computed(() => gridRange(store.month))
  // shifts are stored in UTC, so a day at the edge of the grid may sit on a neighbouring UTC date
  const padded = computed(() => ({
    from: iso(addDays(parseISO(range.value.from), -1)),
    to: iso(addDays(parseISO(range.value.to), 1)),
  }))

  const subscriptionsKey = computed(() => ['subs', store.state.device?.userId])
  const subsQuery = useQuery({ queryKey: subscriptionsKey, queryFn: api.subscriptions, enabled })

  const mineQuery = useQuery({
    queryKey: computed(() => ['shifts', ME, store.state.device?.userId]),
    queryFn: async ({ queryKey }) => {
      const owner = queryKey[2]
      const shifts = await api.myShifts()
      if (owner && owner === store.state.device?.userId) await local.remember({ owner, shifts })
      return shifts
    },
    enabled,
  })

  const subs = computed(() => subsQuery.data.value ?? [])

  const friendQueries = useQueries({
    queries: computed(() =>
      subs.value.map((s) => ({
        queryKey: ['shifts', s.ownerId, range.value.from, range.value.to],
        queryFn: () => api.friendShifts(s.ownerId, padded.value.from, padded.value.to),
        placeholderData: keepPreviousData,
      })),
    ),
  })

  const mockPeople = USE_MOCK_FRIENDS
    ? MOCK_FRIENDS.map((f) => ({ id: f.id, name: store.state.labels[f.id] ?? f.name, subId: '' }))
    : []

  // Include grouped people when managing membership and looking up their details.
  const allPeople = computed(() => {
    return [
      { id: ME, name: 'Я', color: store.state.colors[ME] ?? COLORS[0]!, subId: '', isGroup: false },
      ...subs.value
        .map((s, i) => ({
          id: s.ownerId,
          name: store.state.labels[s.ownerId] ?? 'Друг',
          color: store.state.colors[s.ownerId] ?? COLORS[(i + 1) % COLORS.length]!,
          subId: s.id,
          isGroup: false,
        })),
      ...mockPeople
        .map((m, i) => ({ 
          ...m, 
          color: COLORS[(subs.value.length + i + 1) % COLORS.length]!,
          isGroup: false,
        })),
    ]
    
  })

  // Calendar entries hide individual members and show their groups instead.
  const people = computed(() => {
    const groups = store.state.groups
    const groupMemberIds = new Set(groups.flatMap(g => g.memberIds))
    const individuals = allPeople.value.filter(p => p.id === ME || !groupMemberIds.has(p.id))
    const groupEntries = groups.map(g => ({
      id: g.id,
      name: g.name,
      color: g.color,
      subId: '',
      isGroup: true,
      memberIds: g.memberIds,
    }))
    
    return [...individuals, ...groupEntries]
  })

  const myShifts = computed(() => local.shifts
    .filter(({ date }) => date >= padded.value.from && date <= padded.value.to)
    .map(toLocalShift)
    .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start)))
  const mineLoaded = computed(() => !!local.cache && local.cache.owner === store.state.device?.userId)

  /** date -> entries of all visible people */
  const byDate = computed(() => {
    const map: Record<string, Entry[]> = {}
    
    people.value.forEach((p, i) => {
      if (store.state.hidden.includes(p.id)) return
      
      if ('isGroup' in p && p.isGroup && 'memberIds' in p) {
        // For groups, aggregate shifts from all members
        const memberIds = p.memberIds as string[]
        memberIds.forEach(memberId => {
          const memberIndex = subs.value.findIndex(s => s.ownerId === memberId)
          const list = memberIndex >= 0
            ? (friendQueries.value[memberIndex]?.data ?? []).map(toLocalShift)
            : memberId.startsWith('mock-')
              ? mockShifts(memberId, range.value.from, range.value.to)
              : []
          
          for (const shift of list) {
            (map[shift.date] ??= []).push({ 
              who: p.id, // Group ID
              name: p.name, // Group name
              color: p.color, // Group color
              shift,
              isGroup: true // Mark as group entry
            })
          }
        })
      } else {
        // Individual person
        const list =
          p.id === ME
            ? myShifts.value
            : p.id.startsWith('mock-')
              ? mockShifts(p.id, range.value.from, range.value.to)
              : (friendQueries.value[i - 1]?.data ?? []).map(toLocalShift)
        
        for (const shift of list) {
          (map[shift.date] ??= []).push({ who: p.id, name: p.name, color: p.color, shift, isGroup: false })
        }
      }
    })
    
    for (const list of Object.values(map)) list.sort((a, b) => a.shift.start.localeCompare(b.shift.start))
    return map
  })

  /** days of the shown grid when every visible person is off; empty until all their schedules have loaded */
  const commonOff = computed(() => {
    const visible = people.value.filter((p) => !store.state.hidden.includes(p.id))
    const loaded = people.value.every((p, i) => p.id === ME || p.id.startsWith('mock-') || friendQueries.value[i - 1]?.data)
    if (!loaded || !mineLoaded.value) return []
    // with a single visible person every free day would be "common"
    if (visible.length < 2) return []
    return freeDays(Object.keys(byDate.value), range.value.from, range.value.to)
  })

  /** days of the shown grid with at least one shared free hour for every visible person */
  const commonFreeDays = computed(() => {
    const visible = people.value.filter((p) => !store.state.hidden.includes(p.id))
    const loaded = people.value.every((p, i) => p.id === ME || p.id.startsWith('mock-') || friendQueries.value[i - 1]?.data)
    if (!loaded || !mineLoaded.value) return []
    // an intersection needs at least two schedules
    if (visible.length < 2) return []
    // days without any shifts are already fully free (commonOff), so only busy dates are checked
    return Object.keys(byDate.value).filter(
      (date) => commonFreeWindows(byDate.value[date]!.map((entry) => entry.shift)).length > 0,
    )
  })

  /** public holidays of the shown grid, by local calendar day (see holidays.ts) */
  const holidays = computed(() => {
    const map: Record<string, string> = {}
    // monthGrid includes all days visible in the calendar, including days from adjacent months
    for (const day of monthGrid(store.month)) {
      const date = iso(day)
      const name = holidayName(date)
      if (name) map[date] = name
    }
    return map
  })

  const subscribe = useMutation({
    mutationFn: ({ code }: { code: string; label: string }) => api.subscribe(code),
    onSuccess: (sub, { code, label }) => {
      store.rename(sub.ownerId, label.trim() || code)
      qc.setQueryData<Subscription[]>(subscriptionsKey.value, (current) => [
        ...(current ?? []).filter((friend) => friend.ownerId !== sub.ownerId), sub,
      ])
      return qc.invalidateQueries({ queryKey: subscriptionsKey.value })
    },
  })
  const unsubscribe = useMutation({
    mutationFn: api.unsubscribe,
    onSuccess: (_, subId) => {
      qc.setQueryData<Subscription[]>(subscriptionsKey.value, (current) => current?.filter((friend) => friend.id !== subId))
      return qc.invalidateQueries({ queryKey: subscriptionsKey.value })
    },
  })
  const regenerate = useMutation({
    mutationFn: api.regenerateCode,
    onSuccess: (r) => store.setShareCode(r.shareCode),
  })

  const error = computed(() => {
    const e = [subsQuery, mineQuery, subscribe, unsubscribe, regenerate]
      .map((q) => q.error.value)
      .find(Boolean)
    return e instanceof Error ? e.message : ''
  })

  return reactive({
    month: computed(() => store.month),
    hidden: computed(() => store.state.hidden),
    shareCode: computed(() => store.state.device?.shareCode ?? ''),
    loading: computed(() => (!mineLoaded.value && mineQuery.isFetching.value) || subsQuery.isFetching.value),
    people,
    allPeople,
    byDate,
    commonOff,
    commonFreeDays,
    holidays,
    showCommonOff: computed(() => store.state.showCommonOff),
    showFreeHours: computed(() => store.state.showFreeHours),
    myShifts,
    error,
    shiftMonth: store.shiftMonth,
    toggle: store.toggle,
    rename: store.rename,
    setColor: store.setColor,
    saveShifts: (items: ShiftInput[], removeIds: string[] = []) => local.edit(items, removeIds),
    deleteShift: (id: string) => {
      void local.edit([], [id]).catch((error: unknown) => {
        showAppToast(error instanceof Error ? error.message : 'Не удалось удалить смену.', 'error')
      })
    },
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
  const local = useLocalShiftsStore()
  const qc = useQueryClient()

  void local.open().catch((error: unknown) => {
    showAppToast(error instanceof Error ? error.message : 'Не удалось загрузить локальные смены.', 'error')
  })
  const flush = () => { void local.flush().catch(() => { /* The journal will be retried. */ }) }
  const onVisible = () => { if (!document.hidden) flush() }
  flush()
  window.addEventListener('online', flush)
  window.addEventListener('storage', local.reloadJournal)
  document.addEventListener('visibilitychange', onVisible)

  store.ensureDevice().catch((error: unknown) => {
    setConnection('offline')
    showAppToast(error instanceof Error ? error.message : 'Не удалось подключиться к серверу.', 'error')
  })

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
    flush()
    if (streamOpen || !store.state.device) return
    qc.invalidateQueries({ queryKey: ['shifts'] })
    probe()
  }, 30_000)
  onScopeDispose(() => {
    clearInterval(poll)
    window.removeEventListener('online', flush)
    window.removeEventListener('storage', local.reloadJournal)
    document.removeEventListener('visibilitychange', onVisible)
  })

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
