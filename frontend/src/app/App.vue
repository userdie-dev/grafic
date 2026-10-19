<template>
  <div class="mx-auto flex min-h-dvh max-w-3xl flex-col">
    <main class="flex-1 overflow-x-hidden p-4 pb-28 pt-[calc(1rem+max(env(safe-area-inset-top),var(--safe-area-inset-top,0px)))]">
      <p v-if="s.error && !offline" class="mb-4 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{{ s.error }}</p>
      <RouterView />
    </main>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-if="offline"
        role="status"
        class="pointer-events-none fixed bottom-[calc(6.25rem+env(safe-area-inset-bottom))] right-4 z-50 w-52 rounded-[4px] bg-destructive px-3 py-2.5 text-center text-xs font-medium text-white shadow-lg"
      >
        Нет связи с сервером
      </div>
    </Transition>

    <AppNav />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import AppNav from '@/components/AppNav.vue'
import { useConnection } from '@/composables/useConnection'
import { useCommonOffNotify } from '@/composables/useCommonOffNotify'
import { useSchedule, useScheduleSync } from '@/composables/useSchedule'

const s = useSchedule()
const offline = computed(() => useConnection().value === 'offline')
useScheduleSync()
useCommonOffNotify()
</script>
