import React from 'react'
import styled from 'styled-components'

const CountCell = styled.span`
  overflow: hidden;
  width: 100%;
  padding-right: 25px;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export const renderCount = (value: any) => <CountCell>{value} </CountCell>

const NumberCell = styled.span`
  overflow: hidden;
  width: 100%;
  padding-right: 15px;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
`
export type InputData = number | string | null | undefined

const POSITIVE_INFINITY_STRINGS = new Set(['inf', 'infinity', '+inf', '+infinity'])
const NEGATIVE_INFINITY_STRINGS = new Set(['-inf', '-infinity'])

// normalize infinity strings to allow numeric sorting, some upstream datasets call it "Infinity" and some "Inf"
export const parseNumericValue = (value: InputData): number => {
  if (value === null || value === undefined || value === '') {
    return NaN
  }
  if (typeof value === 'number') {
    return value
  }
  const normalized = value.trim().toLowerCase()
  if (POSITIVE_INFINITY_STRINGS.has(normalized)) {
    return Infinity
  }
  if (NEGATIVE_INFINITY_STRINGS.has(normalized)) {
    return -Infinity
  }
  return parseFloat(value)
}

export const renderOddsRatio = ({
  value,
  precision = 2,
}: {
  value: InputData
  precision?: number
}) => {
  if (value === null || value === undefined) {
    return '-'
  }
  if (value === 0) {
    return '0'
  }
  const floatValue = parseNumericValue(value)
  if (floatValue === Infinity) {
    return '∞'
  }
  if (floatValue === -Infinity) {
    return '-∞'
  }
  if (Number.isNaN(floatValue)) {
    return value
  }
  return floatValue.toFixed(precision)
}

export const renderOddsRatioCI = ({
  oddsRatio,
  confidenceInterval,
}: {
  oddsRatio: InputData
  confidenceInterval: InputData
}) => {
  const renderedOddsRatio = renderOddsRatio({ value: oddsRatio })
  if (renderedOddsRatio === '-') {
    return '-'
  }

  if (
    confidenceInterval === null ||
    confidenceInterval === undefined ||
    confidenceInterval === ''
  ) {
    return '-'
  }

  return `(${confidenceInterval})`
}

export const renderStringOrFloatPvalueAsScientific = ({
  value,
  zeroValue = '0',
  decimalPlaces = 3,
}: {
  value: InputData
  zeroValue?: string
  decimalPlaces?: number
}) => {
  if (value === null || value == undefined) {
    return '-'
  }

  if (value === 0) {
    return '0'
  }

  const floatValue = typeof value == 'string' ? parseFloat(value) : value
  if (Number.isNaN(floatValue)) {
    return value
  }

  return renderFloatAsScientific({
    value: floatValue,
    zeroValue: zeroValue,
    decimalPlaces: decimalPlaces,
  })
}

export const renderFloatAsScientific = ({
  value,
  zeroValue = '0',
  decimalPlaces = 3,
}: {
  value: InputData
  zeroValue?: string
  decimalPlaces?: number
}) => {
  if (value === null || value === undefined) {
    return '-'
  }

  const floatValue = typeof value == 'string' ? parseFloat(value) : value
  if (Number.isNaN(floatValue)) {
    return value
  }

  if (floatValue === 0) {
    return <NumberCell>{zeroValue}</NumberCell>
  }
  return <NumberCell>{floatValue.toExponential(decimalPlaces)} </NumberCell>
}

export const renderStringOrFloatAsDecimal = ({
  value,
  zeroValue = '0',
  decimalPlaces = 3,
}: {
  value: InputData
  zeroValue?: string
  decimalPlaces?: number
}) => {
  if (value === null || value === undefined) {
    return ''
  }

  const floatValue = typeof value === 'string' ? parseFloat(value) : value
  if (Number.isNaN(floatValue)) {
    return value
  }

  if (floatValue === 0) {
    return <NumberCell>{zeroValue}</NumberCell>
  }

  return <NumberCell>{floatValue.toFixed(decimalPlaces)} </NumberCell>
}
