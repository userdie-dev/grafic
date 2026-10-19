import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CalendarDate } from '@internationalized/date'
import { reactive } from 'vue'

const h = vi.hoisted(() => ({ s: null as any, copy: vi.fn() }))

vi.mock('@/composables/useSchedule', () => ({
  ME: 'me',
  COLORS: ['#111'],
  useSchedule: () => h.s,
}))
vi.mock('@vueuse/core', async (orig) => ({
  ...(await orig<typeof import('@vueuse/core')>()),
  useClipboard: () => ({ copy: h.copy }),
}))
vi.mock('@/lib/api', () => ({ registerDevice: vi.fn(), setToken: vi.fn() }))

import ShareView from '@/components/ShareView.vue'
import MonthCalendar from '@/components/MonthCalendar.vue'
import CalendarPage from '@/pages/CalendarPage.vue'
import { useScheduleStore } from '@/stores/schedule'

const entry = (who: string, date: string, start = '09:00') => ({
  who,
  name: who,
  color: '#f00',
  shift: { id: `${who}-${date}-${start}`, date, start, end: '18:00', note: null },
})

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  h.s = reactive({
    shareCode: 'ABC234',
    month: new Date(2030, 0, 15),
    byDate: {} as Record<string, unknown[]>,
    hidden: [] as string[],
    myShifts: [] as unknown[],
    people: [
      { id: 'me', name: 'Я', color: '#111', subId: '' },
      { id: 'o1', name: 'Аня', color: '#222', subId: 's1' },
    ],
    regenerate: vi.fn(),
    addFriend: vi.fn().mockResolvedValue(true),
    toggle: vi.fn(),
    saveShifts: vi.fn(),
    deleteShift: vi.fn(),
  })
})

describe('ShareView', () => {
  it('shows the share code, or an ellipsis before registration', () => {
    expect(mount(ShareView).text()).toContain('ABC234')
    h.s.shareCode = ''
    expect(mount(ShareView).text()).toContain('…')
  })

  it('copies the code and flips the button label back after 1.5s', async () => {
    vi.useFakeTimers()
    const w = mount(ShareView)
    const btn = w.get('button[aria-label="Скопировать"]')
    await btn.trigger('click')
    expect(h.copy).toHaveBeenCalledWith('ABC234')
    expect(w.find('button[aria-label="Скопировано"]').exists()).toBe(true)
    vi.advanceTimersByTime(1500)
    await flushPromises()
    expect(w.find('button[aria-label="Скопировать"]').exists()).toBe(true)
  })

  it('regenerates the code', async () => {
    const w = mount(ShareView)
    await w.findAll('button').find((b) => b.text().includes('Новый код'))!.trigger('click')
    expect(h.s.regenerate).toHaveBeenCalled()
  })

  it('validates the code length before enabling submit', async () => {
    const w = mount(ShareView)
    const submit = () => w.findAll('button').find((b) => b.text().includes('Добавить'))!
    const [code] = w.findAll('input')
    expect(submit().attributes('disabled')).toBeDefined()
    await code!.setValue('abc')
    expect(submit().attributes('disabled')).toBeDefined()
    await code!.setValue('abcd')
    expect(submit().attributes('disabled')).toBeUndefined()
    await code!.setValue('  abcd  ')
    expect(submit().attributes('disabled')).toBeUndefined()
  })

  it('does not submit an invalid form', async () => {
    const w = mount(ShareView)
    await w.get('form').trigger('submit')
    expect(h.s.addFriend).not.toHaveBeenCalled()
  })

  it('adds a friend and clears the fields on success only', async () => {
    const w = mount(ShareView)
    const [code, label] = w.findAll('input')
    await code!.setValue('ABCD')
    await label!.setValue('Боря')
    await w.get('form').trigger('submit')
    await flushPromises()
    expect(h.s.addFriend).toHaveBeenCalledWith('ABCD', 'Боря')
    expect((code!.element as HTMLInputElement).value).toBe('')
    expect((label!.element as HTMLInputElement).value).toBe('')

    h.s.addFriend.mockResolvedValue(false)
    await code!.setValue('WXYZ')
    await w.get('form').trigger('submit')
    await flushPromises()
    expect((code!.element as HTMLInputElement).value).toBe('WXYZ')
  })
})

