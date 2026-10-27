<template>
  <component
    :is="interactive ? 'button' : 'div'"
    :type="interactive ? 'button' : undefined"
    class="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left"
    :class="{ 'transition-colors active:bg-muted': interactive }"
  >
    <span class="flex size-10 shrink-0 items-center justify-center rounded-full" :class="tint">
      <component :is="icon" class="size-5" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="block text-[15px] font-semibold leading-tight">{{ title }}</span>
      <Transition
        enter-active-class="transition-[grid-template-rows,opacity] duration-200 ease-out"
        enter-from-class="grid-rows-[0fr] opacity-0"
        leave-active-class="transition-[grid-template-rows,opacity] duration-150 ease-in"
        leave-to-class="grid-rows-[0fr] opacity-0"
      >
        <span v-if="hint" class="grid grid-rows-[1fr]">
          <span class="block overflow-hidden text-xs text-muted-foreground">{{ hint }}</span>
        </span>
      </Transition>
    </span>
    <slot />
  </component>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon: Component
  tint: string
  title: string
  hint?: string
  /** renders a button instead of a plain row */
  interactive?: boolean
}>()
</script>
