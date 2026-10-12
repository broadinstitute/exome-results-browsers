import React from 'react'
import { render, screen, within } from '@testing-library/react'

import { GeneResultColumnGroup, VariantColumnConfig } from '../Browser'
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

describe('VariantDetails ASC2 count groups', () => {
  const deNovoGroup: GeneResultColumnGroup = {
    key: 'deNovo',
    geneTableLabel: 'De novo',
    variantTableLabel: 'De novo AC',
  }
  const inheritedGroup: GeneResultColumnGroup = {
    key: 'transmittedUntransmitted',
    geneTableLabel: 'Inherited (proband)',
    variantTableLabel: 'Inherited proband AC',
  }
  const caseControlGroup: GeneResultColumnGroup = {
    key: 'caseControl',
    geneTableLabel: 'Case-Control',
    variantTableLabel: 'Case-Control AC',
  }
  const columns: VariantColumnConfig[] = [
    { key: 'info.mpc', heading: 'MPC' },
    { key: 'group_result.de_novo_ac_proband', heading: 'Proband', group: deNovoGroup },
    { key: 'group_result.de_novo_ac_sibling', heading: 'Sibling', group: deNovoGroup },
    { key: 'group_result.transmitted_ac_proband', heading: 'Transmitted', group: inheritedGroup },
    {
      key: 'group_result.untransmitted_ac_proband',
      heading: 'Untransmitted',
      group: inheritedGroup,
    },
    { key: 'group_result.ac_case', heading: 'Case', group: caseControlGroup },
    { key: 'group_result.ac_ctrl', heading: 'Control', group: caseControlGroup },
  ]
  const variant = {
    ...props.variant,
    group_results: {
      meta: {
        ...props.variant.group_results.meta,
        de_novo_ac_sibling: 5,
        transmitted_ac_proband: 7,
        untransmitted_ac_proband: 9,
      },
    },
  }

  it('groups ASC2 counts under their configured labels and preserves ungrouped fields', () => {
    const { container } = render(
      <VariantDetails
        {...props}
        variant={variant}
        variantResultColumns={columns}
        variantDetailsSingleAnalysisGroup
      />
    )

    const expectedGroups = [
      {
        label: 'De novo AC',
        counts: [
          ['Proband', '2'],
          ['Sibling', '5'],
        ],
      },
      {
        label: 'Inherited proband AC',
        counts: [
          ['Transmitted', '7'],
          ['Untransmitted', '9'],
        ],
      },
      {
        label: 'Case-Control AC',
        counts: [
          ['Case', '2'],
          ['Control', '0'],
        ],
      },
    ]

    expectedGroups.forEach(({ label, counts }) => {
      const groupLabel = screen.getByText(label)
      const groupContainer = groupLabel.parentElement
      if (!groupContainer) {
        throw new Error(`Missing count group container: ${label}`)
      }
      counts.forEach(([countLabel, value]) => {
        expect(within(groupContainer).getByText(`${countLabel}:`).parentElement).toHaveTextContent(
          `${countLabel}:${value}`
        )
      })
      expect(within(groupContainer).queryByText('MPC:')).not.toBeInTheDocument()
    })

    expect(Array.from(container.querySelectorAll('dt'), (term) => term.textContent)).toEqual([
      'MPC:',
      'De novo AC',
      'Proband:',
      'Sibling:',
      'Inherited proband AC',
      'Transmitted:',
      'Untransmitted:',
      'Case-Control AC',
      'Case:',
      'Control:',
      'HGVSc:',
      'HGVSp:',
      'Consequence:',
    ])
    expect(screen.getByText('MPC:').parentElement).toHaveTextContent('MPC:3.2')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('merges additional summary columns into their existing count group', () => {
    render(
      <VariantDetails
        {...props}
        variant={variant}
        variantResultColumns={columns.filter((column) => column.heading !== 'Sibling')}
        additionalVariantDetailSummaryColumns={[
          { key: 'group_result.de_novo_ac_sibling', heading: 'Sibling', group: deNovoGroup },
        ]}
        variantDetailsSingleAnalysisGroup
      />
    )

    expect(screen.getAllByText('De novo AC')).toHaveLength(1)
    const groupContainer = screen.getByText('De novo AC').parentElement
    if (!groupContainer) {
      throw new Error('Missing de novo count group container')
    }
    expect(within(groupContainer).getByText('Sibling:').parentElement).toHaveTextContent(
      'Sibling:5'
    )
  })

  it.each(['SCHEMA', 'BipEx', 'IBD'])(
    'keeps the flat summary for %s even when columns carry group metadata',
    (datasetId) => {
      render(
        <VariantDetails
          {...props}
          datasetId={datasetId}
          variant={variant}
          variantResultColumns={columns}
          variantDetailsSingleAnalysisGroup
        />
      )

      expect(screen.queryByText('De novo AC')).not.toBeInTheDocument()
      expect(screen.queryByText('Inherited proband AC')).not.toBeInTheDocument()
      expect(screen.queryByText('Case-Control AC')).not.toBeInTheDocument()
      expect(screen.getByText('Proband:').parentElement).toHaveTextContent('Proband:2')
      expect(screen.getByText('Sibling:').parentElement).toHaveTextContent('Sibling:5')
      expect(screen.getByText('Transmitted:').parentElement).toHaveTextContent('Transmitted:7')
      expect(screen.getByText('Untransmitted:').parentElement).toHaveTextContent('Untransmitted:9')
      expect(screen.getByText('Case:').parentElement).toHaveTextContent('Case:2')
      expect(screen.getByText('Control:').parentElement).toHaveTextContent('Control:0')
    }
  )
})
