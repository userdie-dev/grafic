<template>
  <Drawer :open="open" @update:open="onOpenChange">
    <DrawerContent class="pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div class="flex items-center justify-between gap-2 px-1 pb-3 pt-2">
        <div class="flex min-w-0 items-center gap-2">
          <Button v-if="form" type="button" variant="ghost" size="icon" aria-label="Назад" class="-ml-1 rounded-full" @click="backToList"><RiArrowLeftLine /></Button>
          <DrawerTitle class="truncate text-lg">{{ form?.shift ? `Изменить смену — ${title}` : title }}</DrawerTitle>
        </div>
        <Button v-if="!form" type="button" size="icon-lg" class="shrink-0 rounded-full" aria-label="Добавить смену" @click="form = { shift: null }"><RiAddLine class="size-5" /></Button>
      </div>
      <DrawerDescription class="sr-only">Смены на выбранный день</DrawerDescription>

      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-1">
        <ShiftForm v-if="form" :editing="form.shift" @done="backToList" />
        <ShiftList v-else @edit="form = { shift: $event }" />
      </div>
    </DrawerContent>
  </Drawer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { format, parseISO } from 'date-fns'
import { RiAddLine, RiArrowLeftLine } from '@remixicon/vue'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer'
import { useDrawerClose } from '@/composables/useDrawerClose'
import { useDayEditor } from '@/composables/useDayEditor'
import type { Shift } from '@/lib/dto'
import ShiftForm from './shift/ShiftForm.vue'
import ShiftList from './shift/ShiftList.vue'

const editor = useDayEditor()
const { open, onOpenChange } = useDrawerClose(editor.close)

const title = computed(() => format(parseISO(editor.date.value), 'dd.MM.yyyy'))

// `null` shows the list; otherwise the form, for a new shift (`shift: null`) or an edited one
const form = ref<{ shift: Shift | null } | null>(null)
const backToList = () => (form.value = null)
</script>
