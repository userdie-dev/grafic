import { test as base, expect, type Page, type Route } from '@playwright/test'
import { FakeApi } from '../tests/support/fakeApi'

const API = 'http://localhost:3000'
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, content-type',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

/** Serves the FakeApi to the page; the backend itself is never started. */
async function serve(page: Page, api: FakeApi, state: { offline: boolean }) {
  await page.route(`${API}/**`, async (route: Route) => {
    const req = route.request()
    const url = new URL(req.url())
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })
    if (state.offline) return route.abort('connectionrefused')
    // the live-update stream: stay silent, the app still re-fetches on its own
    if (url.pathname === '/events') {
      return route.fulfill({ status: 200, headers: { ...CORS, 'content-type': 'text/event-stream' }, body: 'retry: 600000\n\n' })
    }
    const res = api.handle({
      method: req.method(),
      path: url.pathname,
      query: url.searchParams,
      body: req.postData() ? JSON.parse(req.postData()!) : undefined,
      token: req.headers()['authorization']?.replace(/^Bearer /, ''),
    })
    await route.fulfill({ status: res.status, headers: CORS, contentType: 'application/json', body: JSON.stringify(res.body) })
  })
}

interface Fixtures {
  api: FakeApi
  /** flip to simulate the backend being unreachable */
  network: { offline: boolean }
  /** the app, opened at a fixed date (2026-03-10) so calendar assertions are stable */
  app: Page
}

export const test = base.extend<Fixtures>({
  api: async ({}, use) => use(new FakeApi()),
  network: async ({}, use) => use({ offline: false }),
  app: async ({ page, api, network }, use) => {
    await page.clock.setFixedTime(new Date('2026-03-10T09:00:00Z'))
    await serve(page, api, network)
    await page.goto('/')
    await expect(page.getByRole('navigation')).toBeVisible()
    await use(page)
  },
})

export { expect }

/** The month-grid cell for a YYYY-MM-DD date. */
export const dayCell = (page: Page, isoDate: string) => page.locator(`[data-slot="calendar-cell-trigger"][data-value="${isoDate}"]`)

/** Opens a day and saves a shift with the form's defaults (preset "Обычный", 09:00–18:00, repeated weekly). */
export async function addDefaultShift(page: Page, isoDate: string) {
  await dayCell(page, isoDate).click()
  await page.getByRole('button', { name: 'Добавить смену' }).click()
  await page.getByRole('button', { name: 'Сохранить' }).click()
}

/** The open day/shift drawer. */
export const drawer = (page: Page) => page.getByRole('dialog')

/** Month title above the grid, e.g. "март 2026 г.". */
export const monthTitle = (page: Page) => page.locator('[data-slot="calendar-heading"]')
