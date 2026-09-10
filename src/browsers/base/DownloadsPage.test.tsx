// otherDatasets/DOWNLOAD_URLS are computed once, at DownloadsPage's module
// load time, from datasetConfig, so varying datasetId/datasets per test
// means reloading the whole module graph with jest.resetModules(). react-dom
// and @testing-library/react must be reloaded together with DownloadsPage in
// that same pass, or @testing-library/react ends up bound to a different
// react instance than DownloadsPage's hooks run against, which React
// reports as an "Invalid hook call".
//
// @testing-library/react normally self-registers an afterEach(cleanup) hook
// on import; done per-test here that would run inside a test body, which
// jest-circus forbids. RTL_SKIP_AUTO_CLEANUP disables that, and clearing
// document.body directly (the jsdom document persists across
// jest.resetModules()) does the equivalent teardown between tests instead.
process.env.RTL_SKIP_AUTO_CLEANUP = 'true'

afterEach(() => {
  document.body.innerHTML = ''
})

type DatasetConfigFixture = {
  datasetId: string
  datasetIds: string[]
}

// Mirrors the window.datasetConfig a deployed browser actually serves:
// datasets is every dataset known to the server's metadata (shared across
// all browser deployments), not just the ones for the current browser.
const renderDownloadsPage = ({ datasetId, datasetIds }: DatasetConfigFixture) => {
  jest.resetModules()
  jest.doMock('../datasetConfig', () => ({
    __esModule: true,
    default: {
      datasetId,
      datasets: Object.fromEntries(datasetIds.map((id) => [id, {}])),
    },
  }))

  const React = require('react')
  const { render } = require('@testing-library/react')
  const { default: DownloadsPage } = require('./DownloadsPage')

  return render(React.createElement(DownloadsPage))
}

