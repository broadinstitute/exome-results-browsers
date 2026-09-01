import { test, expect } from '@playwright/test'

const DEMO_PASSWORD = process.env.DEMO_PASSWORD?.replace(/^"|"$/g, '') || 'password'

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.project.name === 'BipEx2') {
    await page.request.post('/api/auth', { data: { password: DEMO_PASSWORD } })
  }
})

test('renders the gene results table', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'GP2', 'GP2 has no gene results page')

  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.goto('/results')
  await expect(page.locator('h1')).toBeVisible()

  await expect(page.getByRole('gridcell', { name: 'PCSK9' }).first()).toBeVisible()

  expect(pageErrors, `uncaught page error(s): ${pageErrors.join('; ')}`).toEqual([])
})
