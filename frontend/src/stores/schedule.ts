import { computed } from 'vue'
import { addMonths, parseISO } from 'date-fns'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { registerDevice, setToken } from '@/lib/api'
import { setUnauthorizedHandler } from '@/app/config/axios'
import type { Device } from '@/lib/dto'
import { iso } from '@/lib/dates'

export interface Group {
  id: string
  name: string
  color: string
  memberIds: string[] // ids of people in this group
}

interface State {
  version?: number
  device: Device | null
  /** any day of the month shown in the calendar, YYYY-MM-DD */
  month: string
  /** local friend names by ownerId (the server only knows ids) */
  labels: Record<string, string>
  /** local colour overrides by ownerId */
  colors: Record<string, string>
  /** ids of people hidden in the calendar */
  hidden: string[]
  /** tint days when everyone visible is off */
  showCommonOff: boolean
  /** tint days when everyone visible shares at least one free hour */
  showFreeHours: boolean
  /** remind the evening before a day off shared by me and all my friends */
  notifyCommonOff: boolean
  /** user-defined groups */
  groups: Group[]
}

const CURRENT_VERSION = 1

/**
 * Client-side state only; the whole store is mirrored to localStorage by vueuse.
 * Server data (shifts, subscriptions) lives in the vue-query cache.
 */
export const useScheduleStore = defineStore('schedule', () => {
  const state = useLocalStorage<State>(
    'grafic.store',
    { 
      version: CURRENT_VERSION,
      device: null, 
      month: iso(new Date()), 
      labels: {}, 
      colors: {}, 
      hidden: [], 
      showCommonOff: true, 
      showFreeHours: true, 
      notifyCommonOff: false,
      groups: []
    },
    { 
      mergeDefaults: true,
      serializer: {
        read: (v: string) => {
          const parsed = JSON.parse(v)
          // Migration: if no version or old version, preserve existing data
          if (!parsed.version || parsed.version < CURRENT_VERSION) {
            parsed.version = CURRENT_VERSION
            // Preserve all existing data during migration
            if (!parsed.groups) parsed.groups = []
          }
          return parsed
        },
        write: (v: State) => JSON.stringify(v),
      },
    },
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
    setColor: (ownerId: string, color: string) => (state.value.colors[ownerId] = color),
    setShareCode: (shareCode: string) => {
      if (state.value.device) state.value.device.shareCode = shareCode
    },
    // Group management
    addGroup: (name: string, color: string) => {
      const group: Group = { 
        id: `group-${Date.now().toString(36)}`, 
        name, 
        color, 
        memberIds: [] 
      }
      state.value.groups = [...state.value.groups, group]
      return group
    },
    removeGroup: (id: string) => {
      state.value.groups = state.value.groups.filter((g) => g.id !== id)
    },
    updateGroup: (id: string, updates: Partial<Omit<Group, 'id'>>) => {
      state.value.groups = state.value.groups.map((g) => 
        g.id === id ? { ...g, ...updates } : g
      )
    },
    addGroupMember: (groupId: string, memberId: string) => {
      state.value.groups = state.value.groups.map((g) => 
        g.id === groupId && !g.memberIds.includes(memberId)
          ? { ...g, memberIds: [...g.memberIds, memberId] }
          : g
      )
    },
    removeGroupMember: (groupId: string, memberId: string) => {
      state.value.groups = state.value.groups.map((g) => 
        g.id === groupId
          ? { ...g, memberIds: g.memberIds.filter((id) => id !== memberId) }
          : g
      )
    },
  }
})
