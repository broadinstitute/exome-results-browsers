import React, { Component } from 'react'
import styled from 'styled-components'

// @ts-expect-error: no types in this version of @gnomad/ui
import { Grid } from '@gnomad/ui'
import { VariantRow, VariantTableColumn } from './variantTableColumns'
import VariantTableGroupHeadings from './VariantTableGroupHeadings'

const CenteredNumericCell = styled.span`
  display: flex;
  justify-content: center;
  width: 100%;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`

const RightAlignedNumericBlock = styled.span<{ $characterCount: number }>`
  flex-shrink: 0;
  width: ${({ $characterCount }) => $characterCount}ch;
  text-align: right;
`

const getNumericCellText = (value: React.ReactNode): string => {
  if (value === null || value === undefined || typeof value === 'boolean') {
    return ''
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }
  throw new Error('Centered numeric columns must render plain text.')
}

const NoVariants = styled.div<{ height: number }>`
  display: flex;
  justify-content: center;
  align-items: center;
  height: ${(props) => props.height}px;
  border: 1px dashed gray;
  margin-top: 20px;
  font-size: 20px;
  font-weight: bold;
`

// TK: TODO: pull this and other common types out into some shared type?
//    or maybe Browser.tsx holds the really commont types
export type SortOrder = 'ascending' | 'descending'

interface VariantTableProps {
  columns: VariantTableColumn[]
  highlightText?: string
  onClickVariant: (variant: any) => void
  onHoverVariant: (variantId: string) => void
  onRequestSort: (key: string) => void
  onVisibleRowsChange: (args: any) => void
  rowIndexLastClickedInNavigator?: number | null
  sortKey: string
  sortOrder: SortOrder
  variants: any[]
}

class VariantTable extends Component<VariantTableProps> {
  /* eslint-disable react/sort-comp */
  grid = React.createRef<any>()
  /* eslint-enable react/sort-comp */

  componentDidUpdate(prevProps: VariantTableProps) {
    const { rowIndexLastClickedInNavigator } = this.props
    if (rowIndexLastClickedInNavigator !== prevProps.rowIndexLastClickedInNavigator) {
      if (this.grid.current) {
        this.grid.current.scrollToDataRow(rowIndexLastClickedInNavigator)
      }
    }
  }

  render() {
    const {
      columns,
      highlightText = '',
      onClickVariant,
      onHoverVariant,
      onRequestSort,
      onVisibleRowsChange,
      sortKey,
      sortOrder,
      variants,
    } = this.props

    if (variants.length === 0) {
      return <NoVariants height={500}>No variants found</NoVariants>
    }

    const cellData = { highlightWords: highlightText.split(/\s+/), onClickVariant }
    const alignedColumns = columns.map((column) => {
      if (!column.centerNumericValues) {
        return column
      }
      const characterCount = variants.reduce<number>(
        (longest, row) =>
          Math.max(longest, getNumericCellText(column.render(row, column.key, cellData)).length),
        1
      )

      return {
        ...column,
        render: (row: VariantRow, key: string) => (
          <CenteredNumericCell>
            <RightAlignedNumericBlock $characterCount={characterCount}>
              {getNumericCellText(column.render(row, key, cellData))}
            </RightAlignedNumericBlock>
          </CenteredNumericCell>
        ),
      }
    })

    const variantGrid = (
      <Grid
        cellData={cellData}
        columns={alignedColumns}
        data={variants}
        numRowsRendered={20}
        onHoverRow={(rowIndex: number | null) => {
          onHoverVariant(rowIndex === null ? null : variants[rowIndex].variant_id)
        }}
        onRequestSort={onRequestSort}
        onVisibleRowsChange={onVisibleRowsChange}
        ref={this.grid}
        rowKey={(variant: VariantRow) => variant.annotationRowId ?? variant.variant_id}
        sortKey={sortKey}
        sortOrder={sortOrder}
      />
    )
    const groupedVariantGrid = (
      <VariantTableGroupHeadings columns={columns}>{variantGrid}</VariantTableGroupHeadings>
    )
    return columns.some((column) => column.group) ? groupedVariantGrid : variantGrid
  }
}

export default VariantTable
