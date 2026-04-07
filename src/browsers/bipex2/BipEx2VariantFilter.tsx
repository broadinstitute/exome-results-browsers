import React from 'react'

import { Checkbox } from '@gnomad/ui'

type BipExVariantFilterValue = {
  onlyInAnalysis: boolean
}

interface BipExVariantFilterProps {
  value: BipExVariantFilterValue
  onChange: (newValue: BipExVariantFilterValue) => void
}

const BipExVariantFilter = ({ value, onChange }: BipExVariantFilterProps) => (
  <Checkbox
    checked={value.onlyInAnalysis}
    id="in-analysis-filter"
    label="Show only variants in analysis"
    onChange={(onlyInAnalysis: boolean) => {
      onChange({ ...value, onlyInAnalysis })
    }}
  />
)

export default BipExVariantFilter
