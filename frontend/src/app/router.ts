import { createRouter, createWebHashHistory } from 'vue-router'
import CalendarPage from '@/pages/CalendarPage.vue'
import GroupsPage from '@/pages/GroupsPage.vue'
import PresetsPage from '@/pages/PresetsPage.vue'
import SharePage from '@/pages/SharePage.vue'
import SettingsPage from '@/pages/SettingsPage.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: CalendarPage },
    { path: '/groups', component: GroupsPage },
    { path: '/presets', component: PresetsPage },
    { path: '/share', component: SharePage },
    { path: '/settings', component: SettingsPage },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
