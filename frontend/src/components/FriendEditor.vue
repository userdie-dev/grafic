<template>
  <Drawer :open="open" @update:open="onOpenChange">
    <DrawerContent class="pb-[max(1rem,env(safe-area-inset-bottom))]">
      <DrawerTitle class="px-1 pb-3 pt-2 text-lg">Друг</DrawerTitle>
      <DrawerDescription class="sr-only">Имя, цвет и видимость друга в календаре</DrawerDescription>

      <form class="space-y-4 px-1" @submit.prevent="save">
        <Input v-model="name" maxlength="30" placeholder="Имя" aria-label="Имя" class="h-10" />

        <div class="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Цвет">
          <button
            v-for="c in COLORS"
            :key="c"
            type="button"
            role="radio"
            :aria-checked="color === c"
            :aria-label="c"
            class="size-8 rounded-full ring-offset-2 ring-offset-background transition active:scale-90"
            :class="color === c ? 'ring-2 ring-foreground' : ''"
            :style="{ background: c }"
            @click="color = c"
          />
        </div>

        <button
          type="button"
          role="switch"
          :aria-checked="!editor.hidden.value"
          class="flex w-full items-center justify-between rounded-2xl bg-secondary px-4 py-3 text-left font-medium"
          @click="editor.toggle"
        >
          Показывать в календаре
          <span class="flex h-6 w-10 items-center rounded-full p-0.5 transition-colors" :class="editor.hidden.value ? 'bg-muted-foreground/30' : 'bg-primary'">
            <span class="size-5 rounded-full bg-white shadow transition-transform" :class="editor.hidden.value ? '' : 'translate-x-4'" />
          </span>
        </button>

        <div class="flex gap-2">
          <Button type="submit" class="h-10 flex-1">Сохранить</Button>
          <Button v-if="editor.removable.value" type="button" variant="outline" class="h-10 flex-1 text-destructive" @click="askRemove">
            <RiDeleteBinLine /> {{ removing ? 'Точно удалить?' : 'Удалить' }}
          </Button>
        </div>
      </form>
    </DrawerContent>
  </Drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RiDeleteBinLine } from '@remixicon/vue'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { useDrawerClose } from '@/composables/useDrawerClose'
import { useFriendEditor } from '@/composables/useFriendEditor'
import { COLORS } from '@/composables/useSchedule'

const editor = useFriendEditor()
const person = editor.friend.value!

const { open, close, onOpenChange } = useDrawerClose(editor.close)

const name = ref(person.name)
const color = ref(person.color)

function save() {
  editor.save(name.value.trim() || person.name, color.value)
  close()
}

// removing a friend drops the subscription, so it takes two taps
const removing = ref(false)
function askRemove() {
  if (!removing.value) {
    removing.value = true
    return
  }
  editor.remove()
  close()
}
</script>
