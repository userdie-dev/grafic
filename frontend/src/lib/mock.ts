import { eachDayOfInterval, getDay, parseISO } from 'date-fns'
import type { Shift } from '@/lib/dto'
import { iso } from '@/lib/dates'

/** Dev-only demo friends; their shifts are generated locally and never hit the server. */
export const USE_MOCK_FRIENDS = import.meta.env.DEV

interface MockFriend {
  id: string
  name: string
  /** weekday (0 = Sunday) -> [start, end, note] */
  week: Partial<Record<number, [string, string, string?]>>
}

export const MOCK_FRIENDS: MockFriend[] = [
  { id: 'mock-anna', name: 'Анна', week: { 1: ['09:00', '18:00'], 2: ['09:00', '18:00'], 4: ['09:00', '18:00'], 5: ['09:00', '14:00', 'Короткий день'] } },
  { id: 'mock-igor', name: 'Игорь', week: { 1: ['08:00', '20:00', 'Смена'], 3: ['08:00', '20:00', 'Смена'], 5: ['20:00', '08:00', 'Ночная смена'], 6: ['10:00', '16:00'] } },
  { id: 'mock-maria', name: 'Мария', week: { 2: ['14:00', '22:00'], 3: ['14:00', '22:00'], 5: ['14:00', '22:00'], 0: ['12:00', '18:00', 'Выходной подработка'] } },
  { id: 'mock-dmitry', name: 'Дмитрий', week: { 1: ['10:00', '19:00'], 2: ['10:00', '19:00'], 3: ['10:00', '19:00'], 4: ['10:00', '19:00'], 5: ['10:00', '15:00'] } },
  { id: 'mock-elena', name: 'Елена', week: { 1: ['07:00', '15:00'], 2: ['07:00', '15:00'], 3: ['07:00', '15:00'], 4: ['07:00', '15:00'], 5: ['07:00', '15:00'] } },
  { id: 'mock-sergey', name: 'Сергей', week: { 1: ['22:00', '06:00', 'Ночь'], 2: ['22:00', '06:00', 'Ночь'], 3: ['22:00', '06:00', 'Ночь'], 4: ['22:00', '06:00', 'Ночь'] } },
  { id: 'mock-olga', name: 'Ольга', week: { 0: ['09:00', '21:00', '12 часов'], 1: ['09:00', '21:00', '12 часов'], 2: ['09:00', '21:00', '12 часов'] } },
  { id: 'mock-alex', name: 'Александр', week: { 1: ['08:00', '17:00'], 2: ['08:00', '17:00'], 3: ['08:00', '17:00'], 4: ['08:00', '17:00'], 5: ['08:00', '12:00'] } },
  { id: 'mock-natasha', name: 'Наташа', week: { 1: ['13:00', '21:00'], 2: ['13:00', '21:00'], 4: ['13:00', '21:00'], 6: ['11:00', '19:00'] } },
  { id: 'mock-pavel', name: 'Павел', week: { 1: ['06:00', '14:00', 'Утро'], 2: ['06:00', '14:00', 'Утро'], 3: ['06:00', '14:00', 'Утро'], 4: ['06:00', '14:00', 'Утро'], 5: ['06:00', '14:00', 'Утро'] } },
]

export function mockShifts(id: string, from: string, to: string): Shift[] {
  const friend = MOCK_FRIENDS.find((f) => f.id === id)
  if (!friend) return []
  return eachDayOfInterval({ start: parseISO(from), end: parseISO(to) }).flatMap((d) => {
    const slot = friend.week[getDay(d)]
    if (!slot) return []
    const date = iso(d)
    return [{ id: `${id}:${date}`, date, start: slot[0], end: slot[1], note: slot[2] ?? null }]
  })
}
