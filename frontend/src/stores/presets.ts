import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { BUILTIN_PRESETS, type Preset } from '@/lib/presets'

/** User-defined shift presets, mirrored to localStorage. */
export const usePresetsStore = defineStore('presets', () => {
  const custom = useLocalStorage<Preset[]>('grafic.presets', [])

  const all = computed(() => [...BUILTIN_PRESETS, ...custom.value])

  function add(p: Omit<Preset, 'id' | 'custom'>) {
    const preset: Preset = { ...p, id: `custom-${Date.now().toString(36)}`, custom: true }
    custom.value = [...custom.value, preset]
    return preset
  }

  const remove = (id: string) => (custom.value = custom.value.filter((p) => p.id !== id))

  return { all, add, remove }
})
