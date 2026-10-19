<template>
  <Drawer :open="open" @update:open="onOpenChange">
    <DrawerContent class="pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div class="flex items-center justify-between gap-2 px-1 pb-3 pt-2">
        <div class="flex min-w-0 items-center gap-2">
          <Button v-if="view === 'form'" type="button" variant="ghost" size="icon" aria-label="Назад" class="-ml-1 rounded-full" @click="backToList"><RiArrowLeftLine /></Button>
          <DrawerTitle class="truncate text-lg">{{ editing ? `Изменить смену — ${title}` : title }}</DrawerTitle>
        </div>
        <Button v-if="view === 'list'" type="button" size="icon-lg" class="shrink-0 rounded-full" aria-label="Добавить смену" @click="openForm(null)"><RiAddLine class="size-5" /></Button>
      </div>
      <DrawerDescription class="sr-only">Смены на выбранный день</DrawerDescription>

      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-1">
      <div v-if="view === 'list'" class="space-y-3">
      <ul class="space-y-1.5">
        <li v-for="s in shifts" :key="s.id" class="flex items-center justify-between gap-2 rounded-2xl bg-secondary px-3 py-2.5 text-sm">
          <span class="min-w-0 truncate font-medium"><Moon v-if="isNightShift(s)" class="mr-1 inline size-4 align-text-bottom" aria-label="Ночная смена" />{{ s.start }}–{{ s.end }} <span class="font-normal text-muted-foreground">{{ s.note }}</span></span>
          <span class="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon-sm" aria-label="Изменить" @click="openForm(s)"><RiEditLine /></Button>
            <Button variant="destructive" size="icon-sm" aria-label="Удалить" @click="emit('remove', s.id)"><RiDeleteBinLine /></Button>
          </span>
        </li>
        <li v-if="!shifts.length" class="rounded-2xl border border-dashed py-4 text-center text-sm text-muted-foreground">В этот день смен нет</li>
      </ul>
      <div v-if="friends.length" class="space-y-1.5 border-t pt-3">
        <p class="text-sm font-medium">Друзья</p>
        <ul class="space-y-1.5">
          <li v-for="f in friends" :key="f.who + f.shift.id" class="flex items-center gap-2 min-h-12 rounded-2xl bg-secondary/60 px-4 py-3 text-base">
            <span class="size-2.5 shrink-0 rounded-full" :style="{ background: f.color }" />
            <span class="shrink-0 font-medium">{{ f.name }}</span>
            <span class="min-w-0 flex-1 truncate text-right text-muted-foreground"><Moon v-if="isNightShift(f.shift)" class="mr-1 inline size-4 align-text-bottom" aria-label="Ночная смена" />{{ f.shift.start }}–{{ f.shift.end }}<template v-if="f.shift.note"> · {{ f.shift.note }}</template></span>
          </li>
        </ul>
      </div>
      </div>

      <form v-else class="space-y-2" @submit.prevent="submit">
        <div v-if="!editing" class="space-y-1.5">
          <div class="flex flex-wrap gap-1.5">
            <Button
              v-for="p in presets.all"
              :key="p.id"
              type="button"
              size="sm"
              variant="secondary" :class="tone(preset.id === p.id && !creating)"
              class="rounded-full"
              @click="setPreset(p)"
            >{{ p.label }}</Button>
            <Button type="button" size="sm" variant="secondary" :class="tone(creating)" class="rounded-full" aria-label="Создать свой пресет" @click="creating = !creating"><RiAddLine /></Button>
          </div>
          <div v-if="creating" class="space-y-2 rounded-2xl border p-3">
            <Input v-model="draft.label" maxlength="20" placeholder="Название пресета" class="h-10" />
            <div class="flex gap-1.5">
              <Button type="button" size="sm" variant="secondary" :class="tone(draft.mode === 'cycle')" class="flex-1 rounded-full" @click="draft.mode = 'cycle'">Через N дней</Button>
              <Button type="button" size="sm" variant="secondary" :class="tone(draft.mode === 'weekdays')" class="flex-1 rounded-full" @click="draft.mode = 'weekdays'">По дням недели</Button>
            </div>
            <div v-if="draft.mode === 'cycle'" class="flex gap-2">
              <label class="flex-1 space-y-1 text-xs text-muted-foreground">Рабочих дней<Input v-model.number="draft.work" type="number" min="1" max="30" class="h-10 text-foreground" /></label>
              <label class="flex-1 space-y-1 text-xs text-muted-foreground">Выходных<Input v-model.number="draft.off" type="number" min="0" max="30" class="h-10 text-foreground" /></label>
            </div>
            <div v-else class="flex gap-1">
              <Button
                v-for="d in WEEK"
                :key="d.dow"
                type="button"
                size="sm"
                variant="secondary" :class="tone(draft.days.includes(d.dow))"
                class="h-9 flex-1 rounded-full px-0"
                @click="toggleDay(d.dow)"
              >{{ d.label }}</Button>
            </div>
            <p v-if="draftProblem" class="text-sm text-destructive">{{ draftProblem }}</p>
            <Button type="button" size="sm" class="w-full rounded-full bg-blue-600 text-white hover:bg-blue-600/90 dark:bg-blue-500 dark:hover:bg-blue-500/90" @click="createPreset">Сохранить пресет</Button>
          </div>
          <div class="flex gap-1.5">
            <Button
              v-for="k in KINDS"
              :key="k.id"
              type="button"
              size="sm"
              variant="secondary" :class="tone(kind === k.id)"
              class="flex-1 rounded-full"
              @click="setKind(k.id)"
            >{{ k.label }}</Button>
          </div>
          <p v-if="hint" class="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{{ hint }}</span>
            <button v-if="preset.custom" type="button" class="shrink-0 text-destructive underline" @click="deletePreset">Удалить пресет</button>
          </p>
        </div>
        <div class="flex gap-2">
          <label class="flex-1 space-y-1 text-xs text-muted-foreground">Начало<TimePicker v-model="start" /></label>
          <label class="flex-1 space-y-1 text-xs text-muted-foreground">Конец<TimePicker v-model="end" /></label>
        </div>
        <Input v-model="note" maxlength="200" placeholder="Заметка" class="h-10" />
        <p v-if="problem" class="text-sm text-destructive">{{ problem }}</p>
        <div class="flex gap-2">
          <Button size="lg" class="h-11 flex-1 rounded-full bg-blue-600 text-white hover:bg-blue-600/90 dark:bg-blue-500 dark:hover:bg-blue-500/90">Сохранить</Button>
          <Button type="button" variant="outline" size="lg" class="h-11 rounded-full" @click="backToList">Отмена</Button>
        </div>
      </form>
      </div>
    </DrawerContent>
  </Drawer>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { addDays, addWeeks, format, getDay, parseISO } from 'date-fns'
