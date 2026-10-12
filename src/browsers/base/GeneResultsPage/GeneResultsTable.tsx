import React, { PureComponent } from 'react'
import styled from 'styled-components'

// @ts-expect-error: no types in this @gnomad/ui version
import { Grid } from '@gnomad/ui'
import { GeneResultTableColumn, GeneRow } from './geneResultTableColumns'
import { parseNumericValue } from '../tableCells'
import { CenteredCellContent } from '../GenePage/VariantTable'

const CenteredNumericContent = styled(CenteredCellContent)`
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`

const TableWrapper = styled.div<{ $columns: GeneResultTableColumn[] }>`
  ${({ $columns }) =>
    $columns
      .map((column, index) =>
        column.centerHeading
          ? `[role="columnheader"][aria-colindex="${index + 1}"] { justify-content: center; }`
          : ''
      )
      .join('\n')}
`

interface GeneResultsTableProps {
  defaultSortKey: string
  defaultSortOrder?: string
  geneResultColumns: GeneResultTableColumn[]
  geneResults: GeneRow[]
  highlightText?: string
}

interface GeneResultsTableState {
  sortKey: string
  sortAscending: boolean
}

class GeneResultsTable extends PureComponent<GeneResultsTableProps, GeneResultsTableState> {
  static defaultProps = {
    defaultSortKey: 'gene_id',
    defaultSortOrder: undefined,
    highlightText: '',
  }

  constructor(props: GeneResultsTableProps) {
    super(props)

    this.state = {
      sortKey: props.defaultSortKey || 'gene_id',
      sortAscending: props.defaultSortOrder !== 'descending',
    }
  }

  setSortKey = (sortKey: string) => {
    const resolvedSortKey = sortKey === 'gene_id' ? 'gene_symbol' : sortKey
    this.setState((state) => ({
      sortKey: resolvedSortKey,
      sortAscending: resolvedSortKey === state.sortKey ? !state.sortAscending : true,
    }))
  }

  getRenderedResults(): GeneRow[] {
    const { geneResults } = this.props
    const { sortKey, sortAscending } = this.state

    const comparator =
      sortKey === 'gene_id' ||
      sortKey === 'gene_symbol' ||
      sortKey === 'gene_name' ||
      sortKey === 'flags'
        ? (a: any, b: any) => a.localeCompare(b)
        : (a: any, b: any) => {
            const numericA = typeof a === 'boolean' ? Number(a) : parseNumericValue(a)
            const numericB = typeof b === 'boolean' ? Number(b) : parseNumericValue(b)
            return numericA - numericB
          }

    const orderedComparator = sortAscending ? comparator : (a: any, b: any) => comparator(b, a)

    const sortedResults = geneResults.slice().sort((resultA, resultB) => {
      const sortValA = resultA[sortKey]
      const sortValB = resultB[sortKey]

      const isMissingA = sortValA === null || sortValA === undefined || sortValA === ''
      const isMissingB = sortValB === null || sortValB === undefined || sortValB === ''
      if (isMissingA && isMissingB) return 0
      if (isMissingA) return 1
      if (isMissingB) return -1

      return orderedComparator(sortValA, sortValB)
    })

    return sortedResults
  }

  render() {
    const { geneResultColumns, highlightText } = this.props
    const { sortKey, sortAscending } = this.state

    const renderedResults = this.getRenderedResults()
    const alignedColumns = geneResultColumns.map((column) => {
      if (!column.centerNumericValues && !column.centerCellContent) return column
      return {
        ...column,
        render: (row: GeneRow, key: string, context: { highlightWords?: string[] }) => {
          const content = column.render(row, key, context)
          const numericContent = <CenteredNumericContent>{content}</CenteredNumericContent>
          const centeredContent = <CenteredCellContent>{content}</CenteredCellContent>
          return column.centerNumericValues ? numericContent : centeredContent
        },
      }
    })

    return (
      <TableWrapper $columns={geneResultColumns}>
        {renderedResults.length === 0 ? (
          'No results found'
        ) : (
          <Grid
            cellData={{ highlightWords: (highlightText || '').split(/\s+/) }}
            columns={alignedColumns}
            data={renderedResults}
            numRowsRendered={32}
            rowKey={(result: GeneRow) => `${result.gene_id}-${result.gene_symbol}`}
            sortKey={sortKey === 'gene_symbol' ? 'gene_id' : sortKey}
            sortOrder={sortAscending ? 'ascending' : 'descending'}
            onRequestSort={this.setSortKey}
          />
        )}
      </TableWrapper>
    )
  }
}

export default GeneResultsTable
