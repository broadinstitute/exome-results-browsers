import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'

import { Grid } from '@gnomad/ui'

class GeneResultsTable extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      sortKey: props.defaultSortKey,
      sortAscending: true,
    }
  }

  setSortKey = (sortKey) => {
    this.setState((state) => ({
      ...state,
      sortKey: sortKey === 'gene_id' ? 'gene_symbol' : sortKey,
      sortAscending: sortKey === state.sortKey ? !state.sortAscending : true,
    }))
  }

  getRenderedResults() {
    const { geneResults } = this.props
    const { sortKey, sortAscending } = this.state

    const comparator =
      sortKey === 'gene_id' || sortKey === 'gene_name'
        ? (a, b) => a.localeCompare(b)
        : (a, b) => a - b

    const orderedComparator = sortAscending ? comparator : (a, b) => comparator(b, a)

    const sortedResults = geneResults.sort((resultA, resultB) => {
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
            cellData={{ highlightWords: highlightText.split(/\s+/) }}
            columns={geneResultColumns}
            data={renderedResults}
            numRowsRendered={32}
            rowKey={(result) => `${result.gene_id}-${result.gene_symbol}`}
            sortKey={sortKey}
            sortOrder={sortAscending ? 'ascending' : 'descending'}
            onRequestSort={this.setSortKey}
          />
        )}
      </div>
    )
  }
}

GeneResultsTable.propTypes = {
  defaultSortKey: PropTypes.string,
  geneResultColumns: PropTypes.arrayOf(PropTypes.object).isRequired,
  geneResults: PropTypes.arrayOf(PropTypes.object).isRequired,
  highlightText: PropTypes.string,
}

GeneResultsTable.defaultProps = {
  defaultSortKey: 'gene_id',
  highlightText: '',
}

export default GeneResultsTable
