import React, { ComponentProps } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen } from '@testing-library/react'

import { GeneResultsPage } from '../base/GeneResultsPage/GeneResultsPage'
import { schemaDefaultAnalysisGroup, schemaGeneResultColumns } from './SCHEMABrowser'
import { schemaGeneResultFactory } from './schemaGeneTypes.factory'
import { SchemaGeneResult } from './schemaGeneTypes'

type GeneResultsPageProps = ComponentProps<typeof GeneResultsPage>

const buildGeneRow = (
  gene: { gene_id: string; gene_symbol: string; gene_name: string },
  resultOverrides: Partial<SchemaGeneResult>
) => ({
  ...gene,
  chrom: '16',
  pos: 30984070,
  group_results: { [schemaDefaultAnalysisGroup]: schemaGeneResultFactory.build(resultOverrides) },
})

const renderGeneResultsPage = (geneResults: ReturnType<typeof buildGeneRow>[]) =>
  render(
    <MemoryRouter>
      <GeneResultsPage
        browserTitle="SCHEMA Browser"
        analysisGroupOptions={[schemaDefaultAnalysisGroup]}
        defaultAnalysisGroup={schemaDefaultAnalysisGroup}
        geneResultColumns={schemaGeneResultColumns}
        geneResults={(geneResults as unknown) as GeneResultsPageProps['geneResults']}
      />
    </MemoryRouter>
  )

describe('SCHEMA all gene results page (GeneResultsPage)', () => {
  it('renders a row for each fixture gene, with its p-value, odds ratio, and de novo count', () => {
    const setd1a = buildGeneRow(
      {
        gene_id: 'ENSG00000181090',
        gene_symbol: 'SETD1A',
        gene_name: 'SET domain containing 1A, histone lysine methyltransferase',
      },
      {
        schema_case_control_p_value: 0.0001234,
        ptv_odds_ratio: '2.5',
        ptv_n_de_novo: 7,
      }
    )
    const trio2 = buildGeneRow(
      {
        gene_id: 'ENSG00000005339',
        gene_symbol: 'TRIO2',
        gene_name: 'trio Rho guanine nucleotide exchange factor 2',
      },
      {
        schema_case_control_p_value: 0.5678,
        ptv_odds_ratio: '1.1',
        ptv_n_de_novo: 0,
      }
    )

    renderGeneResultsPage([setd1a, trio2])

    expect(screen.getByText('SETD1A')).toBeInTheDocument()
    expect(screen.getByText('TRIO2')).toBeInTheDocument()
    expect(screen.getByText(/1\.234e-4/)).toBeInTheDocument()
    expect(screen.getByText('2.50')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('given a search term, filters the table down to matching genes', () => {
    const setd1a = buildGeneRow(
      {
        gene_id: 'ENSG00000181090',
        gene_symbol: 'SETD1A',
        gene_name: 'SET domain containing 1A, histone lysine methyltransferase',
      },
      {}
    )
    const trio2 = buildGeneRow(
      {
        gene_id: 'ENSG00000005339',
        gene_symbol: 'TRIO2',
        gene_name: 'trio Rho guanine nucleotide exchange factor 2',
      },
      {}
    )

    renderGeneResultsPage([setd1a, trio2])

    fireEvent.change(screen.getByPlaceholderText('Search results by gene'), {
      target: { value: 'SETD1A' },
    })

    expect(screen.getByText('SETD1A')).toBeInTheDocument()
    expect(screen.queryByText('TRIO2')).not.toBeInTheDocument()
  })
})
