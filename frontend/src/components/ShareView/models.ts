import { z } from 'zod'
import { CODE_MAX, CODE_MIN } from '@/lib/dto'

export const addFriendSchema = z.object({
  code: z.string().min(CODE_MIN).max(CODE_MAX),
  label: z.string().max(30),
})

export const addFriendDefaults: z.infer<typeof addFriendSchema> = {
  code: '',
  label: '',
}

export type AddFriendData = z.infer<typeof addFriendSchema>
