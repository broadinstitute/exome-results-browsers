import PropTypes from 'prop-types'
import React from 'react'

import { Checkbox } from '@gnomad/ui'

const GP2VariantFilter = ({ value, onChange }) => (
  <Checkbox
    checked={value.onlyInAnalysis}
    id="in-analysis-filter"
    label="Show only variants in analaysis"
    onChange={(onlyInAnalysis) => {
      onChange({ ...value, onlyInAnalysis })
    }}
  />
)

GP2VariantFilter.propTypes = {
  value: PropTypes.shape({
    onlyInAnalysis: PropTypes.bool.isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
}

export default GP2VariantFilter
