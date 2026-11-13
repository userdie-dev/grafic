<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <button
        type="button"
        role="radio"
        :aria-checked="checked"
        aria-label="Свой цвет"
        title="Свой цвет"
        class="size-8 rounded-full ring-offset-2 ring-offset-background transition active:scale-90"
        :class="checked ? 'ring-2 ring-foreground' : ''"
        :style="{ background: checked ? modelValue : PALETTE }"
      />
    </PopoverTrigger>
    <PopoverContent align="start" side="bottom" class="w-auto p-0">
      <div data-slot="color-picker" class="w-64 space-y-3 p-3">
        <ColorAreaRoot
          :model-value="modelValue"
          color-space="hsl"
          x-channel="saturation"
          y-channel="lightness"
          @update:model-value="onColor"
        >
          <template #default="{ style }">
            <ColorAreaArea
              :style="style"
              aria-label="Насыщенность и яркость"
              class="relative h-32 w-full overflow-hidden rounded-xl"
            >
              <ColorAreaThumb
                class="size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md ring-1 ring-black/20"
              />
            </ColorAreaArea>
          </template>
        </ColorAreaRoot>

        <ColorSliderRoot
          :model-value="modelValue"
          channel="hue"
          aria-label="Оттенок"
          class="flex h-5 w-full items-center"
          @update:model-value="onColor"
        >
          <ColorSliderTrack class="h-3 w-full rounded-full">
            <ColorSliderThumb
              class="block size-5 rounded-full border-2 border-white shadow-md ring-1 ring-black/20"
            />
          </ColorSliderTrack>
        </ColorSliderRoot>

        <div class="flex items-center gap-2">
          <span
            class="size-8 shrink-0 rounded-full border border-border"
            :style="{ background: modelValue }"
            aria-hidden="true"
          />
          <ColorFieldRoot :model-value="modelValue" @update:model-value="onColor">
            <ColorFieldInput
              aria-label="Цвет в HEX"
              placeholder="#000000"
              class="h-9 w-full rounded-xl border border-transparent bg-background px-3 font-mono text-sm uppercase outline-none transition focus:border-ring"
            />
          </ColorFieldRoot>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import type { Color } from 'reka-ui'
import {
  ColorAreaArea,
  ColorAreaRoot,
  ColorAreaThumb,
  ColorFieldInput,
  ColorFieldRoot,
  ColorSliderRoot,
  ColorSliderThumb,
  ColorSliderTrack,
  colorToString,
} from 'reka-ui'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

/** Marker of the custom-colour option: a rainbow ring instead of a single swatch. */
const PALETTE = 'conic-gradient(#ef4444, #f59e0b, #84cc16, #06b6d4, #6366f1, #d946ef, #ef4444)'

defineProps<{ modelValue: string; checked: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const open = defineModel<boolean>('open', { default: false })

// the slider may report a Color object instead of a hex string
const onColor = (value: string | Color) =>
  emit('update:modelValue', typeof value === 'string' ? value : colorToString(value, 'hex'))
</script>
