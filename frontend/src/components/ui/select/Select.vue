<script setup lang="ts" generic="Value extends string | number, Model extends Value | Value[]">
import { computed, ref } from 'vue'
import type { HTMLAttributes } from 'vue'
import { cn } from 'cn'
import { fieldClass } from '../input/fieldClass'
import { RiArrowDownSLine, RiCheckLine } from '@remixicon/vue'
import {
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'

const model = defineModel<Model>({ required: true })
const emit = defineEmits<{ select: [value: Value] }>()
const open = ref(false)

const props = defineProps<{
  id: string
  options: readonly { id: Value; label: string; shortLabel?: string }[]
  placeholder?: string
  class?: HTMLAttributes['class']
}>()

const summary = computed(() => {
  const selected = model.value
  if (!Array.isArray(selected)) return ''
  return props.options.filter((option) => selected.includes(option.id))
    .map((option) => option.shortLabel ?? option.label).join(', ')
})
</script>

<template>
  <SelectRoot v-model="model" v-model:open="open" :multiple="Array.isArray(model)">
    <SelectTrigger
      :id="id"
      :class="cn(fieldClass, 'flex items-center justify-between gap-2 text-left', $props.class)"
      @click="open = true"
    >
      <SelectValue v-if="Array.isArray(model)" :placeholder="placeholder" class="truncate data-[placeholder]:text-muted-foreground">
        {{ summary || placeholder }}
      </SelectValue>
      <SelectValue v-else class="truncate" />
      <SelectIcon :as="RiArrowDownSLine" class="size-4 shrink-0 text-muted-foreground" />
    </SelectTrigger>
    <SelectContent
      position="popper"
      align="start"
      :side-offset="4"
      :aria-multiselectable="Array.isArray(model) || undefined"
      data-reka-swipe-ignore
      class="z-50 w-(--reka-select-trigger-width) max-h-(--reka-select-content-available-height) overflow-y-auto overscroll-contain rounded-xl border border-border bg-popover text-popover-foreground shadow-lg"
    >
      <SelectViewport class="p-1">
        <SelectItem
          v-for="option in options"
          :key="option.id"
          :value="option.id"
          class="flex min-h-9 cursor-default items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm outline-hidden data-highlighted:bg-accent data-highlighted:text-accent-foreground"
          @select="emit('select', option.id)"
        >
          <SelectItemText>{{ option.label }}</SelectItemText>
          <SelectItemIndicator><RiCheckLine class="size-4" /></SelectItemIndicator>
        </SelectItem>
      </SelectViewport>
    </SelectContent>
  </SelectRoot>
</template>
