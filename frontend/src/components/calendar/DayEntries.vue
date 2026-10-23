<template>
  <!-- mobile: colour dots -->
  <span v-if="entries.length" class="flex w-full flex-wrap items-center justify-center gap-1 sm:hidden">
    <template v-for="e in entries.slice(0, DOTS_MAX)" :key="e.shift.id + e.who">
      <Moon v-if="isNightShift(e.shift)" class="size-3.5" stroke-width="2.5" :style="{ color: e.color }" />
      <span v-else class="size-2.5 rounded-full" :style="{ background: e.color }" />
    </template>
  </span>

  <!-- tablet+: dot + time -->
  <span
    v-for="e in entries.slice(0, ROWS_MAX)"
    :key="e.shift.id + e.who"
    class="hidden items-center gap-1.5 truncate text-left text-[10px] leading-[18px] font-medium text-foreground/80 sm:flex"
    :title="`${e.name}: ${e.shift.start}–${e.shift.end} ${e.shift.note ?? ''}`"
  >
    <span class="size-2.5 shrink-0 rounded-full" :style="{ background: e.color }" />
    <Moon v-if="isNightShift(e.shift)" class="-mx-0.5 size-3.5 shrink-0" stroke-width="2.5" :style="{ color: e.color }" aria-label="Ночная смена" />
    {{ e.shift.start }}–{{ e.shift.end }}
  </span>
  <span v-if="entries.length > ROWS_MAX" class="hidden px-1 text-left text-[10px] text-muted-foreground sm:block">
    +{{ entries.length - ROWS_MAX }}
  </span>
</template>

<script setup lang="ts">
import { Moon } from '@lucide/vue'
import type { Entry } from '@/composables/useSchedule'
import { isNightShift } from '@/lib/night'

const DOTS_MAX = 4
const ROWS_MAX = 3

defineProps<{ entries: Entry[] }>()
</script>
