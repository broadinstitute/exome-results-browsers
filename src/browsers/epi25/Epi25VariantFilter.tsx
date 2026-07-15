import React from 'react'

import { Checkbox } from '@gnomad/ui'

type Epi25VariantFilterValue = {
  onlyInAnalysis: boolean
}

interface Epi25VariantFilterProps {
  value: Epi25VariantFilterValue
  onChange: (newValue: Epi25VariantFilterValue) => void
}

const Epi25VariantFilter = ({ value, onChange }: Epi25VariantFilterProps) => (
  <Checkbox
    checked={value.onlyInAnalysis}
    id="in-analysis-filter"
    label="Show only variants in analysis"
    onChange={(onlyInAnalysis: boolean) => {
      onChange({ ...value, onlyInAnalysis })
    }}
  />
)

export default Epi25VariantFilter
