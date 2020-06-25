import PropTypes from 'prop-types'
import React from 'react'
import { withSize } from 'react-sizeme'
import styled from 'styled-components'

import { QQPlot } from '@gnomad/qq-plot'

const GeneResultsQQPlot = ({ pValueColumn, results, ...otherProps }) => {
  const renderedDataPoints = results
    .filter((r) => r[pValueColumn])
    .map((r) => ({ ...r, pval: r[pValueColumn] }))

  return (
    <QQPlot
      {...otherProps}
      dataPoints={renderedDataPoints}
      pointLabel={(d) => d.gene_symbol || d.gene_id}
      onClickPoint={(d) => {
        window.open(`/gene/${d.gene_id}`)
      }}
    />
  )
}

GeneResultsQQPlot.propTypes = {
  pValueColumn: PropTypes.string,
  results: PropTypes.arrayOf(PropTypes.object).isRequired,
}

GeneResultsQQPlot.defaultProps = {
  pValueColumn: 'pval',
}

const Wrapper = styled.div`
  overflow: hidden;
  width: 100%;
`

const AutosizedGeneResultsQQPlot = withSize()(({ size, ...otherProps }) => (
  <Wrapper>
    {Boolean(size.width) && <GeneResultsQQPlot height={500} width={size.width} {...otherProps} />}
  </Wrapper>
))

export default AutosizedGeneResultsQQPlot
