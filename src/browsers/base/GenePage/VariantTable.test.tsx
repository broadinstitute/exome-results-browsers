import { render, screen } from '@testing-library/react'
import React from 'react'

import { VariantColumnConfig } from '../Browser'

import VariantTable from './VariantTable'
import getVariantTableColumns, { VariantRow } from './variantTableColumns'

const buildVariants = (counts: (number | null | undefined)[]): VariantRow[] => {
  return counts.map((count, index) => ({
    variant_id: `1-${index + 1}-A-T`,
    pos: index + 1,
    consequence: 'missense',
    consequenceCategory: 'missense',
    hgvsp: '',
    hgvsc: '',
    group_results: {},
    info: { count, otherCount: 987654 },
  }))
}

const buildColumns = (
  configuration: VariantColumnConfig[] = [
    { key: 'info.count', heading: 'Count', centerNumericValues: true },
    { key: 'info.otherCount', heading: 'Other count' },
  ]
) => {
  return getVariantTableColumns({
    datasetId: 'SCHEMA',
    variantResultColumns: configuration,
    filter: {
      includeCategories: { lof: true, missense: true, synonymous: true, other: true },
      searchText: '',
      custom: undefined,
    },
  }).filter((column) => configuration.some((configured) => configured.key === column.key))
}

const callbacks = {
  onClickVariant: jest.fn(),
  onHoverVariant: jest.fn(),
  onRequestSort: jest.fn(),
  onVisibleRowsChange: jest.fn(),
}

describe('centered numeric variant columns', () => {
  it('centers equally wide right-aligned blocks using rows beyond the visible window', () => {
    const variants = buildVariants([1, 12, 123, ...Array<number>(30).fill(0), 1234])
    const columns = buildColumns()

    render(
      <VariantTable
        columns={columns}
        variants={variants}
        sortKey="info.count"
        sortOrder="ascending"
        onClickVariant={callbacks.onClickVariant}
        onHoverVariant={callbacks.onHoverVariant}
        onRequestSort={callbacks.onRequestSort}
        onVisibleRowsChange={callbacks.onVisibleRowsChange}
      />
    )

    expect(screen.queryByText('1230')).not.toBeInTheDocument()
    for (const value of ['1', '12', '123']) {
      const numericBlock = screen.getByText(value)
      expect(numericBlock).toHaveStyle('width: 4ch; text-align: right;')
      expect(numericBlock.parentElement).toHaveStyle(
        'display: flex; justify-content: center; width: 100%; font-variant-numeric: tabular-nums;'
      )
    }
    expect(screen.getAllByText('988000')[0].firstChild?.nodeType).toBe(Node.TEXT_NODE)
    expect(columns[0].renderForCSV(variants[variants.length - 1], 'info.count')).toBe(1234)
  })

  it('recalculates the shared width when the filtered data changes', () => {
    const columns = buildColumns()
    const renderTable = (variants: VariantRow[]) => {
      return (
        <VariantTable
          columns={columns}
          variants={variants}
          sortKey="info.count"
          sortOrder="ascending"
          onClickVariant={callbacks.onClickVariant}
          onHoverVariant={callbacks.onHoverVariant}
          onRequestSort={callbacks.onRequestSort}
          onVisibleRowsChange={callbacks.onVisibleRowsChange}
        />
      )
    }
    const { rerender } = render(renderTable(buildVariants([1, 12, 1234])))
    expect(screen.getByText('1')).toHaveStyle('width: 4ch;')

    rerender(renderTable(buildVariants([1, 12])))
    expect(screen.getByText('1')).toHaveStyle('width: 2ch;')
    expect(screen.getByText('12')).toHaveStyle('width: 2ch;')
  })

  it('measures formatted text from a custom accessor and renderer per column', () => {
    const columns = buildColumns([
      {
        key: 'customCount',
        heading: 'Formatted count',
        centerNumericValues: true,
        accessor: (row: VariantRow) => row.info.count,
        render: (value: number | null | undefined) =>
          value === null || value === undefined ? '' : value.toFixed(2),
      },
      { key: 'info.otherCount', heading: 'Other count', centerNumericValues: true },
    ])
    const variants = buildVariants([0, 12, null, undefined])
    render(
      <VariantTable
        columns={columns}
        variants={variants}
        sortKey="customCount"
        sortOrder="ascending"
        onClickVariant={callbacks.onClickVariant}
        onHoverVariant={callbacks.onHoverVariant}
        onRequestSort={callbacks.onRequestSort}
        onVisibleRowsChange={callbacks.onVisibleRowsChange}
      />
    )

    expect(screen.getByText('0.00')).toHaveStyle('width: 5ch;')
    expect(screen.getByText('12.00')).toHaveStyle('width: 5ch;')
    expect(screen.getAllByText('988000')[0]).toHaveStyle('width: 6ch;')
    expect(screen.getAllByRole('gridcell').filter((cell) => cell.textContent === '')).toHaveLength(
      2
    )
  })
})
