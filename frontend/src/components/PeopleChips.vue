<template>
  <div class="grid grid-cols-2 gap-2.5 text-base sm:flex sm:flex-wrap sm:gap-3">
    <button
      v-for="p in people"
      :key="p.id"
      type="button"
      class="flex min-h-14 touch-manipulation select-none items-center gap-3 rounded-2xl bg-card px-4 py-3 text-left font-medium shadow-sm transition-[opacity,transform] active:scale-[0.97] sm:rounded-full sm:px-5"
      :class="{ 'line-through opacity-40': hidden.includes(p.id) }"
      @click="emit('pick', p)"
    >
      <span class="size-5 shrink-0 rounded-full" :style="{ background: p.color }" /><span class="min-w-0 truncate">{{ p.name }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
export interface Person {
  id: string
  name: string
  color: string
  subId?: string
}

defineProps<{ people: Person[]; hidden: string[] }>()
const emit = defineEmits<{ pick: [person: Person] }>()
</script>
