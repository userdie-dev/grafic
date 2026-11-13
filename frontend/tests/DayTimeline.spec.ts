import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DayTimeline from '@/components/DayTimeline.vue'
import type { Entry } from '@/composables/useSchedule'
import { useTheme } from '@/composables/useTheme'
import { buildBarData, parseTime, shiftSegments } from '@/lib/dayTimeline'

const ME = { id: 'me', name: 'Я', color: '#2563eb' }
const FRIEND = { id: 'o1', name: 'Аня', color: '#16a34a' }

const entry = (start: string, end: string, who = 'me'): Entry => ({
  who,
  name: who === 'me' ? 'Я' : 'Аня',
  color: who === 'me' ? '#2563eb' : '#16a34a',
  shift: { id: `${who}-${start}`, date: '2030-01-07', start, end, note: null },
})

const mountTimeline = (entries: Entry[], people = [ME, FRIEND]) =>
  mount(DayTimeline, { props: { date: '2030-01-07', entries, allPeople: people } })

type W = ReturnType<typeof mountTimeline>
const chart = (w: W) => w.findComponent({ name: 'VChart' })
const option = (w: W) => chart(w).props('option') as any
const chips = (w: W) => w.findAll('button[aria-pressed]')
const seriesValues = (w: W) => option(w).series[0].data.map((d: any) => d.value)

beforeEach(() => {
  useTheme().setTheme('dark')
})

describe('dayTimeline helpers', () => {
  it('parses HH:mm into decimal hours', () => {
    expect(parseTime('09:30')).toBe(9.5)
    expect(parseTime('0:05')).toBeCloseTo(0.0833, 3)
    expect(parseTime('24:00')).toBeNull()
    expect(parseTime('09:60')).toBeNull()
    expect(parseTime('nine')).toBeNull()
  })

  it('keeps normal shifts in one segment and splits overnight ones', () => {
    expect(shiftSegments('09:00', '18:00')).toEqual([{ from: 9, to: 18 }])
    expect(shiftSegments('22:00', '06:00')).toEqual([
      { from: 22, to: 24 },
      { from: 0, to: 6 },
    ])
    expect(shiftSegments('bad', '18:00')).toBeNull()
  })

  it('treats an equal start and end as a full day', () => {
    expect(shiftSegments('10:00', '10:00')).toEqual([
      { from: 10, to: 24 },
      { from: 0, to: 10 },
    ])
    expect(shiftSegments('00:00', '00:00')).toEqual([{ from: 0, to: 24 }])
  })

  it('builds bar data with the person index and original time range', () => {
    const data = buildBarData(
      [ME, FRIEND],
      [
        { who: 'me', start: '09:00', end: '18:00' },
        { who: 'me', start: '22:00', end: '06:00' },
        { who: 'o1', start: '10:00', end: '12:00' },
        { who: 'o1', start: 'nope', end: '12:00' },
        { who: 'unknown', start: '10:00', end: '12:00' },
      ],
    )
    expect(data.map((d) => d.value)).toEqual([
      [0, 9, 18],
      [0, 22, 24],
      [0, 0, 6],
      [1, 10, 12],
    ])
    expect(data[0]).toMatchObject({ name: 'Я', color: '#2563eb', start: '09:00', end: '18:00' })
  })
})

