import React from 'react'

// @ts-expect-error: no types in this @gnomad/ui version
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
