<template>
  <SettingsSection title="Уведомления">
    <SettingsRow
      interactive
      role="switch"
      :aria-checked="store.state.notifyCommonOff"
      :icon="Bell"
      tint="bg-emerald-200 text-emerald-800"
      title="Общий выходной"
      :hint="hint || 'Напомнить вечером накануне дня, когда выходной у вас и у всех друзей'"
      @click="toggle"
    >
      <span
        class="flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors"
        :class="store.state.notifyCommonOff ? 'bg-primary' : 'bg-muted-foreground/30'"
      >
        <span class="size-5 rounded-full bg-white shadow transition-transform" :class="store.state.notifyCommonOff ? 'translate-x-4' : ''" />
      </span>
    </SettingsRow>
  </SettingsSection>
</template>

<script setup lang="ts">
import { Bell } from '@lucide/vue'
import { ref } from 'vue'
import { notificationsSupported, requestNotifyPermission } from '@/composables/useCommonOffNotify'
import { useScheduleStore } from '@/stores/schedule'
import SettingsRow from './SettingsRow.vue'
import SettingsSection from './SettingsSection.vue'

const store = useScheduleStore()
const hint = ref('')

async function toggle() {
  hint.value = ''
  if (store.state.notifyCommonOff) {
    store.state.notifyCommonOff = false
    return
  }
  if (!notificationsSupported()) {
    hint.value = 'Уведомления работают только в приложении на телефоне'
    return
  }
  if (await requestNotifyPermission()) store.state.notifyCommonOff = true
  else hint.value = 'Разрешите уведомления для приложения в настройках телефона'
}
</script>
