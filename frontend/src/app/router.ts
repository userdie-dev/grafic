import { createRouter, createWebHashHistory } from 'vue-router'
import CalendarPage from '@/pages/CalendarPage.vue'
import SharePage from '@/pages/SharePage.vue'
import SettingsPage from '@/pages/SettingsPage.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: CalendarPage },
    { path: '/share', component: SharePage },
    { path: '/settings', component: SettingsPage },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
