import { render, screen } from '@testing-library/react'
import React from 'react'

import { renderASC2BayesFactor, renderASC2FalseDiscoveryRate } from './ascNumberFormatting'

describe('renderASC2BayesFactor', () => {
  it('shows two decimal places as a plain number for values at or under 1000', () => {
    render(<div>{renderASC2BayesFactor(3.14159)}</div>)
    expect(screen.getByText('3.14')).toBeInTheDocument()

    render(<div>{renderASC2BayesFactor(1000)}</div>)
    expect(screen.getByText('1000.00')).toBeInTheDocument()
  })

  it('switches to two-decimal scientific notation above 1000', () => {
    render(<div>{renderASC2BayesFactor(123456.789)}</div>)
    expect(screen.getByText('1.23e+5')).toBeInTheDocument()
  })

  it('applies the same threshold to large negative values', () => {
    render(<div>{renderASC2BayesFactor(-123456.789)}</div>)
    expect(screen.getByText('-1.23e+5')).toBeInTheDocument()
  })

  it('renders a dash for null or undefined', () => {
    expect(renderASC2BayesFactor(null)).toBe('-')
    expect(renderASC2BayesFactor(undefined)).toBe('-')
  })
})

describe('renderASC2FalseDiscoveryRate', () => {
  it('shows two-decimal scientific notation for values at or above the floor', () => {
    render(<div>{renderASC2FalseDiscoveryRate(0.000123)}</div>)
    expect(screen.getByText('1.23e-4')).toBeInTheDocument()
  })

  it('shows a floor instead of rounding to zero below 1e-16', () => {
    render(<div>{renderASC2FalseDiscoveryRate(1e-20)}</div>)
    expect(screen.getByText('< 1e-16')).toBeInTheDocument()
  })

  it('shows the floor for an exact 0 instead of "0.00e+0"', () => {
    render(<div>{renderASC2FalseDiscoveryRate(0)}</div>)
    expect(screen.getByText('< 1e-16')).toBeInTheDocument()
  })

  it('renders a dash for null or undefined', () => {
    expect(renderASC2FalseDiscoveryRate(null)).toBe('-')
    expect(renderASC2FalseDiscoveryRate(undefined)).toBe('-')
  })
})
