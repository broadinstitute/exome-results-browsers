import React from 'react'

import datasetConfig from '../../datasetConfig'
import Fetch from '../Fetch'
import VariantsInGeneContainer from './VariantsInGene'
import VariantTable from './VariantTable'
import getVariantTableColumns, { VariantRow } from './variantTableColumns'

const originalDatasetConfig = { ...datasetConfig }
const gene = { gene_id: 'ENSG00000169604', reference_genome: 'GRCh38' as const }
const sourceRows: unknown[][] = [
  [
    '2-69193415-G-A',
    69193415,
    'splice_region_variant',
    null,
    'p.Thr478=',
    ['PTV', 'ENST00000303714'],
    [[1, 0, 0, 0, 0, 0]],
  ],
  [
    '2-69193415-G-A',
    69193415,
    'splice_region_variant',
    null,
    'p.Thr478=',
    ['synonymous', 'ENST00000303714'],
    [[0, 0, 4, 4, 2, 1]],
  ],
]

beforeEach(() => {
  Object.assign(datasetConfig, {
    variant_fields: ['variant_id', 'pos', 'consequence', 'hgvsc', 'hgvsp', 'info', 'group_results'],
    variant_info_field_names: ['variant_class', 'transcript_id'],
    variant_result_analysis_groups: ['meta'],
    variant_group_result_field_names: [
      'de_novo_ac_proband',
      'de_novo_ac_sibling',
      'transmitted_ac_proband',
      'untransmitted_ac_proband',
      'ac_case',
      'ac_ctrl',
    ],
  })
})

afterEach(() => {
  Object.assign(datasetConfig, originalDatasetConfig)
})

const decodeRows = (datasetId: string, rows = sourceRows): VariantRow[] => {
  const fetchElement = VariantsInGeneContainer({
    datasetId,
    gene,
    variantConsequences: [{ term: 'splice_region_variant', category: 'other' }],
    variantResultColumns: [],
  })
  if (!React.isValidElement<React.ComponentProps<typeof Fetch>>(fetchElement)) {
    throw new Error('Expected the variant fetch component')
  }
  const variantsElement = fetchElement.props.children({
    data: { variants: rows },
    loading: false,
    error: null,
  })
  if (!React.isValidElement<{ variants: VariantRow[] }>(variantsElement)) {
    throw new Error('Expected the decoded variant list')
  }
  return variantsElement.props.variants
}

interface VariantGridProps {
  data: VariantRow[]
  rowKey: (variant: VariantRow) => string
  cellData: { onClickVariant: (variant: VariantRow) => void }
  onHoverRow: (rowIndex: number | null) => void
}

const getGridProps = (
  variants: VariantRow[],
  onClickVariant = jest.fn(),
  onHoverVariant = jest.fn()
): VariantGridProps => {
  const table = new VariantTable({
    variants,
    columns: [],
    onClickVariant,
    onHoverVariant,
    onRequestSort: jest.fn(),
    onVisibleRowsChange: jest.fn(),
    sortKey: 'variant_id',
    sortOrder: 'ascending',
  })
  const gridElement = table.render()
  if (!React.isValidElement<VariantGridProps>(gridElement)) {
    throw new Error('Expected the variant grid')
  }
  return gridElement.props
}

