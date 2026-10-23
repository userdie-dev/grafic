import { addDefaultShift, dayCell, drawer, expect, test } from './fixtures'

/**
 * The server stores UTC. The same local shift "09:00-18:00 on 10 March" must reach it as the
 * zone's UTC equivalent and come back displayed unchanged on the same day.
 */
const ZONES = [
  { tz: 'Europe/Moscow', start: '06:00', end: '15:00', date: '2026-03-10' },
  { tz: 'Asia/Vladivostok', start: '23:00', end: '08:00', date: '2026-03-09' },
  { tz: 'America/New_York', start: '13:00', end: '22:00', date: '2026-03-10' }, // already on daylight time since 8 March
  { tz: 'Asia/Kathmandu', start: '03:15', end: '12:15', date: '2026-03-10' },
  { tz: 'Pacific/Auckland', start: '20:00', end: '05:00', date: '2026-03-09' },
]

for (const z of ZONES) {
  test.describe(z.tz, () => {
    test.use({ timezoneId: z.tz })

    test(`sends ${z.start}-${z.end} UTC and shows 09:00-18:00 locally`, async ({ app, api }) => {
      await addDefaultShift(app, '2026-03-10')
      await expect.poll(() => api.shiftsOf(api.users[0]!.id).length).toBeGreaterThan(0)
      expect(api.shiftsOf(api.users[0]!.id)[0]).toMatchObject({ date: z.date, start: z.start, end: z.end })

      await app.reload()
      await dayCell(app, '2026-03-10').click()
      await expect(drawer(app).getByText('09:00–18:00')).toBeVisible()
    })
  })
}

test.describe('shifts stored in UTC are shown on the right local day', () => {
  test.use({ timezoneId: 'Pacific/Auckland' })

  test('an evening UTC shift lands on the next local day', async ({ app, api }) => {
    await expect.poll(() => api.users.length).toBe(1)
    const me = api.users[0]!
    // 22:00Z-06:00Z on the 9th is 11:00-19:00 on the 10th in Auckland (UTC+13 in March)
    api.handle({ method: 'PUT', path: '/me/shifts', token: me.token, body: { shifts: [{ date: '2026-03-09', start: '22:00', end: '06:00' }] } })
    await app.reload()
    await dayCell(app, '2026-03-10').click()
    await expect(drawer(app).getByText('11:00–19:00')).toBeVisible()
  })
})
