<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { RiTimeLine } from '@remixicon/vue'
import { cn } from 'cn'
import { computed, nextTick, ref, watch } from 'vue'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'

const props = defineProps<{
  /** `HH:mm`; empty string means no value. */
  modelValue?: string
  /** Minute grid step; the current value is always kept selectable. */
  step?: number
  title?: string
  class?: HTMLAttributes['class']
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const open = ref(false)
const pad = (n: number) => String(n).padStart(2, '0')

// edits are kept in a draft and committed with the confirm button
const draft = ref('')
const hour = computed(() => (draft.value ? Number(draft.value.slice(0, 2)) : null))
const minute = computed(() => (draft.value ? Number(draft.value.slice(3, 5)) : null))

const hours = Array.from({ length: 24 }, (_, i) => i)
const minutes = computed(() => {
  const step = props.step ?? 5
  const list = Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step)
  const current = props.modelValue ? Number(props.modelValue.slice(3, 5)) : null
  if (current !== null && !list.includes(current)) list.push(current)
  return list.sort((a, b) => a - b)
})

function setHour(h: number) {
  draft.value = `${pad(h)}:${pad(minute.value ?? 0)}`
}
function setMinute(m: number) {
  draft.value = `${pad(hour.value ?? 0)}:${pad(m)}`
}
function confirm() {
  if (draft.value) emit('update:modelValue', draft.value)
  open.value = false
}

const hoursEl = ref<HTMLElement>()
const minutesEl = ref<HTMLElement>()

// bring the selected values into view each time the drawer opens
watch(open, async (v) => {
  if (!v) return
  draft.value = props.modelValue ?? ''
  await nextTick()
  // the drawer content is portaled and animating in; give it a frame to lay out
  await new Promise((r) => setTimeout(r, 50))
  for (const el of [hoursEl.value, minutesEl.value]) {
    el?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'center', behavior: 'instant' })
  }
})
</script>

<template>
  <Drawer v-model:open="open">
    <DrawerTrigger as-child>
      <button
        type="button"
        data-slot="time-picker"
        :class="cn(
          'bg-input/50 focus-visible:border-ring focus-visible:ring-ring/30 aria-expanded:border-ring aria-expanded:ring-ring/30 flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-2xl border border-transparent px-3 text-left text-sm text-foreground transition-[color,box-shadow] outline-none focus-visible:ring-3 aria-expanded:ring-3',
          props.class,
        )"
      >
        <span :class="modelValue ? 'tabular-nums' : 'text-muted-foreground'">{{ modelValue || '--:--' }}</span>
        <RiTimeLine class="size-4 shrink-0 text-muted-foreground" />
      </button>
    </DrawerTrigger>
    <DrawerContent class="pb-[max(1rem,env(safe-area-inset-bottom))]">
      <DrawerTitle class="pt-3 text-center">{{ title || 'Выберите время' }}</DrawerTitle>
      <DrawerDescription class="sr-only">Часы и минуты</DrawerDescription>
      <div class="my-3 flex gap-2 text-center text-xs text-muted-foreground">
        <span class="flex-1">Часы</span>
        <span class="flex-1">Минуты</span>
      </div>
      <div class="flex min-h-0 flex-1 gap-2" data-vaul-no-drag>
        <div ref="hoursEl" class="flex h-full flex-1 flex-col gap-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="listbox" aria-label="Часы">
          <button
            v-for="h in hours"
            :key="h"
            type="button"
            role="option"
            :aria-selected="hour === h"
            :data-selected="hour === h"
            class="h-12 shrink-0 rounded-2xl text-lg tabular-nums transition-colors active:bg-muted data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground"
            @click="setHour(h)"
          >{{ pad(h) }}</button>
        </div>
        <div ref="minutesEl" class="flex h-full flex-1 flex-col gap-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="listbox" aria-label="Минуты">
          <button
            v-for="m in minutes"
            :key="m"
            type="button"
            role="option"
            :aria-selected="minute === m"
            :data-selected="minute === m"
            class="h-12 shrink-0 rounded-2xl text-lg tabular-nums transition-colors active:bg-muted data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground"
            @click="setMinute(m)"
          >{{ pad(m) }}</button>
        </div>
      </div>
      <button
        type="button"
        class="mt-4 h-12 w-full shrink-0 rounded-full bg-foreground text-base font-medium text-background transition-colors active:bg-foreground/90"
        @click="confirm"
      >Готово</button>
    </DrawerContent>
  </Drawer>
</template>
