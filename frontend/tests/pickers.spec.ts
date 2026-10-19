import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Calendar } from '@/components/ui/calendar'
import DatePicker from '@/components/ui/date-picker/DatePicker.vue'
import TimePicker from '@/components/ui/time-picker/TimePicker.vue'

afterEach(() => {
  document.body.innerHTML = ''
})

const body = () => document.body
const byText = (sel: string, text: string) =>
  [...body().querySelectorAll<HTMLElement>(sel)].find((e) => e.textContent?.trim() === text)!

describe('TimePicker', () => {
  const open = async (props: Record<string, unknown> = {}) => {
    Element.prototype.scrollIntoView = vi.fn()
    const w = mount(TimePicker, { props, attachTo: body() })
    await w.get('[data-slot=time-picker]').trigger('click')
    await flushPromises()
    await new Promise((r) => setTimeout(r, 80))
    await flushPromises()
    return w
  }

  it('shows a placeholder when empty and the value otherwise', () => {
    expect(mount(TimePicker).text()).toContain('--:--')
    expect(mount(TimePicker, { props: { modelValue: '09:30' } }).text()).toContain('09:30')
  })

  it('applies a custom class', () => {
    expect(mount(TimePicker, { props: { class: 'custom' } }).get('button').classes()).toContain('custom')
  })

  it('opens with the current value selected and scrolls it into view', async () => {
    await open({ modelValue: '09:30', title: 'Начало' })
    expect(body().textContent).toContain('Начало')
    expect(body().querySelectorAll('[data-selected="true"]')).toHaveLength(2)
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
  })

  it('uses the default title and keeps an off-grid minute selectable', async () => {
    await open({ modelValue: '09:07' })
    expect(body().textContent).toContain('Выберите время')
    expect(byText('[role=option]', '07')).toBeTruthy()
  })

  it('honours the step', async () => {
    await open({ modelValue: '09:00', step: 15 })
    const minutes = [...body().querySelectorAll('[aria-label="Минуты"] [role=option]')].map((e) => e.textContent)
    expect(minutes).toEqual(['00', '15', '30', '45'])
  })

  it('commits the picked time on confirm', async () => {
    const w = await open({ modelValue: '09:30' })
    byText('[aria-label="Часы"] [role=option]', '14').click()
    byText('[aria-label="Минуты"] [role=option]', '45').click()
    await flushPromises()
    byText('button', 'Готово').click()
    await flushPromises()
    expect(w.emitted('update:modelValue')).toEqual([['14:45']])
  })

  it('picks a time from an empty value (minutes/hours default to 00)', async () => {
    const w = await open()
    byText('[aria-label="Минуты"] [role=option]', '30').click()
    await flushPromises()
    byText('button', 'Готово').click()
    await flushPromises()
    expect(w.emitted('update:modelValue')).toEqual([['00:30']])
  })

  it('picks only an hour from an empty value', async () => {
    const w = await open()
    byText('[aria-label="Часы"] [role=option]', '07').click()
    await flushPromises()
    byText('button', 'Готово').click()
    await flushPromises()
    expect(w.emitted('update:modelValue')).toEqual([['07:00']])
  })

  it('emits nothing when confirmed with no value', async () => {
    const w = await open()
    byText('button', 'Готово').click()
    await flushPromises()
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('DatePicker', () => {
  const open = async (props: Record<string, unknown> = {}) => {
    const w = mount(DatePicker, { props, attachTo: body() })
    await w.get('[data-slot=date-picker]').trigger('click')
    await flushPromises()
    return w
  }

  it('shows placeholder text or the formatted date', () => {
    expect(mount(DatePicker).text()).toContain('Выберите дату')
    expect(mount(DatePicker, { props: { placeholder: 'Когда?' } }).text()).toContain('Когда?')
    expect(mount(DatePicker, { props: { modelValue: '2030-03-05' } }).text()).toContain('5 марта 2030')
  })

  it('applies a custom class', () => {
    expect(mount(DatePicker, { props: { class: 'custom' } }).get('button').classes()).toContain('custom')
  })

  it('opens a calendar with a custom title', async () => {
    await open({ modelValue: '2030-03-05', title: 'До какого' })
    expect(body().textContent).toContain('До какого')
    expect(body().querySelector('[data-slot=calendar]')).toBeTruthy()
  })

  const dayTrigger = (n: string) =>
    [...body().querySelectorAll<HTMLElement>('[data-reka-calendar-cell-trigger]')].find(
      (e) => e.textContent?.trim() === n && !e.hasAttribute('data-outside-view'),
    )!

  it('emits the picked date and closes', async () => {
    const w = await open({ modelValue: '2030-03-05' })
    const day = dayTrigger('20')
    const value = day.getAttribute('data-value')
    day.click()
    await flushPromises()
    expect(w.emitted('update:modelValue')).toEqual([[value]])
    expect(body().querySelector('[data-slot=calendar]')).toBeFalsy()
  })

  it('passes the min date through to the calendar', async () => {
    await open({ min: '2999-01-01' })
    expect(dayTrigger('20').hasAttribute('data-disabled')).toBe(true)
  })

  it('ignores an empty pick', async () => {
    const w = await open()
    w.findComponent(Calendar).vm.$emit('update:modelValue', undefined)
    await flushPromises()
    expect(w.emitted('update:modelValue')).toBeUndefined()
    expect(body().querySelector('[data-slot=calendar]')).toBeTruthy()
  })
})
