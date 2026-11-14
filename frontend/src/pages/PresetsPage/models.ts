import { z } from 'zod'

export const presetFormSchema = z.object({
  label: z.string().min(1, 'Название обязательно').max(100),
  hint: z.string(),
  ruleType: z.enum(['once', 'weekly', 'cycle', 'weekdays']),
  cycleWork: z.number().min(1).max(30),
  cycleOff: z.number().min(1).max(30),
  weekdays: z.array(z.number()),
  dayStart: z.string(),
  dayEnd: z.string(),
})

export const presetFormDefaults: z.infer<typeof presetFormSchema> = {
  label: '',
  hint: '',
  ruleType: 'once',
  cycleWork: 2,
  cycleOff: 2,
  weekdays: [1, 2, 3, 4, 5],
  dayStart: '09:00',
  dayEnd: '18:00',
}

export type PresetFormData = z.infer<typeof presetFormSchema>
