import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import ShiftEditor from '@/components/ShiftEditor.vue'
import { DAY_EDITOR_KEY } from '@/composables/useDayEditor'
import { usePresetsStore } from '@/stores/presets'
import type { Shift } from '@/lib/dto'

const body = () => document.body
const shift = (over: Partial<Shift> = {}): Shift => ({ id: 's1', date: '2030-01-07', start: '09:00', end: '18:00', note: null, ...over })
const friend = (note: string | null = null) => ({
  who: 'o1',
  name: 'Аня',
  color: '#f00',
  shift: { id: 'f1', date: '2030-01-07', start: '10:00', end: '12:00', note },
})

let w: VueWrapper
beforeEach(() => {
  setActivePinia(createPinia())
  Element.prototype.scrollIntoView = vi.fn()
})
afterEach(() => {
  w?.unmount()
  document.body.innerHTML = ''
  vi.useRealTimers()
})

let editor: ReturnType<typeof fakeEditor>
const fakeEditor = (props: Record<string, unknown>) => ({
  selected: ref('2030-01-07'),
  date: ref('2030-01-07'),
  shifts: ref((props.shifts ?? []) as Shift[]),
  friends: ref((props.friends ?? []) as unknown[]),
  open: vi.fn(),
  close: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
})
const mountEditor = async (props: Record<string, unknown> = {}) => {
  editor = fakeEditor(props)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  w = mount(ShiftEditor, {
    global: { plugins: [[VueQueryPlugin, { queryClient }]], provide: { [DAY_EDITOR_KEY as symbol]: editor } },
    attachTo: body(),
  })
  await flushPromises()
  // the drawer opens on the chart tab; the list is a separate mode
  await click(btn('Список'))
  return w
}
const btns = () => [...body().querySelectorAll<HTMLButtonElement>('button')]
const btn = (text: string) => btns().find((b) => b.textContent?.trim() === text)!
const aria = (label: string) => body().querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!
const click = async (el: Element) => {
  ;(el as HTMLElement).click()
  await flushPromises()
}
const selectTrigger = (label: string) =>
  [...body().querySelectorAll<HTMLLabelElement>('label')].find((el) => el.textContent === label)!.control!
const select = async (label: string, value: string) => {
  const pressEnter = (el: Element) => el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
  pressEnter(selectTrigger(label))
  await flushPromises()
  const option = [...body().querySelectorAll('[role="option"]')].find((el) => el.textContent?.trim() === value)!
  pressEnter(option)
  await flushPromises()
}
const input = async (el: HTMLTextAreaElement, value: string) => {
  el.value = value
  el.dispatchEvent(new Event('input', { bubbles: true }))
  await flushPromises()
}
const noteField = () => body().querySelector<HTMLTextAreaElement>('textarea[placeholder]')!
const form = () => body().querySelector('form')!
const submit = async () => {
  form().dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
  await flushPromises()
}
/** Opens the add-shift form. */
const openAdd = async () => click(aria('Добавить смену'))
const saved = () => editor.save.mock.calls

describe('list view', () => {
  it('shows an empty state and the formatted date', async () => {
    await mountEditor()
    expect(body().textContent).toContain('07.01.2030')
    expect(body().textContent).toContain('В этот день смен нет')
  })

  it('lists shifts with notes, and friends with and without notes', async () => {
    await mountEditor({ shifts: [shift({ note: 'Утро' })], friends: [friend(), { ...friend('Смена'), shift: { ...friend('Смена').shift, id: 'f2' } }] })
    expect(body().textContent).toContain('09:00–18:00')
    expect(body().textContent).toContain('Утро')
    expect(body().textContent).toContain('Друзья')
    expect(body().textContent).toContain('Аня')
    expect(body().textContent).toContain('10:00–12:00 · Смена')
    expect(body().textContent).not.toContain('В этот день смен нет')
  })

  it('emits remove for a shift', async () => {
    await mountEditor({ shifts: [shift()] })
    await click(aria('Удалить'))
    expect(editor.remove.mock.calls).toEqual([['s1']])
  })
})

