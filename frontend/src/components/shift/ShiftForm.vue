<template>
  <form class="space-y-4" @submit.prevent="submit">
    <div v-if="!editing" class="space-y-3">
      <div class="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          :class="tone(mode === 'single')"
          class="flex-1 rounded-full"
          @click="mode = 'single'"
        >Один день</Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          :class="tone(mode === 'preset')"
          class="flex-1 rounded-full"
          @click="mode = 'preset'"
        >Пресет</Button>
      </div>
      
      <div v-if="mode === 'preset'" class="space-y-3">
        <div class="flex flex-wrap gap-2">
          <Button
            v-for="p in presets.all"
            :key="p.id"
            type="button"
            size="sm"
            variant="secondary"
            :class="tone(preset.id === p.id && !creating)"
            class="rounded-full"
            @click="setPreset(p)"
          >{{ p.label }}</Button>
          <Button type="button" size="sm" variant="secondary" :class="tone(creating)" class="rounded-full" aria-label="Создать свой пресет" @click="creating = !creating"><RiAddLine /></Button>
        </div>
        <PresetCreator v-if="creating" @created="setPreset" />
        <p v-if="hint" class="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{{ hint }}</span>
          <button v-if="preset.custom" type="button" class="shrink-0 text-destructive underline" @click="deletePreset">Удалить пресет</button>
        </p>
      </div>
    </div>

    <div class="flex gap-2 pt-2">
      <label class="flex-1 space-y-1.5 text-xs text-muted-foreground">Начало<TimePicker v-model="start" /></label>
      <label class="flex-1 space-y-1.5 text-xs text-muted-foreground">Конец<TimePicker v-model="end" :allow-next-day="true" /></label>
    </div>
    <Input v-model="note" maxlength="200" placeholder="Заметка" class="h-10" />
    <p v-if="problem" class="text-sm text-destructive">{{ problem }}</p>
    <div class="flex gap-2 pt-2">
      <Button size="lg" :class="PRIMARY_BLUE" class="h-11 flex-1 rounded-full">Сохранить</Button>
      <Button type="button" variant="outline" size="lg" class="h-11 rounded-full" @click="emit('done')">Отмена</Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { addDays, addWeeks, getDay, parseISO } from 'date-fns'
import { RiAddLine } from '@remixicon/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TimePicker } from '@/components/ui/time-picker'
import { useDayEditor } from '@/composables/useDayEditor'
import type { Shift, ShiftInput } from '@/lib/dto'
import { iso } from '@/lib/dates'
import { BUILTIN_PRESETS, describe, works, type Preset } from '@/lib/presets'
import { PRIMARY_BLUE, tone } from '@/lib/tone'
import { usePresetsStore } from '@/stores/presets'
import PresetCreator from './PresetCreator.vue'

type Mode = 'single' | 'preset'

// without an explicit end date a cycle/weekday preset is laid out for about a year (capped at 366 shifts)
const DEFAULT_FILL_DAYS = 366

const props = defineProps<{ editing: Shift | null }>()
const emit = defineEmits<{ done: [] }>()
const editor = useDayEditor()

const presets = usePresetsStore()

const mode = ref<Mode>('single')
const preset = ref<Preset>(BUILTIN_PRESETS[0]!)
const creating = ref(false)
const start = ref(props.editing?.start ?? '09:00')
const end = ref(props.editing?.end ?? '18:00')
const note = ref(props.editing?.note ?? '')
const problem = ref('')

const isOnce = computed(() => preset.value.rule.type === 'once')
const isWeekly = computed(() => preset.value.rule.type === 'weekly')
const hint = computed(() => describe(preset.value))

// Determine if shift is night shift based on time
const isNightShift = computed(() => {
  const startHour = parseInt(start.value.split(':')[0] || '0', 10)
  const endHour = parseInt(end.value.split(':')[0] || '0', 10)
  // Night shift: starts after 18:00 or ends before 12:00 (crosses midnight)
  return startHour >= 18 || endHour < 12 || endHour < startHour
})

function applyTimes() {
  const kind = isNightShift.value ? 'night' : 'day'
  ;[start.value, end.value] = preset.value[kind]
}

function setPreset(p: Preset) {
  creating.value = false
  preset.value = p
  applyTimes()
}

function deletePreset() {
  presets.remove(preset.value.id)
  setPreset(BUILTIN_PRESETS[0]!)
}

/** Shifts the form would create; `null` when the period is too long. */
function buildItems(): ShiftInput[] | null {
  const items: ShiftInput[] = []
  const first = parseISO(editor.date.value)
  const add = (d: Date) => items.push({ date: iso(d), start: start.value, end: end.value, note: note.value || null })
  
  // Single shift: editing or single mode
  if (props.editing || mode.value === 'single') {
    add(first)
    return items
  }
  
  // Preset mode: 'once' preset
  if (isOnce.value) {
    add(first)
    return items
  }
  
  // Weekly repeating shift
  if (isWeekly.value) {
    let d = first
    const last = addDays(first, DEFAULT_FILL_DAYS - 1)
    while (d <= last && items.length < 366) {
      add(d)
      d = addWeeks(d, 1)
    }
    return items
  }
  
  // Cycle or weekdays preset
  const last = addDays(first, DEFAULT_FILL_DAYS - 1)
  for (let d = first, i = 0; d <= last; d = addDays(d, 1), i++) {
    if (items.length >= 366) return null
    if (works(preset.value, i, getDay(d))) add(d)
  }
  return items
}

function submit() {
  if (!start.value || !end.value) {
    problem.value = 'Укажите время'
    return
  }
  const items = buildItems()
  if (!items) {
    problem.value = 'Слишком длинный период (максимум 366 смен)'
    return
  }
  
  // When editing a shift, we need to handle several cases:
  // 1. If start time changed, delete old shift (server keys by date+start)
  // 2. If we're editing a single shift but it was part of a preset, only delete that specific shift
  let removeIds: string[] = []
  
  if (props.editing) {
    // Always remove the edited shift when any field changes
    removeIds = [props.editing.id]
  }
  
  editor.save(items, removeIds)
  emit('done')
}
</script>
