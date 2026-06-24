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
  if (value === 'Infinity') {
    return '∞'
  }
  if (value === 0) {
    return '0'
  }
  const floatValue = typeof value === 'string' ? parseFloat(value) : value
  if (Number.isNaN(floatValue)) {
    return value
  }
  return floatValue.toFixed(precision)
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
  zeroValue: string
  decimalPlaces: number
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
