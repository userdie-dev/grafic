import { computed, watch } from 'vue'
import { addDays, format, parseISO, set, subDays } from 'date-fns'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { useQueries, useQuery } from '@tanstack/vue-query'
import { api } from '@/lib/api'
import { freeDays } from '@/lib/commonOff'
import { iso } from '@/lib/dates'
import { useScheduleStore } from '@/stores/schedule'

/** How far ahead we look for a day when everyone is off. */
export const HORIZON_DAYS = 30
/** The reminder arrives the evening before, so there is time to make plans. */
const NOTIFY_HOUR = 19
/** Notification ids of this feature live in their own range so we never touch foreign ones. */
const ID_BASE = 7_000_000

const idFor = (date: string) => ID_BASE + Number(date.replaceAll('-', '')) % 1_000_000

export const notificationsSupported = () => Capacitor.isNativePlatform()

/** Asks for the OS permission; true when notifications may be shown. */
export async function requestNotifyPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false
  const cur = await LocalNotifications.checkPermissions()
  if (cur.display === 'granted') return true
  return (await LocalNotifications.requestPermissions()).display === 'granted'
}

async function clearScheduled() {
  const { notifications } = await LocalNotifications.getPending()
  const ours = notifications.filter((n) => n.id >= ID_BASE && n.id < ID_BASE + 1_000_000)
  if (ours.length) await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) })
}

/** Replaces our scheduled reminders with one per upcoming day off shared by everyone. */
export async function scheduleCommonOff(days: string[], now = new Date()) {
  await clearScheduled()
  const notifications = days
    .map((date) => ({
      date,
      at: set(subDays(parseISO(date), 1), { hours: NOTIFY_HOUR, minutes: 0, seconds: 0, milliseconds: 0 }),
    }))
    .filter((d) => d.at > now)
    .map((d) => ({
      id: idFor(d.date),
      title: 'Общий выходной',
      body: `Завтра, ${format(parseISO(d.date), 'd.MM')}, выходной у всех. Самое время встретиться!`,
      schedule: { at: d.at, allowWhileIdle: true },
    }))
  if (notifications.length) await LocalNotifications.schedule({ notifications })
}

/** Keeps reminders in sync with the schedules of me and all my friends. Call once. */
export function useCommonOffNotify() {
  const store = useScheduleStore()
  const enabled = computed(() => store.state.notifyCommonOff && !!store.state.device && notificationsSupported())

  const from = iso(addDays(new Date(), 1))
  const to = iso(addDays(new Date(), HORIZON_DAYS))

  const subs = useQuery({ queryKey: ['subs'], queryFn: api.subscriptions, enabled })
  const mine = useQuery({
    queryKey: ['shifts', 'me', from, to],
    queryFn: () => api.myShifts(from, to),
    enabled,
  })
  const friends = useQueries({
    queries: computed(() =>
      (subs.data.value ?? []).map((s) => ({
        queryKey: ['shifts', s.ownerId, from, to],
        queryFn: () => api.friendShifts(s.ownerId, from, to),
        enabled: enabled.value,
      })),
    ),
  })

  // null until every schedule has loaded: a partial picture would announce days off that are not shared
  const days = computed(() => {
    if (!enabled.value || !mine.data.value || !subs.data.value?.length) return null
    const lists = [mine.data.value, ...friends.value.map((q) => q.data)]
    if (lists.some((l) => !l)) return null
    return freeDays(lists.flatMap((l) => l!.map((s) => s.date)), from, to)
  })

  watch(
    [days, enabled],
    ([d, on]) => {
      if (!on) {
        if (notificationsSupported()) void clearScheduled().catch(() => {})
      } else if (d) void scheduleCommonOff(d).catch((e) => console.warn('schedule failed', e))
    },
    { immediate: true },
  )
}
