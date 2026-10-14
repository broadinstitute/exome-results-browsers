import { render, screen } from '@testing-library/react'
import React from 'react'

import AGBVariantClassBadge, {
  AGB_VARIANT_CLASS_COLORS,
  compareAGBVariantClassSeverity,
} from './AGBVariantClassBadge'
import { AGBVariantClass } from './agbTypes'

describe('AGBVariantClassBadge', () => {
  it.each(Object.keys(AGB_VARIANT_CLASS_COLORS))(
    'renders %s with the color sampled from fig3_variant_callset.png',
    (variantClass) => {
      render(<AGBVariantClassBadge variantClass={variantClass} />)

      const badge = screen.getByText(variantClass === 'synonymous' ? 'Synonymous' : variantClass)

      expect(badge).toHaveStyle({
        background: AGB_VARIANT_CLASS_COLORS[variantClass as AGBVariantClass],
      })
    }
  )

  it('falls back to a neutral color for an unrecognized class instead of throwing', () => {
    render(<AGBVariantClassBadge variantClass="unexpected-future-class" />)

    expect(screen.getByText('unexpected-future-class')).toBeInTheDocument()
  })
})

describe('compareAGBVariantClassSeverity', () => {
  it('orders classes by severity, matching CLASS_SEVERITY_RANK in the data pipeline', () => {
    const classes = ['synonymous', 'Mis0', 'PTV', 'Mis1', 'Mis2']

    expect([...classes].sort(compareAGBVariantClassSeverity)).toEqual([
      'PTV',
      'Mis2',
      'Mis1',
      'Mis0',
      'synonymous',
    ])
  })

  it('sorts an unrecognized class after every known class', () => {
    expect(compareAGBVariantClassSeverity('unexpected-future-class', 'synonymous')).toBeGreaterThan(
      0
    )
  })
})
