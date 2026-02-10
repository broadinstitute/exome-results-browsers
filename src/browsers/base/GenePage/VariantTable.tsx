import React, { Component } from 'react'
import styled from 'styled-components'

// @ts-expect-error: no types in this version of @gnomad/ui
import { Grid } from '@gnomad/ui'
import { VariantRow, VariantTableColumn } from './variantTableColumns'

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

    return (
      <Grid
        cellData={{ highlightWords: highlightText.split(/\s+/), onClickVariant }}
        columns={columns}
        data={variants}
        numRowsRendered={20}
        onHoverRow={(rowIndex: number | null) => {
          onHoverVariant(rowIndex === null ? null : variants[rowIndex].variant_id)
        }}
        onRequestSort={onRequestSort}
        onVisibleRowsChange={onVisibleRowsChange}
        ref={this.grid}
        rowKey={(variant: VariantRow) => variant.variant_id}
        sortKey={sortKey}
        sortOrder={sortOrder}
      />
    )
  }
}

export default VariantTable