describe('DayTimeline', () => {
  it('shows an empty state without shifts', () => {
    const w = mountTimeline([])
    expect(w.text()).toContain('В этот день смен нет')
    expect(chart(w).exists()).toBe(false)
    expect(chips(w)).toHaveLength(0)
  })

  it('shows a chip only for people who have shifts that day', () => {
    const w = mountTimeline([entry('09:00', '18:00')])
    expect(chips(w)).toHaveLength(1)
    expect(chips(w)[0]!.text()).toContain('Я')
    expect(w.text()).not.toContain('Аня')
  })

  it('feeds people, bars and a time axis into the chart', () => {
    const w = mountTimeline([entry('09:00', '18:00'), entry('10:00', '12:00', 'o1')])
    const opt = option(w)

    expect(opt.xAxis.data).toEqual(['Я', 'Аня'])
    expect(opt.yAxis).toMatchObject({ min: 0, max: 24, inverse: true, interval: 2 })
    expect(opt.yAxis.axisLabel.formatter(2)).toBe('02:00')
    expect(opt.yAxis.axisLabel.formatter(24)).toBe('24:00')
    expect(seriesValues(w)).toEqual([
      [0, 9, 18],
      [1, 10, 12],
    ])
    expect(opt.series[0].data[0].itemStyle).toEqual({ color: '#2563eb' })
  })

  it('formats the tooltip as plain text', () => {
    const w = mountTimeline([entry('09:00', '18:00')])
    const formatter = option(w).tooltip.formatter
    expect(formatter({ data: { name: 'Я', start: '09:00', end: '18:00' } })).toBe('Я\n09:00–18:00')
    expect(formatter({})).toBe('')
  })

  it('hides a person temporarily and restores them', async () => {
    const w = mountTimeline([entry('09:00', '18:00'), entry('10:00', '12:00', 'o1')])

    await chips(w)[0]!.trigger('click')

    expect(chips(w)[0]!.attributes('aria-pressed')).toBe('false')
    expect(chips(w)[0]!.attributes('title')).toBe('Показать: Я')
    expect(option(w).xAxis.data).toEqual(['Аня'])
    expect(seriesValues(w)).toEqual([[0, 10, 12]])

    await chips(w)[0]!.trigger('click') // toggle back
    expect(chips(w)[0]!.attributes('aria-pressed')).toBe('true')

    await chips(w)[0]!.trigger('click')
    await w.get('button.underline').trigger('click') // «Показать всех»

    expect(chips(w)[0]!.attributes('aria-pressed')).toBe('true')
    expect(option(w).xAxis.data).toEqual(['Я', 'Аня'])
    expect(seriesValues(w)).toEqual([
      [0, 9, 18],
      [1, 10, 12],
    ])
  })

  it('says that everyone is hidden and can bring them back', async () => {
    const w = mountTimeline([entry('09:00', '18:00')])
    await chips(w)[0]!.trigger('click')

    expect(w.text()).toContain('Все люди скрыты')
    expect(chart(w).exists()).toBe(false)

    await w.get('button.underline').trigger('click')
    expect(chart(w).exists()).toBe(true)
  })

  it('uses dark-aware axis colours', async () => {
    const w = mountTimeline([entry('09:00', '18:00')])
    expect(option(w).yAxis.axisLabel.color).toBe('#94a3b8')

    useTheme().setTheme('light')
    await w.vm.$nextTick()

    expect(option(w).yAxis.axisLabel.color).toBe('#64748b')
  })

  it('follows the system colour scheme', () => {
    const original = window.matchMedia
    const media = (matches: boolean) =>
      ({
        matches,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList

    try {
      useTheme().setTheme('system')
      window.matchMedia = vi.fn(() => media(true))
      expect(option(mountTimeline([entry('09:00', '18:00')])).yAxis.axisLabel.color).toBe('#94a3b8')

      window.matchMedia = vi.fn(() => media(false))
      expect(option(mountTimeline([entry('09:00', '18:00')])).yAxis.axisLabel.color).toBe('#64748b')
    } finally {
      window.matchMedia = original
    }
  })

  it('positions bars inside the grid and clamps their size', () => {
    const w = mountTimeline([entry('09:00', '18:00')])
    const render = option(w).series[0].renderItem
    const api = (band: number | number[] | undefined, coord = (v: number[]) => [120, (v[1] ?? 0) * 10]) => ({
      value: (i: number) => [0, 0, 24][i],
      coord,
      size: band === undefined ? undefined : () => band,
      visual: () => '#2563eb',
    })
    const coords = { coordSys: { x: 8, y: 8, width: 200, height: 100 } }

    // clipped to the grid: top/bottom never leave the plotting area
    expect(render(coords, api([80, 0]))).toEqual({
      type: 'rect',
      shape: { x: 98, y: 8, width: 44, height: 100, r: 4 },
      style: { fill: '#2563eb' },
    })
    expect((render(coords, api([400, 0])) as any).shape.width).toBe(56) // capped
    expect((render(coords, api([10, 0])) as any).shape.width).toBe(8) // at least 8px
    expect((render(coords, api(24)) as any).shape.width).toBeCloseTo(13.2) // numeric size
    expect((render(coords, api(undefined)) as any).shape.width).toBeCloseTo(13.2) // no size() at all
    expect((render(coords, api([])) as any).shape.width).toBeCloseTo(13.2) // empty size array

    // missing coordinates fall back to the grid origin, degenerate bars stay visible
    const empty = render(
      coords,
      api([80, 0], () => []),
    ) as any
    expect(empty.shape).toMatchObject({ x: -22, y: 8, height: 2 })
  })
})
