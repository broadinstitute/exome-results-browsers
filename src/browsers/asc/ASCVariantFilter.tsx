import React from 'react'

import { Checkbox } from '@gnomad/ui'

type ASCVariantFilterValue = {
  onlyInAnalysis: boolean
}

interface ASCVariantFilterProps {
  value: ASCVariantFilterValue
  onChange: (newValue: ASCVariantFilterValue) => void
}

const ASCVariantFilter = ({ value, onChange }: ASCVariantFilterProps) => (
  <Checkbox
    checked={value.onlyInAnalysis}
    id="in-analysis-filter"
    label="Show only variants in analysis"
    onChange={(onlyInAnalysis: boolean) => {
      onChange({ ...value, onlyInAnalysis })
    }}
  />
)

export default ASCVariantFilter
