<template>
  <section class="space-y-3">
    <div class="rounded-4xl bg-card px-4 pb-4 pt-4">
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-xl font-semibold">Пресеты смен</h1>
        <Button
          size="icon-lg"
          class="rounded-2xl"
          aria-label="Создать пресет"
          @click="showCreateDialog = true"
        >
          <RiAddLine class="size-5" />
        </Button>
      </div>

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
                  variant="secondary"
                  size="icon"
                  aria-label="Редактировать"
                  class="size-10 rounded-2xl"
                  @click="editPreset(preset)"
                >
                  <RiEditLine class="size-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label="Удалить пресет"
                  class="text-destructive size-10 rounded-2xl"
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
      <DrawerContent
        :initial-focus="false"
        class="h-auto data-[swipe-direction=down]:mt-0 data-[swipe-direction=down]:max-h-[95dvh] pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <DrawerTitle class="px-4 pt-4">{{ editingPreset ? 'Редактировать пресет' : 'Создать пресет' }}</DrawerTitle>
        <DrawerDescription class="sr-only">Форма создания пресета</DrawerDescription>
        
        <form class="space-y-4 overflow-y-auto p-4" @submit="onSubmit">
          <div class="space-y-2">
            <label class="block text-sm font-medium">Название</label>
            <Input v-model="label" placeholder="Например: Моя смена" required />
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium">Описание</label>
            <Input v-model="hint" placeholder="Краткое описание (необязательно)" />
          </div>

          <div class="space-y-2">
            <label :for="ruleTypeId" class="block text-sm font-medium">Тип повторения</label>
            <Select :id="ruleTypeId" v-model="ruleType" :options="RULE_TYPES" />
          </div>

          <!-- Cycle rule parameters -->
          <div v-if="ruleType === 'cycle'" class="flex gap-2">
            <div class="flex-1 space-y-2">
              <label class="block text-xs font-medium text-muted-foreground">Рабочих дней</label>
              <Input v-model.number="cycleWork" type="number" min="1" max="30" required />
            </div>
            <div class="flex-1 space-y-2">
              <label class="block text-xs font-medium text-muted-foreground">Выходных дней</label>
              <Input v-model.number="cycleOff" type="number" min="1" max="30" required />
            </div>
          </div>

          <!-- Weekdays rule parameters -->
          <div v-if="ruleType === 'weekdays'" class="space-y-2">
            <label :for="weekdaysId" class="block text-sm font-medium">Рабочие дни недели</label>
            <Select :id="weekdaysId" v-model="weekdays" :options="WEEKDAYS" placeholder="Выберите дни" />
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium">Время смены</label>
            <div class="flex gap-2">
              <div class="flex-1">
                <TimePicker v-model="dayStart" title="Начало" />
              </div>
              <div class="flex-1">
                <TimePicker v-model="dayEnd" title="Конец" :allow-next-day="true" />
              </div>
            </div>
          </div>

          <p v-if="formError" class="text-sm text-destructive">{{ formError }}</p>

          <div class="flex gap-2">
            <Button type="submit" size="lg" class="flex-1 rounded-2xl">
              {{ editingPreset ? 'Сохранить' : 'Создать' }}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              class="rounded-2xl"
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
import { computed, ref, useId } from 'vue'
import { RiAddLine, RiDeleteBinLine, RiEditLine } from '@remixicon/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { TimePicker } from '@/components/ui/time-picker'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer'
import { usePresetsStore } from '@/stores/presets'
import { describe, type Preset } from '@/lib/presets'
import { useFormSchema } from '@/composables/useFormSchema'
import { presetFormSchema, presetFormDefaults } from './models'

const presets = usePresetsStore()

const customPresets = computed(() => presets.all.filter(p => p.custom))

const RULE_TYPES = [
  { id: 'once', label: 'Один раз' },
  { id: 'weekly', label: 'Еженедельно' },
  { id: 'cycle', label: 'Цикл' },
  { id: 'weekdays', label: 'Дни недели' },
] as const

const WEEKDAYS = ([
  ['Воскресенье', 'Вс'],
  ['Понедельник', 'Пн'],
  ['Вторник', 'Вт'],
  ['Среда', 'Ср'],
  ['Четверг', 'Чт'],
  ['Пятница', 'Пт'],
  ['Суббота', 'Сб'],
] as const).map(([label, shortLabel], id) => ({ id, label, shortLabel }))

const showCreateDialog = ref(false)
const editingPreset = ref<Preset | null>(null)
const formError = ref('')

const { handleSubmit, defineField, setValues, resetForm } = useFormSchema(presetFormSchema, presetFormDefaults)

const [label] = defineField('label')
const [hint] = defineField('hint')
const [ruleType] = defineField('ruleType')
const ruleTypeId = useId()
const [cycleWork] = defineField('cycleWork')
const [cycleOff] = defineField('cycleOff')
const [weekdays] = defineField('weekdays')
const weekdaysId = useId()
const [dayStart] = defineField('dayStart')
const [dayEnd] = defineField('dayEnd')

function editPreset(preset: Preset) {
  editingPreset.value = preset
  setValues({
    label: preset.label,
    hint: preset.hint,
    ruleType: preset.rule.type,
    cycleWork: preset.rule.type === 'cycle' ? preset.rule.work : 2,
    cycleOff: preset.rule.type === 'cycle' ? preset.rule.off : 2,
    weekdays: preset.rule.type === 'weekdays' ? [...preset.rule.days] : [1, 2, 3, 4, 5],
    dayStart: preset.day[0],
    dayEnd: preset.day[1],
  })
  showCreateDialog.value = true
}

const onSubmit = handleSubmit((values) => {
  formError.value = ''

  if (!values.label.trim()) {
    formError.value = 'Укажите название пресета'
    return
  }

  if (values.ruleType === 'weekdays' && values.weekdays.length === 0) {
    formError.value = 'Выберите хотя бы один день недели'
    return
  }

  let rule: Preset['rule']
  if (values.ruleType === 'cycle') {
    rule = { type: 'cycle', work: values.cycleWork, off: values.cycleOff }
  } else if (values.ruleType === 'weekdays') {
    rule = { type: 'weekdays', days: [...values.weekdays] }
  } else {
    rule = { type: values.ruleType }
  }

  const presetData = {
    label: values.label,
    hint: values.hint,
    rule,
    day: [values.dayStart, values.dayEnd] as [string, string],
    night: [values.dayStart, values.dayEnd] as [string, string], // Same as day
  }

  if (editingPreset.value) {
    // Remove old and add new (simpler than updating in place)
    presets.remove(editingPreset.value.id)
    presets.add(presetData)
  } else {
    presets.add(presetData)
  }

  cancelEdit()
})

function cancelEdit() {
  showCreateDialog.value = false
  editingPreset.value = null
  formError.value = ''
  resetForm()
}
</script>