import { RiAddLine, RiArrowLeftLine, RiDeleteBinLine, RiEditLine } from '@remixicon/vue'
import { Moon } from '@lucide/vue'
import { isNightShift } from '@/lib/night'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { TimePicker } from '@/components/ui/time-picker'
import type { Shift, ShiftInput } from '@/lib/dto'
import { iso } from '@/lib/dates'
import { BUILTIN_PRESETS, describe, works, type Preset } from '@/lib/presets'
import { usePresetsStore } from '@/stores/presets'

const props = withDefaults(defineProps<{ date: string; shifts: Shift[]; friends?: { who: string; name: string; color: string; shift: Shift }[] }>(), { friends: () => [] })
const emit = defineEmits<{
  save: [items: ShiftInput[], removeIds: string[]]
  remove: [id: string]
  close: []
}>()

type Kind = 'day' | 'night'

const KINDS: { id: Kind; label: string }[] = [
  { id: 'day', label: 'Дневные' },
  { id: 'night', label: 'Ночные' },
]
const WEEK = [1, 2, 3, 4, 5, 6, 0].map((dow) => ({ dow, label: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][dow]! }))

const presets = usePresetsStore()

const CLOSE_ANIMATION_MS = 200
// without an explicit end date a cycle/weekday preset is laid out for about a year (capped at 366 shifts)
const DEFAULT_FILL_DAYS = 366

// blue toggle buttons: solid when selected, pale otherwise
const tone = (active: boolean) =>
  active
    ? 'bg-blue-600 text-white hover:bg-blue-600/90 dark:bg-blue-500 dark:hover:bg-blue-500/90'
    : 'bg-blue-100 text-blue-900 hover:bg-blue-100/80 dark:bg-blue-950 dark:text-blue-100 dark:hover:bg-blue-950/80'

