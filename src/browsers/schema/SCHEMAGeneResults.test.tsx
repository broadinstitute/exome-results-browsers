import React from 'react'
import { render, screen } from '@testing-library/react'

import SCHEMAGeneResults from './SCHEMAGeneResults'
import { schemaGeneResultFactory } from './schemaGeneTypes.factory'

describe('SCHEMAGeneResults', () => {
  it('renders the PTV, missense, and synonymous carrier counts and odds ratios', () => {
    const result = schemaGeneResultFactory.build({
      ptv_case_carrier: 3,
      ptv_control_carrier: 1,
      ptv_odds_ratio: '2.5',
      mis_case_carrier: 8,
      mis_control_carrier: 4,
      mis_odds_ratio: '1.8',
      syn_case_carrier: 6,
      syn_control_carrier: 6,
      syn_odds_ratio: '1.0',
    })

    render(<SCHEMAGeneResults results={{ meta: result }} />)

    expect(screen.getByText('2.50')).toBeInTheDocument()
    expect(screen.getByText('1.80')).toBeInTheDocument()
    expect(screen.getByText('1.00')).toBeInTheDocument()
  })

  it('renders the case/control and de novo p-values, and the case/control totals', () => {
    const result = schemaGeneResultFactory.build({
      schema_case_control_p_value: 0.0001234,
      case_control_plus_de_novo_p_value: 0.0005678,
      n_cases: 10000,
      n_controls: 20000,
    })

    render(<SCHEMAGeneResults results={{ meta: result }} />)

    expect(screen.getByText(/1\.234e-4/)).toBeInTheDocument()
    expect(screen.getByText(/5\.678e-4/)).toBeInTheDocument()
    expect(screen.getByText('Total cases: 10000')).toBeInTheDocument()
    expect(screen.getByText('Total controls: 20000')).toBeInTheDocument()
  })

  it('renders a "no result" message when there is no meta-analysis result for the gene', () => {
    render(<SCHEMAGeneResults results={{} as any} />)

    expect(screen.getByText('No result for this gene.')).toBeInTheDocument()
  })
})
