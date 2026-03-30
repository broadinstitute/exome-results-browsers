import React from 'react'
import styled from 'styled-components'

import { BaseTable, TooltipAnchor, TooltipHint } from '@gnomad/ui'

import HelpButton from '../base/HelpButton'
import StyledContent from '../base/StyledContent'
import geneResultsDescription from './content/generesults.md'

const Table = styled(BaseTable)`
  min-width: 325px;
`

const renderOddsRatio = (value: number | null | 'Infinity') => {
  if (value === null) {
    return '-'
  }
  if (value === 'Infinity') {
    return '∞'
  }
  if (value === 0) {
    return '0'
  }
  return value.toPrecision(3)
}

type SchemaGeneResult = {
  'Case PTV': number
  'Ctrl PTV': number
  'Case mis3': number
  'Ctrl mis3': number
  'Case mis2': number
  'Ctrl mis2': number
  'P ca/co (Class 1)': number
  'P ca/co (Class 2)': number
  'P ca/co (comb)': number
  'De novo PTV': number
  'De novo mis3': number
  'De novo mis2': number
  'P de novo': number
  'P meta': number
  'Q meta': number
  'OR (PTV)': number
  'OR (Class I)': number
  'OR (Class II)': number
  'OR (PTV) lower bound': number
  'OR (PTV) upper bound': number
  'OR (Class I) lower bound': number
  'OR (Class I) upper bound': number
  'OR (Class II) lower bound': number
  'OR (Class II) upper bound': number
}

interface SchemaGeneResultProps {
  result: SchemaGeneResult
}

const SCHEMAGeneResult = ({ result }: SchemaGeneResultProps) => (
  <div>
    <Table>
      <thead>
        <tr>
          <th scope="col" style={{ width: '50px' }}>
            Class
          </th>
          <th scope="col">Consequence</th>
          <th scope="col" style={{ paddingLeft: '10px', borderLeft: '1px solid #ccc' }}>
            Cases
          </th>
          <th scope="col">Controls</th>
          <th scope="col" style={{ paddingLeft: '10px' }}>
            Odds Ratio
          </th>
          <th scope="col" style={{ paddingLeft: '10px' }}>
            Case/Control <span style={{ fontStyle: 'italic' }}>P</span>-value
          </th>
          <th scope="col" style={{ paddingLeft: '10px', borderLeft: '1px solid #ccc' }}>
            <span style={{ fontStyle: 'italic' }}>De Novos</span>
          </th>
          <th scope="col">
            <span style={{ fontStyle: 'italic' }}>De Novo</span>{' '}
            <span style={{ fontStyle: 'italic' }}>P</span>-value
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td rowSpan={2}>{'\u2160'}</td>
          <th scope="row">
            <TooltipAnchor tooltip="Protein truncating variant (PTVs) or putatively loss-of-function variants: stop-gained, frameshift, and essential splice donor or acceptor variants.">
              <TooltipHint style={{ backgroundPosition: '0 1.11em' }}>PTV</TooltipHint>
            </TooltipAnchor>
          </th>
          <td style={{ paddingLeft: '10px', borderLeft: '1px solid #ccc' }}>
            {result['Case PTV'] === null ? '—' : result['Case PTV']}
          </td>
          <td>{result['Ctrl PTV'] === null ? '—' : result['Ctrl PTV']}</td>
          <td rowSpan={2} style={{ paddingLeft: '10px' }}>
            {renderOddsRatio(result['OR (Class I)'])}
          </td>
          <td rowSpan={2} style={{ paddingLeft: '10px' }}>
            {result['P ca/co (Class 1)'] === null
              ? '—'
              : result['P ca/co (Class 1)'].toPrecision(3)}
          </td>
          <td style={{ paddingLeft: '10px', borderLeft: '1px solid #ccc' }}>
            {result['De novo PTV'] === null ? '—' : result['De novo PTV']}
          </td>
          <td rowSpan={3} style={{ paddingLeft: '10px' }}>
            {result['P de novo'] === null ? '—' : result['P de novo'].toPrecision(3)}
          </td>
        </tr>
        <tr>
          <th scope="row">
            <TooltipAnchor tooltip="MPC-prioritized missense variants: missense variants with an MPC score above the described threshold.">
              <TooltipHint style={{ backgroundPosition: '0 1.11em' }}>
                Missense (MPC&nbsp;&ge;&nbsp;3)
              </TooltipHint>
            </TooltipAnchor>
          </th>
          <td style={{ paddingLeft: '10px', borderLeft: '1px solid #ccc' }}>
            {result['Case mis3'] === null ? '—' : result['Case mis3']}
          </td>
          <td>{result['Ctrl mis3'] === null ? '—' : result['Ctrl mis3']}</td>
          <td style={{ paddingLeft: '10px', borderLeft: '1px solid #ccc' }}>
            {result['De novo mis3'] === null ? '—' : result['De novo mis3']}
          </td>
        </tr>
        <tr>
          <td>{'\u2161'}</td>
          <th scope="row">
            <TooltipAnchor tooltip="MPC-prioritized missense variants: missense variants with an MPC score in the described range.">
              <TooltipHint style={{ backgroundPosition: '0 1.11em' }}>
                Missense (3&nbsp;&gt;&nbsp;MPC&nbsp;&ge;&nbsp;2)
              </TooltipHint>
            </TooltipAnchor>
          </th>
          <td style={{ paddingLeft: '10px', borderLeft: '1px solid #ccc' }}>
            {result['Case mis2'] === null ? '—' : result['Case mis2']}
          </td>
          <td>{result['Ctrl mis2'] === null ? '—' : result['Ctrl mis2']}</td>

          <td style={{ paddingLeft: '10px' }}>{renderOddsRatio(result['OR (Class II)'])}</td>
          <td style={{ paddingLeft: '10px' }}>
            {result['P ca/co (Class 2)'] === null
              ? '—'
              : result['P ca/co (Class 2)'].toPrecision(3)}
          </td>
          <td style={{ paddingLeft: '10px', borderLeft: '1px solid #ccc' }}>
            {result['De novo mis2'] === null ? '—' : result['De novo mis2']}
          </td>
        </tr>
      </tbody>
    </Table>
    <p style={{ fontWeight: 'bold' }}>
      Meta-analysis <span style={{ fontStyle: 'italic' }}>P</span>-value:{' '}
      {result['P meta'] === null ? '—' : result['P meta'].toPrecision(3)}
    </p>
    <p style={{ fontWeight: 'bold' }}>
      Meta-analysis <span style={{ fontStyle: 'italic' }}>Q</span>-value:{' '}
      {result['Q meta'] === null ? '—' : result['Q meta'].toPrecision(3)}
    </p>
  </div>
)

interface SchemaGeneResultsProps {
  results: {
    meta: SchemaGeneResult
  }
}

const SCHEMAGeneResults = ({ results }: SchemaGeneResultsProps) => (
  <>
    <h2>
      Gene Result{' '}
      <HelpButton
        popupTitle="Gene Result"
        popupContent={
          <StyledContent dangerouslySetInnerHTML={{ __html: geneResultsDescription.html }} />
        }
      />
    </h2>
    {results.meta ? <SCHEMAGeneResult result={results.meta} /> : <p>No result for this gene.</p>}
  </>
)

export default SCHEMAGeneResults
