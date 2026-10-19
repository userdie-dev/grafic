import { computed } from 'vue'
import { addMonths, parseISO } from 'date-fns'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { registerDevice, setToken } from '@/lib/api'
import { setUnauthorizedHandler } from '@/app/config/axios'
import type { Device } from '@/lib/dto'
import { iso } from '@/lib/dates'

interface State {
  device: Device | null
  /** any day of the month shown in the calendar, YYYY-MM-DD */
  month: string
  /** local friend names by ownerId (the server only knows ids) */
  labels: Record<string, string>
  /** ids of people hidden in the calendar */
  hidden: string[]
}

/**
 * Client-side state only; the whole store is mirrored to localStorage by vueuse.
 * Server data (shifts, subscriptions) lives in the vue-query cache.
 */
export const useScheduleStore = defineStore('schedule', () => {
  const state = useLocalStorage<State>(
    'grafic.store',
    { device: null, month: iso(new Date()), labels: {}, hidden: [] },
    { mergeDefaults: true },
  )

  // the api layer reads the token from here, including after a page reload
  if (state.value.device) setToken(state.value.device.token)

  const month = computed(() => parseISO(state.value.month))

  /** Registers this device on first run. */
  async function ensureDevice() {
    if (state.value.device) return
    const device = await registerDevice()
    setToken(device.token)
    state.value.device = device
  }

  let reregistering: Promise<void> | undefined
  // the server forgot our token: drop the stale device and register a new one (shared by concurrent 401s)
  setUnauthorizedHandler(() => {
    reregistering ??= (async () => {
      setToken('')
      const device = await registerDevice()
      setToken(device.token)
      state.value.device = device
    })().finally(() => (reregistering = undefined))
    return reregistering
  })

  return {
    state,
    month,
    ensureDevice,
    shiftMonth: (n: number) => (state.value.month = iso(addMonths(month.value, n))),
    toggle: (id: string) => {
      const h = state.value.hidden
      state.value.hidden = h.includes(id) ? h.filter((x) => x !== id) : [...h, id]
    },
    rename: (ownerId: string, label: string) => (state.value.labels[ownerId] = label),
    setShareCode: (shareCode: string) => {
      if (state.value.device) state.value.device.shareCode = shareCode
    },
  }
})
