<template>
  <Drawer :open="open" @update:open="onOpenChange">
    <DrawerContent
      class="h-[100dvh] max-h-[100dvh] pb-[max(1rem,env(safe-area-inset-bottom))] data-[swipe-direction=down]:mt-0 data-[swipe-direction=down]:max-h-[100dvh]"
    >
      <div class="flex items-center justify-between gap-2 px-1 pb-3 pt-2">
        <div class="flex min-w-0 items-center gap-2">
          <Button
            v-if="form"
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Назад"
            class="-ml-1 rounded-full"
            @click="backToList"
            ><RiArrowLeftLine
          /></Button>
          <DrawerTitle class="truncate text-lg">{{
            form?.shift ? `Изменить смену — ${title}` : title
          }}</DrawerTitle>
        </div>
        <Button
          v-if="!form"
          type="button"
          size="icon-lg"
          class="shrink-0 rounded-full"
          aria-label="Добавить смену"
          @click="form = { shift: null }"
          ><RiAddLine class="size-5"
        /></Button>
      </div>
      <DrawerDescription class="sr-only"
        >Смены на выбранный день</DrawerDescription
      >

      <div
        v-if="!form"
        class="mx-1 mb-3 flex shrink-0 gap-1 rounded-full bg-muted p-1 text-xs"
        role="tablist"
        aria-label="Вид смен"
      >
        <button
          v-for="tab in TABS"
          :key="tab.id"
          type="button"
          role="tab"
          :aria-selected="mode === tab.id"
          class="flex-1 rounded-full px-3 py-1.5 font-medium transition"
          :class="
            mode === tab.id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground'
          "
          @click="mode = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-1">
        <ShiftForm v-if="form" :editing="form.shift" @done="backToList" />
        <div v-else class="flex min-h-full flex-col">
          <DayTimeline
            v-if="mode === 'chart'"
            class="min-h-0 flex-1"
            :date="editor.date.value"
            :entries="dayEntries"
            :all-people="s.people"
          />
          <div v-else class="min-h-0 flex-1">
            <ShiftList @edit="form = { shift: $event }" />
          </div>
        </div>
      </div>
    </DrawerContent>
  </Drawer>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { format, parseISO } from "date-fns";
import { RiAddLine, RiArrowLeftLine } from "@remixicon/vue";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useDrawerClose } from "@/composables/useDrawerClose";
import { useDayEditor } from "@/composables/useDayEditor";
import { useSchedule } from "@/composables/useSchedule";
import type { Shift } from "@/lib/dto";
import DayTimeline from "./DayTimeline.vue";
import ShiftForm from "./shift/ShiftForm.vue";
import ShiftList from "./shift/ShiftList.vue";

const editor = useDayEditor();
const s = useSchedule();
const { open, onOpenChange } = useDrawerClose(editor.close);

const title = computed(() => format(parseISO(editor.date.value), "dd.MM.yyyy"));

const TABS = [
  { id: "chart", label: "Диаграмма" },
  { id: "list", label: "Список" },
] as const;
const mode = ref<(typeof TABS)[number]["id"]>("chart");

// `null` shows the diagram / list tabs; otherwise the form, for a new shift (`shift: null`) or an edited one
const form = ref<{ shift: Shift | null } | null>(null);
const backToList = () => {
  form.value = null;
};

const dayEntries = computed(() => s.byDate[editor.date.value] ?? []);
</script>
