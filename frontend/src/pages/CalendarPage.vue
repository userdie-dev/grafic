<template>
  <section class="space-y-3">
    <MonthCalendar
      :month="s.month"
      :entries="s.byDate"
      :free-days="showCommonOff ? s.commonOff : []"
      :free-hour-days="showFreeHours ? s.commonFreeDays : []"
      :holidays="holidays"
      @select="dayEditor.open"
    />

    <p v-if="showCommonOff && s.commonOff.length" class="flex items-center gap-2 px-1 text-sm text-muted-foreground">
      <span class="size-3.5 rounded-md bg-emerald-500/30" /> Общий выходной у всех
    </p>
    <p v-if="showFreeHours && s.commonFreeDays.length" class="flex items-center gap-2 px-1 text-sm text-muted-foreground">
      <span class="size-3.5 rounded-md bg-sky-500/25" /> Есть свободные часы
    </p>
    <p v-if="hasHolidays" class="flex items-center gap-2 px-1 text-sm text-muted-foreground">
      <span class="size-3.5 rounded-md bg-red-500/20" /> Праздничный день
    </p>

    <PeopleChips :people="s.people" :hidden="s.hidden" @pick="onPerson" />

    <FriendEditor v-if="friendEditor.friend.value" :key="friendEditor.friend.value.id" />
    <ShiftEditor v-if="dayEditor.selected.value" :key="dayEditor.selected.value" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MonthCalendar from '@/components/MonthCalendar.vue'
import PeopleChips from '@/components/PeopleChips.vue'
import FriendEditor from '@/components/FriendEditor.vue'
import ShiftEditor from '@/components/ShiftEditor.vue'
import { provideDayEditor } from '@/composables/useDayEditor'
import { provideFriendEditor } from '@/composables/useFriendEditor'
import { useSchedule } from '@/composables/useSchedule'

const s = useSchedule()
const dayEditor = provideDayEditor()
const friendEditor = provideFriendEditor()

const holidays = computed(() => s.holidays ?? {})
const hasHolidays = computed(() => Object.keys(holidays.value).length > 0)
// a store saved by an older version may not know these flags yet
const showCommonOff = computed(() => s.showCommonOff !== false)
const showFreeHours = computed(() => s.showFreeHours !== false)

// tapping anyone, me included, opens their settings; my shifts stay editable from the day drawer
const onPerson = (p: { id: string }) => friendEditor.open(p.id)
</script>
