<template>
  <SettingsSection title="Пресеты смен">
    <div class="space-y-3">
      <p class="text-sm text-muted-foreground">
        Встроенные и пользовательские шаблоны смен
      </p>

      <div class="space-y-2">
        <div class="space-y-1.5">
          <p class="text-xs font-medium text-muted-foreground">Встроенные пресеты</p>
          <div class="space-y-2">
            <div
              v-for="preset in builtinPresets"
              :key="preset.id"
              class="flex items-center justify-between gap-3 rounded-2xl bg-secondary/60 px-4 py-3"
            >
              <div class="min-w-0 space-y-0.5">
                <p class="font-medium">{{ preset.label }}</p>
                <p class="text-xs text-muted-foreground">{{ describe(preset) }}</p>
                <p class="text-xs text-muted-foreground">
                  День: {{ preset.day[0] }}–{{ preset.day[1] }} · 
                  Ночь: {{ preset.night[0] }}–{{ preset.night[1] }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="customPresets.length" class="space-y-1.5">
          <p class="text-xs font-medium text-muted-foreground">Пользовательские пресеты</p>
          <div class="space-y-2">
            <div
              v-for="preset in customPresets"
              :key="preset.id"
              class="flex items-center justify-between gap-3 rounded-2xl bg-secondary px-4 py-3"
            >
              <div class="min-w-0 space-y-0.5">
                <p class="font-medium">{{ preset.label }}</p>
                <p class="text-xs text-muted-foreground">{{ describe(preset) }}</p>
                <p class="text-xs text-muted-foreground">
                  День: {{ preset.day[0] }}–{{ preset.day[1] }} · 
                  Ночь: {{ preset.night[0] }}–{{ preset.night[1] }}
                </p>
              </div>
              <Button
                variant="destructive"
                size="icon-sm"
                aria-label="Удалить пресет"
                @click="presets.remove(preset.id)"
              >
                <RiDeleteBinLine />
              </Button>
            </div>
          </div>
        </div>

        <p v-else class="rounded-2xl border border-dashed py-4 text-center text-sm text-muted-foreground">
          Пользовательских пресетов пока нет
        </p>
      </div>
    </div>
  </SettingsSection>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RiDeleteBinLine } from '@remixicon/vue'
import { Button } from '@/components/ui/button'
import { usePresetsStore } from '@/stores/presets'
import { BUILTIN_PRESETS, describe } from '@/lib/presets'
import SettingsSection from './SettingsSection.vue'

const presets = usePresetsStore()

const builtinPresets = computed(() => BUILTIN_PRESETS)
const customPresets = computed(() => presets.all.filter(p => p.custom))
</script>
