import { test, expect } from '@playwright/test'

interface GeneFixture {
  id: string
  symbol: string
}

const PCSK9: GeneFixture = { id: 'ENSG00000169174', symbol: 'PCSK9' }
const NOD2: GeneFixture = { id: 'ENSG00000167207', symbol: 'NOD2' }

const DEFAULT_GENE = PCSK9
const DATASET_GENE_OVERRIDES: Partial<Record<string, GeneFixture>> = {
  IBD: NOD2,
}

const DEMO_PASSWORD = process.env.DEMO_PASSWORD?.replace(/^"|"$/g, '') || 'password'

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.project.name === 'BipEx2') {
    await page.request.post('/api/auth', { data: { password: DEMO_PASSWORD } })
  }
})

test('renders the gene page and opens the variant modal', async ({ page }, testInfo) => {
  const gene = DATASET_GENE_OVERRIDES[testInfo.project.name] ?? DEFAULT_GENE

  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.goto(`/gene/${gene.id}`)
  await expect(page.locator('h1')).toContainText(gene.symbol)

  const variantButton = page.getByRole('button', { name: /^\S+-\d+-\S+-\S+$/ }).first()
  const variantId = await variantButton.textContent()
  await variantButton.click()

  const modal = page.locator('#variant-details-modal')
  await expect(modal).toBeVisible()
  await expect(modal).toContainText(variantId!)

  expect(pageErrors, `uncaught page error(s): ${pageErrors.join('; ')}`).toEqual([])
})
