import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
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
  w = mount(ShiftEditor, { global: { provide: { [DAY_EDITOR_KEY as symbol]: editor } }, attachTo: body() })
  await flushPromises()
  return w
}
const btns = () => [...body().querySelectorAll<HTMLButtonElement>('button')]
const btn = (text: string) => btns().find((b) => b.textContent?.trim() === text)!
const aria = (label: string) => body().querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!
const click = async (el: Element) => {
  ;(el as HTMLElement).click()
  await flushPromises()
}
const input = async (el: HTMLInputElement, value: string) => {
  el.value = value
  el.dispatchEvent(new Event('input', { bubbles: true }))
  await flushPromises()
}
const inputs = () => [...body().querySelectorAll<HTMLInputElement>('input')]
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
    expect(inputs().find((i) => i.placeholder === 'Заметка')!.value).toBe('Заметка')
    expect(body().textContent).toContain('09:00')
    expect(body().textContent).toContain('18:00')
    expect(body().textContent).not.toContain('Повторять каждую неделю')
  })

  it('prefills an empty note when the shift has none', async () => {
    await edit(shift())
    expect(inputs().find((i) => i.placeholder === 'Заметка')!.value).toBe('')
  })

  it('saves the same row without removal when the start is unchanged', async () => {
    await edit()
    await submit()
    expect(saved()[0]).toEqual([[{ date: '2030-01-07', start: '09:00', end: '18:00', note: 'Заметка' }], []])
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
    await input(inputs().find((i) => i.placeholder === 'Заметка')!, '')
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
    await input(inputs().find((i) => i.placeholder === 'Заметка')!, 'Смена')
    await submit()
    const items = (saved()[0] as any)[0]
    expect(items.slice(0, 3).map((i: any) => i.date)).toEqual(['2030-01-07', '2030-01-14', '2030-01-21'])
    expect(items).toHaveLength(53)
    expect(items[0].note).toBe('Смена')
  })

  it('fills a cycle preset across months by default', async () => {
    await mountEditor()
    await openAdd()
    await click(btn('2/2'))
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
    await click(btn('5/2'))
    expect(body().textContent).toContain('Пн–Пт рабочие')
    await click(btn('Ночные'))
    await submit()
    const items = (saved()[0] as any)[0]
    expect(items.slice(0, 5).map((i: any) => i.date)).toEqual(['2030-01-07', '2030-01-08', '2030-01-09', '2030-01-10', '2030-01-11'])
    expect(items[5].date).toBe('2030-01-14')
    expect(items[0]).toMatchObject({ start: '22:00', end: '06:00' })
  })

  it('switching back to the plain preset restores its times', async () => {
    await mountEditor()
    await openAdd()
    await click(btn('2/2'))
    await click(btn('Обычный'))
    await submit()
    expect((saved()[0] as any)[0][0]).toMatchObject({ start: '09:00', end: '18:00' })
  })
})

describe('custom presets', () => {
  const draftToggle = () => aria('Создать свой пресет')
  const open = async () => {
    await mountEditor()
    await openAdd()
    await click(draftToggle())
  }
  const field = (placeholderOrIndex: string | number) =>
    typeof placeholderOrIndex === 'string'
      ? inputs().find((i) => i.placeholder === placeholderOrIndex)!
      : inputs().filter((i) => i.type === 'number')[placeholderOrIndex]!
  const timePickers = () => w.findAllComponents({ name: 'TimePicker' })

  it('toggles the draft panel', async () => {
    await open()
    expect(body().textContent).toContain('Сохранить пресет')
    await click(draftToggle())
    expect(body().textContent).not.toContain('Сохранить пресет')
  })

  it('creates a cycle preset with a generated label and selects it', async () => {
    await open()
    await click(btn('Сохранить пресет'))
    expect(btn('2/2')).toBeTruthy()
    const store = usePresetsStore()
    expect(store.all.at(-1)).toMatchObject({ custom: true, label: '2/2', rule: { type: 'cycle', work: 2, off: 2 } })
    expect(body().textContent).not.toContain('Сохранить пресет')
    expect(body().textContent).toContain('Удалить пресет')
  })

  it('creates a cycle preset with a custom label', async () => {
    await open()
    await input(field('Название пресета'), '  Мой  ')
    await input(field(0), '3')
    await input(field(1), '1')
    await click(btn('Сохранить пресет'))
    expect(usePresetsStore().all.at(-1)).toMatchObject({ label: 'Мой', rule: { work: 3, off: 1 } })
  })

  it('validates cycle numbers', async () => {
    await open()
    await input(field(0), '0')
    await click(btn('Сохранить пресет'))
    expect(body().textContent).toContain('Укажите число рабочих и выходных дней')
    await input(field(0), '1')
    await input(field(1), '-1')
    await click(btn('Сохранить пресет'))
    expect(body().textContent).toContain('Укажите число рабочих и выходных дней')
    expect(usePresetsStore().all.every((p) => !p.custom)).toBe(true)
  })

  it('creates a weekdays preset, toggling days, with a default label', async () => {
    await open()
    await click(btn('По дням недели'))
    const day = (l: string) => [...body().querySelectorAll<HTMLButtonElement>('.h-9')].find((b) => b.textContent === l)!
    await click(day('Пн')) // off
    await click(day('Сб')) // on
    await click(btn('Сохранить пресет'))
    expect(usePresetsStore().all.at(-1)).toMatchObject({ label: 'Свой', rule: { type: 'weekdays', days: [2, 3, 4, 5, 6] } })
  })

  it('requires at least one weekday', async () => {
    await open()
    await click(btn('По дням недели'))
    for (const l of ['Пн', 'Вт', 'Ср', 'Чт', 'Пт']) await click([...body().querySelectorAll<HTMLButtonElement>('.h-9')].find((b) => b.textContent === l)!)
    await click(btn('Сохранить пресет'))
    expect(body().textContent).toContain('Выберите хотя бы один день недели')
    await click(btn('Через N дней'))
    expect(body().textContent).toContain('Рабочих дней')
  })

  it('deletes a custom preset and falls back to the plain one', async () => {
    await open()
    await click(btn('Сохранить пресет'))
    await click(btn('Удалить пресет'))
    expect(usePresetsStore().all.every((p) => !p.custom)).toBe(true)
    expect(body().textContent).not.toContain('Удалить пресет')
    expect(body().textContent).not.toContain('Заполнить график до')
  })

  it('selecting a preset closes the draft panel', async () => {
    await open()
    await click(btn('5/2'))
    expect(body().textContent).not.toContain('Сохранить пресет')
  })
})
