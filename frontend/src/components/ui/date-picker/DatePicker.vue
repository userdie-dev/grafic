<script setup lang="ts">
import type { DateValue } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { parseDate } from '@internationalized/date'
import { RiCalendarLine } from '@remixicon/vue'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { cn } from 'cn'
import { computed, ref } from 'vue'
import { Calendar } from '@/components/ui/calendar'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'

const props = defineProps<{
  /** ISO date, `yyyy-MM-dd`; empty string means no value. */
  modelValue?: string
  min?: string
  placeholder?: string
  title?: string
  class?: HTMLAttributes['class']
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const open = ref(false)

const value = computed(() => (props.modelValue ? parseDate(props.modelValue) : undefined))
const minValue = computed(() => (props.min ? parseDate(props.min) : undefined))
const label = computed(() => (props.modelValue ? format(parseISO(props.modelValue), 'd MMMM yyyy', { locale: ru }) : ''))

function pick(v: DateValue | undefined) {
  if (!v) return
  emit('update:modelValue', v.toString())
  open.value = false
}
</script>

<template>
  <Drawer v-model:open="open">
    <DrawerTrigger as-child>
      <button
        type="button"
        data-slot="date-picker"
        :class="cn(
          'bg-input/50 focus-visible:border-ring focus-visible:ring-ring/30 aria-expanded:border-ring aria-expanded:ring-ring/30 flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-2xl border border-transparent px-3 text-left text-sm text-foreground transition-[color,box-shadow] outline-none focus-visible:ring-3 aria-expanded:ring-3',
          props.class,
        )"
      >
        <span :class="label ? '' : 'text-muted-foreground'">{{ label || placeholder || 'Выберите дату' }}</span>
        <RiCalendarLine class="size-4 shrink-0 text-muted-foreground" />
      </button>
    </DrawerTrigger>
    <DrawerContent class="pb-[max(1rem,env(safe-area-inset-bottom))]">
      <DrawerTitle class="pt-3 text-center">{{ title || 'Выберите дату' }}</DrawerTitle>
      <DrawerDescription class="sr-only">Календарь</DrawerDescription>
      <Calendar
        :model-value="value"
        :min-value="minValue"
        locale="ru"
        :week-starts-on="1"
        class="mx-auto w-full max-w-sm bg-transparent [--cell-size:--spacing(10)]"
        @update:model-value="pick"
      />
    </DrawerContent>
  </Drawer>
</template>
