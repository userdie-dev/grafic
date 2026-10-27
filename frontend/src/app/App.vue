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
        class="pointer-events-none fixed bottom-[calc(6.25rem+env(safe-area-inset-bottom))] right-4 z-50 flex w-52 items-center justify-center gap-2 rounded-[4px] bg-blue-600 px-3 py-2.5 text-center text-xs font-medium text-white shadow-lg"
      >
        <LoaderCircle class="size-4 shrink-0 animate-spin" aria-hidden="true" />
        Подключение к серверу…
      </div>
    </Transition>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-if="update"
        role="status"
        class="pointer-events-none fixed bottom-[calc(9.5rem+env(safe-area-inset-bottom))] right-4 z-50 max-w-72 rounded-[4px] px-3 py-2.5 text-center text-xs font-medium text-white shadow-lg"
        :class="update.kind === 'error' ? 'bg-destructive' : 'bg-blue-600'"
      >
        {{ update.text }}
      </div>
    </Transition>

    <AppNav />
    <OnboardingGuide />
  </div>
</template>

<script setup lang="ts">
import { LoaderCircle } from '@lucide/vue'
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import AppNav from '@/components/AppNav.vue'
import OnboardingGuide from '@/components/OnboardingGuide.vue'
import { useConnection } from '@/composables/useConnection'
import { useCommonOffNotify } from '@/composables/useCommonOffNotify'
import { useUpdateStatus } from '@/composables/useUpdateStatus'
import { useSchedule, useScheduleSync } from '@/composables/useSchedule'

const s = useSchedule()
const offline = computed(() => useConnection().value === 'offline')
const update = useUpdateStatus()
useScheduleSync()
useCommonOffNotify()
</script>
