<template>
  <section>
    <h2 class="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{{ title }}</h2>
    <div class="divide-y divide-border/60 overflow-hidden rounded-3xl bg-card p-1.5 shadow-sm">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
</script>
