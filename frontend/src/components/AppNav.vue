<template>
  <nav class="fixed inset-x-0 bottom-0 z-20 bg-background pb-[env(safe-area-inset-bottom)]">
    <div class="mx-auto flex max-w-3xl">
      <RouterLink
        v-for="t in pages"
        :key="t.to"
        :to="t.to"
        class="flex flex-1 items-center justify-center pb-3 pt-3.5 text-[11px] font-medium"
      >
        <span
          class="flex flex-col items-center gap-1.5 transition-colors"
          :class="isActive(t.to) ? 'text-primary' : 'text-muted-foreground'"
        >
          <component :is="t.icon" class="size-7" />
          {{ t.label }}
        </span>
      </RouterLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { RiCalendarLine, RiSettings3Line, RiShareLine } from '@remixicon/vue'

const route = useRoute()
const pages = [
  { to: '/', label: 'Календарь', icon: RiCalendarLine },
  { to: '/share', label: 'Поделиться', icon: RiShareLine },
  { to: '/settings', label: 'Настройки', icon: RiSettings3Line },
] as const

const isActive = (to: string) => route.path === to
</script>
