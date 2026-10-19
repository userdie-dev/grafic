import './styles/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import { router } from './router'
import { vueQueryOptions } from './config/query'
import { initTheme } from '@/composables/useTheme'

initTheme()

createApp(App).use(createPinia()).use(router).use(VueQueryPlugin, vueQueryOptions).mount('#app')
