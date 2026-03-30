import React from 'react'
import { withSize, SizeMeProps } from 'react-sizeme'
import styled from 'styled-components'

// @ts-expect-error: no types in this @gnomad/ui version
import { QQPlot } from '@gnomad/qq-plot'
import { GeneRow } from './geneResultTableColumns'

interface AutosizedGeneResultsQQPlotProps {
  pValueColumn: string
  results: GeneRow[]
  [key: string]: any
}

interface GeneResultsQQPlotProps extends AutosizedGeneResultsQQPlotProps {
  height: number
  width: number
}

const GeneResultsQQPlot = ({
  pValueColumn = 'pval',
  results,
  height,
  width,
  ...otherProps
}: GeneResultsQQPlotProps) => {
  const renderedDataPoints = results
    .filter((r) => r[pValueColumn])
    .map((r) => ({ ...r, pval: r[pValueColumn] }))

  return (
    <QQPlot
      height={height}
      width={width}
      dataPoints={renderedDataPoints}
      pointLabel={(d: GeneRow) => d.gene_symbol || d.gene_id}
      xLabel={'Expected -log\u2081\u2080(p)'}
      yLabel={'Observed -log\u2081\u2080(p)'}
      onClickPoint={(d: GeneRow) => {
        window.open(`/gene/${d.gene_id}`)
      }}
      {...otherProps}
    />
  )
}

const Wrapper = styled.div`
  overflow: hidden;
  width: 100%;
`

const AutosizedGeneResultsQQPlot = withSize()(
  ({ size, ...otherProps }: SizeMeProps & AutosizedGeneResultsQQPlotProps) => {
    return (
      <Wrapper>
        {Boolean(size.width) && (
          <GeneResultsQQPlot height={500} width={size.width!} {...otherProps} />
        )}
      </Wrapper>
    )
  }
)

export default AutosizedGeneResultsQQPlot
