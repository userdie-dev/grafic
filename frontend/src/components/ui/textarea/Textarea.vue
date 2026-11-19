<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from 'cn'
import { fieldClass } from '../input/fieldClass'

const model = defineModel<string>()
const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <textarea
    v-model="model"
    data-slot="textarea"
    :class="cn(fieldClass, 'block h-auto resize-y py-2 placeholder:text-muted-foreground', props.class)"
  />
</template>
