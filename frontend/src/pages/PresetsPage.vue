<template>
  <section class="space-y-3">
    <div class="rounded-[1.75rem] bg-card px-4 pb-4 pt-4">
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-xl font-semibold">Пресеты смен</h1>
        <Button
          size="icon-lg"
          class="rounded-full"
          aria-label="Создать пресет"
          @click="showCreateDialog = true"
        >
          <RiAddLine class="size-5" />
        </Button>
      </div>

      <p class="mb-4 text-sm text-muted-foreground">
        Создавайте собственные шаблоны смен для быстрого добавления в календарь
      </p>

      <!-- Custom presets -->
      <div>
        <h2 class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Мои пресеты
        </h2>
        <div v-if="customPresets.length" class="space-y-2">
          <div
            v-for="preset in customPresets"
            :key="preset.id"
            class="rounded-2xl bg-secondary px-4 py-3"
          >
            <div class="flex items-start justify-between">
              <div class="min-w-0 flex-1">
                <div class="mb-1 font-medium">{{ preset.label }}</div>
                <div class="text-xs text-muted-foreground">{{ describe(preset) }}</div>
                <div class="mt-1 text-xs text-muted-foreground">
                  День: {{ preset.day[0] }}–{{ preset.day[1] }} · 
                  Ночь: {{ preset.night[0] }}–{{ preset.night[1] }}
                </div>
              </div>
              <div class="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Редактировать"
                  class="size-10 rounded-full"
                  @click="editPreset(preset)"
                >
                  <RiEditLine class="size-5" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  aria-label="Удалить пресет"
                  class="size-10 rounded-full"
                  @click="presets.remove(preset.id)"
                >
                  <RiDeleteBinLine class="size-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="rounded-2xl border border-dashed py-8 text-center text-sm text-muted-foreground">
          Пользовательских пресетов пока нет. Создайте первый!
        </div>
      </div>
    </div>

    <!-- Create/Edit Preset Dialog -->
    <Drawer v-model:open="showCreateDialog">
      <DrawerContent class="max-h-[90vh]">
        <DrawerTitle class="px-4 pt-4">{{ editingPreset ? 'Редактировать пресет' : 'Создать пресет' }}</DrawerTitle>
        <DrawerDescription class="sr-only">Форма создания пресета</DrawerDescription>
        
        <form class="space-y-4 overflow-y-auto p-4" @submit.prevent="savePreset">
          <div class="space-y-2">
            <label class="block text-sm font-medium">Название</label>
            <Input v-model="presetForm.label" placeholder="Например: Моя смена" required />
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium">Описание</label>
            <Input v-model="presetForm.hint" placeholder="Краткое описание (необязательно)" />
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium">Тип повторения</label>
            <div class="flex flex-wrap gap-2">
              <Button
                v-for="type in RULE_TYPES"
                :key="type.id"
                type="button"
                size="sm"
                variant="secondary"
                :class="presetForm.ruleType === type.id ? 'bg-primary text-primary-foreground' : ''"
                class="rounded-full"
                @click="presetForm.ruleType = type.id"
              >
                {{ type.label }}
              </Button>
            </div>
          </div>

          <!-- Cycle rule parameters -->
          <div v-if="presetForm.ruleType === 'cycle'" class="flex gap-2">
            <div class="flex-1 space-y-2">
              <label class="block text-xs font-medium text-muted-foreground">Рабочих дней</label>
              <Input v-model.number="presetForm.cycleWork" type="number" min="1" max="30" required />
            </div>
            <div class="flex-1 space-y-2">
              <label class="block text-xs font-medium text-muted-foreground">Выходных дней</label>
              <Input v-model.number="presetForm.cycleOff" type="number" min="1" max="30" required />
            </div>
          </div>

          <!-- Weekdays rule parameters -->
          <div v-if="presetForm.ruleType === 'weekdays'" class="space-y-2">
            <label class="block text-sm font-medium">Рабочие дни недели</label>
            <div class="flex flex-wrap gap-2">
              <Button
                v-for="(day, index) in WEEKDAYS"
                :key="index"
                type="button"
                size="sm"
                variant="secondary"
                :class="presetForm.weekdays.includes(index) ? 'bg-primary text-primary-foreground' : ''"
                class="rounded-full"
                @click="toggleWeekday(index)"
              >
                {{ day }}
              </Button>
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium">Время смены</label>
            <div class="flex gap-2">
              <div class="flex-1">
                <TimePicker v-model="presetForm.dayStart" title="Начало" />
              </div>
              <div class="flex-1">
                <TimePicker v-model="presetForm.dayEnd" title="Конец" :allow-next-day="true" />
              </div>
            </div>
          </div>

          <p v-if="formError" class="text-sm text-destructive">{{ formError }}</p>

          <div class="flex gap-2">
            <Button type="submit" size="lg" class="flex-1 rounded-full">
              {{ editingPreset ? 'Сохранить' : 'Создать' }}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              class="rounded-full"
              @click="cancelEdit"
            >
              Отмена
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RiAddLine, RiDeleteBinLine, RiEditLine } from '@remixicon/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TimePicker } from '@/components/ui/time-picker'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer'
import { usePresetsStore } from '@/stores/presets'
import { describe, type Preset } from '@/lib/presets'

