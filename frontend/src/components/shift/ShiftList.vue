<template>
  <div class="space-y-3">
    <ul class="space-y-1.5">
      <li v-for="s in editor.shifts.value" :key="s.id" class="flex items-center justify-between gap-2 rounded-2xl bg-secondary px-3 py-2.5 text-sm">
        <span class="min-w-0 truncate font-medium">
          <NightIcon v-if="isNightShift(s)" />{{ s.start }}–{{ s.end }} <span class="font-normal text-muted-foreground">{{ s.note }}</span>
        </span>
        <span class="flex shrink-0 gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Изменить" @click="emit('edit', s)"><RiEditLine /></Button>
          <Button variant="destructive" size="icon-sm" aria-label="Удалить" @click="editor.remove(s.id)"><RiDeleteBinLine /></Button>
        </span>
      </li>
      <li v-if="!editor.shifts.value.length" class="rounded-2xl border border-dashed py-4 text-center text-sm text-muted-foreground">В этот день смен нет</li>
    </ul>

    <div v-if="editor.friends.value.length" class="space-y-1.5 border-t pt-3">
      <p class="text-sm font-medium">Друзья</p>
      <ul class="space-y-1.5">
        <li v-for="f in editor.friends.value" :key="f.who + f.shift.id" class="flex min-h-12 items-center gap-2 rounded-2xl bg-secondary/60 px-4 py-3 text-base">
          <span class="size-2.5 shrink-0 rounded-full" :style="{ background: f.color }" />
          <span class="shrink-0 font-medium">{{ f.name }}</span>
          <span class="min-w-0 flex-1 truncate text-right text-muted-foreground">
            <NightIcon v-if="isNightShift(f.shift)" />{{ f.shift.start }}–{{ f.shift.end }}<template v-if="f.shift.note"> · {{ f.shift.note }}</template>
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RiDeleteBinLine, RiEditLine } from '@remixicon/vue'
import { Button } from '@/components/ui/button'
import { useDayEditor } from '@/composables/useDayEditor'
import type { Shift } from '@/lib/dto'
import { isNightShift } from '@/lib/night'
import NightIcon from './NightIcon.vue'

const editor = useDayEditor()
const emit = defineEmits<{ edit: [shift: Shift] }>()
</script>
