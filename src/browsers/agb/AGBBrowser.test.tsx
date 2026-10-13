import { fireEvent, render, screen, within } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'

import Browser from '../base/Browser'
import { GeneResultsPage } from '../base/GeneResultsPage/GeneResultsPage'
import GeneResultsTable from '../base/GeneResultsPage/GeneResultsTable'
import getTableColumns from '../base/GeneResultsPage/geneResultTableColumns'
import { GeneRow } from '../base/GeneResultsPage/geneResultTableColumns'
import getVariantTableColumns, { VariantRow } from '../base/GenePage/variantTableColumns'
import VariantTable from '../base/GenePage/VariantTable'
import AutosizedRegionViewer from '../base/GenePage/AutosizedRegionViewer'
import { VariantsInGene } from '../base/GenePage/VariantsInGene'

import AGBBrowser from './AGBBrowser'

jest.mock('../base/Browser', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

jest.mock('./AGBWaterfallPlot', () => ({
  __esModule: true,
  default: () => null,
}))

const getBrowserConfiguration = () => {
  jest.mocked(Browser).mockClear()
  render(<AGBBrowser />)
  return jest.mocked(Browser).mock.calls[0][0]
}

const getGeneResultColumns = () => getBrowserConfiguration().geneResultColumns ?? []

const getGeneResultColumn = (key: string) => {
  const column = getGeneResultColumns().find((candidate) => candidate.key === key)
  if (!column) {
    throw new Error(`Missing AGB gene result column: ${key}`)
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
        browserTitle="AGB"
        analysisGroupOptions={['meta']}
        defaultAnalysisGroup="meta"
        defaultColumnGroups={configuration.defaultGeneResultColumnGroups}
        geneResultColumns={columns}
        geneResults={[gene]}
      />
    </MemoryRouter>
  )
}

describe('AGB all-genes table', () => {
  it('centers formatted Bayes Factor, FDR, and Flag cells without changing sorting or CSV values', () => {
    const columns = getTableColumns(
      getGeneResultColumns().filter((column) =>
        ['bayes_factor', 'false_discovery_rate', 'qc_flagged'].includes(column.key)
      )
    )
    const gene: GeneRow = {
      gene_id: 'ENSG000001',
      gene_symbol: 'GENE',
      symbol: 'GENE',
      reference_genome: 'GRCh38',
      canonical_transcript_id: 'ENST000001',
      start: 1,
      stop: 100,
      group_results: {},
      bayes_factor: 123,
      false_discovery_rate: 0.05,
      qc_flagged: true,
    }
    render(
      <MemoryRouter>
        <GeneResultsTable
          defaultSortKey="bayes_factor"
          geneResultColumns={columns}
          geneResults={[
            gene,
            {
              ...gene,
              gene_id: 'ENSG000002',
              gene_symbol: 'OTHER',
              bayes_factor: 0,
              false_discovery_rate: null,
              qc_flagged: false,
            },
          ]}
        />
      </MemoryRouter>
    )

    for (const heading of ['Bayes Factor', 'FDR', 'Flag']) {
      expect(screen.getByRole('columnheader', { name: heading })).toHaveStyle(
        'justify-content: center;'
      )
    }
    for (const value of ['123.00', '5.00e-2', '0.00']) {
      const number = screen.getByText(value)
      expect(number).toHaveStyle('width: auto; padding-right: 0; text-align: center;')
      expect(number.parentElement).toHaveStyle(
        'display: flex; justify-content: center; width: 100%; font-variant-numeric: tabular-nums;'
      )
    }
    expect(screen.getByRole('gridcell', { name: 'Flag' }).firstElementChild).toHaveStyle(
      'display: flex; justify-content: center; width: 100%;'
    )
    expect(screen.getByRole('gridcell', { name: 'Flag' }).firstElementChild).not.toHaveStyle(
      'font-variant-numeric: tabular-nums;'
    )
    expect(screen.getByText('-')).toHaveStyle('justify-content: center;')
    expect(screen.getByRole('gridcell', { name: 'GENE' }).firstElementChild).not.toHaveStyle(
      'justify-content: center;'
    )
    expect(
      columns
        .filter((column) => column.centerNumericValues || column.centerCellContent)
        .map((column) => column.renderForCSV(gene, column.key))
    ).toEqual([123, 0.05, true])

    expect(screen.getAllByRole('row')[1]).toHaveTextContent('0.00')
    fireEvent.click(screen.getByRole('button', { name: 'Bayes Factor' }))
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('123.00')
  })

  it('sorts every all-genes column in both directions, keeping missing values last', () => {
    const configuration = getGeneResultColumns()
    const columns = getTableColumns(configuration)
    const genes: GeneRow[] = [10, 2, 0, null].map((value, index) => ({
      ...Object.fromEntries(configuration.map((column) => [column.key, value])),
      gene_id: `ENSG${index}`,
      gene_symbol: ['ZETA', 'ALPHA', 'BETA', 'MISSING'][index],
      gene_name: ['Zebra', 'Apple', 'Berry', undefined][index],
      symbol: 'GENE',
      reference_genome: 'GRCh38',
      canonical_transcript_id: 'ENST1',
      start: 1,
      stop: 100,
      group_results: {},
      qc_flagged: [false, true, false, null][index],
      bayes_factor: ['Infinity', 2, 0, null][index],
      false_discovery_rate: [0.7, 0.05, 0, undefined][index],
    }))
    render(
      <MemoryRouter>
        <GeneResultsTable
          defaultSortKey="bayes_factor"
          defaultSortOrder="descending"
          geneResultColumns={columns}
          geneResults={genes}
        />
      </MemoryRouter>
    )
    const geneOrder = () =>
      screen
        .getAllByRole('row')
        .slice(1)
        .map((row) => row.querySelector('[aria-colindex="1"]')?.textContent)
    for (const [columnIndex, column] of columns.entries()) {
      const header = screen.getAllByRole('columnheader')[columnIndex]
      const button = header?.querySelector('button')
      if (!button) throw new Error(`Missing sortable header ${column.key}`)
      fireEvent.click(button)
      expect(header).toHaveAttribute('aria-sort', 'ascending')
      if (column.key === 'gene_id')
        expect(geneOrder()).toEqual(['ALPHA', 'BETA', 'MISSING', 'ZETA'])
      else if (column.key === 'gene_name')
        expect(geneOrder()).toEqual(['ALPHA', 'BETA', 'ZETA', 'MISSING'])
      else if (column.key === 'qc_flagged')
        expect(geneOrder()).toEqual(['ZETA', 'BETA', 'ALPHA', 'MISSING'])
      else expect(geneOrder()).toEqual(['BETA', 'ALPHA', 'ZETA', 'MISSING'])
      fireEvent.click(button)
      expect(header).toHaveAttribute('aria-sort', 'descending')
      if (column.key === 'gene_id')
        expect(geneOrder()).toEqual(['ZETA', 'MISSING', 'BETA', 'ALPHA'])
      else if (column.key === 'gene_name')
        expect(geneOrder()).toEqual(['ZETA', 'BETA', 'ALPHA', 'MISSING'])
      else if (column.key === 'qc_flagged')
        expect(geneOrder()).toEqual(['ALPHA', 'ZETA', 'BETA', 'MISSING'])
      else expect(geneOrder()).toEqual(['ZETA', 'ALPHA', 'BETA', 'MISSING'])
    }
  })

  it('sorts Flag without crashing when no genes are flagged', () => {
    const columns = getTableColumns([getGeneResultColumn('qc_flagged')])
    const genes: GeneRow[] = [false, false, null, undefined].map((qc_flagged, index) => ({
      gene_id: `ENSG${index}`,
      gene_symbol: `GENE${index}`,
      symbol: `GENE${index}`,
      reference_genome: 'GRCh38',
      canonical_transcript_id: 'ENST1',
      start: 1,
      stop: 100,
      gene_name: undefined,
      group_results: {},
      qc_flagged,
    }))
    render(
      <MemoryRouter>
        <GeneResultsTable
          defaultSortKey="gene_id"
          geneResultColumns={columns}
          geneResults={genes}
        />
      </MemoryRouter>
    )
    const flagHeader = screen.getByRole('button', { name: 'Flag' })
    fireEvent.click(flagHeader)
    fireEvent.click(flagHeader)
    expect(screen.getAllByRole('row')).toHaveLength(5)
    expect(screen.getByRole('columnheader', { name: 'Flag' })).toHaveAttribute(
      'aria-sort',
      'descending'
    )
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
    datasetId: 'AGB',
    variantResultColumns: configuration.variantResultColumns ?? [],
    filter: {
      includeCategories: { lof: true, missense: true, synonymous: true, other: true },
      searchText: '',
      custom: undefined,
    },
  })
  const column = columns.find((candidate) => candidate.key === key)
  if (!column) {
    throw new Error(`Missing AGB variant count column: ${key}`)
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

describe('AGB variant sorting', () => {
  it('sorts every single-gene variant column in both directions without crashing', () => {
    const configuration = getBrowserConfiguration()
    const countFields = [
      'de_novo_ac_proband',
      'de_novo_ac_sibling',
      'transmitted_ac_proband',
      'untransmitted_ac_proband',
      'ac_case',
      'ac_ctrl',
    ]
    const variants: VariantRow[] = [10, 2, 0, null].map((value, index) => ({
      variant_id: ['1-103-A-T', '1-102-A-T', '1-101-A-T', '1-104-A-T'][index],
      pos: [103, 102, 101, 104][index],
      hgvs: ['p.Z', 'p.A', 'p.B', ''][index],
      hgvsp: ['p.Z', 'p.A', 'p.B', ''][index],
      hgvsc: '',
      consequence: ['stop_gained', 'missense_variant', 'synonymous_variant', ''][index],
      consequenceCategory: ['PTV', 'Mis2', 'Mis1', 'synonymous'][index],
      group_results: {
        meta: {
          ...Object.fromEntries(countFields.map((field) => [field, value])),
          ac_case: value ?? 0,
          ac_ctrl: value ?? 0,
          an_case: 20,
          an_ctrl: 20,
          af_case: 0.1,
          af_ctrl: 0.1,
          af: 0.1,
        },
      },
      info: {
        variant_class: ['PTV', 'Mis2', 'Mis1', 'synonymous'][index],
        transcript_id: ['ENST_Z', 'ENST_A', 'ENST_B', null][index],
        mpc: value,
        alpha_missense: [0.9, 0.2, 0, null][index],
        gnomad_af: [0.09, 0.02, 0, undefined][index],
        is_other_splice: [true, false, false, null][index],
      },
    }))
    const resultColumns = configuration.variantResultColumns ?? []
    const columns = getVariantTableColumns({
      datasetId: 'AGB',
      variantResultColumns: resultColumns,
      variantCategoryOptions: configuration.variantCategoryOptions,
      filter: { includeCategories: {}, searchText: '', custom: undefined },
    })
    render(
      <MemoryRouter>
        <AutosizedRegionViewer regions={[{ start: 90, stop: 150, feature_type: 'exon' }]}>
          <VariantsInGene
            datasetId="AGB"
            gene={{ gene_id: 'ENSG1', reference_genome: 'GRCh38' }}
            variants={variants}
            variantAnalysisGroupOptions={['meta']}
            defaultVariantAnalysisGroup="meta"
            variantResultColumns={resultColumns}
            variantCategoryOptions={configuration.variantCategoryOptions}
            getVariantCategory={configuration.getVariantCategory}
            variantLollipopTrackGroups={configuration.variantLollipopTrackGroups}
          />
        </AutosizedRegionViewer>
      </MemoryRouter>
    )
    const grid = screen.getByRole('grid')
    const order = () =>
      within(grid)
        .getAllByRole('row')
        .slice(1)
        .map((row) => row.querySelector('[aria-colindex="1"]')?.textContent)
    const high = '1-103-A-T',
      low = '1-102-A-T',
      zero = '1-101-A-T',
      missing = '1-104-A-T'
    for (const [columnIndex, column] of columns.entries()) {
      const button = within(grid).getAllByRole('columnheader')[columnIndex]?.querySelector('button')
      if (!button) throw new Error(`Missing sortable variant header ${column.key}`)
      fireEvent.click(button)
      fireEvent.click(button)
      if (column.key === 'variant_id') expect(order()).toEqual([zero, low, high, missing])
      else if (column.key === 'info.variant_class')
        expect(order()).toEqual([high, low, zero, missing])
      else if (column.key === 'consequence') expect(order()).toEqual([low, high, zero, missing])
      else if (['hgvs', 'info.transcript_id', 'info.is_other_splice'].includes(column.key))
        expect({ column: column.key, rows: order() }).toEqual({
          column: column.key,
          rows: [low, zero, high, missing],
        })
      else if (['group_result.ac_case', 'group_result.ac_ctrl'].includes(column.key))
        expect(order()).toEqual([zero, missing, low, high])
      else expect(order()).toEqual([zero, low, high, missing])
      fireEvent.click(button)
      if (column.key === 'variant_id') expect(order()).toEqual([missing, high, low, zero])
      else if (column.key === 'info.variant_class')
        expect(order()).toEqual([missing, zero, low, high])
      else if (column.key === 'consequence') expect(order()).toEqual([zero, high, low, missing])
      else if (column.key === 'info.is_other_splice')
        expect(order()).toEqual([high, low, zero, missing])
      else if (['hgvs', 'info.transcript_id'].includes(column.key))
        expect(order()).toEqual([high, zero, low, missing])
      else expect(order()).toEqual([high, low, zero, missing])
    }
  })
})

describe('AGB variant count alignment', () => {
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
