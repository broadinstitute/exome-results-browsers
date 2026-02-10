import React from 'react'
import styled from 'styled-components'

const VariantAttributeLabel = styled.dt`
  display: inline;
  font-weight: bold;
`

const VariantAttributeValue = styled.dd`
  display: inline;
  margin-left: 0.5em;
`

const VariantAttributeListItem = styled.div`
  margin-bottom: 0.25em;
`

interface VariantAttributeProps {
  children?: React.ReactNode | null,
  label: string,
}

export const VariantAttribute = ({ children = null, label }: VariantAttributeProps) => {
  return (
    <VariantAttributeListItem>
      <VariantAttributeLabel>{label}:</VariantAttributeLabel>
      <VariantAttributeValue>{children === null ? '—' : children}</VariantAttributeValue>
    </VariantAttributeListItem>
  )
}

interface VariantAttributeListProps {
  children: React.ReactNode,
  label: string,
}

export const VariantAttributeList = ({ children, label }: VariantAttributeListProps) => {
  return (
    <div>
      <h2>{label}</h2>
      <dl>{children}</dl>
    </div>
  )
}
