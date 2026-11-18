import { addDefaultShift, drawer, expect, monthTitle, openDayList, test } from './fixtures'

const DAY = '2026-03-10'

test.describe('first run', () => {
  test('registers a device and shows its share code', async ({ app, api }) => {
    await app.getByRole('link', { name: 'Поделиться' }).click()
    await expect(app.getByText('Поделиться графиком')).toBeVisible()
    await expect.poll(() => api.users.length).toBe(1)
    await expect(app.getByText(api.users[0]!.shareCode)).toBeVisible()
  })

  test('survives a reload without registering a second device', async ({ app, api }) => {
    await expect.poll(() => api.users.length).toBe(1)
    await app.reload()
    await expect(app.getByRole('navigation')).toBeVisible()
    expect(api.users).toHaveLength(1)
  })

  test('navigates between the tabs', async ({ app }) => {
    await app.getByRole('link', { name: 'Настройки' }).click()
    await expect(app).toHaveURL(/#\/settings$/)
    await app.getByRole('link', { name: 'Поделиться' }).click()
    await expect(app.getByText('Поделиться графиком')).toBeVisible()
    await app.getByRole('link', { name: 'Календарь' }).click()
    await expect(monthTitle(app)).toHaveText(/март 2026/i)
  })
})

test.describe('my shifts', () => {
  test('creates a shift, which is saved on the server and survives a reload', async ({ app, api }) => {
    await addDefaultShift(app, DAY)
    await expect.poll(() => api.shiftsOf(api.users[0]!.id).length).toBeGreaterThan(0)

    await app.reload()
    await openDayList(app, DAY)
    await expect(drawer(app).getByText('09:00–18:00')).toBeVisible()
  })

  test('the weekly preset repeats every seven days', async ({ app, api }) => {
    await addDefaultShift(app, DAY, true)
    await expect.poll(() => api.shiftsOf(api.users[0]!.id).length).toBeGreaterThan(1)
    const times = api.shiftsOf(api.users[0]!.id).map((s) => Date.parse(`${s.date}T00:00:00Z`))
    times.slice(1).forEach((t, i) => expect(t - times[i]!).toBe(7 * 24 * 3600_000))
  })

  test('edits a shift note', async ({ app, api }) => {
    await addDefaultShift(app, DAY) // leaves the day drawer open on its list
    await app.getByRole('button', { name: 'Изменить' }).click()
    await app.getByPlaceholder('Заметка').fill('Склад')
    await app.getByRole('button', { name: 'Сохранить' }).click()
    await expect(drawer(app).getByText('Склад')).toBeVisible()
    await expect.poll(() => api.shiftsOf(api.users[0]!.id).some((s) => s.note === 'Склад')).toBe(true)
  })

  test('deletes a shift', async ({ app, api }) => {
    await addDefaultShift(app, DAY)
    await expect.poll(() => api.shiftsOf(api.users[0]!.id).length).toBeGreaterThan(0)
    const before = api.shiftsOf(api.users[0]!.id).length
    await app.getByRole('button', { name: 'Удалить' }).click()
    await expect(drawer(app).getByText('В этот день смен нет')).toBeVisible()
    await expect.poll(() => api.shiftsOf(api.users[0]!.id).length).toBe(before - 1)
  })

  test('keeps offline additions and deletions after reload and sends them on reconnect', async ({ app, api, network }) => {
    await expect.poll(() => api.users.length).toBe(1)
    network.offline = true
    await addDefaultShift(app, DAY, true)
    await expect(drawer(app).getByText('09:00–18:00')).toBeVisible()
    await app.reload()
    await openDayList(app, DAY)
    await expect(drawer(app).getByText('09:00–18:00')).toBeVisible()
    await app.getByRole('button', { name: 'Удалить' }).click()
    await expect(drawer(app).getByText('В этот день смен нет')).toBeVisible()
    expect(api.shiftsOf(api.users[0]!.id)).toHaveLength(0)

    await app.reload()
    await openDayList(app, DAY)
    await expect(drawer(app).getByText('В этот день смен нет')).toBeVisible()
    network.offline = false
    await app.evaluate(() => window.dispatchEvent(new Event('online')))
    await expect.poll(() => app.evaluate(() => {
      const journal = JSON.parse(localStorage.getItem('grafic.shiftJournal') ?? '{}')
      return journal.pending?.length
    })).toBe(0)
    const shifts = api.shiftsOf(api.users[0]!.id)
    expect(shifts.length).toBeGreaterThan(0)
    expect(shifts.some((shift) => shift.date === DAY)).toBe(false)
  })
})

test.describe('month navigation', () => {
  test('moves between months and returns to the current one', async ({ app }) => {
    await app.getByRole('button', { name: /next/i }).click()
    await expect(monthTitle(app)).toHaveText(/апрель 2026/i)
    await app.getByRole('button', { name: '← К текущему месяцу' }).click()
    await expect(monthTitle(app)).toHaveText(/март 2026/i)
  })
})

test.describe('friends', () => {
  test('follows a friend by code and sees their shifts', async ({ app, api }) => {
    api.seedUser([{ date: '2026-03-12', start: '08:00', end: '20:00', note: 'Смена друга' }], 'FRND42')
    await app.getByRole('link', { name: 'Поделиться' }).click()
    await app.getByPlaceholder('Код').fill('frnd42')
    await app.getByPlaceholder('Имя').fill('Саша')
    await app.getByRole('button', { name: 'Добавить' }).click()
    await expect.poll(() => api.subs.length).toBe(1)

    await app.getByRole('link', { name: 'Календарь' }).click()
    await openDayList(app, '2026-03-12')
    await expect(drawer(app).getByText('Саша')).toBeVisible()
    await expect(drawer(app).getByText(/Смена друга/)).toBeVisible()
  })

  test.fixme('rejects an unknown code with the server message', async ({ app }) => {
    await app.getByRole('link', { name: 'Поделиться' }).click()
    await app.getByPlaceholder('Код').fill('NOPE22')
    await app.getByRole('button', { name: 'Добавить' }).click()
    await expect(app.getByText('Unknown code')).toBeVisible()
  })

  test('does not allow codes that are too short', async ({ app }) => {
    await app.getByRole('link', { name: 'Поделиться' }).click()
    await app.getByPlaceholder('Код').fill('AB')
    await expect(app.getByRole('button', { name: 'Добавить' })).toBeDisabled()
  })

  test('replacing the share code takes two taps', async ({ app, api }) => {
    await app.getByRole('link', { name: 'Поделиться' }).click()
    await expect.poll(() => api.users.length).toBe(1)
    const old = api.users[0]!.shareCode
    await app.getByRole('button', { name: 'Новый код' }).click()
    expect(api.users[0]!.shareCode).toBe(old)
    await app.getByRole('button', { name: /Заменить/ }).click()
    await expect.poll(() => api.users[0]!.shareCode).not.toBe(old)
    await expect(app.getByText(api.users[0]!.shareCode)).toBeVisible()
  })
})

test.describe('resilience', () => {
  test('does not show a connection toast when the server is unreachable', async ({ app, network }) => {
    network.offline = true
    await app.reload()
    await expect(app.getByText('Подключение к серверу')).toHaveCount(0)
  })

  test('shows cached shifts while offline', async ({ app, network, api }) => {
    await addDefaultShift(app, DAY)
    await expect.poll(() => api.shiftsOf(api.users[0]!.id).length).toBeGreaterThan(0)
    await expect(app.getByText('В этот день смен нет')).toHaveCount(0)
    network.offline = true
    await app.reload()
    await expect(app.getByText('Подключение к серверу')).toHaveCount(0)
    await openDayList(app, DAY)
    await expect(drawer(app).getByText('09:00–18:00')).toBeVisible()
  })

  test('registers again when the server forgot the device (401)', async ({ app, api }) => {
    await expect.poll(() => api.users.length).toBe(1)
    const first = api.users[0]!.token
    api.users = [] // backend database reset
    await app.reload()
    await expect.poll(() => api.users[0]?.token).toBeTruthy()
    expect(api.users[0]!.token).not.toBe(first)
    await expect(app.getByText('Unauthorized')).toHaveCount(0)
  })
})
