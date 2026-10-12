import React from 'react'
import { render, screen } from '@testing-library/react'

import { IndividualGeneAPIResponse } from '../GeneResultsPage/geneResultTableColumns'
import { Constraint } from './Constraint'
import GeneInfo from './GeneInfo'

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

const gene: IndividualGeneAPIResponse = {
  gene_id: 'ENSG00000000001',
  hgnc_id: 'HGNC:1',
  symbol: 'GENE1',
  name: 'Example gene',
  previous_symbols: null,
  alias_symbols: null,
  omim_id: '',
  search_terms: null,
  exac_constraint: constraint,
  gnomad_v2_constraint: constraint,
  gnomad_v4_constraint: constraint,
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
  mane_select_transcript_id: 'ENST00000000002',
}

describe('GeneInfo MANE Select transcript', () => {
  it.each([undefined, false])('hides the MANE Select row when the option is %s', (option) => {
    render(<GeneInfo gene={gene} showManeSelectTranscript={option} />)

    expect(screen.queryByText('MANE Select transcript')).not.toBeInTheDocument()
    expect(screen.queryByText('ENST00000000002')).not.toBeInTheDocument()
    expect(screen.getByText('Ensembl transcript ID').nextElementSibling).toHaveTextContent(
      'ENST00000000001'
    )
  })

  it('shows the MANE Select ID separately from the canonical ID when opted in', () => {
    render(<GeneInfo gene={gene} showManeSelectTranscript />)

    expect(screen.getByText('MANE Select transcript').nextElementSibling).toHaveTextContent(
      'ENST00000000002'
    )
    expect(screen.getByText('Ensembl transcript ID').nextElementSibling).toHaveTextContent(
      'ENST00000000001'
    )
  })

  it('labels MANE Select even when it matches the canonical transcript', () => {
    render(
      <GeneInfo
        gene={{ ...gene, mane_select_transcript_id: gene.canonical_transcript_id }}
        showManeSelectTranscript
      />
    )

    expect(screen.getByText('MANE Select transcript').nextElementSibling).toHaveTextContent(
      gene.canonical_transcript_id
    )
    expect(screen.getByText('Ensembl transcript ID')).toBeInTheDocument()
  })

  it.each([null, undefined])('omits the row when the MANE Select ID is %s', (transcriptId) => {
    render(
      <GeneInfo
        gene={{ ...gene, mane_select_transcript_id: transcriptId }}
        showManeSelectTranscript
      />
    )

    expect(screen.queryByText('MANE Select transcript')).not.toBeInTheDocument()
    expect(screen.getByText('ENST00000000001')).toBeInTheDocument()
  })
})
