<template>
  <section class="space-y-3">
    <MonthCalendar :month="s.month" :entries="s.byDate" :free-days="s.commonOff" @select="selected = $event" />

    <p v-if="s.commonOff.length" class="flex items-center gap-2 px-1 text-sm text-muted-foreground">
      <span class="size-3.5 rounded-md bg-emerald-500/30" /> Общий выходной у всех
    </p>

    <div class="grid grid-cols-2 gap-2.5 text-base sm:flex sm:flex-wrap sm:gap-3">
      <button
        v-for="p in s.people"
        :key="p.id"
        type="button"
        class="flex min-h-14 touch-manipulation select-none items-center gap-3 rounded-2xl bg-card px-4 py-3 text-left font-medium shadow-sm transition-[opacity,transform] active:scale-[0.97] sm:rounded-full sm:px-5"
        :class="{ 'line-through opacity-40': s.hidden.includes(p.id) }"
        @click="onPerson(p)"
      >
        <span class="size-5 shrink-0 rounded-full" :style="{ background: p.color }" /><span class="min-w-0 truncate">{{ p.name }}</span>
      </button>
    </div>

    <FriendEditor
      v-if="friend"
      :key="friend.id"
      :person="friend"
      :hidden="s.hidden.includes(friend.id)"
      :removable="!!friend.subId"
      @close="friendId = null"
      @save="(name, color) => (s.rename(friend!.id, name), s.setColor(friend!.id, color))"
      @toggle="s.toggle(friend.id)"
      @remove="s.removeFriend(friend.subId)"
    />

    <ShiftEditor
      v-if="selected"
      :key="selected"
      :date="selected"
      :shifts="selectedShifts"
      :friends="selectedFriends"
      @close="selected = null"
      @save="(items, ids) => s.saveShifts(items, ids)"
      @remove="s.deleteShift"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import MonthCalendar from '@/components/MonthCalendar.vue'
import FriendEditor from '@/components/FriendEditor.vue'
import ShiftEditor from '@/components/ShiftEditor.vue'
import { ME, useSchedule } from '@/composables/useSchedule'

const s = useSchedule()

const selected = ref<string | null>(null)

// tapping a friend opens their editor (visibility lives there); tapping me just toggles my shifts
const friendId = ref<string | null>(null)
const friend = computed(() => s.people.find((p) => p.id === friendId.value))
const onPerson = (p: { id: string }) => (p.id === ME ? s.toggle(p.id) : (friendId.value = p.id))
const selectedShifts = computed(() => s.myShifts.filter((x) => x.date === selected.value))
const selectedFriends = computed(() => (selected.value ? (s.byDate[selected.value] ?? []) : []).filter((e) => e.who !== ME))
</script>