const presets = usePresetsStore()

const customPresets = computed(() => presets.all.filter(p => p.custom))

const RULE_TYPES = [
  { id: 'once', label: 'Один раз' },
  { id: 'weekly', label: 'Еженедельно' },
  { id: 'cycle', label: 'Цикл' },
  { id: 'weekdays', label: 'Дни недели' },
] as const

const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

const showCreateDialog = ref(false)
const editingPreset = ref<Preset | null>(null)
const formError = ref('')

const presetForm = ref({
  label: '',
  hint: '',
  ruleType: 'once' as 'once' | 'weekly' | 'cycle' | 'weekdays',
  cycleWork: 2,
  cycleOff: 2,
  weekdays: [1, 2, 3, 4, 5] as number[],
  dayStart: '09:00',
  dayEnd: '18:00',
})

function toggleWeekday(day: number) {
  const index = presetForm.value.weekdays.indexOf(day)
  if (index === -1) {
    presetForm.value.weekdays.push(day)
  } else {
    presetForm.value.weekdays.splice(index, 1)
  }
}

function editPreset(preset: Preset) {
  editingPreset.value = preset
  presetForm.value = {
    label: preset.label,
    hint: preset.hint,
    ruleType: preset.rule.type,
    cycleWork: preset.rule.type === 'cycle' ? preset.rule.work : 2,
    cycleOff: preset.rule.type === 'cycle' ? preset.rule.off : 2,
    weekdays: preset.rule.type === 'weekdays' ? [...preset.rule.days] : [1, 2, 3, 4, 5],
    dayStart: preset.day[0],
    dayEnd: preset.day[1],
  }
  showCreateDialog.value = true
}

function savePreset() {
  formError.value = ''

  if (!presetForm.value.label.trim()) {
    formError.value = 'Укажите название пресета'
    return
  }

  if (presetForm.value.ruleType === 'weekdays' && presetForm.value.weekdays.length === 0) {
    formError.value = 'Выберите хотя бы один день недели'
    return
  }

  let rule: Preset['rule']
  if (presetForm.value.ruleType === 'cycle') {
    rule = { type: 'cycle', work: presetForm.value.cycleWork, off: presetForm.value.cycleOff }
  } else if (presetForm.value.ruleType === 'weekdays') {
    rule = { type: 'weekdays', days: [...presetForm.value.weekdays] }
  } else {
    rule = { type: presetForm.value.ruleType }
  }

  const presetData = {
    label: presetForm.value.label,
    hint: presetForm.value.hint,
    rule,
    day: [presetForm.value.dayStart, presetForm.value.dayEnd] as [string, string],
    night: [presetForm.value.dayStart, presetForm.value.dayEnd] as [string, string], // Same as day
  }

  if (editingPreset.value) {
    // Remove old and add new (simpler than updating in place)
    presets.remove(editingPreset.value.id)
    presets.add(presetData)
  } else {
    presets.add(presetData)
  }

  cancelEdit()
}

function cancelEdit() {
  showCreateDialog.value = false
  editingPreset.value = null
  formError.value = ''
  presetForm.value = {
    label: '',
    hint: '',
    ruleType: 'once',
    cycleWork: 2,
    cycleOff: 2,
    weekdays: [1, 2, 3, 4, 5],
    dayStart: '09:00',
    dayEnd: '18:00',
  }
}
</script>
