import React from 'react'
import { SizeMeProps, withSize } from 'react-sizeme'
import styled from 'styled-components'

// @ts-expect-error: no types in this @gnomad/ui version
import { ManhattanPlot } from '@gnomad/manhattan-plot'
import { GeneRow } from './geneResultTableColumns'

interface GeneResultsManhattanPlotProps {
  pValueColumn?: string
  results: GeneRow[]
  height: number
  width: number
  [key: string]: any
}

const VALID_MANHATTAN_PACKAGE_CHROMOSOMES = new Set(
  Array.from(new Array(22), (_, i) => `${i + 1}`).concat(['X', 'Y'])
)

const GeneResultsManhattanPlot = ({
  pValueColumn = 'pval',
  results,
  height,
  width,
  ...otherProps
}: GeneResultsManhattanPlotProps) => {
  const renderedDataPoints = results
    .filter((r) => {
      return (
        r.chrom &&
        r.pos &&
        r[pValueColumns] &&
        VALID_MANHATTAN_PACKAGE_CHROMOSOMES.has(r.chrom)
      )
    })
    .map((r) => ({ ...r, pval: r[pValueColumn]}))

  return (
    <ManhattanPlot
      {...otherProps}
      dataPoints={renderedDataPoints}
      pointLabel={(d: GeneRow) => `${d.gene_symbol || d.gene_id} (p = ${d.pval.toExponential(3)})`}
      yLabel={'-log\u2081\u2080(p)'}
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

const AutosizedGeneResultsManhattanPlot = withSize()(({ size, ...otherProps }: SizeMeProps) => (
  <Wrapper>
    {Boolean(size.width) && (
      <GeneResultsManhattanPlot height={500} width={size.width!} {...(otherProps as any)} />
    )}
  </Wrapper>
))

export default AutosizedGeneResultsManhattanPlot
