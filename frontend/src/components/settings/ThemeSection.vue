<template>
  <SettingsSection title="Тема приложения">
    <SettingsRow
      v-for="o in options"
      :key="o.value"
      interactive
      :icon="o.icon"
      :tint="o.tint"
      :title="o.label"
      @click="setTheme(o.value)"
    >
      <span
        class="flex size-6 items-center justify-center rounded-full border-2 transition-colors"
        :class="theme === o.value ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'"
      >
        <Check v-if="theme === o.value" class="size-3.5" :stroke-width="3" />
      </span>
    </SettingsRow>
  </SettingsSection>
</template>

<script setup lang="ts">
import { Check, Moon, Smartphone, Sun } from '@lucide/vue'
import type { Component } from 'vue'
import { useTheme, type Theme } from '@/composables/useTheme'
import SettingsRow from './SettingsRow.vue'
import SettingsSection from './SettingsSection.vue'

const { theme, setTheme } = useTheme()

const options: { value: Theme; label: string; icon: Component; tint: string }[] = [
  { value: 'light', label: 'Светлая', icon: Sun, tint: 'bg-amber-200 text-amber-800' },
  { value: 'dark', label: 'Тёмная', icon: Moon, tint: 'bg-indigo-200 text-indigo-800' },
  { value: 'system', label: 'Системная', icon: Smartphone, tint: 'bg-emerald-200 text-emerald-800' },
]
</script>
