<template>
  <Drawer :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <DrawerContent class="h-auto max-h-[80dvh] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <DrawerTitle class="px-1 pb-3 pt-2 text-lg">Интернет и данные</DrawerTitle>
      <DrawerDescription class="sr-only">Зачем приложению нужен интернет и какие данные оно хранит</DrawerDescription>
      <div class="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-1 pb-1 text-sm text-muted-foreground">
        <div v-for="t in TOPICS" :key="t.title">
          <p class="mb-1 text-[15px] font-semibold text-foreground">{{ t.title }}</p>
          <p>{{ t.text }}</p>
        </div>
        <p class="rounded-2xl bg-secondary p-3 text-foreground">Сейчас: {{ status }}</p>
      </div>
    </DrawerContent>
  </Drawer>
</template>

<script setup lang="ts">
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer'

defineProps<{ open: boolean; status: string }>()
const emit = defineEmits<{ 'update:open': [open: boolean] }>()

const TOPICS = [
  {
    title: 'Зачем нужен интернет',
    text: 'Чтобы вы и ваши друзья видели актуальные графики друг друга. Когда кто-то меняет смену, у остальных она обновляется сама. Без интернета приложение работает, но показывает последний сохранённый график — он может устареть.',
  },
  {
    title: 'Что мы храним',
    text: 'Только ваши смены (дата, время и заметка) и список друзей, на которых вы подписаны. Ни имени, ни телефона, ни почты мы не спрашиваем — регистрация не нужна.',
  },
  {
    title: 'Что остаётся на телефоне',
    text: 'Последний загруженный график, ваши шаблоны смен, имена друзей (их видите только вы) и тема оформления. Это помогает открывать приложение без ожидания.',
  },
  {
    title: 'Обновления',
    text: 'При запуске приложение проверяет, вышла ли новая версия, и обновляется само.',
  },
]
</script>
