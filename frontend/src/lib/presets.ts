export type Times = [string, string]

/**
 * weekly  – a single shift, optionally repeated every week
 * cycle   – `work` working days, then `off` days off, repeating from the chosen day
 * weekdays – fixed days of the week (0 = Sunday … 6 = Saturday)
 */
export interface Preset {
  id: string
  label: string
  hint: string
  rule: { type: 'weekly' } | { type: 'cycle'; work: number; off: number } | { type: 'weekdays'; days: number[] }
  day: Times
  night: Times
  custom?: boolean
}

export const BUILTIN_PRESETS: Preset[] = [
  { id: 'weekly', label: 'Обычный', hint: '', rule: { type: 'weekly' }, day: ['09:00', '18:00'], night: ['20:00', '08:00'] },
  {
    id: '5/2',
    label: '5/2',
    hint: 'Пн–Пт рабочие, Сб–Вс выходные, начиная с выбранного дня',
    rule: { type: 'weekdays', days: [1, 2, 3, 4, 5] },
    day: ['09:00', '18:00'],
    night: ['22:00', '06:00'],
  },
  { id: '6/1', label: '6/1', hint: 'Пн–Сб рабочие, Вс выходной', rule: { type: 'weekdays', days: [1, 2, 3, 4, 5, 6] }, day: ['09:00', '18:00'], night: ['22:00', '06:00'] },
  { id: '2/2', label: '2/2', hint: '', rule: { type: 'cycle', work: 2, off: 2 }, day: ['08:00', '20:00'], night: ['20:00', '08:00'] },
  { id: '3/3', label: '3/3', hint: '', rule: { type: 'cycle', work: 3, off: 3 }, day: ['08:00', '20:00'], night: ['20:00', '08:00'] },
  { id: '4/2', label: '4/2', hint: '', rule: { type: 'cycle', work: 4, off: 2 }, day: ['08:00', '20:00'], night: ['20:00', '08:00'] },
  { id: '1/3', label: '1/3', hint: '', rule: { type: 'cycle', work: 1, off: 3 }, day: ['08:00', '20:00'], night: ['20:00', '08:00'] },
  { id: '1/2', label: '1/2', hint: '', rule: { type: 'cycle', work: 1, off: 2 }, day: ['08:00', '20:00'], night: ['20:00', '08:00'] },
]

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
const dayName = (d: number) => DAY_NAMES[d]!

export function describe(p: Preset): string {
  if (p.hint) return p.hint
  const r = p.rule
  if (r.type === 'cycle') return `${r.work} раб., ${r.off} вых., начиная с выбранного дня`
  if (r.type === 'weekdays') return `Рабочие дни: ${[1, 2, 3, 4, 5, 6, 0].filter((d) => r.days.includes(d)).map(dayName).join(', ')}`
  return ''
}

/** Whether the preset puts a shift on the day `offset` days after the first one (`dow` = that day's weekday). */
export function works(p: Preset, offset: number, dow: number): boolean {
  const r = p.rule
  if (r.type === 'cycle') return offset % (r.work + r.off) < r.work
  if (r.type === 'weekdays') return r.days.includes(dow)
  return offset === 0
}
