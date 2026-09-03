// otherDatasets/DOWNLOAD_URLS are computed once, at DownloadsPage's module
// load time, from datasetConfig, so varying datasetId per test means
// reloading the whole module graph with jest.resetModules(). react-dom and
// @testing-library/react must be reloaded together with DownloadsPage in
// that same pass, or @testing-library/react ends up bound to a different
// react instance than DownloadsPage's hooks run against, which React
// reports as an "Invalid hook call".
//
// @testing-library/react normally self-registers an afterEach(cleanup)
// hook on import; done per-test here that would run inside a test body,
// which jest-circus forbids. RTL_SKIP_AUTO_CLEANUP disables that, and
// clearing document.body directly (the jsdom document persists across
// resetModules) does the equivalent teardown between tests instead.
process.env.RTL_SKIP_AUTO_CLEANUP = 'true'

const DATASET_IDS = ['ASC', 'BipEx', 'BipEx2', 'Epi25', 'GP2', 'IBD', 'SCHEMA']

afterEach(() => {
  document.body.innerHTML = ''
})

const setup = (datasetId: string) => {
  jest.resetModules()
  jest.doMock('../datasetConfig', () => ({
    __esModule: true,
    default: {
      datasetId,
      datasets: Object.fromEntries(DATASET_IDS.map((id) => [id, {}])),
    },
  }))

  const React = require('react')
  const { render, screen } = require('@testing-library/react')
  const downloadsPageModule = require('./DownloadsPage')

  return { React, render, screen, ...downloadsPageModule }
}

describe('otherDatasets', () => {
  it('excludes the current dataset and is sorted', () => {
    const { otherDatasets } = setup('SCHEMA')

    expect(otherDatasets).not.toContain('SCHEMA')
    expect(otherDatasets).toEqual([...otherDatasets].sort())
  })
})

describe('downloadUrl', () => {
  it('builds baseUrl + filePrefix + file for a dataset with a DOWNLOAD_URLS entry', () => {
    const { downloadUrl, DOWNLOAD_URLS } = setup('ASC')
    const { baseUrl, filePrefix } = DOWNLOAD_URLS.ASC

    expect(downloadUrl('ASC', 'gene_results.tsv.bgz')).toBe(
      `${baseUrl}/${filePrefix}_gene_results.tsv.bgz`
    )
  })
})

describe('Other Studies list', () => {
  it('includes only datasets present in DOWNLOAD_URLS, nothing more and nothing less', () => {
    const { React, render, screen, default: DownloadsPage, DOWNLOAD_URLS, otherDatasets } = setup(
      'ASC'
    )
    render(React.createElement(DownloadsPage))

    // Deriving the expectation from DOWNLOAD_URLS itself, rather than from a
    // second hand-maintained list, is what this test protects: it fails if
    // DownloadsPage falls back to (or reintroduces) a separate "datasets
    // without downloads" list that can drift out of sync with DOWNLOAD_URLS.
    const expectedWithDownloads = otherDatasets.filter((id: string) => id in DOWNLOAD_URLS)
    const expectedWithoutDownloads = otherDatasets.filter((id: string) => !(id in DOWNLOAD_URLS))

    expect(expectedWithDownloads.length).toBeGreaterThan(0)
    expect(expectedWithoutDownloads.length).toBeGreaterThan(0)

    const renderedOtherStudyHeadings = screen
      .getAllByRole('heading', { level: 3 })
      .map((heading: HTMLElement) => heading.textContent)

    expect(renderedOtherStudyHeadings).toEqual(expectedWithDownloads)
    expectedWithoutDownloads.forEach((id: string) => {
      expect(screen.queryByRole('heading', { level: 3, name: id })).not.toBeInTheDocument()
    })
  })
})

describe('legacy SCHEMA_v1 pairing', () => {
  it('renders both the SCHEMA and SCHEMA 1.0 link lists for the main SCHEMA dataset', () => {
    const { React, render, screen, default: DownloadsPage } = setup('SCHEMA')
    render(React.createElement(DownloadsPage))

    expect(screen.getByText('Previous SCHEMA release data downloads')).toBeInTheDocument()
    expect(screen.getByText(/SCHEMA gene results/)).toBeInTheDocument()
    expect(screen.getByText(/SCHEMA 1\.0 gene results/)).toBeInTheDocument()
  })

  it('does not render the legacy pairing when SCHEMA is not the main dataset', () => {
    const { React, render, screen, default: DownloadsPage } = setup('ASC')
    render(React.createElement(DownloadsPage))

    expect(screen.queryByText('Previous SCHEMA release data downloads')).not.toBeInTheDocument()
  })
})
