import React from 'react'
import { withSize, SizeMeProps } from 'react-sizeme'
import styled from 'styled-components'

// @ts-expect-error: no types in this @gnomad/ui version
import { QQPlot } from '@gnomad/qq-plot'
import { GeneRow } from './geneResultTableColumns'

interface GeneResultsQQPlotProps {
  pValueColumn: string
  results: GeneRow[]
  height: number
  width: number
  [key: string]: any
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
      {...otherProps}
      dataPoints={renderedDataPoints}
      pointLabel={(d: GeneRow) => d.gene_symbol || d.gene_id}
      xLabel={'Expected -log\u2081\u2080(p)'}
      yLabel={'Observed -log\u2081\u2080(p)'}
      onClickPoint={(d: GeneRow) => {
        window.open(`/gene/${d.gene_id}`)
      }}
    />
  )
}

const Wrapper = styled.div`
  overflow: hidden;
  width: 100%;
`

const AutosizedGeneResultsQQPlot = withSize()(({ size, ...otherProps }: SizeMeProps) => (
  <Wrapper>
    {Boolean(size.width) && (
      <GeneResultsQQPlot height={500} width={size.width!} {...(otherProps as any)} />
    )}
  </Wrapper>
))

export default AutosizedGeneResultsQQPlot
