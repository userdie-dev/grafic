<template>
  <section class="mx-auto flex w-full max-w-md flex-col gap-8">
    <Card class="text-center">
      <CardHeader>
        <CardTitle class="text-base">Поделиться графиком</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex items-stretch gap-3 rounded-3xl bg-secondary p-3">
          <div class="flex-1 py-3 text-4xl font-bold tracking-[0.3em] text-foreground">{{ s.shareCode || '…' }}</div>
          <Button
            variant="outline"
            class="h-auto rounded-2xl bg-background px-4"
            :title="copied ? 'Скопировано' : 'Скопировать'"
            :aria-label="copied ? 'Скопировано' : 'Скопировать'"
            @click="copyCode"
          >
            <component :is="copied ? RiCheckLine : RiFileCopyLine" class="size-5" />
          </Button>
        </div>
        <Button variant="outline" size="lg" class="h-10 w-full" @click="askRegenerate"><RiRefreshLine /> {{ confirming ? 'Старый код перестанет работать. Заменить?' : 'Новый код' }}</Button>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">Добавить друга по коду</CardTitle>
      </CardHeader>
      <CardContent>
        <form class="space-y-2" @submit="onSubmit">
          <Input v-model="code" :maxlength="CODE_MAX" placeholder="Код" class="h-10 tracking-widest" />
          <Input v-model="label" maxlength="30" placeholder="Имя" class="h-10" />
          <Button size="lg" class="h-10 w-full" :disabled="!valid">
            <RiUserAddLine /> Добавить
          </Button>
        </form>
      </CardContent>
    </Card>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useClipboard } from '@vueuse/core'
import { RiCheckLine, RiFileCopyLine, RiRefreshLine, RiUserAddLine } from '@remixicon/vue'
import { showAppToast } from '@/composables/useAppToast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CODE_MAX, CODE_MIN } from '@/lib/dto'
import { useSchedule } from '@/composables/useSchedule'
import { useFormSchema } from '@/composables/useFormSchema'
import { addFriendSchema, addFriendDefaults } from './models'

const s = useSchedule()
const { copy } = useClipboard()
const copied = ref(false)

async function copyCode() {
  await copy(s.shareCode)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}

// replacing the code is irreversible for anyone who still holds the old one, so it takes two taps
const confirming = ref(false)
let confirmTimer: ReturnType<typeof setTimeout> | undefined
function askRegenerate() {
  clearTimeout(confirmTimer)
  if (confirming.value) {
    confirming.value = false
    s.regenerate()
    return
  }
  confirming.value = true
  confirmTimer = setTimeout(() => (confirming.value = false), 4000)
}

const { handleSubmit, defineField, resetForm } = useFormSchema(addFriendSchema, addFriendDefaults)

const [code] = defineField('code')
const [label] = defineField('label')

const valid = computed(() => 
  code.value.trim().length >= CODE_MIN && code.value.trim().length <= CODE_MAX
)

const onSubmit = handleSubmit(async (values) => {
  if (!valid.value) return
  if (await s.addFriend(values.code, values.label)) {
    resetForm()
    return
  }
  const reason = s.error || ''
  showAppToast(
    reason.includes('yourself') ? 'Это ваш собственный код' : 'Не удалось добавить друга. Проверьте код',
    'error',
  )
})

</script>
