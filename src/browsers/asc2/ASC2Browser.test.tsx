import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'

import Browser from '../base/Browser'
import { GeneResultsPage } from '../base/GeneResultsPage/GeneResultsPage'
import { GeneRow } from '../base/GeneResultsPage/geneResultTableColumns'
import getVariantTableColumns, { VariantRow } from '../base/GenePage/variantTableColumns'
import VariantTable from '../base/GenePage/VariantTable'

import ASC2Browser from './ASC2Browser'

jest.mock('../base/Browser', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

jest.mock('./ASC2WaterfallPlot', () => ({
  __esModule: true,
  default: () => null,
}))

const getBrowserConfiguration = () => {
  jest.mocked(Browser).mockClear()
  render(<ASC2Browser />)
  return jest.mocked(Browser).mock.calls[0][0]
}

const getGeneResultColumns = () => getBrowserConfiguration().geneResultColumns ?? []

const getGeneResultColumn = (key: string) => {
  const column = getGeneResultColumns().find((candidate) => candidate.key === key)
  if (!column) {
    throw new Error(`Missing ASC2 gene result column: ${key}`)
  }
  return column
}

const renderGeneResultsPage = () => {
  const configuration = getBrowserConfiguration()
  const columns = configuration.geneResultColumns ?? []
  const gene: GeneRow = {
    gene_id: 'ENSG000001',
    gene_symbol: 'GENE',
    symbol: 'GENE',
    reference_genome: 'GRCh38',
    canonical_transcript_id: 'ENST000001',
    start: 1,
    stop: 100,
    group_results: {
      meta: Object.fromEntries(columns.map((column) => [column.key, 1])),
    },
  }

  return render(
    <MemoryRouter>
      <GeneResultsPage
        browserTitle="ASC2"
        analysisGroupOptions={['meta']}
        defaultAnalysisGroup="meta"
        defaultColumnGroups={configuration.defaultGeneResultColumnGroups}
        geneResultColumns={columns}
        geneResults={[gene]}
      />
    </MemoryRouter>
  )
}

describe('ASC2 all-genes table', () => {
  it.each<[string, number | boolean, string]>([
    ['bayes_factor', 123, '123.00'],
    ['false_discovery_rate', 0.05, '5.00e-2'],
    ['qc_flagged', true, 'Flag'],
  ])('centers only the heading of %s', (key, value, text) => {
    const column = getGeneResultColumn(key)
    const { container, getByText } = render(<>{column.render?.(value)}</>)

    expect(column.centerHeading).toBe(true)
    expect(getByText(text)).toBeInTheDocument()
    expect(container.firstChild).not.toHaveStyle('justify-content: center;')
    if (key !== 'qc_flagged') {
      expect(getByText(text)).toHaveStyle('padding-right: 15px; text-align: right;')
    }
  })

  it.each([false, null, undefined])('leaves the flag empty for %s', (value) => {
    const column = getGeneResultColumn('qc_flagged')
    const { container } = render(<>{column.render?.(value)}</>)

    expect(container.textContent).toBe('')
  })

  it.each(['deNovo', 'transmittedUntransmitted', 'caseControl'])(
    'keeps only the analysis variant classes in the %s group',
    (groupKey) => {
      const columns = getGeneResultColumns().filter((column) => column.group?.key === groupKey)

      expect(columns).toHaveLength(10)
      expect(columns.map((column) => column.key)).not.toEqual(
        expect.arrayContaining([expect.stringMatching(/_(mis0|syn)_/)])
      )
      for (const suffix of ['ptv', 'mis2', 'mis1', 'del', 'dup']) {
        expect(columns.filter((column) => column.key.includes(`${suffix}_`))).toHaveLength(2)
      }
    }
  )

  it('shows four visibility controls with both De novo roles enabled by default', () => {
    renderGeneResultsPage()

    expect(screen.getAllByRole('checkbox').map((checkbox) => checkbox.id)).toEqual([
      'gene-result-column-group-deNovoProband',
      'gene-result-column-group-deNovoSibling',
      'gene-result-column-group-transmittedUntransmitted',
      'gene-result-column-group-caseControl',
    ])
    expect(screen.getByRole('checkbox', { name: 'De\u00a0novo (proband)' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'De\u00a0novo (sibling)' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Inherited (proband)' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Case-Control' })).not.toBeChecked()
  })

  it.each([
    [true, true],
    [true, false],
    [false, true],
    [false, false],
  ])('shows the shared header for proband=%s and sibling=%s', (hasProband, hasSibling) => {
    renderGeneResultsPage()

    if (!hasProband) {
      fireEvent.click(screen.getByRole('checkbox', { name: 'De\u00a0novo (proband)' }))
    }
    if (!hasSibling) {
      fireEvent.click(screen.getByRole('checkbox', { name: 'De\u00a0novo (sibling)' }))
    }

    for (const category of ['PTV', 'Mis2', 'Mis1', 'DEL', 'DUP']) {
      expect(screen.queryAllByText(`${category} Proband`)).toHaveLength(hasProband ? 1 : 0)
      expect(screen.queryAllByText(`${category} Sibling`)).toHaveLength(hasSibling ? 1 : 0)
    }
    expect(screen.queryAllByText('De novo')).toHaveLength(hasProband || hasSibling ? 1 : 0)
    expect(screen.getByText('Bayes Factor')).toBeInTheDocument()
    expect(screen.getByText('FDR')).toBeInTheDocument()
    expect(screen.queryByText('Transmitted PTV')).not.toBeInTheDocument()
    expect(screen.queryByText('PTV Case')).not.toBeInTheDocument()
  })

  it('keeps the inherited and case-control toggles independent of De novo roles', () => {
    renderGeneResultsPage()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Inherited (proband)' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Case-Control' }))
    expect(screen.getByText('Transmitted PTV')).toBeInTheDocument()
    expect(screen.getByText('PTV Case')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('checkbox', { name: 'De\u00a0novo (proband)' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'De\u00a0novo (sibling)' }))
    expect(screen.getByText('Transmitted PTV')).toBeInTheDocument()
    expect(screen.getByText('PTV Case')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Inherited (proband)' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Case-Control' }))
    expect(screen.queryByText('Transmitted PTV')).not.toBeInTheDocument()
    expect(screen.queryByText('PTV Case')).not.toBeInTheDocument()
  })

  it('preserves the three variant groups and the paired De novo lollipop tracks', () => {
    const configuration = getBrowserConfiguration()
    const variantColumns = configuration.variantResultColumns ?? []
    const groups = new Set(
      variantColumns.flatMap((column) => (column.group ? [column.group.key] : []))
    )

    expect([...groups]).toEqual(['deNovo', 'transmittedUntransmitted', 'caseControl'])
    expect(
      variantColumns.filter((column) => column.group?.key === 'deNovo').map((column) => column.key)
    ).toEqual(['group_result.de_novo_ac_proband', 'group_result.de_novo_ac_sibling'])
    expect(configuration.variantLollipopTrackGroups?.[0].key).toBe('deNovo')
    expect(configuration.variantLollipopTrackGroups?.[0].tracks.map((track) => track.key)).toEqual([
      'de_novo_proband',
      'de_novo_sibling',
    ])
  })

  it('ends every configured gene-table tooltip with a period', () => {
    const tooltips = getGeneResultColumns().flatMap((column) =>
      column.tooltip ? [column.tooltip] : []
    )

    expect(tooltips).toHaveLength(32)
    for (const tooltip of tooltips) {
      expect(tooltip).toMatch(/\.$/)
    }
  })
})

