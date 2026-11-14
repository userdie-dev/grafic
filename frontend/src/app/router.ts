import { createRouter, createWebHashHistory } from 'vue-router'
import CalendarPage from '@/pages/CalendarPage/index.vue'
import GroupsPage from '@/pages/GroupsPage/index.vue'
import PresetsPage from '@/pages/PresetsPage/index.vue'
import SharePage from '@/pages/SharePage/index.vue'
import SettingsPage from '@/pages/SettingsPage/index.vue'

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
