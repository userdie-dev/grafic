<template>
  <div class="space-y-2 rounded-2xl border p-3">
    <Input v-model="draft.label" maxlength="20" placeholder="Название пресета" class="h-10" />
    <div class="flex gap-1.5">
      <Button type="button" size="sm" variant="secondary" :class="tone(draft.mode === 'cycle')" class="flex-1 rounded-full" @click="draft.mode = 'cycle'">Через N дней</Button>
      <Button type="button" size="sm" variant="secondary" :class="tone(draft.mode === 'weekdays')" class="flex-1 rounded-full" @click="draft.mode = 'weekdays'">По дням недели</Button>
    </div>
    <div v-if="draft.mode === 'cycle'" class="flex gap-2">
      <label class="flex-1 space-y-1 text-xs text-muted-foreground">Рабочих дней<Input v-model.number="draft.work" type="number" min="1" max="30" class="h-10 text-foreground" /></label>
      <label class="flex-1 space-y-1 text-xs text-muted-foreground">Выходных<Input v-model.number="draft.off" type="number" min="0" max="30" class="h-10 text-foreground" /></label>
    </div>
    <div v-else class="flex gap-1">
      <Button
        v-for="d in WEEK"
        :key="d.dow"
        type="button"
        size="sm"
        variant="secondary"
        :class="tone(draft.days.includes(d.dow))"
        class="h-9 flex-1 rounded-full px-0"
        @click="toggleDay(d.dow)"
      >{{ d.label }}</Button>
    </div>
    <p v-if="problem" class="text-sm text-destructive">{{ problem }}</p>
    <Button type="button" size="sm" :class="PRIMARY_BLUE" class="w-full rounded-full" @click="create">Сохранить пресет</Button>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Preset } from '@/lib/presets'
import { PRIMARY_BLUE, tone } from '@/lib/tone'
import { usePresetsStore } from '@/stores/presets'

const WEEK = [1, 2, 3, 4, 5, 6, 0].map((dow) => ({ dow, label: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][dow]! }))

const emit = defineEmits<{ created: [preset: Preset] }>()
const presets = usePresetsStore()

const problem = ref('')
const draft = reactive({
  label: '',
  mode: 'cycle' as 'cycle' | 'weekdays',
  work: 2,
  off: 2,
  days: [1, 2, 3, 4, 5],
})

function toggleDay(d: number) {
  draft.days = draft.days.includes(d) ? draft.days.filter((x) => x !== d) : [...draft.days, d]
}

function create() {
  if (draft.mode === 'cycle' && !(draft.work >= 1 && draft.off >= 0)) {
    problem.value = 'Укажите число рабочих и выходных дней'
    return
  }
  if (draft.mode === 'weekdays' && !draft.days.length) {
    problem.value = 'Выберите хотя бы один день недели'
    return
  }
  problem.value = ''
  const created = presets.add({
    label: draft.label.trim() || (draft.mode === 'cycle' ? `${draft.work}/${draft.off}` : 'Свой'),
    hint: '',
    rule:
      draft.mode === 'cycle'
        ? { type: 'cycle', work: draft.work, off: draft.off }
        : { type: 'weekdays', days: [...draft.days] },
    day: ['08:00', '20:00'],
    night: ['20:00', '08:00'],
  })
  draft.label = ''
  emit('created', created)
}
</script>
