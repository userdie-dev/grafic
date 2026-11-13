<template>
  <div class="space-y-5">
    <ThemeSection />
    <NotificationsSection />
    <CalendarSection />
    <AboutSection />
  </div>
</template>

<script setup lang="ts">
import AboutSection from '@/components/settings/AboutSection.vue'
import CalendarSection from '@/components/settings/CalendarSection.vue'
import NotificationsSection from '@/components/settings/NotificationsSection.vue'
import ThemeSection from '@/components/settings/ThemeSection.vue'
</script>
