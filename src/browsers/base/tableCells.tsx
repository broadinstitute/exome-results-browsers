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

export const renderStringOrFloatPvalueAsScientific = (
  value: number | string | undefined | null,
  zeroValue: string,
) => {
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

  return renderFloatAsScientific(floatValue, zeroValue)
}

export const renderFloatAsScientific = (
  value: number | string | undefined | null,
  zeroValue: string,
) => {
  if (value === null || value === undefined) {
    return '-'
  }

  const floatValue = typeof value == 'string' ? parseFloat(value) : value
  if (Number.isNaN(floatValue)) {
    return value
  }

  const truncated = Number(floatValue.toPrecision(3))
  if (truncated === 0) {
    return <NumberCell>{zeroValue}</NumberCell>
  }
  return <NumberCell>{truncated.toExponential(2)} </NumberCell>
}

export const renderFloatAsDecimal = (value: number | undefined | null) => {
  if (value === null || value === undefined) {
    return ''
  }

  return <NumberCell>{value.toFixed(3)} </NumberCell>
}
