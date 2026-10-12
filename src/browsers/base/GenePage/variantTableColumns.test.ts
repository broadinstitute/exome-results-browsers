import React from 'react'
import { render, screen } from '@testing-library/react'

import { VariantColumnConfig } from '../Browser'
import { FilterState } from './VariantFilterControls'
import getVariantTableColumns, { VariantRow } from './variantTableColumns'

const DEFAULT_FILTER: FilterState = {
  includeCategories: { lof: true, missense: true, synonymous: true, other: true },
  searchText: '',
  custom: undefined,
}

const buildTableColumn = (variantResultColumns: VariantColumnConfig[]) => {
  window.datasetConfig = {
    datasetId: 'SCHEMA',
    reference_genome: 'GRCh37',
    datasets: {} as Window['datasetConfig']['datasets'],
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

  const [column] = getVariantTableColumns({
    datasetId: 'SCHEMA',
    variantResultColumns,
    filter: DEFAULT_FILTER,
  }).filter((c) => variantResultColumns.some((r) => r.key === c.key))

  return column
}

describe('getVariantTableColumns', () => {
  it('defaults to numeric comparison and the column key, matching the pre-existing numeric columns', () => {
    const column = buildTableColumn([{ key: 'group_result.ac_case', heading: 'AC' }])

    expect(column.sortKey).toBe('group_result.ac_case')
    expect(column.sortFunction(1, 2)).toBeLessThan(0)
    expect(column.isSortable).toBe(true)
  })

  it('uses a column-supplied sortFunction instead of the numeric default', () => {
    const rankOf: Record<string, number> = { low: 0, high: 1 }
    const column = buildTableColumn([
      {
        key: 'info.severity',
        heading: 'Severity',
        sortFunction: (a: string, b: string) => rankOf[a] - rankOf[b],
      },
    ])

    // The numeric default (a - b) would produce NaN for these strings and
    // leave the table effectively unsorted; the custom sortFunction must run.
    expect(column.sortFunction('low', 'high')).toBeLessThan(0)
    expect(column.sortFunction('high', 'low')).toBeGreaterThan(0)
  })

  it('uses a column-supplied sortKey instead of the column key', () => {
    const column = buildTableColumn([
      { key: 'info.severity_label', heading: 'Severity', sortKey: 'info.severity_rank' },
    ])

    expect(column.sortKey).toBe('info.severity_rank')
  })

  it('honors isSortable: false', () => {
    const column = buildTableColumn([
      { key: 'info.severity', heading: 'Severity', isSortable: false },
    ])

    expect(column.isSortable).toBe(false)
  })
})

describe('HGVS description columns', () => {
  const variant: VariantRow = {
    variant_id: '1-100-A-T',
    pos: 100,
    consequence: 'missense_variant',
    consequenceCategory: 'missense',
    hgvsp: 'p.Lys34Asn',
    hgvsc: 'c.100A>T',
    hgvs: 'p.Lys34Asn',
    group_results: {},
    info: {},
  }

  const buildDescriptionColumns = (datasetId: string) => {
    return getVariantTableColumns({
      datasetId,
      variantResultColumns: [{ key: 'info.score', heading: 'Score' }],
      filter: { ...DEFAULT_FILTER, gp2VariantColumnGroups: {} },
    })
  }

  const getAsc2HgvsColumn = () => {
    const column = buildDescriptionColumns('ASC2').find((candidate) => candidate.key === 'hgvs')
    if (!column) {
      throw new Error('Missing ASC2 column: hgvs')
    }
    return column
  }

  it('keeps the combined ASC2 column in its original position', () => {
    const columns = buildDescriptionColumns('ASC2')

    expect(columns.map((column) => column.key)).toEqual([
      'variant_id',
      'hgvs',
      'consequence',
      'info.score',
    ])
    expect(columns[1].heading).toBe('HGVSp/c')
  })

  it.each(['ASC', 'ASC2', 'BipEx', 'BipEx2', 'Epi25', 'GP2', 'IBD', 'SCHEMA'])(
    'keeps the combined column for %s',
    (datasetId) => {
      const columns = buildDescriptionColumns(datasetId)

      expect(columns.slice(0, 3).map((column) => column.key)).toEqual([
        'variant_id',
        'hgvs',
        'consequence',
      ])
      expect(columns[1].heading).toBe('HGVSp/c')
      expect(columns[1].renderForCSV(variant, 'hgvs')).toBe('p.Lys34Asn')
    }
  )

  it.each([
    { hgvsp: 'p.Lys34Asn', hgvsc: 'c.100A>T', expected: 'p.Lys34Asn' },
    { hgvsp: '', hgvsc: 'c.100A>T', expected: 'c.100A>T' },
  ])('renders and exports the combined HGVS value $expected', ({ hgvsp, hgvsc, expected }) => {
    const column = getAsc2HgvsColumn()
    const normalizedVariant = { ...variant, hgvsp, hgvsc, hgvs: hgvsp || hgvsc }

    render(React.createElement(React.Fragment, null, column.render(normalizedVariant, 'hgvs', {})))

    expect(screen.getByText(expected)).toBeInTheDocument()
    expect(column.renderForCSV(normalizedVariant, 'hgvs')).toBe(expected)
    expect(column.sortKey).toBe('hgvs')
    expect(column.isSortable).toBe(true)
    expect(column.sortFunction('a', 'b')).toBeLessThan(0)
    expect(column.sortFunction('b', 'a')).toBeGreaterThan(0)
  })

  it('leaves the combined column blank when both HGVS values are missing', () => {
    const column = getAsc2HgvsColumn()
    const variantWithMissingHgvs = { ...variant, hgvsp: '', hgvsc: '', hgvs: '' }

    const { container } = render(
      React.createElement(React.Fragment, null, column.render(variantWithMissingHgvs, 'hgvs', {}))
    )

    expect(container.textContent).toBe('')
    expect(column.renderForCSV(variantWithMissingHgvs, 'hgvs')).toBe('')
  })
})
