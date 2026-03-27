import PropTypes from 'prop-types'
import React from 'react'

import { Checkbox } from '@gnomad/ui'

const SCHEMAVariantFilter = ({ value, onChange }) => (
  <>
    <Checkbox
      checked={value.onlyInAnalysis}
      id="in-analysis-filter"
      label="Show only variants in analysis"
      onChange={(onlyInAnalysis) => {
        onChange({ ...value, onlyInAnalysis })
      }}
    />
    <Checkbox
      checked={value.onlyDeNovo}
      id="de-novo-filter"
      label="Show only de novo variants"
      onChange={(onlyDeNovo) => {
        onChange({ ...value, onlyDeNovo })
      }}
    />
  </>
)

SCHEMAVariantFilter.propTypes = {
  value: PropTypes.shape({
    onlyInAnalysis: PropTypes.bool.isRequired,
    onlyDeNovo: PropTypes.bool.isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
}

export default SCHEMAVariantFilter
