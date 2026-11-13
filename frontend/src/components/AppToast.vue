<template>
  <div
    role="status"
    class="pointer-events-none max-w-72 rounded-[4px] px-3 py-2.5 text-center text-xs font-medium text-white shadow-lg"
    :class="kind === 'error' ? 'bg-destructive' : 'bg-blue-600'"
  >
    {{ text }}
  </div>
</template>

<script setup lang="ts">
import type { AppToastKind } from '@/composables/useAppToast'

defineProps<{ kind: AppToastKind; text: string }>()
</script>
