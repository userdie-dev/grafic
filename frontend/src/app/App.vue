<template>
  <div class="mx-auto flex min-h-dvh max-w-3xl flex-col">
    <main class="flex-1 overflow-x-hidden p-4 pb-28">
      <p v-if="s.error" class="mb-4 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{{ s.error }}</p>
      <RouterView />
    </main>

    <AppNav />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppNav from '@/components/AppNav.vue'
import { useSchedule, useScheduleSync } from '@/composables/useSchedule'

const s = useSchedule()
useScheduleSync()
</script>
