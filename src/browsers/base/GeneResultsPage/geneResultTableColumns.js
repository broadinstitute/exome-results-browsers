import { get } from 'lodash'
import React from 'react'
import Highlighter from 'react-highlight-words'

import Link from '../Link'
import { renderFloat } from '../tableCells'

const baseColumns = [
  {
    key: 'gene_id',
    heading: 'Gene',
    isSortable: true,
    minWidth: 100,
    render: (row, key, { highlightWords }) => (
      <Link className="grid-cell-content" target="_blank" to={`/gene/${row.gene_id}`}>
        <Highlighter
          searchWords={highlightWords}
          textToHighlight={row.gene_symbol || row.gene_id}
        />
      </Link>
    ),
    renderForCSV: get,
  },
  {
    key: 'gene_name',
    heading: 'Description',
    isSortable: true,
    minWidth: 200,
    grow: 4,
    render: (row, key, { highlightWords }) => (
      <Highlighter
        className="grid-cell-content"
        searchWords={highlightWords}
        textToHighlight={row[key] || ''}
      />
    ),
    renderForCSV: get,
  },
]

const getTableColumns = (geneResultColumns) => {
  const resultColumns = geneResultColumns.map((column) => ({
    key: column.key,
    heading: column.heading || column.key,
    tooltip: column.tooltip,
    isSortable: true,
    minWidth: column.minWidth || 65,
    grow: 0,
    render: column.render
      ? (row, key) => column.render(get(row, key))
      : (row, key) => renderFloat(get(row, key)),
    renderForCSV: column.renderForCSV ? (row, key) => column.renderForCSV(get(row, key)) : get,
  }))

  return [...baseColumns, ...resultColumns]
}

export default getTableColumns
