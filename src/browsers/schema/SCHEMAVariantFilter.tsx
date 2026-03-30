import React from 'react'

import { Checkbox } from '@gnomad/ui'

type SCHEMAVariantFilterValue = {
  onlyInAnalysis: boolean
  onlyDeNovo: boolean
}

interface SCHEMAVariantFilterProps {
  value: SCHEMAVariantFilterValue
  onChange: (newValue: SCHEMAVariantFilterValue) => void
}

const SCHEMAVariantFilter = ({ value, onChange }: SCHEMAVariantFilterProps) => (
  <>
    <Checkbox
      checked={value.onlyInAnalysis}
      id="in-analysis-filter"
      label="Show only variants in analysis"
      onChange={(onlyInAnalysis: boolean) => {
        onChange({ ...value, onlyInAnalysis })
      }}
    />
    <Checkbox
      checked={value.onlyDeNovo}
      id="de-novo-filter"
      label="Show only de novo variants"
      onChange={(onlyDeNovo: boolean) => {
        onChange({ ...value, onlyDeNovo })
      }}
    />
  </>
)

export default SCHEMAVariantFilter
