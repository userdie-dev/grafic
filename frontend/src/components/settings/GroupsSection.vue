<template>
  <SettingsSection title="Друзья и группы">
    <div class="space-y-3">
      <p class="text-sm text-muted-foreground">
        Управляйте людьми, которые отображаются в календаре
      </p>

      <div v-if="s.people.length > 1" class="space-y-2">
        <div
          v-for="person in s.people.filter(p => p.id !== 'me')"
          :key="person.id"
          class="flex items-center justify-between gap-3 rounded-2xl bg-secondary px-4 py-3"
        >
          <div class="flex min-w-0 items-center gap-3">
            <span
              class="size-3 shrink-0 rounded-full"
              :style="{ background: person.color }"
            />
            <span class="truncate font-medium">{{ person.name }}</span>
          </div>
          <div class="flex shrink-0 gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Изменить цвет"
              @click="openColorPicker(person)"
            >
              <RiPaletteLine />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Переименовать"
              @click="openRename(person)"
            >
              <RiEditLine />
            </Button>
            <Button
              v-if="person.subId"
              variant="destructive"
              size="icon-sm"
              aria-label="Удалить"
              @click="s.removeFriend(person.subId)"
            >
              <RiDeleteBinLine />
            </Button>
          </div>
        </div>
      </div>

      <p v-else class="rounded-2xl border border-dashed py-4 text-center text-sm text-muted-foreground">
        Друзей пока нет. Добавьте их через "Поделиться"
      </p>
    </div>
  </SettingsSection>
</template>

<script setup lang="ts">
import { RiDeleteBinLine, RiEditLine, RiPaletteLine } from '@remixicon/vue'
import { Button } from '@/components/ui/button'
import { useSchedule } from '@/composables/useSchedule'
import SettingsSection from './SettingsSection.vue'

const s = useSchedule()

function openColorPicker(person: { id: string; name: string }) {
  const color = prompt(`Цвет для ${person.name} (например, #ff0000):`, s.people.find(p => p.id === person.id)?.color)
  if (color) {
    s.setColor(person.id, color)
  }
}

function openRename(person: { id: string; name: string }) {
  const name = prompt(`Новое имя для ${person.name}:`, person.name)
  if (name) {
    s.rename(person.id, name)
  }
}
</script>
