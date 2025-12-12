import PropTypes from 'prop-types'
import React from 'react'
import { withSize } from 'react-sizeme'
import styled from 'styled-components'

import { ManhattanPlot } from '@gnomad/manhattan-plot'

const VALID_MANHATTAN_PACKAGE_CHROMOSOMES = new Set(
  Array.from(new Array(22), (_, i) => `${i + 1}`).concat(['X', 'Y'])
)

const GeneResultsManhattanPlot = ({ pValueColumn, results, ...otherProps }) => {
  const renderedDataPoints = results
    .filter((r) => {
      return (
        r.chrom &&
        r.pos &&
        r[pValueColumn] &&
        VALID_MANHATTAN_PACKAGE_CHROMOSOMES.has(r.chrom)
      )
    })
    .map((r) => ({ ...r, pval: r[pValueColumn]}))

  return (
    <ManhattanPlot
      {...otherProps}
      dataPoints={renderedDataPoints}
      pointLabel={(d) => `${d.gene_symbol || d.gene_id} (p = ${d.pval.toExponential(3)})`}
      yLabel={'-log\u2081\u2080(p)'}
      onClickPoint={(d) => {
        window.open(`/gene/${d.gene_id}`)
      }}
    />
  )
}

GeneResultsManhattanPlot.propTypes = {
  pValueColumn: PropTypes.string,
  results: PropTypes.arrayOf(PropTypes.object).isRequired,
}

GeneResultsManhattanPlot.defaultProps = {
  pValueColumn: 'pval',
}

const Wrapper = styled.div`
  overflow: hidden;
  width: 100%;
`

const AutosizedGeneResultsManhattanPlot = withSize()(({ size, ...otherProps }) => (
  <Wrapper>
    {Boolean(size.width) && (
      <GeneResultsManhattanPlot height={500} width={size.width} {...otherProps} />
    )}
  </Wrapper>
))

export default AutosizedGeneResultsManhattanPlot
