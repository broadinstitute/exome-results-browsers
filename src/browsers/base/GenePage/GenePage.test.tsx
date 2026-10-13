import { fireEvent, render, screen } from '@testing-library/react'
import React, { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'

import { DatasetId } from '../Browser'
import { IndividualGeneAPIResponse } from '../GeneResultsPage/geneResultTableColumns'

import { Constraint } from './Constraint'
import GenePage from './GenePage'

jest.mock('../Fetch', () => ({
  __esModule: true,
  default: ({
    children,
  }: {
    children: (response: {
      data: { gene: IndividualGeneAPIResponse }
      error: null
      loading: false
    }) => ReactNode
  }) => children({ data: { gene: mockGene }, error: null, loading: false }),
}))

jest.mock('./AutosizedRegionViewer', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('./GeneResults', () => ({
  __esModule: true,
  default: () => null,
}))

const constraint: Constraint = {
  exp_lof: null,
  exp_mis: null,
  exp_syn: null,
  obs_lof: null,
  obs_mis: null,
  obs_syn: null,
  oe_lof: null,
  oe_mis: null,
  oe_syn: null,
  lof_z: null,
  mis_z: null,
  syn_z: null,
  pLI: null,
}

const mockGene: IndividualGeneAPIResponse = {
  gene_id: 'ENSG00000000001',
  hgnc_id: 'HGNC:1',
  symbol: 'GENE1',
  name: 'Example gene',
  previous_symbols: null,
  alias_symbols: null,
  omim_id: '',
  search_terms: null,
  exac_constraint: constraint,
  gnomad_v2_constraint: { ...constraint, obs_syn: 22 },
  gnomad_v4_constraint: { ...constraint, obs_syn: 44 },
  gene_results: {},
  reference_genome: 'GRCh38',
  chrom: '1',
  strand: '+',
  start: 100,
  stop: 200,
  gencode_gene_symbol: 'GENE1',
  canonical_transcript_id: 'ENST00000000001',
  canonical_transcript: {
    transcript_id: 'ENST00000000001',
    strand: '+',
    start: 100,
    stop: 200,
    exons: [],
  },
}

const renderGenePage = (datasetId: DatasetId) => {
  return render(
    <MemoryRouter>
      <GenePage
        datasetId={datasetId}
        geneIdOrSymbol={mockGene.gene_id}
        browserTitle="Browser"
        defaultVariantAnalysisGroup="meta"
        variantAnalysisGroupOptions={['meta']}
        variantConsequences={[]}
        variantResultColumns={[]}
      />
    </MemoryRouter>
  )
}

describe('gene page constraint tabs', () => {
  it('removes ExAC for AGB while retaining both gnomAD tables', () => {
    renderGenePage('AGB')

    expect(screen.queryByText('ExAC')).not.toBeInTheDocument()
    expect(screen.getByText('gnomAD v4')).toBeInTheDocument()
    expect(screen.getByText('gnomAD v2')).toBeInTheDocument()
    expect(screen.getByText('44')).toBeVisible()

    fireEvent.focus(screen.getByRole('tab', { name: 'gnomAD v2' }))
    expect(screen.getByText('22')).toBeVisible()
    expect(screen.getByText('44')).not.toBeVisible()
  })

  it('retains ExAC in other browsers', () => {
    renderGenePage('SCHEMA')

    expect(screen.getByText('ExAC')).toBeInTheDocument()
  })
})
