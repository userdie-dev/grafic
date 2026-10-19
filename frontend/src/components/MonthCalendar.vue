<template>
  <CalendarRoot
    v-slot="{ grid, weekDays }"
    :model-value="selected"
    v-model:placeholder="placeholder"
    locale="ru"
    :week-starts-on="1"
    fixed-weeks
    prevent-deselect
    weekday-format="short"
    class="rounded-[1.75rem] bg-card px-1.5 pb-3 pt-3 sm:rounded-[2rem] sm:px-4 sm:pb-4 sm:pt-4"
    @update:model-value="onPick"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
  >
    <CalendarHeader class="mb-0 px-1.5">
      <CalendarPrevButton class="size-10 shrink-0 rounded-full border-0 bg-muted/60 text-muted-foreground opacity-100 transition active:scale-90 active:bg-muted" @click="s.shiftMonth(-1)" />
      <CalendarHeading class="min-w-0 flex-1 text-center text-[1.05rem] font-semibold tracking-tight first-letter:uppercase sm:text-lg" />
      <CalendarNextButton class="size-10 shrink-0 rounded-full border-0 bg-muted/60 text-muted-foreground opacity-100 transition active:scale-90 active:bg-muted" @click="s.shiftMonth(1)" />
    </CalendarHeader>

    <div class="-mt-1 mb-3 flex h-7 justify-center">
      <button
        v-if="monthsFromToday"
        type="button"
        class="rounded-full bg-primary/12 px-3.5 text-xs font-medium text-primary transition active:scale-95"
        @click="s.shiftMonth(-monthsFromToday)"
      >
        ← К текущему месяцу
      </button>
    </div>

    <CalendarGrid v-for="m in grid" :key="m.value.toString()" class="w-full table-fixed border-separate border-spacing-0">
      <CalendarGridHead>
        <CalendarGridRow>
          <CalendarHeadCell
            v-for="(d, i) in weekDays"
            :key="d"
            class="min-w-0 basis-0 pb-1.5 text-xs font-medium"
            :class="i >= 5 ? 'text-muted-foreground/50' : 'text-foreground/80'"
          >{{ d }}</CalendarHeadCell>
        </CalendarGridRow>
      </CalendarGridHead>
      <CalendarGridBody>
        <CalendarGridRow v-for="(week, i) in m.rows" :key="i" class="w-full">
          <CalendarCell v-for="date in week" :key="date.toString()" :date="date" class="min-w-0 basis-0 p-[1.5px] text-sm sm:p-[3px]">
            <CalendarCellTrigger
              :day="date"
              :month="m.value"
              class="group/day flex h-auto min-h-[4.75rem] w-full flex-col items-center justify-start gap-1 rounded-xl bg-transparent px-0.5 pb-1.5 pt-1.5 font-normal ring-1 ring-inset ring-transparent transition hover:bg-transparent active:scale-95 data-[outside-view]:opacity-30 data-[selected]:bg-transparent data-[today]:bg-transparent data-[selected]:ring-foreground/80 data-[today]:ring-foreground/40 data-[selected]:text-foreground data-[selected]:hover:bg-transparent data-[selected]:hover:text-foreground data-[selected]:focus:bg-transparent data-[selected]:focus:text-foreground [&[data-today]:not([data-selected])]:bg-transparent [&[data-today]:not([data-selected])]:text-foreground sm:min-h-28 sm:items-stretch sm:gap-1 sm:px-1.5"
            >
              <span class="flex h-7 items-center justify-center text-[15px] font-medium sm:self-start sm:px-1">{{ date.day }}</span>

              <!-- mobile: colour pills -->
              <span v-if="dayEntries(date).length" class="flex w-full flex-col items-center gap-[3px] sm:hidden">
                <span
                  v-for="e in dayEntries(date).slice(0, 3)"
                  :key="e.shift.id + e.who"
                  class="flex h-3.5 w-full items-center justify-center rounded-[5px]"
                  :style="{ background: e.color }"
                >
                  <Moon v-if="isNightShift(e.shift)" class="size-2 text-white" />
                </span>
              </span>

              <!-- tablet+: dot + time -->
              <template v-for="e in dayEntries(date).slice(0, MAX)" :key="e.shift.id + e.who">
                <span
                  class="hidden items-center gap-1.5 truncate text-left text-[10px] leading-[18px] font-medium text-foreground/80 sm:flex"
                  :title="`${e.name}: ${e.shift.start}–${e.shift.end} ${e.shift.note ?? ''}`"
                >
                  <span class="size-2.5 shrink-0 rounded-full" :style="{ background: e.color }" />
                  <Moon v-if="isNightShift(e.shift)" class="-mx-0.5 size-3 shrink-0" aria-label="Ночная смена" />
                  {{ e.shift.start }}–{{ e.shift.end }}
                </span>
              </template>
              <span v-if="dayEntries(date).length > MAX" class="hidden px-1 text-left text-[10px] text-muted-foreground sm:block">
                +{{ dayEntries(date).length - MAX }}
              </span>
            </CalendarCellTrigger>
          </CalendarCell>
        </CalendarGridRow>
      </CalendarGridBody>
    </CalendarGrid>
  </CalendarRoot>
</template>

<script setup lang="ts">
import { computed, ref, watch, type Ref } from 'vue'
import { differenceInCalendarMonths } from 'date-fns'
import { CalendarRoot, type DateValue } from 'reka-ui'
import { CalendarDate } from '@internationalized/date'
import { Moon } from '@lucide/vue'
import { isNightShift } from '@/lib/night'
import {
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarHeader,
  CalendarHeading,
  CalendarNextButton,
  CalendarPrevButton,
} from '@/components/ui/calendar'
import { useScheduleStore } from '@/stores/schedule'
import type { Shift } from '@/lib/dto'

const MAX = 3
const props = defineProps<{
  month: Date
  entries: Record<string, { who: string; name: string; color: string; shift: Shift }[]>
}>()
const emit = defineEmits<{ select: [date: string] }>()
const s = useScheduleStore()

// months between the shown month and the current one (0 = already on it)
const monthsFromToday = computed(() => differenceInCalendarMonths(props.month, new Date()))

const dayEntries = (d: DateValue) => props.entries[d.toString()] ?? []

const toCal =(d: Date) => new CalendarDate(d.getFullYear(), d.getMonth() + 1, 1)
const placeholder = ref(toCal(props.month)) as Ref<DateValue>
const selected = ref<DateValue | undefined>()

// the store is the source of truth for the shown month
watch(() => props.month, (m) => (placeholder.value = toCal(m)))
// month changed via the calendar's own keyboard navigation
watch(placeholder, (p) => {
  const diff = (p.year - props.month.getFullYear()) * 12 + p.month - (props.month.getMonth() + 1)
  if (diff) s.shiftMonth(diff)
})

// horizontal swipe switches the month: left = next, right = previous
let touch: { x: number; y: number } | null = null
function onTouchStart(e: TouchEvent) {
  const t = e.touches[0]
  touch = e.touches.length === 1 && t ? { x: t.clientX, y: t.clientY } : null
}
function onTouchEnd(e: TouchEvent) {
  const t = e.changedTouches[0]
  if (!touch || !t) return
  const dx = t.clientX - touch.x
  const dy = t.clientY - touch.y
  touch = null
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) s.shiftMonth(dx < 0 ? 1 : -1)
}

function onPick(v: DateValue | DateValue[] | undefined) {
  if (v && !Array.isArray(v)) selected.value = v as DateValue
  if (v && !Array.isArray(v)) emit('select', v.toString())
}
</script>
