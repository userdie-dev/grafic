<template>
  <Drawer :open="open" @update:open="onOpenChange">
    <!-- opening must not focus the name field: the drawer is informational until tapped -->
    <DrawerContent :initial-focus="false" class="pb-[max(1rem,env(safe-area-inset-bottom))]">
      <DrawerTitle class="px-1 pb-3 pt-2 text-lg">{{ isMe ? 'Я' : 'Друг' }}</DrawerTitle>
      <DrawerDescription class="sr-only">{{
        isMe ? 'Цвет и видимость в календаре' : 'Имя, цвет и видимость друга в календаре'
      }}</DrawerDescription>

      <form class="space-y-4 px-1" @submit="onSubmit">
        <Input v-if="!isMe" v-model="name" maxlength="30" placeholder="Имя" aria-label="Имя" class="h-10" />

        <div class="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Цвет">
          <button
            v-for="c in COLORS"
            :key="c"
            type="button"
            role="radio"
            :aria-checked="!pickerOpen && color === c"
            :aria-label="c"
            class="size-8 rounded-full ring-offset-2 ring-offset-background transition active:scale-90"
            :class="!pickerOpen && color === c ? 'ring-2 ring-foreground' : ''"
            :style="{ background: c }"
            @click="pickPreset(c)"
          />

          <!-- the palette is the last option: an arbitrary colour in a popover -->
          <ColorPicker v-model="color" v-model:open="pickerOpen" :checked="pickerOpen" @update:model-value="onCustom" />
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
import { ColorPicker } from '@/components/ui/color-picker'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { showAppToast } from '@/composables/useAppToast'
import { useDrawerClose } from '@/composables/useDrawerClose'
import { useFriendEditor } from '@/composables/useFriendEditor'
import { COLORS, ME } from '@/composables/useSchedule'
import { useFormSchemaWithValues } from '@/composables/useFormSchema'
import { friendFormSchema } from './models'

const editor = useFriendEditor()
const person = editor.friend.value!

const { open, close, onOpenChange } = useDrawerClose(editor.close)

const isMe = person.id === ME

const { handleSubmit, setFieldValue, defineField } = useFormSchemaWithValues(friendFormSchema, {
  name: person.name,
  color: person.color,
})

const [name] = defineField('name')
const [color] = defineField('color')
const pickerOpen = ref(false)

function pickPreset(c: string) {
  setFieldValue('color', c)
  pickerOpen.value = false
}

function onCustom() {
  // opening the picker marks it as custom, but changing the colour there keeps it selected
  pickerOpen.value = true
}

const onSubmit = handleSubmit((values) => {
  if (isMe) {
    editor.save(person.name, values.color)
    close()
    return
  }
  const isNewFriend = !person.subId || person.name === 'Друг'
  editor.save(values.name.trim() || person.name, values.color)
  if (isNewFriend) {
    showAppToast(`${values.name.trim() || person.name} добавлен`, 'success')
  }
  close()
})

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
