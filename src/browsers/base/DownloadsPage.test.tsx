import { screen } from '@testing-library/react'

import { DatasetId } from './Browser'
import { buildWindowDatasetConfig } from '../testUtils/buildWindowDatasetConfig'

// manually re-require all modules to have fresh window object per test
afterEach(() => {
  document.body.innerHTML = ''
})

const renderDownloadsPageAsDataset = (datasetId: DatasetId): void => {
  window.datasetConfig = buildWindowDatasetConfig(datasetId)

  // manually re-require all imports to force re-load of window for a new test
  jest.resetModules()

  // eslint-disable-next-line global-require
  const FreshReact = require('react')
  // eslint-disable-next-line global-require
  const FreshReactDOM = require('react-dom')
  // eslint-disable-next-line global-require
  const { act } = require('react-dom/test-utils')
  // eslint-disable-next-line global-require
  const DownloadsPage = require('./DownloadsPage').default

  const container = document.createElement('div')
  document.body.appendChild(container)
  act(() => {
    FreshReactDOM.render(FreshReact.createElement(DownloadsPage), container)
  })
}

const SCHEMA_LEGACY_HEADING = 'Previous SCHEMA release data downloads'

// Excludes only the one known non-dataset heading, rather than allowing only
// known dataset ids through, so an unexpected heading (e.g. a regression that
// renders ClinVarGRCh38) shows up here instead of being silently dropped.
const namesOfRenderedOtherStudies = (): string[] =>
  screen
    .getAllByRole('heading', { level: 3 })
    .map((heading) => heading.textContent)
    .filter((text): text is string => text !== null && text !== SCHEMA_LEGACY_HEADING)

describe('DownloadsPage', () => {
  it.each([
    ['AGB gene results (TSV)', 'gene_results.tsv.bgz'],
    ['AGB variant results (TSV)', 'variant_results.tsv.bgz'],
    ['AGB variant results (VCF)', 'variant_results.vcf.bgz'],
  ])('links %s to the renamed pipeline output', (label, filename) => {
    renderDownloadsPageAsDataset('AGB')

    expect(screen.getByRole('link', { name: label })).toHaveAttribute(
      'href',
      `https://storage.googleapis.com/exome-results-browsers-public/downloads/2026-10-12/AGB/AGB_${filename}`
    )
  })

  it('preserves downloads for the original ASC dataset alongside AGB', () => {
    renderDownloadsPageAsDataset('AGB')

    expect(screen.getByRole('link', { name: 'ASC gene results (TSV)' })).toHaveAttribute(
      'href',
      'https://atgu-exome-browser-data.s3.amazonaws.com/ASC/ASC_gene_results.tsv.bgz'
    )
  })

  it('given SCHEMA is the current dataset, lists ASC, BipEx, and Epi25 as other studies', () => {
    const CURRENT_DATASET: DatasetId = 'SCHEMA'

    renderDownloadsPageAsDataset(CURRENT_DATASET)

    expect(namesOfRenderedOtherStudies()).toEqual(['ASC', 'BipEx', 'Epi25'])
  })

  it('given Epi25 is the current dataset, lists ASC, BipEx, and SCHEMA as other studies', () => {
    const CURRENT_DATASET: DatasetId = 'Epi25'

    renderDownloadsPageAsDataset(CURRENT_DATASET)

    expect(namesOfRenderedOtherStudies()).toEqual(['ASC', 'BipEx', 'SCHEMA'])
  })

  it('given SCHEMA is the current dataset, also renders the legacy SCHEMA 1.0 downloads', () => {
    const CURRENT_DATASET: DatasetId = 'SCHEMA'

    renderDownloadsPageAsDataset(CURRENT_DATASET)

    expect(screen.getByText('SCHEMA 1.0 gene results (TSV)')).toBeInTheDocument()
  })

  it('never renders an IBD download section, even though it is always on window.datasetConfig', () => {
    const CURRENT_DATASET: DatasetId = 'SCHEMA'

    renderDownloadsPageAsDataset(CURRENT_DATASET)

    expect(screen.queryByText(/IBD/)).not.toBeInTheDocument()
  })

  it('never renders a GP2 download section, even though it is always on window.datasetConfig', () => {
    const CURRENT_DATASET: DatasetId = 'SCHEMA'

    renderDownloadsPageAsDataset(CURRENT_DATASET)

    expect(screen.queryByText(/GP2/)).not.toBeInTheDocument()
  })

  it('never renders a ClinVarGRCh38 download section, even though it is always on window.datasetConfig', () => {
    const CURRENT_DATASET: DatasetId = 'SCHEMA'

    renderDownloadsPageAsDataset(CURRENT_DATASET)

    expect(screen.queryByText(/ClinVarGRCh38/)).not.toBeInTheDocument()
  })
})
