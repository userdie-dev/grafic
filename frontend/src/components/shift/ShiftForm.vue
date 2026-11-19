<template>
  <form class="space-y-4" @submit.prevent="submit">
    <div v-if="!editing" class="space-y-3">
      <div class="space-y-1.5">
        <label :for="modeSelectId" class="block text-xs text-muted-foreground">Тип графика</label>
        <Select :id="modeSelectId" v-model="mode" :options="MODES" class="h-10" />
      </div>
      
      <div v-if="mode === 'preset'" class="space-y-3">
        <div class="space-y-1.5">
          <label :for="presetSelectId" class="block text-xs text-muted-foreground">Пресет</label>
          <Select :id="presetSelectId" :model-value="preset.id" :options="presets.all" class="h-10" @select="selectPreset" />
        </div>
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
    <Textarea v-model="note" rows="3" maxlength="200" placeholder="Заметка" aria-label="Заметка" />
    <p v-if="problem" class="text-sm text-destructive">{{ problem }}</p>
    <div class="flex gap-2 pt-2">
      <Button type="submit" size="lg" :disabled="saving" class="h-11 flex-1">{{ saving ? 'Сохранение…' : 'Сохранить' }}</Button>
      <Button type="button" variant="secondary" size="lg" class="h-11" @click="emit('done')">Отмена</Button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { addDays, addWeeks, getDay, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { TimePicker } from '@/components/ui/time-picker'
import { useDayEditor } from '@/composables/useDayEditor'
import type { Shift, ShiftInput } from '@/lib/dto'
import { iso } from '@/lib/dates'
import { BUILTIN_PRESETS, describe, works, type Preset } from '@/lib/presets'
import { usePresetsStore } from '@/stores/presets'

const MODES = [
  { id: 'single', label: 'Один день' },
  { id: 'preset', label: 'Пресет' },
] as const

type Mode = (typeof MODES)[number]['id']

// without an explicit end date a cycle/weekday preset is laid out for about a year (capped at 366 shifts)
const DEFAULT_FILL_DAYS = 366

const props = defineProps<{ editing: Shift | null }>()
const emit = defineEmits<{ done: [] }>()
const editor = useDayEditor()

const presets = usePresetsStore()

const mode = ref<Mode>('single')
const modeSelectId = useId()
const preset = ref<Preset>(BUILTIN_PRESETS[0]!)
const presetSelectId = useId()
const start = ref(props.editing?.start ?? '09:00')
const end = ref(props.editing?.end ?? '18:00')
const note = ref(props.editing?.note ?? '')
const problem = ref('')
const saving = ref(false)

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
  preset.value = p
  applyTimes()
}

function selectPreset(id: string) {
  const selected = presets.all.find((p) => p.id === id)
  if (selected) setPreset(selected)
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

async function submit() {
  if (saving.value) return
  problem.value = ''
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
  
  saving.value = true
  try {
    await editor.save(items, removeIds)
    emit('done')
  } catch (error) {
    problem.value = error instanceof Error ? error.message : 'Не удалось сохранить смены. Попробуйте ещё раз.'
  } finally {
    saving.value = false
  }
}
</script>
