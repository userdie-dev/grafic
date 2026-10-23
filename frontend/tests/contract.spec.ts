import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { api, registerDevice, setToken } from '@/lib/api'
import { setUnauthorizedHandler } from '@/app/config/axios'
import { FakeApi } from './support/fakeApi'
import { createApiServer } from './support/msw'

/** The real api layer + axios against the fake backend over HTTP: checks URLs, auth, payloads and error mapping. */
let fake: FakeApi
const server = createApiServer((fake = new FakeApi()))

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
beforeEach(() => {
  fake.users = []
  fake.subs = []
  fake.log = []
  fake.failNext = undefined
  setToken('')
})
afterEach(() => server.resetHandlers())

// the server reads the same instance, so tests below mutate `fake` in place
const device = async () => {
  const d = await registerDevice()
  setToken(d.token)
  return d
}

describe('device registration', () => {
  it('returns a token and a 6 character share code', async () => {
    const d = await registerDevice()
    expect(d).toMatchObject({ userId: expect.any(String), token: expect.any(String) })
    expect(d.shareCode).toMatch(/^[A-Z2-9]{6}$/)
  })

  it('rejects authorised calls without a token', async () => {
    await expect(api.myShifts()).rejects.toThrow('Unauthorized')
  })
})

describe('shifts', () => {
  it('sends shifts in UTC and sees them back within the requested range', async () => {
    await device()
    const saved = await api.saveShifts([{ date: '2026-03-10', start: '09:00', end: '18:00', note: 'x' }])
    expect(saved).toHaveLength(1)
    const [mine] = await api.myShifts('2026-03-01', '2026-03-31')
    expect(mine).toMatchObject({ note: 'x' })
    expect(await api.myShifts('2026-04-01', '2026-04-30')).toEqual([])
  })

  it('upserts by date+start instead of duplicating', async () => {
    await device()
    const [first] = await api.saveShifts([{ date: '2026-03-10', start: '09:00', end: '18:00' }])
    const [again] = await api.saveShifts([{ date: '2026-03-10', start: '09:00', end: '19:00' }])
    expect(again!.id).toBe(first!.id)
    const all = await api.myShifts()
    expect(all).toHaveLength(1)
    expect(all[0]!.end).not.toBe(first!.end)
  })

  it('deletes a shift and reports unknown ids', async () => {
    await device()
    const [s] = await api.saveShifts([{ date: '2026-03-10', start: '09:00', end: '18:00' }])
    expect(await api.deleteShift(s!.id)).toEqual({ deleted: true })
    expect(await api.deleteShift(s!.id)).toEqual({ deleted: false })
  })

  it('surfaces validation messages as one error', async () => {
    await device()
    await expect(api.myShifts('nope', 'nope')).rejects.toThrow('Invalid date: nope')
  })
})

describe('sharing', () => {
  it('subscribes by code (case and padding insensitive), then reads the friend schedule', async () => {
    await device()
    const friend = fake.seedUser([{ date: '2026-03-12', start: '08:00', end: '20:00' }], 'ABC234')
    const sub = await api.subscribe('ABC234')
    expect(sub.ownerId).toBe(friend.id)
    expect(await api.subscriptions()).toEqual([sub])
    expect(await api.friendShifts(friend.id, '2026-03-01', '2026-03-31')).toHaveLength(1)
    expect((await api.subscribe('ABC234')).id).toBe(sub.id) // idempotent
  })

  it('maps server errors to readable messages', async () => {
    const me = await device()
    await expect(api.subscribe('ZZZZZZ')).rejects.toThrow('Unknown code')
    await expect(api.subscribe(me.shareCode)).rejects.toThrow('Cannot subscribe to yourself')
    await expect(api.subscribe('AB')).rejects.toThrow(/code must be/)
  })

  it('forbids reading schedules of people we do not follow', async () => {
    await device()
    const stranger = fake.seedUser()
    await expect(api.friendShifts(stranger.id)).rejects.toThrow('Forbidden')
  })

  it('unsubscribes', async () => {
    await device()
    fake.seedUser([], 'ABC234')
    const sub = await api.subscribe('ABC234')
    expect(await api.unsubscribe(sub.id)).toEqual({ deleted: true })
    expect(await api.subscriptions()).toEqual([])
  })

  it('regenerates the share code, invalidating the old one', async () => {
    const me = await device()
    const { shareCode } = await api.regenerateCode()
    expect(shareCode).not.toBe(me.shareCode)
  })
})

describe('expired token', () => {
  it('re-registers once and retries the failed request', async () => {
    const d = await device()
    fake.users = [] // the server database was reset
    setUnauthorizedHandler(async () => {
      const fresh = await registerDevice()
      setToken(fresh.token)
    })
    expect(await api.myShifts()).toEqual([])
    expect(fake.users).toHaveLength(1)
    expect(fake.users[0]!.token).not.toBe(d.token)
  })
})
