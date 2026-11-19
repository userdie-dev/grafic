import './styles/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import { router } from './router'
import { createQueryClient } from './config/query'
import { initTheme } from '@/composables/useTheme'

import { initUpdater } from './config/updater'
import { restoreAndroidFriends } from './config/friendStorage'
import { useScheduleStore } from '@/stores/schedule'
import type { Subscription } from '@/lib/dto'

async function start() {
  initTheme()
  const pinia = createPinia()
  const queryClient = createQueryClient()
  const store = useScheduleStore(pinia)
  const owner = store.state.device?.userId
  const legacySubscriptions = queryClient.getQueryData<Subscription[]>(['subs'])
  if (owner && legacySubscriptions && !queryClient.getQueryData(['subs', owner])) {
    queryClient.setQueryData(['subs', owner], legacySubscriptions)
  }
  queryClient.removeQueries({ queryKey: ['subs'], exact: true })
  const saveFriends = await restoreAndroidFriends(store, queryClient)
  createApp(App).use(pinia).use(router).use(VueQueryPlugin, { queryClient }).mount('#app')
  void initUpdater(saveFriends)
}

void start()
