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

export const renderCount = (value) => <CountCell>{value}</CountCell>

const NumberCell = styled.span`
  overflow: hidden;
  width: 100%;
  padding-right: 15px;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export const renderFloatAsScientific = (value) => {
  if (value === null) {
    return ''
  }

  const truncated = Number(value.toPrecision(3))
  if (truncated === 0) {
    return <NumberCell>0</NumberCell>
  }
  return <NumberCell>{truncated.toExponential()}</NumberCell>
}

export const renderFloatAsDecimal = (value) => {
  if (value === null) {
    return ''
  }

  return <NumberCell>{value.toFixed(3)}</NumberCell>
}
