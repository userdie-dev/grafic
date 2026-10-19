<template>
  <section class="space-y-3">
    <MonthCalendar :month="s.month" :entries="s.byDate" @select="selected = $event" />

    <div class="grid grid-cols-2 gap-2.5 text-base sm:flex sm:flex-wrap sm:gap-3">
      <button
        v-for="p in s.people"
        :key="p.id"
        type="button"
        class="flex min-h-14 touch-manipulation select-none items-center gap-3 rounded-2xl bg-card px-4 py-3 text-left font-medium shadow-sm transition-[opacity,transform] active:scale-[0.97] sm:rounded-full sm:px-5"
        :class="{ 'line-through opacity-40': s.hidden.includes(p.id) }"
        @click="s.toggle(p.id)"
      >
        <span class="size-5 shrink-0 rounded-full" :style="{ background: p.color }" /><span class="min-w-0 truncate">{{ p.name }}</span>
      </button>
    </div>

    <ShiftEditor
      v-if="selected"
      :key="selected"
      :date="selected"
      :shifts="selectedShifts"
      :friends="selectedFriends"
      @close="selected = null"
      @save="(items, ids) => s.saveShifts(items, ids)"
      @remove="s.deleteShift"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import MonthCalendar from '@/components/MonthCalendar.vue'
import ShiftEditor from '@/components/ShiftEditor.vue'
import { ME, useSchedule } from '@/composables/useSchedule'

const s = useSchedule()

const selected = ref<string | null>(null)
const selectedShifts = computed(() => s.myShifts.filter((x) => x.date === selected.value))
const selectedFriends = computed(() => (selected.value ? (s.byDate[selected.value] ?? []) : []).filter((e) => e.who !== ME))
</script>