describe('closing', () => {
  it('emits close after the exit animation', async () => {
    vi.useFakeTimers()
    await mountEditor()
    w.findComponent({ name: 'Drawer' }).vm.$emit('update:open', false)
    await flushPromises()
    expect(editor.close).not.toHaveBeenCalled()
    vi.advanceTimersByTime(250)
    expect(editor.close).toHaveBeenCalledTimes(1)
  })

  it('ignores an open request', async () => {
    vi.useFakeTimers()
    await mountEditor()
    w.findComponent({ name: 'Drawer' }).vm.$emit('update:open', true)
    vi.advanceTimersByTime(250)
    expect(editor.close).not.toHaveBeenCalled()
  })

  it('cancels a pending close when unmounted', async () => {
    vi.useFakeTimers()
    await mountEditor()
    w.findComponent({ name: 'Drawer' }).vm.$emit('update:open', false)
    w.unmount()
    vi.advanceTimersByTime(250)
    expect(editor.close).not.toHaveBeenCalled()
  })
})

describe('editing an existing shift', () => {
  const edit = async (s = shift({ note: 'Заметка' })) => {
    await mountEditor({ shifts: [s] })
    await click(aria('Изменить'))
  }

  it('prefills the form and hides preset controls', async () => {
    await edit()
    expect(body().textContent).toContain('Изменить смену')
    expect(btn('5/2')).toBeUndefined()
    expect(noteField().value).toBe('Заметка')
    expect(body().textContent).toContain('09:00')
    expect(body().textContent).toContain('18:00')
    expect(body().textContent).not.toContain('Повторять каждую неделю')
  })

  it('prefills an empty note when the shift has none', async () => {
    await edit(shift())
    expect(noteField().value).toBe('')
  })

  it('saves the same row without removal when the start is unchanged', async () => {
    await edit()
    await submit()
    expect(saved()[0]).toEqual([[{ date: '2030-01-07', start: '09:00', end: '18:00', note: 'Заметка' }], ['s1']])
    expect(body().textContent).toContain('Смены на выбранный день') // back to the list
  })

  it('removes the old row when the start time changed', async () => {
    await edit()
    // pick a new start in the time picker
    await click(body().querySelector('[data-slot=time-picker]')!)
    await new Promise((r) => setTimeout(r, 80))
    await flushPromises()
    const hour = [...body().querySelectorAll<HTMLElement>('[aria-label="Часы"] [role=option]')].find((e) => e.textContent === '10')!
    await click(hour)
    await click(btn('Готово'))
    await submit()
    expect(saved()[0]).toEqual([[{ date: '2030-01-07', start: '10:00', end: '18:00', note: 'Заметка' }], ['s1']])
  })

  it('sends a null note when cleared', async () => {
    await edit()
    await input(noteField(), '')
    await submit()
    expect((saved()[0] as any)[0][0].note).toBeNull()
  })

  it('goes back to the list with the back / cancel buttons', async () => {
    await edit()
    await click(aria('Назад'))
    expect(body().querySelector('form')).toBeNull()
    await click(aria('Изменить'))
    await click(btn('Отмена'))
    expect(body().querySelector('form')).toBeNull()
  })

  it('rejects an empty time', async () => {
    await edit()
    const picker = w.findAllComponents({ name: 'TimePicker' })[0]!
    picker.vm.$emit('update:modelValue', '')
    await flushPromises()
    await submit()
    expect(body().textContent).toContain('Укажите время')
    expect(editor.save).not.toHaveBeenCalled()
  })
})

