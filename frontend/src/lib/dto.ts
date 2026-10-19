export const CODE_MIN = 4
export const CODE_MAX = 6

export interface Shift {
  id: string
  date: string
  start: string
  end: string
  note: string | null
}

export type ShiftInput = Pick<Shift, 'date' | 'start' | 'end'> & { note?: string | null }

export interface Subscription {
  id: string
  ownerId: string
}

export interface Device {
  userId: string
  token: string
  shareCode: string
}
