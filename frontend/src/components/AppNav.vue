<template>
  <nav class="fixed inset-x-0 bottom-0 z-20 border-t bg-card pb-[env(safe-area-inset-bottom)]">
    <div class="mx-auto flex max-w-3xl">
      <RouterLink
        v-for="t in pages"
        :key="t.to"
        :to="t.to"
        class="group flex flex-1 items-center justify-center py-2 text-xs font-medium"
      >
        <span
          class="flex flex-col items-center gap-1 rounded-2xl px-4 py-1.5 transition-colors group-active:bg-muted"
          :class="isActive(t.to) ? 'text-primary' : 'text-muted-foreground'"
        >
          <component :is="isActive(t.to) ? t.activeIcon : t.icon" class="size-6" />
          {{ t.label }}
        </span>
      </RouterLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { RiCalendarFill, RiCalendarLine, RiSettings3Fill, RiSettings3Line, RiShareFill, RiShareLine } from '@remixicon/vue'

const route = useRoute()
const pages = [
  { to: '/', label: 'Календарь', icon: RiCalendarLine, activeIcon: RiCalendarFill },
  { to: '/share', label: 'Поделиться', icon: RiShareLine, activeIcon: RiShareFill },
  { to: '/settings', label: 'Настройки', icon: RiSettings3Line, activeIcon: RiSettings3Fill },
] as const

const isActive = (to: string) => route.path === to
</script>