describe('MonthCalendar', () => {
  const mountCal = (entries: Record<string, ReturnType<typeof entry>[]> = {}, month = new Date(2030, 0, 15)) =>
    mount(MonthCalendar, { props: { month, entries }, attachTo: document.body })
  const cells = () => [...document.querySelectorAll<HTMLElement>('[data-reka-calendar-cell-trigger]')]
  const cell = (iso: string) => cells().find((c) => c.getAttribute('data-value') === iso)!

  it('renders a fixed 6-week Monday-first grid with entries', async () => {
    const many = Array.from({ length: 5 }, (_, i) => entry(`p${i}`, '2030-01-10', `0${i}:00`))
    const w = mountCal({ '2030-01-10': many, '2030-01-11': [entry('a', '2030-01-11')] })
    await flushPromises()
    expect(cells()).toHaveLength(42)
    expect(cells()[0]!.getAttribute('data-value')).toBe('2029-12-31')
    expect(cell('2030-01-10').textContent).toContain('+2')
    expect(cell('2030-01-11').textContent).toContain('09:00–18:00')
    expect(cell('2030-01-11').querySelector('[title]')!.getAttribute('title')).toBe('a: 09:00–18:00 ')
    w.unmount()
  })

  it('shows the note in the tooltip', async () => {
    const e = entry('a', '2030-01-11')
    e.shift.note = 'Смена' as never
    const w = mountCal({ '2030-01-11': [e] })
    await flushPromises()
    expect(cell('2030-01-11').querySelector('[title]')!.getAttribute('title')).toContain('Смена')
    w.unmount()
  })

  it('emits the clicked date', async () => {
    const w = mountCal()
    await flushPromises()
    cell('2030-01-12').click()
    await flushPromises()
    expect(w.emitted('select')).toEqual([['2030-01-12']])
    w.unmount()
  })

  it('pages months through the store and offers a way back to today', async () => {
    const store = useScheduleStore()
    store.state.month = '2030-01-15'
    const spy = vi.spyOn(store, 'shiftMonth')
    const w = mountCal()
    await flushPromises()
    const nav = [...document.querySelectorAll<HTMLElement>('[data-slot=calendar-prev-button], [data-slot=calendar-next-button]')]
    // header buttons: prev first, next second
    const [prev, next] = nav.length ? nav : [...document.querySelectorAll<HTMLElement>('button[aria-label*="месяц"]')]
    prev!.click()
    await flushPromises()
    expect(spy).toHaveBeenCalledWith(-1)
    next!.click()
    await flushPromises()
    expect(spy).toHaveBeenCalledWith(1)

    const back = [...document.querySelectorAll<HTMLElement>('button')].find((b) => b.textContent?.includes('К текущему месяцу'))!
    expect(back).toBeTruthy()
    back.click()
    expect(spy).toHaveBeenLastCalledWith(expect.any(Number))
    w.unmount()
  })

  it('hides the back-to-today button on the current month', async () => {
    const w = mountCal({}, new Date())
    await flushPromises()
    expect([...document.querySelectorAll('button')].some((b) => b.textContent?.includes('К текущему месяцу'))).toBe(false)
    w.unmount()
  })

  it('follows the month prop', async () => {
    const w = mountCal()
    await flushPromises()
    await w.setProps({ month: new Date(2030, 5, 1) })
    await flushPromises()
    expect(cells().some((c) => c.getAttribute('data-value') === '2030-06-15')).toBe(true)
    w.unmount()
  })

  it('syncs keyboard month navigation back to the store', async () => {
    const store = useScheduleStore()
    store.state.month = '2030-01-15'
    const spy = vi.spyOn(store, 'shiftMonth')
    const w = mountCal()
    await flushPromises()
    // reka-ui reports its own keyboard / button navigation through the placeholder model
    const root = w.findComponent({ name: 'CalendarRoot' })
    root.vm.$emit('update:placeholder', new CalendarDate(2030, 3, 1))
    await flushPromises()
    expect(spy).toHaveBeenCalledWith(2)
    spy.mockClear()
    root.vm.$emit('update:placeholder', new CalendarDate(2030, 1, 1)) // same month as the prop: no-op
    await flushPromises()
    expect(spy).not.toHaveBeenCalled()
    w.unmount()
  })

  it('ignores array / empty selections', async () => {
    const w = mountCal()
    await flushPromises()
    const root = w.findComponent({ name: 'CalendarRoot' })
    root.vm.$emit('update:modelValue', undefined)
    root.vm.$emit('update:modelValue', [])
    expect(w.emitted('select')).toBeUndefined()
    w.unmount()
  })
})

describe('CalendarPage', () => {
  const stubs = {
    MonthCalendar: { props: ['month', 'entries'], emits: ['select'], template: '<button id="cal" @click="$emit(\'select\', \'2030-01-10\')" />' },
    ShiftEditor: {
      props: ['date', 'shifts', 'friends'],
      emits: ['close', 'save', 'remove'],
      template: '<div id="ed">{{ date }}|{{ shifts.length }}|{{ friends.length }}<i id="close" @click="$emit(\'close\')" /><i id="save" @click="$emit(\'save\', [1], [\'x\'])" /><i id="rm" @click="$emit(\'remove\', \'r\')" /></div>',
    },
  }

  it('lists people, toggles them and shows struck-out hidden ones', async () => {
    h.s.hidden = ['o1']
    const w = mount(CalendarPage, { global: { stubs } })
    const buttons = w.findAll('section > div button')
    expect(buttons.map((b) => b.text())).toEqual(['Я', 'Аня'])
    expect(buttons[1]!.classes()).toContain('line-through')
    expect(buttons[0]!.classes()).not.toContain('line-through')
    await buttons[0]!.trigger('click')
    expect(h.s.toggle).toHaveBeenCalledWith('me')
  })

  it('opens the editor for a day with my shifts and friends only, and wires events', async () => {
    h.s.myShifts = [
      { id: '1', date: '2030-01-10', start: '09:00', end: '18:00', note: null },
      { id: '2', date: '2030-01-11', start: '09:00', end: '18:00', note: null },
    ]
    h.s.byDate = { '2030-01-10': [entry('me', '2030-01-10'), entry('o1', '2030-01-10')] }
    const w = mount(CalendarPage, { global: { stubs } })
    expect(w.find('#ed').exists()).toBe(false)
    await w.get('#cal').trigger('click')
    expect(w.get('#ed').text()).toBe('2030-01-10|1|1')

    await w.get('#save').trigger('click')
    expect(h.s.saveShifts).toHaveBeenCalledWith([1], ['x'])
    await w.get('#rm').trigger('click')
    expect(h.s.deleteShift).toHaveBeenCalledWith('r')
    await w.get('#close').trigger('click')
    expect(w.find('#ed').exists()).toBe(false)
  })

  it('has no friends while nothing is selected', () => {
    const w = mount(CalendarPage, { global: { stubs } })
    expect((w.vm as any).selectedFriends).toEqual([])
  })

  it('has no friends for days without entries', async () => {
    const w = mount(CalendarPage, { global: { stubs } })
    await w.get('#cal').trigger('click')
    expect(w.get('#ed').text()).toBe('2030-01-10|0|0')
  })
})
