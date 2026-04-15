import React, { PureComponent } from 'react'

// @ts-expect-error: no types in this @gnomad/ui version
import { Grid } from '@gnomad/ui'
import { GeneResultTableColumn, GeneRow } from './geneResultTableColumns'

interface GeneResultsTableProps {
  defaultSortKey: string
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
    highlightText: '',
  }

  constructor(props: GeneResultsTableProps) {
    super(props)

    this.state = {
      sortKey: props.defaultSortKey || 'gene_id',
      sortAscending: true,
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
        : (a: any, b: any) => a - b

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
      <div>
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
      </div>
    )
  }
}

export default GeneResultsTable
