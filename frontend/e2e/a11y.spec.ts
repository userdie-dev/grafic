import AxeBuilder from '@axe-core/playwright'
import { dayCell, expect, test } from './fixtures'

// only serious/critical violations fail the build; minor ones are reported but tolerated
const scan = async (page: Parameters<typeof AxeBuilder>[0]['page']) => {
  // color-contrast is off: the calendar dims weekend headings and out-of-month days on purpose (known design trade-off)
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).disableRules(['color-contrast']).analyze()
  return violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)
}

test('calendar page has no serious accessibility violations', async ({ app }) => {
  await expect(app.locator('[data-slot="calendar-heading"]')).toBeVisible()
  expect(await scan(app)).toEqual([])
})

test('share page has no serious accessibility violations', async ({ app }) => {
  await app.getByRole('link', { name: 'Поделиться' }).click()
  await expect(app.getByText('Поделиться графиком')).toBeVisible()
  expect(await scan(app)).toEqual([])
})

test('settings page has no serious accessibility violations', async ({ app }) => {
  await app.getByRole('link', { name: 'Настройки' }).click()
  await expect(app).toHaveURL(/settings/)
  expect(await scan(app)).toEqual([])
})

test('day drawer has no serious accessibility violations', async ({ app }) => {
  await dayCell(app, '2026-03-10').click()
  await expect(app.getByRole('dialog')).toBeVisible()
  expect(await scan(app)).toEqual([])
})
