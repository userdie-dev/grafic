<template>
  <SettingsSection title="О приложении">
    <SettingsRow interactive :icon="Wifi" tint="bg-sky-200 text-sky-800" title="Интернет и данные" :hint="label" @click="infoOpen = true">
      <ChevronRight class="size-5 text-muted-foreground" />
    </SettingsRow>
    <SettingsRow interactive :icon="CircleHelp" tint="bg-violet-200 text-violet-800" title="Как пользоваться" hint="Показать инструкцию заново" @click="show">
      <ChevronRight class="size-5 text-muted-foreground" />
    </SettingsRow>
    <SettingsRow :icon="Info" tint="bg-primary/15 text-primary" title="Версия приложения">
      <span class="text-sm text-muted-foreground">{{ version }}</span>
    </SettingsRow>
    <SettingsRow interactive :icon="RefreshCw" tint="bg-emerald-200 text-emerald-800" title="Проверить обновления" :hint="checking ? 'Проверяем…' : undefined" @click="check">
      <LoaderCircle v-if="checking" class="size-5 animate-spin text-muted-foreground" aria-label="Проверяем" />
    </SettingsRow>
  </SettingsSection>

  <ConnectionInfoDrawer v-model:open="infoOpen" :status="label" />
</template>

<script setup lang="ts">
import { ChevronRight, CircleHelp, Info, LoaderCircle, RefreshCw, Wifi } from '@lucide/vue'
import { computed, ref } from 'vue'
import { checkForUpdates } from '@/app/config/updater'
import { useConnection } from '@/composables/useConnection'
import { useOnboarding } from '@/composables/useOnboarding'
import ConnectionInfoDrawer from './ConnectionInfoDrawer.vue'
import SettingsRow from './SettingsRow.vue'
import SettingsSection from './SettingsSection.vue'

const version = __APP_VERSION__
const { show } = useOnboarding()
const infoOpen = ref(false)
const checking = ref(false)
async function check() {
  if (checking.value) return
  checking.value = true
  try {
    await checkForUpdates({ manual: true })
  } finally {
    checking.value = false
  }
}
const connection = useConnection()
const label = computed(
  () => ({ online: 'Есть связь с сервером', connecting: 'Подключение…', offline: 'Нет связи — график может быть неактуальным' })[connection.value],
)
</script>
