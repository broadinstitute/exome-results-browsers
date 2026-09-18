import { render, screen } from '@testing-library/react'
import React from 'react'

import ASC2VariantClassBadge, {
  ASC2_VARIANT_CLASS_COLORS,
  compareASC2VariantClassSeverity,
} from './ASC2VariantClassBadge'

describe('ASC2VariantClassBadge', () => {
  it.each(Object.keys(ASC2_VARIANT_CLASS_COLORS))(
    'renders %s with the color sampled from fig3_variant_callset.png',
    (variantClass) => {
      render(<ASC2VariantClassBadge variantClass={variantClass} />)

      const badge = screen.getByText(variantClass === 'synonymous' ? 'Synonymous' : variantClass)

      expect(badge).toHaveStyle({ background: ASC2_VARIANT_CLASS_COLORS[variantClass] })
    }
  )

  it('falls back to a neutral color for an unrecognized class instead of throwing', () => {
    render(<ASC2VariantClassBadge variantClass="unexpected-future-class" />)

    expect(screen.getByText('unexpected-future-class')).toBeInTheDocument()
  })
})

describe('compareASC2VariantClassSeverity', () => {
  it('orders classes by severity, matching CLASS_SEVERITY_RANK in the data pipeline', () => {
    const classes = ['synonymous', 'Mis0', 'PTV', 'Mis1', 'Mis2']

    expect([...classes].sort(compareASC2VariantClassSeverity)).toEqual([
      'PTV',
      'Mis2',
      'Mis1',
      'Mis0',
      'synonymous',
    ])
  })

  it('sorts an unrecognized class after every known class', () => {
    expect(compareASC2VariantClassSeverity('unexpected-future-class', 'synonymous')).toBeGreaterThan(0)
  })
})
