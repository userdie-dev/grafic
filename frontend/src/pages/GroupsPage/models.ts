import { z } from 'zod'
import { COLORS } from '@/composables/useSchedule'

export const groupFormSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(100),
  color: z.string(),
})

export const groupFormDefaults: z.infer<typeof groupFormSchema> = {
  name: '',
  color: COLORS[0]!,
}

export type GroupFormData = z.infer<typeof groupFormSchema>