// the parent unmounts us on `close`, so wait for the exit animation to finish first
const open = ref(true)
let closeTimer: ReturnType<typeof setTimeout> | undefined
function onOpenChange(v: boolean) {
  if (v) return
  open.value = false
  closeTimer = setTimeout(() => emit('close'), CLOSE_ANIMATION_MS)
}
// a stale `close` would clear the selection of a newer editor opened meanwhile
onBeforeUnmount(() => clearTimeout(closeTimer))

const preset = ref<Preset>(BUILTIN_PRESETS[0]!)
const kind = ref<Kind>('day')
const editing = ref<Shift | null>(null)
const start = ref('09:00')
const end = ref('18:00')
const note = ref('')
const problem = ref('')
const creating = ref(false)

const isWeekly = computed(() => preset.value.rule.type === 'weekly')
const hint = computed(() => describe(preset.value))

function applyTimes() {
  ;[start.value, end.value] = preset.value[kind.value]
}

function setPreset(p: Preset) {
  creating.value = false
  preset.value = p
  applyTimes()
}

function setKind(k: Kind) {
  kind.value = k
  applyTimes()
}

const draftProblem = ref('')
const draft = reactive({
  label: '',
  mode: 'cycle' as 'cycle' | 'weekdays',
  work: 2,
  off: 2,
  days: [1, 2, 3, 4, 5],
})

function toggleDay(d: number) {
  draft.days = draft.days.includes(d) ? draft.days.filter((x) => x !== d) : [...draft.days, d]
}

function createPreset() {
  if (draft.mode === 'cycle' && !(draft.work >= 1 && draft.off >= 0)) {
    draftProblem.value = 'Укажите число рабочих и выходных дней'
    return
  }
  if (draft.mode === 'weekdays' && !draft.days.length) {
    draftProblem.value = 'Выберите хотя бы один день недели'
    return
  }
  draftProblem.value = ''
  const created = presets.add({
    label: draft.label.trim() || (draft.mode === 'cycle' ? `${draft.work}/${draft.off}` : 'Свой'),
    hint: '',
    rule:
      draft.mode === 'cycle'
        ? { type: 'cycle', work: draft.work, off: draft.off }
        : { type: 'weekdays', days: [...draft.days] },
    day: ['08:00', '20:00'],
    night: ['20:00', '08:00'],
  })
  draft.label = ''
  setPreset(created)
}

function deletePreset() {
  presets.remove(preset.value.id)
  setPreset(BUILTIN_PRESETS[0]!)
}

const title = computed(() => format(parseISO(props.date), 'dd.MM.yyyy'))

function edit(s: Shift | null) {
  editing.value = s
  preset.value = BUILTIN_PRESETS[0]!
  kind.value = 'day'
  creating.value = false
  start.value = s?.start ?? preset.value.day[0]
  end.value = s?.end ?? preset.value.day[1]
  note.value = s?.note ?? ''
  problem.value = ''
}

function submit() {
  if (!start.value || !end.value) {
    problem.value = 'Укажите время'
    return
  }
  const items: ShiftInput[] = []
  const first = parseISO(props.date)
  const add = (d: Date) => items.push({ date: iso(d), start: start.value, end: end.value, note: note.value || null })
  if (editing.value || isWeekly.value) {
    let d = first
    const last = editing.value ? d : addDays(first, DEFAULT_FILL_DAYS - 1)
    while (d <= last && items.length < 366) {
      add(d)
      d = addWeeks(d, 1)
    }
  } else {
    const last = addDays(first, DEFAULT_FILL_DAYS - 1)
    for (let d = first, i = 0; d <= last; d = addDays(d, 1), i++) {
      if (items.length >= 366) {
        problem.value = 'Слишком длинный период (максимум 366 смен)'
        return
      }
      if (works(preset.value, i, getDay(d))) add(d)
    }
  }
  // the server keys shifts by date+start, so a changed start time must replace the old row
  const removeIds = editing.value && editing.value.start !== start.value ? [editing.value.id] : []
  emit('save', items, removeIds)
  backToList()
}

const view = ref<'list' | 'form'>('list')

function openForm(s: Shift | null) {
  edit(s)
  view.value = 'form'
}

function backToList() {
  edit(null)
  view.value = 'list'
}
</script>
