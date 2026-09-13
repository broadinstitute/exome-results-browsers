import { VariantColumnConfig } from '../Browser'
import { FilterState } from './VariantFilterControls'
import getVariantTableColumns from './variantTableColumns'

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
