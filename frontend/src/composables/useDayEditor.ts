import { computed, inject, provide, ref, type InjectionKey } from 'vue'
import type { ShiftInput } from '@/lib/dto'
import { ME, useSchedule } from '@/composables/useSchedule'

/** State and actions of the day (shifts) editor drawer, shared between the page and the drawer. */
function createDayEditor() {
  const s = useSchedule()
  const selected = ref<string | null>(null)

  const shifts = computed(() => s.myShifts.filter((x) => x.date === selected.value))
  // friends only: my own shifts are listed separately
  const friends = computed(() => (selected.value ? (s.byDate[selected.value] ?? []) : []).filter((e) => e.who !== ME))

  return {
    selected,
    date: computed(() => selected.value ?? ''),
    shifts,
    friends,
    open: (date: string) => (selected.value = date),
    close: () => (selected.value = null),
    save: (items: ShiftInput[], removeIds: string[]) => s.saveShifts(items, removeIds),
    remove: (id: string) => s.deleteShift(id),
  }
}

export type DayEditor = ReturnType<typeof createDayEditor>
export const DAY_EDITOR_KEY: InjectionKey<DayEditor> = Symbol('dayEditor')

export function provideDayEditor() {
  const editor = createDayEditor()
  provide(DAY_EDITOR_KEY, editor)
  return editor
}

export function useDayEditor() {
  const editor = inject(DAY_EDITOR_KEY)
  if (!editor) throw new Error('useDayEditor() needs provideDayEditor() in an ancestor')
  return editor
}