describe('DownloadsPage, SCHEMA browser in production', () => {
  // As deployed: window.datasetConfig.datasets covers every dataset the
  // server knows about (ASC, BipEx, Epi25, GP2, IBD, SCHEMA) -- BipEx2 is
  // not yet part of that metadata. GP2 and IBD are known datasets but have
  // no download files, so DownloadsPage excludes them by name.
  const setup = () =>
    renderDownloadsPage({
      datasetId: 'SCHEMA',
      datasetIds: ['ASC', 'BipEx', 'Epi25', 'GP2', 'IBD', 'SCHEMA'],
    })

  it('renders the main SCHEMA dataset downloads', () => {
    const { getByRole } = setup()

    expect(getByRole('link', { name: 'SCHEMA gene results (TSV)' })).toHaveAttribute(
      'href',
      'https://storage.googleapis.com/exome-results-browsers-public/downloads/2026-08-07/SCHEMA/SCHEMA_gene_results.tsv.bgz'
    )
    expect(getByRole('link', { name: 'SCHEMA variant results (TSV)' })).toHaveAttribute(
      'href',
      'https://storage.googleapis.com/exome-results-browsers-public/downloads/2026-08-07/SCHEMA/SCHEMA_variant_results.tsv.bgz'
    )
    expect(getByRole('link', { name: 'SCHEMA variant results (VCF)' })).toHaveAttribute(
      'href',
      'https://storage.googleapis.com/exome-results-browsers-public/downloads/2026-08-07/SCHEMA/SCHEMA_variant_results.vcf.bgz'
    )
  })

  it('renders the legacy SCHEMA 1.0 downloads alongside the main dataset', () => {
    const { getByText, getByRole } = setup()

    expect(getByText('Previous SCHEMA release data downloads')).toBeInTheDocument()
    expect(
      getByText(
        'The prior SCHEMA (SCHEMA 1.0) analysis and dataset was released September 10th, 2020.'
      )
    ).toBeInTheDocument()
    expect(getByRole('link', { name: 'SCHEMA 1.0 gene results (TSV)' })).toHaveAttribute(
      'href',
      'https://atgu-exome-browser-data.s3.amazonaws.com/SCHEMA/SCHEMA_gene_results.tsv.bgz'
    )
    expect(getByRole('link', { name: 'SCHEMA 1.0 variant results (TSV)' })).toHaveAttribute(
      'href',
      'https://atgu-exome-browser-data.s3.amazonaws.com/SCHEMA/SCHEMA_variant_results.tsv.bgz'
    )
    expect(getByRole('link', { name: 'SCHEMA 1.0 variant results (VCF)' })).toHaveAttribute(
      'href',
      'https://atgu-exome-browser-data.s3.amazonaws.com/SCHEMA/SCHEMA_variant_results.vcf.bgz'
    )
  })

  it('lists ASC, BipEx and Epi25 under Other Studies, excluding GP2 and IBD', () => {
    const { getByRole, getAllByRole } = setup()

    // The main SCHEMA dataset's legacy SCHEMA 1.0 section also has an h3
    // ("Previous SCHEMA release data downloads"), so scope to h3s that come
    // after the "Other Studies" h2 rather than querying all h3s.
    const otherStudiesHeading = getByRole('heading', { level: 2, name: 'Other Studies' })
    const otherStudyHeadings = getAllByRole('heading', { level: 3 })
      .filter(
        (heading) =>
          otherStudiesHeading.compareDocumentPosition(heading) &
          Node.DOCUMENT_POSITION_FOLLOWING
      )
      .map((heading) => heading.textContent)

    expect(otherStudyHeadings).toEqual(['ASC', 'BipEx', 'Epi25'])
  })

  it('links ASC downloads to its configured DOWNLOAD_URLS entry', () => {
    const { getByRole } = setup()

    expect(getByRole('link', { name: 'ASC gene results (TSV)' })).toHaveAttribute(
      'href',
      'https://atgu-exome-browser-data.s3.amazonaws.com/ASC/ASC_gene_results.tsv.bgz'
    )
    expect(getByRole('link', { name: 'ASC variant results (TSV)' })).toHaveAttribute(
      'href',
      'https://atgu-exome-browser-data.s3.amazonaws.com/ASC/ASC_variant_results.tsv.bgz'
    )
    expect(getByRole('link', { name: 'ASC variant results (VCF)' })).toHaveAttribute(
      'href',
      'https://atgu-exome-browser-data.s3.amazonaws.com/ASC/ASC_variant_results.vcf.bgz'
    )
  })

  it('links Epi25 downloads to its configured DOWNLOAD_URLS entry', () => {
    const { getByRole } = setup()

    expect(getByRole('link', { name: 'Epi25 gene results (TSV)' })).toHaveAttribute(
      'href',
      'https://storage.googleapis.com/exome-results-browsers-public/downloads/2022-12-01/Epi25/Epi25_gene_results.tsv.bgz'
    )
    expect(getByRole('link', { name: 'Epi25 variant results (TSV)' })).toHaveAttribute(
      'href',
      'https://storage.googleapis.com/exome-results-browsers-public/downloads/2022-12-01/Epi25/Epi25_variant_results.tsv.bgz'
    )
    expect(getByRole('link', { name: 'Epi25 variant results (VCF)' })).toHaveAttribute(
      'href',
      'https://storage.googleapis.com/exome-results-browsers-public/downloads/2022-12-01/Epi25/Epi25_variant_results.vcf.bgz'
    )
  })

  it('links BipEx downloads to the generic fallback URL, since BipEx has no DOWNLOAD_URLS entry', () => {
    const { getByRole } = setup()

    expect(getByRole('link', { name: 'BipEx gene results (TSV)' })).toHaveAttribute(
      'href',
      'https://atgu-exome-browser-data.s3.amazonaws.com/BipEx/BipEx_gene_results.tsv.bgz'
    )
    expect(getByRole('link', { name: 'BipEx variant results (TSV)' })).toHaveAttribute(
      'href',
      'https://atgu-exome-browser-data.s3.amazonaws.com/BipEx/BipEx_variant_results.tsv.bgz'
    )
    expect(getByRole('link', { name: 'BipEx variant results (VCF)' })).toHaveAttribute(
      'href',
      'https://atgu-exome-browser-data.s3.amazonaws.com/BipEx/BipEx_variant_results.vcf.bgz'
    )
  })
})
