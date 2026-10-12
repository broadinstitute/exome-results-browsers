import React from 'react'
import { render, screen, within } from '@testing-library/react'

import VariantDetails from './VariantDetails'

const props: React.ComponentProps<typeof VariantDetails> = {
  datasetId: 'ASC2',
  defaultVariantAnalysisGroup: 'meta',
  referenceGenome: 'GRCh38',
  variant: {
    variant_id: '1-100-A-T',
    pos: 100,
    consequence: 'missense_variant',
    consequenceCategory: 'missense',
    hgvsc: 'c.100A>T',
    hgvsp: 'p.Lys34Asn',
    group_results: {
      meta: {
        ac_case: 2,
        an_case: 100,
        af_case: 0.02,
        ac_ctrl: 0,
        an_ctrl: 100,
        af_ctrl: 0,
        af: 0.01,
        de_novo_ac_proband: 2,
      },
    },
    info: { mpc: 3.2 },
  },
  variantAnalysisGroupOptions: ['meta'],
  variantAnalysisGroupLabels: { meta: 'Meta-analysis' },
  variantResultColumns: [
    { key: 'group_result.de_novo_ac_proband', heading: 'Proband', render: (value) => value },
    { key: 'info.mpc', heading: 'MPC', render: (value) => value },
  ],
  renderVariantAttributes: () => [],
  additionalVariantDetailSummaryColumns: undefined,
  variantDetailColumns: undefined,
  renderVariantTranscriptConsequences: false,
  filter: {
    includeCategories: { lof: true, missense: true, synonymous: true, other: true },
    searchText: '',
    custom: {},
  },
}

describe('VariantDetails single analysis group layout', () => {
  it.each([undefined, false])('keeps the existing layout when the option is %s', (option) => {
    render(<VariantDetails {...props} variantDetailsSingleAnalysisGroup={option} />)

    expect(screen.getByRole('heading', { name: 'Analysis (meta)' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Analysis Groups' })).toBeInTheDocument()
    const table = screen.getByRole('table')
    expect(within(table).getByRole('rowheader', { name: 'Meta-analysis' })).toBeInTheDocument()
    expect(within(table).getByRole('cell', { name: '2' })).toBeInTheDocument()
  })

  it('keeps all group rows for other datasets without opting in', () => {
    const variant = {
      ...props.variant,
      group_results: {
        ...props.variant.group_results,
        exome: { ...props.variant.group_results.meta, de_novo_ac_proband: 4 },
      },
    }

    render(
      <VariantDetails
        {...props}
        datasetId="SCHEMA"
        variant={variant}
        variantAnalysisGroupOptions={['meta', 'exome']}
      />
    )

    const table = screen.getByRole('table')
    expect(within(table).getByRole('rowheader', { name: 'Meta-analysis' })).toBeInTheDocument()
    expect(within(table).getByRole('rowheader', { name: 'exome' })).toBeInTheDocument()
    expect(within(table).getByRole('cell', { name: '4' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Analysis (meta)' })).toBeInTheDocument()
  })

  it('hides the group table and name without removing summary information when opted in', () => {
    render(<VariantDetails {...props} variantDetailsSingleAnalysisGroup />)

    expect(screen.getByRole('heading', { name: 'Analysis', exact: true })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Analysis (meta)' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Analysis Groups' })).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByText('Proband:').parentElement).toHaveTextContent('Proband:2')
    expect(screen.getByText('MPC:').parentElement).toHaveTextContent('MPC:3.2')
    expect(screen.getByRole('heading', { name: 'Annotations' })).toBeInTheDocument()
    expect(screen.getByText('c.100A>T')).toBeInTheDocument()
    expect(screen.getByText('p.Lys34Asn')).toBeInTheDocument()
    expect(screen.getByText('missense_variant')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View in gnomAD' })).toBeInTheDocument()
  })

  it('preserves transcript consequences when opted in', () => {
    const variant = {
      ...props.variant,
      info: { ...props.variant.info, transcript_consequences: '[]' },
    }

    render(
      <VariantDetails
        {...props}
        variant={variant}
        variantDetailsSingleAnalysisGroup
        renderVariantTranscriptConsequences
      />
    )

    expect(screen.getByRole('heading', { name: 'Transcript Consequences' })).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