const getVariantCountColumn = (key: string) => {
  const configuration = getBrowserConfiguration()
  const columns = getVariantTableColumns({
    datasetId: 'ASC2',
    variantResultColumns: configuration.variantResultColumns ?? [],
    filter: {
      includeCategories: { lof: true, missense: true, synonymous: true, other: true },
      searchText: '',
      custom: undefined,
    },
  })
  const column = columns.find((candidate) => candidate.key === key)
  if (!column) {
    throw new Error(`Missing ASC2 variant count column: ${key}`)
  }
  return column
}

const countVariant: VariantRow = {
  variant_id: '1-100-A-T',
  pos: 100,
  consequence: 'missense',
  consequenceCategory: 'missense',
  hgvsp: 'p.Lys34Asn',
  hgvsc: 'c.100A>T',
  group_results: {},
  info: {},
}

describe('ASC2 variant count alignment', () => {
  it.each([
    ['de_novo_ac_proband', 'Proband'],
    ['de_novo_ac_sibling', 'Sibling'],
    ['transmitted_ac_proband', 'Transmitted'],
    ['untransmitted_ac_proband', 'Untransmitted'],
    ['ac_case', 'Case'],
    ['ac_ctrl', 'Control'],
  ])('centers the lower header and enables a centered numeric block for %s', (field, heading) => {
    const column = getVariantCountColumn(`group_result.${field}`)
    const row = { ...countVariant, group_result: { [field]: 123 } }

    render(
      <>
        {column.heading}
        {column.render(row, column.key, {})}
      </>
    )

    expect(screen.getByText(heading)).toHaveStyle('text-align: center;')
    expect(column.centerNumericValues).toBe(true)
    expect(screen.getByText('123')).toBeInTheDocument()
    expect(column.csvHeading).toBe(heading)
    expect(column.renderForCSV(row, column.key)).toBe(123)
  })

  it('renders and centers real MPC and AlphaMissense cells, including zero and missing scores', () => {
    const columns = ['info.mpc', 'info.alpha_missense'].map(getVariantCountColumn)
    const variants = [
      { ...countVariant, info: { mpc: 0.123, alpha_missense: 0.456 } },
      { ...countVariant, variant_id: '1-101-A-T', info: { mpc: 0, alpha_missense: 0 } },
      { ...countVariant, variant_id: '1-102-A-T', info: { mpc: null, alpha_missense: undefined } },
    ]
    render(
      <VariantTable
        columns={columns}
        variants={variants}
        sortKey="info.mpc"
        sortOrder="ascending"
        onClickVariant={jest.fn()}
        onHoverVariant={jest.fn()}
        onRequestSort={jest.fn()}
        onVisibleRowsChange={jest.fn()}
      />
    )

    for (const heading of ['MPC', 'AlphaMissense']) {
      expect(screen.getByText(heading)).toHaveStyle('text-align: center;')
    }
    for (const value of ['1.230e-1', '4.560e-1', '0']) {
      for (const cell of screen.getAllByText(value)) {
        expect(cell).toHaveStyle('width: auto; padding-right: 0; text-align: center;')
        expect(cell.parentElement).toHaveStyle(
          'display: flex; justify-content: center; width: 100%;'
        )
      }
    }
    expect(screen.getAllByText('-')).toHaveLength(2)
    expect(columns[0].renderForCSV(variants[0], columns[0].key)).toBe(0.123)
    expect(columns[1].renderForCSV(variants[0], columns[1].key)).toBe(0.456)
  })

  it('centers the Other splice header and Yes/No content', () => {
    const column = getVariantCountColumn('info.is_other_splice')
    render(<>{column.heading}</>)
    expect(screen.getByText('Other splice')).toHaveStyle('text-align: center;')
    expect(column.centerCellContent).toBe(true)
    expect(column.centerNumericValues).not.toBe(true)
    expect(
      column.render({ ...countVariant, info: { is_other_splice: true } }, column.key, {})
    ).toBe('yes')
    expect(
      column.renderForCSV({ ...countVariant, info: { is_other_splice: true } }, column.key)
    ).toBe(true)
  })

  it('keeps the upper De novo group separate from the sortable lower header', () => {
    const column = getVariantCountColumn('group_result.de_novo_ac_proband')
    render(<>{column.heading}</>)

    expect(column.group?.variantTableLabel).toMatch(/^De\snovo AC$/)
    expect(screen.queryByText('De novo AC')).not.toBeInTheDocument()
  })

  it.each([
    [0, '0'],
    [99999, '100000'],
    [null, ''],
    [undefined, ''],
  ])('preserves count formatting and CSV values for %s', (value, expectedText) => {
    const column = getVariantCountColumn('group_result.ac_case')
    const row = { ...countVariant, group_result: { ac_case: value } }
    const { container } = render(<>{column.render(row, column.key, {})}</>)

    expect(container.textContent).toBe(expectedText)
    expect(column.renderForCSV(row, column.key)).toBe(value)
  })
})
