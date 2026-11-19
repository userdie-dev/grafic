<template>
  <Drawer :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <DrawerContent class="h-auto max-h-[80dvh] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <DrawerTitle class="px-1 pb-3 pt-2 text-lg">Интернет и данные</DrawerTitle>
      <DrawerDescription class="sr-only">Состояние связи, сервер и сборка приложения</DrawerDescription>
      <div class="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-1 pb-1 text-sm text-muted-foreground">
        <p class="rounded-2xl bg-secondary p-3 text-foreground">Сейчас: {{ status }}</p>
        <dl class="space-y-2 rounded-2xl bg-secondary p-3 text-foreground">
          <div>
            <dt class="text-muted-foreground">Сервер</dt>
            <dd class="select-text break-all">{{ API_URL }}</dd>
          </div>
          <div>
            <dt class="text-muted-foreground">Сборка</dt>
            <dd class="select-text">{{ build }}</dd>
          </div>
        </dl>
      </div>
    </DrawerContent>
  </Drawer>
</template>

<script setup lang="ts">
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer'
import { API_URL } from '@/app/config/axios'

const build = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'dev'

defineProps<{ open: boolean; status: string }>()
const emit = defineEmits<{ 'update:open': [open: boolean] }>()
</script>
