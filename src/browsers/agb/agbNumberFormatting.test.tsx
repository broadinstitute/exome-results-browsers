import { render, screen } from '@testing-library/react'
import React from 'react'

import { renderAGBBayesFactor, renderAGBFalseDiscoveryRate } from './agbNumberFormatting'

describe('renderAGBBayesFactor', () => {
  it('shows two decimal places as a plain number for values at or under 1000', () => {
    render(<div>{renderAGBBayesFactor(3.14159)}</div>)
    expect(screen.getByText('3.14')).toBeInTheDocument()

    render(<div>{renderAGBBayesFactor(1000)}</div>)
    expect(screen.getByText('1000.00')).toBeInTheDocument()
  })

  it('switches to two-decimal scientific notation above 1000', () => {
    render(<div>{renderAGBBayesFactor(123456.789)}</div>)
    expect(screen.getByText('1.23e+5')).toBeInTheDocument()
  })

  it('applies the same threshold to large negative values', () => {
    render(<div>{renderAGBBayesFactor(-123456.789)}</div>)
    expect(screen.getByText('-1.23e+5')).toBeInTheDocument()
  })

  it('renders a dash for null or undefined', () => {
    expect(renderAGBBayesFactor(null)).toBe('-')
    expect(renderAGBBayesFactor(undefined)).toBe('-')
  })
})

describe('renderAGBFalseDiscoveryRate', () => {
  it('shows two-decimal scientific notation for values at or above the floor', () => {
    render(<div>{renderAGBFalseDiscoveryRate(0.000123)}</div>)
    expect(screen.getByText('1.23e-4')).toBeInTheDocument()
  })

  it('shows a floor instead of rounding to zero below 1e-16', () => {
    render(<div>{renderAGBFalseDiscoveryRate(1e-20)}</div>)
    expect(screen.getByText('< 1e-16')).toBeInTheDocument()
  })

  it('shows the floor for an exact 0 instead of "0.00e+0"', () => {
    render(<div>{renderAGBFalseDiscoveryRate(0)}</div>)
    expect(screen.getByText('< 1e-16')).toBeInTheDocument()
  })

  it('renders a dash for null or undefined', () => {
    expect(renderAGBFalseDiscoveryRate(null)).toBe('-')
    expect(renderAGBFalseDiscoveryRate(undefined)).toBe('-')
  })
})
