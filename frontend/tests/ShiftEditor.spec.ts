import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ShiftEditor from '@/components/ShiftEditor.vue'
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

const mountEditor = async (props: Record<string, unknown> = {}) => {
  w = mount(ShiftEditor, { props: { date: '2030-01-07', shifts: [], ...props }, attachTo: body() })
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
const saved = () => w.emitted('save')!

describe('list view', () => {
  it('shows an empty state and the formatted date', async () => {
    await mountEditor()
    expect(body().textContent).toContain('График — 07.01.2030')
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
    expect(w.emitted('remove')).toEqual([['s1']])
  })
})

describe('closing', () => {
  it('emits close after the exit animation', async () => {
    vi.useFakeTimers()
    await mountEditor()
    w.findComponent({ name: 'Drawer' }).vm.$emit('update:open', false)
    await flushPromises()
    expect(w.emitted('close')).toBeUndefined()
    vi.advanceTimersByTime(250)
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('ignores an open request', async () => {
    vi.useFakeTimers()
    await mountEditor()
    w.findComponent({ name: 'Drawer' }).vm.$emit('update:open', true)
    vi.advanceTimersByTime(250)
    expect(w.emitted('close')).toBeUndefined()
  })

  it('cancels a pending close when unmounted', async () => {
    vi.useFakeTimers()
    await mountEditor()
    const emitted = w.emitted()
    w.findComponent({ name: 'Drawer' }).vm.$emit('update:open', false)
    w.unmount()
    vi.advanceTimersByTime(250)
    expect(emitted.close).toBeUndefined()
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
    expect(body().textContent).toContain('График') // back to the list
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
    expect(w.emitted('save')).toBeUndefined()
  })
})

describe('adding shifts', () => {
  const setDate = async (iso: string) => {
    w.findComponent({ name: 'DatePicker' }).vm.$emit('update:modelValue', iso)
    await flushPromises()
  }

  it('saves a single weekly shift with the default times', async () => {
    await mountEditor()
    await openAdd()
    expect(body().textContent).toContain('Новая смена')
    expect(body().textContent).toContain('Повторять каждую неделю до')
    await submit()
    expect(saved()[0]).toEqual([[{ date: '2030-01-07', start: '09:00', end: '18:00', note: null }], []])
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

  it('repeats weekly until the chosen date', async () => {
    await mountEditor()
    await openAdd()
    await setDate('2030-01-21')
    await input(inputs().find((i) => i.placeholder === 'Заметка')!, 'Смена')
    await submit()
    expect((saved()[0] as any)[0].map((i: any) => i.date)).toEqual(['2030-01-07', '2030-01-14', '2030-01-21'])
    expect((saved()[0] as any)[0][0].note).toBe('Смена')
  })

  it('caps weekly repetition at 366 items', async () => {
    await mountEditor()
    await openAdd()
    await setDate('2050-01-01')
    await submit()
    expect((saved()[0] as any)[0]).toHaveLength(366)
  })

  it('fills a cycle preset to the end of the month by default', async () => {
    await mountEditor()
    await openAdd()
    await click(btn('2/2'))
    expect(body().textContent).toContain('2 раб., 2 вых., начиная с выбранного дня')
    expect(body().textContent).toContain('Заполнить график до')
    await submit()
    const dates = (saved()[0] as any)[0].map((i: any) => i.date)
    expect(dates).toEqual(['2030-01-07', '2030-01-08', '2030-01-11', '2030-01-12', '2030-01-15', '2030-01-16', '2030-01-19', '2030-01-20', '2030-01-23', '2030-01-24', '2030-01-27', '2030-01-28', '2030-01-31'])
    expect((saved()[0] as any)[0][0]).toMatchObject({ start: '08:00', end: '20:00' })
  })

  it('fills weekday presets until a chosen date and supports night shifts', async () => {
    await mountEditor()
    await openAdd()
    await click(btn('5/2'))
    expect(body().textContent).toContain('Пн–Пт рабочие')
    await click(btn('Ночные'))
    await setDate('2030-01-13')
    await submit()
    const items = (saved()[0] as any)[0]
    expect(items.map((i: any) => i.date)).toEqual(['2030-01-07', '2030-01-08', '2030-01-09', '2030-01-10', '2030-01-11'])
    expect(items[0]).toMatchObject({ start: '22:00', end: '06:00' })
  })

  it('refuses periods longer than 366 shifts', async () => {
    await mountEditor()
    await openAdd()
    await click(btn('6/1'))
    await setDate('2050-01-01')
    await submit()
    expect(body().textContent).toContain('Слишком длинный период')
    expect(w.emitted('save')).toBeUndefined()
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

  it('requires all four preset times', async () => {
    await open()
    timePickers()[0]!.vm.$emit('update:modelValue', '') // draft dayStart (the draft pickers come first)
    await flushPromises()
    await click(btn('Сохранить пресет'))
    expect(body().textContent).toContain('Укажите время смен')
  })

  it('stores the picked draft times', async () => {
    await open()
    ;[ '06:00', '14:00', '22:00', '06:00' ].forEach((v, i) => timePickers()[i]!.vm.$emit('update:modelValue', v))
    await flushPromises()
    await click(btn('Сохранить пресет'))
    expect(usePresetsStore().all.at(-1)).toMatchObject({ day: ['06:00', '14:00'], night: ['22:00', '06:00'] })
  })

  it('deletes a custom preset and falls back to the plain one', async () => {
    await open()
    await click(btn('Сохранить пресет'))
    await click(btn('Удалить пресет'))
    expect(usePresetsStore().all.every((p) => !p.custom)).toBe(true)
    expect(body().textContent).not.toContain('Удалить пресет')
    expect(body().textContent).toContain('Повторять каждую неделю до')
  })

  it('selecting a preset closes the draft panel', async () => {
    await open()
    await click(btn('5/2'))
    expect(body().textContent).not.toContain('Сохранить пресет')
  })
})
