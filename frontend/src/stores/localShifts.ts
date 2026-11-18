import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/lib/api'
import type { Shift, ShiftInput } from '@/lib/dto'
import {
  appendNativeChange, cacheNativeShifts, isAndroid, openNativeJournal, shiftKey,
  type ShiftCache, type ShiftJournal,
} from '@/lib/syncService'
import { toUtcInput } from '@/lib/tz'
import { useScheduleStore } from './schedule'

const journalKey = 'grafic.shiftJournal'
const cacheKey = 'grafic.shiftCache'
const emptyJournal: ShiftJournal = { overrides: {}, pending: [] }

const withLock = <T>(name: string, run: () => Promise<T>) =>
  navigator.locks ? navigator.locks.request(name, run) : run()

function read<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback
  } catch {
    return fallback
  }
}

export const useLocalShiftsStore = defineStore('localShifts', () => {
  const schedule = useScheduleStore()
  const journal = ref<ShiftJournal>(isAndroid ? emptyJournal : read(journalKey, emptyJournal))
  const cache = ref<ShiftCache | null>(isAndroid ? null : read(cacheKey, null))
  let opening: Promise<void> | undefined
  let sending: Promise<void> | undefined
  let edits = Promise.resolve()

  function open(legacyCache?: ShiftCache) {
    if (!isAndroid) return Promise.resolve()
    if (!opening) {
      opening = openNativeJournal(schedule.state.device, legacyCache).then((stored) => {
        journal.value = { ...emptyJournal, overrides: stored.overrides }
        cache.value = stored.cache
      }).catch((error: unknown) => {
        opening = undefined
        throw error
      })
    }
    return opening
  }

  function write(next: ShiftJournal) {
    localStorage.setItem(journalKey, JSON.stringify(next))
    journal.value = next
  }

  function reloadJournal() {
    if (!isAndroid) journal.value = read(journalKey, emptyJournal)
  }

  async function remember(next: ShiftCache) {
    if (isAndroid) {
      await open()
      await cacheNativeShifts(next)
      cache.value = next
      return
    }
    cache.value = next
    try {
      localStorage.setItem(cacheKey, JSON.stringify(cache.value))
    } catch {
      // Remote data is a cache. Failure to cache it must not block editing.
    }
  }

  const shifts = computed(() => {
    const owner = schedule.state.device?.userId
    const remote = cache.value?.owner === owner ? cache.value?.shifts ?? [] : []
    const shifts = new Map(remote.map((shift) => [shiftKey(shift), shift]))
    for (const [key, shift] of Object.entries(journal.value.overrides)) {
      if (shift) shifts.set(key, shift)
      else shifts.delete(key)
    }
    return [...shifts.values()]
  })

  async function flush() {
    if (isAndroid) return
    sending ??= withLock('grafic.shiftSender', async () => {
      reloadJournal()
      if (!journal.value.pending.length) return
      await schedule.ensureDevice()
      while (journal.value.pending.length) {
        const change = journal.value.pending[0]!
        for (const shift of change.remove) {
          const id = shift.serverId ?? (await api.myShifts(shift.date, shift.date))
            .find((remote) => shiftKey(remote) === shiftKey(shift))?.id
          if (id) await api.deleteShift(id)
        }
        if (change.items.length) await api.saveUtcShifts(change.items)
        await withLock(journalKey, async () => {
          reloadJournal()
          write({ ...journal.value, pending: journal.value.pending.slice(1) })
        })
      }
    }).finally(() => { sending = undefined })
    await sending
  }

  async function applyEdit(items: ShiftInput[], removeIds: string[]) {
    await open()
    reloadJournal()
    const toSave = new Map(items.map(toUtcInput).map((shift) => [shiftKey(shift), shift]))
    const remove = shifts.value.filter((shift) => removeIds.includes(shift.id) && !toSave.has(shiftKey(shift)))
      .map(({ id, date, start }) => ({ date, start, ...(id.startsWith('local:') ? {} : { serverId: id }) }))
    if (!remove.length && !toSave.size) return

    const change = { items: [...toSave.values()], remove }
    const overrides: ShiftJournal['overrides'] = {}
    for (const shift of remove) overrides[shiftKey(shift)] = null
    for (const [key, shift] of toSave) {
      overrides[key] = { ...shift, id: `local:${key}`, note: shift.note ?? null }
    }
    if (isAndroid) {
      await appendNativeChange(change, overrides)
      journal.value = { ...emptyJournal, overrides: { ...journal.value.overrides, ...overrides } }
    } else {
      write({
        overrides: { ...journal.value.overrides, ...overrides },
        pending: [...journal.value.pending, change],
      })
    }
  }

  function edit(items: ShiftInput[], removeIds: string[]) {
    const apply = () => applyEdit(items, removeIds)
    const saved = edits.then(() => isAndroid ? apply() : withLock(journalKey, apply))
    edits = saved.catch(() => { /* A failed write must not block later edits. */ })
    if (!isAndroid) void saved.then(flush).catch(() => { /* Retried by the sync loop. */ })
    return saved
  }

  return { cache, journal, shifts, open, remember, edit, flush, reloadJournal }
})