describe('adding shifts', () => {
  it('keeps the form and entered data after a failed save, then allows retrying', async () => {
    await mountEditor()
    await openAdd()
    await input(noteField(), 'Склад\nВторая строка')
    editor.save.mockRejectedValueOnce(new Error('Не удалось сохранить'))
    await click(btn('Сохранить'))
    expect(body().textContent).toContain('Не удалось сохранить')
    expect(noteField().value).toBe('Склад\nВторая строка')
    await click(btn('Сохранить'))
    expect(editor.save).toHaveBeenCalledTimes(2)
    expect(saved()[1]?.[0]).toEqual([expect.objectContaining({ note: 'Склад\nВторая строка' })])
    expect(body().querySelector('form')).toBeNull()
  })

  it('waits for saving and prevents duplicate submissions', async () => {
    await mountEditor()
    await openAdd()
    let finish!: () => void
    editor.save.mockReturnValueOnce(new Promise<void>((resolve) => { finish = resolve }))
    await click(btn('Сохранить'))
    expect(btn('Сохранение…').disabled).toBe(true)
    await submit()
    expect(editor.save).toHaveBeenCalledTimes(1)
    finish()
    await flushPromises()
    expect(body().querySelector('form')).toBeNull()
  })

  it('saves an edited end time', async () => {
    await mountEditor()
    await openAdd()
    const pickers = w.findAllComponents({ name: 'TimePicker' })
    pickers.at(-1)!.vm.$emit('update:modelValue', '19:30')
    await flushPromises()
    await submit()
    expect((saved()[0] as any)[0][0]).toMatchObject({ start: '09:00', end: '19:30' })
  })

  it('repeats a plain shift weekly for a year', async () => {
    await mountEditor()
    await openAdd()
    await select('Тип графика', 'Пресет')
    await select('Пресет', 'Обычный')
    await input(noteField(), 'Смена')
    await submit()
    const items = (saved()[0] as any)[0]
    expect(items.slice(0, 3).map((i: any) => i.date)).toEqual(['2030-01-07', '2030-01-14', '2030-01-21'])
    expect(items).toHaveLength(53)
    expect(items[0].note).toBe('Смена')
  })

  it('fills a cycle preset across months by default', async () => {
    await mountEditor()
    await openAdd()
    await select('Тип графика', 'Пресет')
    await select('Пресет', '2/2')
    expect(body().textContent).toContain('2 раб., 2 вых., начиная с выбранного дня')
    expect(body().textContent).not.toContain('Заполнить график до')
    await submit()
    const dates = (saved()[0] as any)[0].map((i: any) => i.date)
    expect(dates.slice(0, 8)).toEqual(['2030-01-07', '2030-01-08', '2030-01-11', '2030-01-12', '2030-01-15', '2030-01-16', '2030-01-19', '2030-01-20'])
    expect(dates).toContain('2030-02-04')
    expect(dates).toContain('2030-02-05')
    expect((saved()[0] as any)[0][0]).toMatchObject({ start: '08:00', end: '20:00' })
  })

  it('fills weekday presets and supports night shifts', async () => {
    await mountEditor()
    await openAdd()
    await select('Тип графика', 'Пресет')
    await select('Пресет', '5/2')
    expect(body().textContent).toContain('Пн–Пт рабочие')
    // Изменим время на ночное вручную через TimePicker
    const pickers = w.findAllComponents({ name: 'TimePicker' })
    pickers[0]!.vm.$emit('update:modelValue', '22:00')
    pickers[1]!.vm.$emit('update:modelValue', '06:00')
    await flushPromises()
    await submit()
    const items = (saved()[0] as any)[0]
    expect(items.slice(0, 5).map((i: any) => i.date)).toEqual(['2030-01-07', '2030-01-08', '2030-01-09', '2030-01-10', '2030-01-11'])
    expect(items[5].date).toBe('2030-01-14')
    expect(items[0]).toMatchObject({ start: '22:00', end: '06:00' })
  })

  it('switching back to the plain preset restores its times', async () => {
    await mountEditor()
    await openAdd()
    await select('Тип графика', 'Пресет')
    await select('Пресет', '2/2')
    await select('Пресет', 'Обычный')
    await submit()
    expect((saved()[0] as any)[0][0]).toMatchObject({ start: '09:00', end: '18:00' })
  })
})

describe('custom presets', () => {
  it('selects a saved preset and falls back to the default after deletion', async () => {
    await mountEditor()
    const store = usePresetsStore()
    store.add({
      label: 'Мой график',
      hint: 'Смены по циклу',
      rule: { type: 'cycle', work: 3, off: 1 },
      day: ['08:00', '20:00'],
      night: ['20:00', '08:00'],
    })
    await openAdd()
    await select('Тип графика', 'Пресет')
    expect(aria('Создать свой пресет')).toBeNull()
    await select('Пресет', 'Мой график')
    expect(selectTrigger('Пресет').textContent).toBe('Мой график')
    await click(btn('Удалить пресет'))
    expect(store.all.every((p) => !p.custom)).toBe(true)
    expect(selectTrigger('Пресет').textContent).toBe('Один раз')
  })
})
