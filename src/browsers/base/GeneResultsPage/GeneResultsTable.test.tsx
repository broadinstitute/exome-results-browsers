import { render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'

import GeneResultsTable from './GeneResultsTable'
import getTableColumns, { GeneRow } from './geneResultTableColumns'

const gene: GeneRow = {
  gene_id: 'ENSG000001',
  symbol: 'GENE',
  reference_genome: 'GRCh38',
  canonical_transcript_id: 'ENST000001',
  start: 1,
  stop: 100,
  group_results: {},
  bayes_factor: 123,
}

describe('gene table heading alignment', () => {
  it('centers opted-in headers without changing other headers or CSV labels', () => {
    const columns = getTableColumns([
      { key: 'bayes_factor', heading: 'Bayes Factor', centerHeading: true },
      { key: 'count', heading: 'Count' },
    ])

    render(
      <MemoryRouter>
        <GeneResultsTable
          defaultSortKey="bayes_factor"
          geneResultColumns={columns}
          geneResults={[gene]}
        />
      </MemoryRouter>
    )

    expect(screen.getByRole('columnheader', { name: 'Bayes Factor' })).toHaveStyle(
      'justify-content: center;'
    )
    for (const heading of ['Gene', 'Description', 'Count']) {
      expect(screen.getByRole('columnheader', { name: heading })).not.toHaveStyle(
        'justify-content: center;'
      )
    }
    expect(columns.map((column) => column.csvHeading)).toEqual([
      'Gene',
      'Description',
      'Bayes Factor',
      'Count',
    ])
  })
})