describe('AGB annotation row identities', () => {
  it('preserves both ANTXR1 rows with distinct grid keys and unchanged biological IDs and counts', () => {
    const rows = decodeRows('AGB')
    const grid = getGridProps(rows)

    expect(grid.data).toHaveLength(2)
    expect(rows.map((row) => row.variant_id)).toEqual(['2-69193415-G-A', '2-69193415-G-A'])
    expect(rows.map(grid.rowKey)).toEqual([
      'ENSG00000169604:2-69193415-G-A:0',
      'ENSG00000169604:2-69193415-G-A:1',
    ])
    expect(rows.map((row) => row.info.variant_class)).toEqual(['PTV', 'synonymous'])
    expect(rows.map((row) => row.group_results.meta.de_novo_ac_proband)).toEqual([1, 0])
    expect(rows.map((row) => row.group_results.meta.transmitted_ac_proband)).toEqual([0, 4])
    expect(rows.map((row) => row.group_results.meta.untransmitted_ac_proband)).toEqual([0, 4])
    expect(rows.map((row) => row.group_results.meta.ac_case)).toEqual([0, 2])
    expect(rows.map((row) => row.group_results.meta.ac_ctrl)).toEqual([0, 1])
  })

  it('assigns distinct keys even to exact duplicate annotations', () => {
    const rows = decodeRows('AGB', [...sourceRows, sourceRows[1]])
    const grid = getGridProps(rows)

    expect(rows).toHaveLength(3)
    expect(rows[1].info).toEqual(rows[2].info)
    expect(rows[1].group_results).toEqual(rows[2].group_results)
    expect(new Set(rows.map(grid.rowKey)).size).toBe(3)
  })

  it('keeps row identities attached through sorting, filtering, and analysis-group copies', () => {
    const rows = decodeRows('AGB')
    const originalGrid = getGridProps(rows)
    const originalKeys = rows.map(originalGrid.rowKey)
    const sortedRows = [...rows].sort(
      (left, right) =>
        Number(right.group_results.meta.transmitted_ac_proband) -
        Number(left.group_results.meta.transmitted_ac_proband)
    )

    expect(sortedRows.map(getGridProps(sortedRows).rowKey)).toEqual([...originalKeys].reverse())
    const filteredRows = sortedRows
      .filter((row) => row.info.variant_class === 'synonymous')
      .map((row) => ({ ...row, group_result: row.group_results.meta }))
    expect(filteredRows.map(getGridProps(filteredRows).rowKey)).toEqual([originalKeys[1]])
  })

  it('passes the clicked annotation row with its own counts to the details callback', () => {
    const rows = decodeRows('AGB')
    const onClickVariant = jest.fn()
    const grid = getGridProps(rows, onClickVariant)

    const [variantIdColumn] = getVariantTableColumns({
      datasetId: 'AGB',
      variantResultColumns: [],
      filter: {
        includeCategories: { lof: true, missense: true, synonymous: true, other: true },
        searchText: '',
        custom: undefined,
      },
    })
    grid.data.forEach((row) => {
      const variantIdButton = variantIdColumn.render(row, 'variant_id', {
        onClickVariant: grid.cellData.onClickVariant,
      })
      if (!React.isValidElement<{ onClick: () => void }>(variantIdButton)) {
        throw new Error('Expected the variant ID button')
      }
      variantIdButton.props.onClick()
    })

    expect(onClickVariant).toHaveBeenNthCalledWith(1, rows[0])
    expect(onClickVariant).toHaveBeenNthCalledWith(2, rows[1])
    expect(
      onClickVariant.mock.calls.map(([row]) => row.group_results.meta.transmitted_ac_proband)
    ).toEqual([0, 4])
  })

  it('retains both annotations and counts in CSV column values', () => {
    const rows = decodeRows('AGB').map((row) => ({ ...row, group_result: row.group_results.meta }))
    const columns = getVariantTableColumns({
      datasetId: 'AGB',
      variantResultColumns: [
        { key: 'info.variant_class', heading: 'Class' },
        { key: 'group_result.de_novo_ac_proband', heading: 'Proband' },
        { key: 'group_result.transmitted_ac_proband', heading: 'Transmitted' },
      ],
      filter: {
        includeCategories: { lof: true, missense: true, synonymous: true, other: true },
        searchText: '',
        custom: undefined,
      },
    })
    const exportedRows = rows.map((row) =>
      columns.map((column) => column.renderForCSV(row, column.key))
    )

    expect(exportedRows).toEqual([
      ['2-69193415-G-A', 'p.Thr478=', 'splice_region_variant', 'PTV', 1, 0],
      ['2-69193415-G-A', 'p.Thr478=', 'splice_region_variant', 'synonymous', 0, 4],
    ])
  })

  it('keeps hover highlighting based on the biological variant ID', () => {
    const rows = decodeRows('AGB')
    const onHoverVariant = jest.fn()
    const grid = getGridProps(rows, jest.fn(), onHoverVariant)

    grid.onHoverRow(0)
    grid.onHoverRow(1)
    grid.onHoverRow(null)

    expect(onHoverVariant.mock.calls).toEqual([['2-69193415-G-A'], ['2-69193415-G-A'], [null]])
  })

  it.each(['SCHEMA', 'BipEx', 'BipEx2', 'Epi25', 'GP2', 'IBD'])(
    'keeps existing biological row keys for %s',
    (datasetId) => {
      const rows = decodeRows(datasetId)
      const grid = getGridProps(rows)

      expect(rows.every((row) => row.annotationRowId === undefined)).toBe(true)
      expect(rows.map(grid.rowKey)).toEqual(rows.map((row) => row.variant_id))
    }
  )
})
