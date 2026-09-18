import React from 'react'

import { InputData, NumberCell } from '../base/tableCells'

const BAYES_FACTOR_SCIENTIFIC_NOTATION_THRESHOLD = 1000
const FDR_DISPLAY_FLOOR = 1e-16

const toFloat = (value: InputData): number | null => {
  if (value === null || value === undefined) {
    return null
  }
  const floatValue = typeof value === 'string' ? parseFloat(value) : value
  return Number.isNaN(floatValue) ? null : floatValue
}

// Bayes Factor magnitudes routinely span tiny to very large; scientific
// notation is reserved for values over the threshold so everyday values stay
// readable as plain decimals. Downloads keep the exact value; this is
// display-only formatting.
export const renderASC2BayesFactor = (value: InputData) => {
  const floatValue = toFloat(value)
  if (floatValue === null) {
    return '-'
  }

  const formatted =
    Math.abs(floatValue) > BAYES_FACTOR_SCIENTIFIC_NOTATION_THRESHOLD
      ? floatValue.toExponential(2)
      : floatValue.toFixed(2)

  return <NumberCell>{formatted}</NumberCell>
}

// FDR values below this floor round to "0.00e+0" at 2 decimal places, which
// reads as exactly zero; show a floor instead. Downloads keep the exact
// value; this is display-only formatting.
export const renderASC2FalseDiscoveryRate = (value: InputData) => {
  const floatValue = toFloat(value)
  if (floatValue === null) {
    return '-'
  }

  if (Math.abs(floatValue) < FDR_DISPLAY_FLOOR) {
    return <NumberCell>{'< 1e-16'}</NumberCell>
  }

  return <NumberCell>{floatValue.toExponential(2)}</NumberCell>
}
