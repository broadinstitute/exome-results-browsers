import PropTypes from 'prop-types'
import React from 'react'

import { Checkbox } from '@gnomad/ui'

const ASCVariantFilter = ({ value, onChange }) => (
  <Checkbox
    checked={value.onlyInAnalysis}
    id="in-analysis-filter"
    label="Show only variants in analysis"
    onChange={(onlyInAnalysis) => {
      onChange({ ...value, onlyInAnalysis })
    }}
  />
)

ASCVariantFilter.propTypes = {
  value: PropTypes.shape({
    onlyInAnalysis: PropTypes.bool.isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
}

export default ASCVariantFilter
