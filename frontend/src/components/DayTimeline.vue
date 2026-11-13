<template>
  <div class="flex min-h-0 flex-col gap-2">
    <div class="flex flex-wrap items-center gap-1.5">
      <button
        v-for="person in peopleWithEntries"
        :key="person.id"
        type="button"
        class="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition"
        :class="
          isHidden(person.id)
            ? 'border border-dashed border-border text-muted-foreground opacity-60'
            : 'bg-secondary text-secondary-foreground'
        "
        :aria-pressed="!isHidden(person.id)"
        :title="isHidden(person.id) ? `Показать: ${person.name}` : `Скрыть: ${person.name}`"
        @click="togglePerson(person.id)"
      >
        <span
          class="size-2.5 shrink-0 rounded-full"
          :style="{ background: person.color }"
        />
        {{ person.name }}
      </button>

      <button
        v-if="hiddenIds.length"
        type="button"
        class="rounded-full px-2.5 py-1 text-xs text-muted-foreground underline"
        @click="hiddenIds = []"
      >
        Показать всех
      </button>
    </div>

    <div
      class="relative min-h-[18rem] min-w-0 flex-1 overflow-x-auto overflow-y-hidden rounded-lg"
    >
      <div
        v-if="!bars.length"
        class="absolute inset-0 flex items-center justify-center rounded-lg bg-muted/30 p-4 text-center text-sm text-muted-foreground"
      >
        {{ emptyText }}
      </div>
      <div
        v-else
        class="absolute inset-0"
        :style="{ minWidth: `${Math.max(shownPeople.length * 72, 240)}px` }"
      >
        <VChart class="size-full" :option="option" autoresize />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePreferredDark } from '@vueuse/core'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CustomChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { ComposeOption } from 'echarts/core'
import type { CustomSeriesOption } from 'echarts/charts'
import type { GridComponentOption, TooltipComponentOption } from 'echarts/components'
import type { CustomSeriesRenderItem } from 'echarts'
import { useTheme } from '@/composables/useTheme'
import type { Entry } from '@/composables/useSchedule'
import { buildBarData, type BarDatum, type TimelineEntry } from '@/lib/dayTimeline'

use([CustomChart, GridComponent, TooltipComponent, CanvasRenderer])

const props = defineProps<{
  date: string
  entries: Entry[]
  allPeople: Array<{ id: string; name: string; color: string }>
}>()

type ChartOption = ComposeOption<
  CustomSeriesOption | GridComponentOption | TooltipComponentOption
>

/** Chart margins; bars are clipped to the grid rect ECharts reports in `renderItem`. */
const GRID = { left: 8, right: 46, top: 8, bottom: 24 } as const

const { theme } = useTheme()
const prefersDark = usePreferredDark()
const isDark = computed(
  () => theme.value === 'dark' || (theme.value === 'system' && prefersDark.value),
)

const hiddenIds = ref<string[]>([])

const isHidden = (id: string) => hiddenIds.value.includes(id)

const togglePerson = (id: string) => {
  const index = hiddenIds.value.indexOf(id)
  if (index === -1) {
    hiddenIds.value.push(id)
  } else {
    hiddenIds.value.splice(index, 1)
  }
}

const timelineEntries = computed<TimelineEntry[]>(() =>
  props.entries.map((entry) => ({
    who: entry.who,
    start: entry.shift.start,
    end: entry.shift.end,
  })),
)

/** People that actually have shifts that day; the chips double as the chart legend. */
const peopleWithEntries = computed(() =>
  props.allPeople.filter((person) =>
    timelineEntries.value.some((entry) => entry.who === person.id),
  ),
)

const shownPeople = computed(() =>
  peopleWithEntries.value.filter((person) => !isHidden(person.id)),
)

const bars = computed(() => buildBarData(shownPeople.value, timelineEntries.value))

const emptyText = computed(() =>
  peopleWithEntries.value.length && !shownPeople.value.length
    ? 'Все люди скрыты'
    : 'В этот день смен нет',
)

const axisColor = computed(() => (isDark.value ? '#94a3b8' : '#64748b'))
const gridColor = computed(() =>
  isDark.value ? 'rgba(148, 163, 184, 0.18)' : 'rgba(100, 116, 139, 0.16)',
)

const renderItem: CustomSeriesRenderItem = (params, api) => {
  const start = api.coord([api.value(0), api.value(1)])
  const end = api.coord([api.value(0), api.value(2)])
  // for the cartesian coordinate system coordSys carries its pixel rect
  const area = params.coordSys as unknown as {
    x: number
    y: number
    width: number
    height: number
  }
  const size = api.size?.([1, 0])
  const band = Array.isArray(size) ? (size[0] ?? 24) : (size ?? 24)
  const width = Math.max(Math.min(band * 0.55, 56), 8)

  const top = Math.max(start[1] ?? 0, area.y)
  const bottom = Math.min(end[1] ?? 0, area.y + area.height)
  const height = Math.max(bottom - top, 2)

  return {
    type: 'rect',
    shape: {
      x: (start[0] ?? 0) - width / 2,
      y: top,
      width,
      height,
      r: 4,
    },
    style: { fill: api.visual('color') },
  }
}

const option = computed<ChartOption>(() => ({
  animationDuration: 300,
  grid: { ...GRID },
  tooltip: {
    trigger: 'item',
    renderMode: 'richText',
    backgroundColor: isDark.value
      ? 'rgba(30, 33, 43, 0.95)'
      : 'rgba(255, 255, 255, 0.97)',
    borderWidth: 0,
    textStyle: {
      color: isDark.value ? '#f1f5f9' : '#1e293b',
      fontSize: 12,
    },
    formatter: (params) => {
      const bar = (params as { data?: BarDatum }).data
      if (!bar) return ''
      return `${bar.name}\n${bar.start}–${bar.end}`
    },
  },
  xAxis: {
    type: 'category',
    data: shownPeople.value.map((person) => person.name),
    axisTick: { show: false },
    axisLine: { lineStyle: { color: gridColor.value } },
    axisLabel: {
      color: axisColor.value,
      fontSize: 11,
      width: 72,
      overflow: 'truncate',
      interval: 0,
    },
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: 24,
    inverse: true,
    interval: 2,
    position: 'right',
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: axisColor.value,
      fontSize: 10,
      formatter: (value: number) => `${value.toString().padStart(2, '0')}:00`,
    },
    splitLine: { lineStyle: { color: gridColor.value } },
  },
  series: [
    {
      type: 'custom',
      renderItem,
      encode: { x: 0, y: [1, 2] },
      data: bars.value.map((bar) => ({
        ...bar,
        itemStyle: { color: bar.color },
      })),
    },
  ],
}))
</script>
