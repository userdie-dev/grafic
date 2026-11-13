<template>
  <SettingsSection title="Календарь">
    <SettingsRow
      interactive
      role="switch"
      :aria-checked="store.state.showCommonOff"
      :icon="CalendarDays"
      tint="bg-emerald-200 text-emerald-800"
      title="Общие свободные дни"
      hint="Подсвечивать дни, когда вы и все друзья не работаете"
      @click="store.state.showCommonOff = !store.state.showCommonOff"
    >
      <span
        class="flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors"
        :class="store.state.showCommonOff ? 'bg-primary' : 'bg-muted-foreground/30'"
      >
        <span class="size-5 rounded-full bg-white shadow transition-transform" :class="store.state.showCommonOff ? 'translate-x-4' : ''" />
      </span>
    </SettingsRow>

    <SettingsRow
      interactive
      role="switch"
      :aria-checked="store.state.showFreeHours"
      :icon="Clock"
      tint="bg-sky-200 text-sky-800"
      title="Общие свободные часы"
      hint="Подсвечивать дни, когда у вас и у друзей совпадает хотя бы час"
      @click="store.state.showFreeHours = !store.state.showFreeHours"
    >
      <span
        class="flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors"
        :class="store.state.showFreeHours ? 'bg-primary' : 'bg-muted-foreground/30'"
      >
        <span class="size-5 rounded-full bg-white shadow transition-transform" :class="store.state.showFreeHours ? 'translate-x-4' : ''" />
      </span>
    </SettingsRow>
  </SettingsSection>
</template>

<script setup lang="ts">
import { CalendarDays, Clock } from '@lucide/vue'
import { useScheduleStore } from '@/stores/schedule'
import SettingsRow from './SettingsRow.vue'
import SettingsSection from './SettingsSection.vue'

const store = useScheduleStore()
</script>
