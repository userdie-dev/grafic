<template>
  <span class="inline-block size-2.5 rounded-full" :class="[meta.color, { 'animate-pulse': state === 'connecting' }]" :title="meta.label" role="status" :aria-label="meta.label" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useConnection } from '@/composables/useConnection'

const state = useConnection()

const META = {
  online: { color: 'bg-emerald-500', label: 'Подключено к серверу' },
  connecting: { color: 'bg-amber-500', label: 'Подключение к серверу…' },
  offline: { color: 'bg-red-500', label: 'Нет связи с сервером' },
} as const

const meta = computed(() => META[state.value])
</script>
