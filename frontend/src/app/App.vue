<template>
  <div class="mx-auto flex min-h-dvh max-w-3xl flex-col">
    <main class="flex-1 overflow-x-hidden p-4 pb-28 pt-[calc(1rem+max(env(safe-area-inset-top),var(--safe-area-inset-top,0px)))]">
      <p v-if="offline" class="mb-4 rounded-2xl bg-amber-500/15 p-3 text-sm text-amber-700 dark:text-amber-300">
        Нет связи с сервером. Показан сохранённый график — он может быть неактуальным.
      </p>
      <p v-else-if="s.error" class="mb-4 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{{ s.error }}</p>
      <RouterView />
    </main>

    <AppNav />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import AppNav from '@/components/AppNav.vue'
import { useConnection } from '@/composables/useConnection'
import { useSchedule, useScheduleSync } from '@/composables/useSchedule'

const s = useSchedule()
const offline = computed(() => useConnection().value === 'offline')
useScheduleSync()
</script>
