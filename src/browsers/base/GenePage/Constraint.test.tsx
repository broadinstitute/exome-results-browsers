import React from 'react'
import { render, screen, within } from '@testing-library/react'

import { Constraint, ExacConstraintTable, GnomadConstraintTable } from './Constraint'

const constraint: Constraint = {
  exp_lof: null,
  exp_mis: null,
  exp_syn: null,
  obs_lof: null,
  obs_mis: null,
  obs_syn: null,
  oe_lof: 0.1,
  oe_mis: null,
  oe_syn: null,
  lof_z: null,
  mis_z: null,
  syn_z: null,
  pLI: 0.99,
}

describe('gnomAD constraint highlights', () => {
  it.each<[string, 'syn_z' | 'mis_z', number | null, boolean, string]>([
    ['Synonymous', 'syn_z', 3.71, false, '#ff2600'],
    ['Synonymous', 'syn_z', 3.7101, true, '#ff2600'],
    ['Missense', 'mis_z', 3.09, false, '#ff9300'],
    ['Missense', 'mis_z', 3.0901, true, '#ff9300'],
    ['Missense', 'mis_z', 0, false, '#ff9300'],
    ['Missense', 'mis_z', -4, false, '#ff9300'],
    ['Missense', 'mis_z', null, false, '#ff9300'],
  ])('checks %s %s = %s at its strict threshold', (category, field, value, highlighted, color) => {
    render(<GnomadConstraintTable constraint={{ ...constraint, [field]: value }} />)
    const row = screen.getByRole('row', { name: new RegExp(`^${category} `) })
    const number = row.querySelector('span[title]')
    if (highlighted) {
      expect(number).toHaveStyle(`background-color: ${color}`)
      expect(number).toHaveAttribute('title', expect.stringContaining(`${value}`))
    } else {
      expect(number).toBeNull()
    }
  })

  it.each([
    [0, '#ff2600'],
    [0.3299, '#ff2600'],
    [0.33, '#ff9300'],
    [0.6599, '#ff9300'],
    [0.66, '#ffc000'],
    [0.9999, '#ffc000'],
    [1, null],
    [1.2, null],
  ])('colors LOEUF %s using the unrounded upper bound', (upper, color) => {
    render(
      <GnomadConstraintTable constraint={{ ...constraint, oe_lof_lower: 0, oe_lof_upper: upper }} />
    )
    const row = screen.getByRole('row', { name: /^pLoF / })
    expect(row).toHaveTextContent(`o/e = 0.1 (0 - ${Number(upper.toFixed(2))})`)
    const number = within(row).queryByTitle(`LOEUF, pLoF o/e upper confidence bound: ${upper}`)
    if (color) {
      expect(number).toHaveStyle(`background-color: ${color}`)
    } else {
      expect(number).toBeNull()
    }
    expect(within(row).getByText('pLI = 0.99')).not.toHaveAttribute('title')
  })

  it.each([null, undefined])('keeps legacy data without bounds usable: %s', (upper) => {
    render(<GnomadConstraintTable constraint={{ ...constraint, oe_lof_upper: upper }} />)
    expect(screen.getByText('o/e = 0.1')).toBeInTheDocument()
    expect(screen.queryByTitle(/LOEUF/)).not.toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('leaves ExAC metrics unhighlighted', () => {
    const { container } = render(
      <ExacConstraintTable constraint={{ ...constraint, syn_z: 4, mis_z: 4 }} />
    )
    expect(container.querySelector('span[title]')).toBeNull()
  })
})
