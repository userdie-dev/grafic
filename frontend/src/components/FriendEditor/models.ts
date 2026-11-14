import { z } from 'zod'

export const friendFormSchema = z.object({
  name: z.string().max(30),
  color: z.string(),
})

export type FriendFormData = z.infer<typeof friendFormSchema>
