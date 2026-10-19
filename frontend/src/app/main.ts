import './styles/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import { router } from './router'
import { createQueryClient } from './config/query'
import { initTheme } from '@/composables/useTheme'

import { initUpdater } from './config/updater'

initTheme()
void initUpdater()

createApp(App).use(createPinia()).use(router).use(VueQueryPlugin, { queryClient: createQueryClient() }).mount('#app')
