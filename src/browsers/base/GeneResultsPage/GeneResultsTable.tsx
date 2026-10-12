import React, { PureComponent } from 'react'
import styled from 'styled-components'

// @ts-expect-error: no types in this @gnomad/ui version
import { Grid } from '@gnomad/ui'
import { GeneResultTableColumn, GeneRow } from './geneResultTableColumns'
import { parseNumericValue } from '../tableCells'

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
    this.setState((state) => ({
      // ...state,
      sortKey: sortKey === 'gene_id' ? 'gene_symbol' : sortKey,
      sortAscending: sortKey === state.sortKey ? !state.sortAscending : true,
    }))
  }

  getRenderedResults(): GeneRow[] {
    const { geneResults } = this.props
    const { sortKey, sortAscending } = this.state

    const comparator =
      sortKey === 'gene_id' || sortKey === 'gene_name' || sortKey === 'flags'
        ? (a: any, b: any) => a.localeCompare(b)
        : (a: any, b: any) => parseNumericValue(a) - parseNumericValue(b)

    const orderedComparator = sortAscending ? comparator : (a: any, b: any) => comparator(b, a)

    const sortedResults = geneResults.slice().sort((resultA, resultB) => {
      const sortValA = resultA[sortKey]
      const sortValB = resultB[sortKey]

      if (sortValA === null || sortValA === '') {
        return 1
      }

      if (sortValB === null || sortValB === '') {
        return -1
      }

      return orderedComparator(sortValA, sortValB)
    })

    return sortedResults
  }

  render() {
    const { geneResultColumns, highlightText } = this.props
    const { sortKey, sortAscending } = this.state

    const renderedResults = this.getRenderedResults()

    return (
      <TableWrapper $columns={geneResultColumns}>
        {renderedResults.length === 0 ? (
          'No results found'
        ) : (
          <Grid
            cellData={{ highlightWords: (highlightText || '').split(/\s+/) }}
            columns={geneResultColumns}
            data={renderedResults}
            numRowsRendered={32}
            rowKey={(result: GeneRow) => `${result.gene_id}-${result.gene_symbol}`}
            sortKey={sortKey}
            sortOrder={sortAscending ? 'ascending' : 'descending'}
            onRequestSort={this.setSortKey}
          />
        )}
      </TableWrapper>
    )
  }
}

export default GeneResultsTable
