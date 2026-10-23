<template>
  <section class="space-y-3">
    <MonthCalendar :month="s.month" :entries="s.byDate" :free-days="s.commonOff" @select="dayEditor.open" />

    <p v-if="s.commonOff.length" class="flex items-center gap-2 px-1 text-sm text-muted-foreground">
      <span class="size-3.5 rounded-md bg-emerald-500/30" /> Общий выходной у всех
    </p>

    <PeopleChips :people="s.people" :hidden="s.hidden" @pick="onPerson" />

    <FriendEditor v-if="friendEditor.friend.value" :key="friendEditor.friend.value.id" />
    <ShiftEditor v-if="dayEditor.selected.value" :key="dayEditor.selected.value" />
  </section>
</template>

<script setup lang="ts">
import MonthCalendar from '@/components/MonthCalendar.vue'
import PeopleChips from '@/components/PeopleChips.vue'
import FriendEditor from '@/components/FriendEditor.vue'
import ShiftEditor from '@/components/ShiftEditor.vue'
import { provideDayEditor } from '@/composables/useDayEditor'
import { provideFriendEditor } from '@/composables/useFriendEditor'
import { ME, useSchedule } from '@/composables/useSchedule'

const s = useSchedule()
const dayEditor = provideDayEditor()
const friendEditor = provideFriendEditor()

// tapping a friend opens their editor (visibility lives there); tapping me just toggles my shifts
const onPerson = (p: { id: string }) => (p.id === ME ? s.toggle(p.id) : friendEditor.open(p.id))
</script>
