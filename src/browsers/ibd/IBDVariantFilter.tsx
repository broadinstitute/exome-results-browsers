import React from 'react'

import { Checkbox } from '@gnomad/ui'

type IBDVariantFilterValue = {
  onlyInAnalysis: boolean
}

interface IBDVariantFilterProps {
  value: IBDVariantFilterValue
  onChange: (newValue: IBDVariantFilterValue) => void
}

const IBDVariantFilter = ({ value, onChange }: IBDVariantFilterProps) => (
  <Checkbox
    checked={value.onlyInAnalysis}
    id="in-analysis-filter"
    label="Show only variants in analysis"
    onChange={(onlyInAnalysis: boolean) => {
      onChange({ ...value, onlyInAnalysis })
    }}
  />
)

export default IBDVariantFilter
