import { screen } from '@testing-library/react'

import { DatasetId } from './Browser'

// Production's window.datasetConfig.datasets always includes ClinVarGRCh38
// (GP2's variant pages depend on it), regardless of which dataset is current.
// It's not a DatasetId and never has downloadable files of its own.
const PRODUCTION_WINDOW_DATASETS: (DatasetId | 'ClinVarGRCh38')[] = [
  'ASC',
  'BipEx',
  'Epi25',
  'GP2',
  'IBD',
  'SCHEMA',
  'ClinVarGRCh38',
]

const buildDatasetFields = () => ({
  reference_genome: 'GRCh37' as const,
  gene_result_analysis_groups: [],
  gene_group_result_field_names: [],
  gene_group_result_field_types: [],
  variant_result_analysis_groups: [],
  variant_group_result_field_names: [],
  variant_group_result_field_types: [],
  variant_info_field_names: [],
  variant_info_field_types: [],
})

const buildAllDatasets = (): Window['datasetConfig']['datasets'] =>
  Object.fromEntries(
    PRODUCTION_WINDOW_DATASETS.map((id) => [id, buildDatasetFields()])
  ) as unknown as Window['datasetConfig']['datasets']

// manually re-require all modules to have fresh window object per test
afterEach(() => {
  document.body.innerHTML = ''
})

const renderDownloadsPageAsDataset = (datasetId: DatasetId): void => {
  window.datasetConfig = {
    datasetId,
    reference_genome: 'GRCh37',
    datasets: buildAllDatasets(),
    gene_result_analysis_groups: [],
    gene_group_result_field_names: [],
    gene_group_result_field_types: [],
    variant_result_analysis_groups: [],
    variant_fields: [],
    variant_group_result_field_names: [],
    variant_group_result_field_types: [],
    variant_info_field_names: [],
    variant_info_field_types: [],
  }

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
