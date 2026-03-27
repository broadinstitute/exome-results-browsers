import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { BaseTable, TooltipAnchor, TooltipHint } from '@gnomad/ui'

import HelpButton from '../base/HelpButton'
import StyledContent from '../base/StyledContent'
import geneResultsDescription from './content/generesults.md'

const Table = styled(BaseTable)`
  min-width: 325px;
`

const renderOddsRatio = (value) => {
  if (value === null) {
    return '-'
  }
  if (value === 'Infinity') {
    return '∞'
  }

  if (value === 0) {
    return '0'
  }

  const float_value = parseFloat(value)
  if (isNaN(float_value)) {
    return value
  }
  return float_value.toPrecision(3)
}

const SCHEMAGeneResult = ({ result }) => {
  return (
    <div>
      <Table>
        <thead>
          <tr>
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
            <th scope="row">
              <TooltipAnchor tooltip="Protein-truncating variants (PTVs) classified as high-confidence by LOFTEE: stop-gained, frameshift, and essential splice acceptor and donor sites.">
                <TooltipHint style={{ backgroundPosition: '0 1.11em' }}>PTV</TooltipHint>
              </TooltipAnchor>
            </th>
            <td style={{ paddingLeft: '10px', borderLeft: '1px solid #ccc' }}>
              {result['PTV Case Carrier'] === null ? '—' : result['PTV Case Carrier']}
            </td>
            <td>{result['PTV Control Carrier'] === null ? '—' : result['PTV Control Carrier']}</td>
            <td style={{ paddingLeft: '10px' }}>{renderOddsRatio(result['PTV OR'])}</td>
            <td style={{ paddingLeft: '10px' }}>
              {result['PTV Pvalue'] === null ? '—' : result['PTV Pvalue'].toPrecision(3)}
            </td>
            <td style={{ paddingLeft: '10px', borderLeft: '1px solid #ccc' }}>
              {result['N de novo PTV'] === null ? '—' : result['N de novo PTV']}
            </td>
            <td rowSpan={2} style={{ paddingLeft: '10px' }}>
              {result['de novo Pvalue'] === null ? '—' : result['de novo Pvalue'].toPrecision(3)}
            </td>
          </tr>

          <tr>
            <th scope="row">
              <TooltipAnchor tooltip="Protein-truncating variants (PTVs) classified as high-confidence by LOFTEE: stop-gained, frameshift, and essential splice acceptor and donor sites, and missense variants predicted to be damaging (mean missense rank percentile >= 93%).">
                <TooltipHint style={{ backgroundPosition: '0 1.11em' }}>PTV + Missense</TooltipHint>
              </TooltipAnchor>
            </th>
            <td style={{ paddingLeft: '10px', borderLeft: '1px solid #ccc' }}>
              {result['PTV Missense Case Carrier'] === null
                ? '—'
                : result['PTV Missense Case Carrier']}
            </td>
            <td>
              {result['PTV Missense Control Carrier'] === null
                ? '—'
                : result['PTV Missense Control Carrier']}
            </td>
            <td rowSpan={2} style={{ paddingLeft: '10px' }}>
              {renderOddsRatio(result['PTV+ Missense OR'])}
            </td>
            <td rowSpan={2} style={{ paddingLeft: '10px' }}>
              {result['PTV Missense Pvalue'] === null
                ? '—'
                : result['PTV Missense Pvalue'].toPrecision(3)}
            </td>
            <td style={{ paddingLeft: '10px', borderLeft: '1px solid #ccc' }}>
              {result['N de novo PTV Missense'] === null ? '—' : result['N de novo PTV Missense']}
            </td>
          </tr>
        </tbody>
      </Table>
      <p style={{ marginTop: '2rem', fontWeight: 'bold' }}>
        Case-Control Cauchy <span style={{ fontStyle: 'italic' }}>P</span>-value:{' '}
        {result['Case-Control Cauchy Pvalue'] === null
          ? '—'
          : result['Case-Control Cauchy Pvalue'].toPrecision(3)}
      </p>
      <p style={{ fontWeight: 'bold' }}>
        Case-Control Min <span style={{ fontStyle: 'italic' }}>P</span>-value:{' '}
        {result['Case-Control Min-Pvalue'] === null
          ? '—'
          : result['Case-Control Min-Pvalue'].toPrecision(3)}
      </p>
      <p style={{ fontWeight: 'bold' }}>
        Case-Control + de novo <span style={{ fontStyle: 'italic' }}>P</span>-value:{' '}
        {result['Case Control de novo Pvalue'] === null
          ? '—'
          : result['Case Control de novo Pvalue'].toPrecision(3)}
      </p>
      <p style={{ marginTop: '2em' }}>
        <strong>Total cases: {result.n_cases}</strong>
      </p>
      <p>
        <strong>Total controls: {result.n_controls}</strong>
      </p>
    </div>
  )
}

SCHEMAGeneResult.propTypes = {
  result: PropTypes.shape({
    'PTV Case Carrier': PropTypes.number,
    'PTV Control Carrier': PropTypes.number,
    'PTV Pvalue': PropTypes.number,
    'PTV OR': PropTypes.string,
    'N de novo PTV': PropTypes.number,
    'PTV Missense Case Carrier': PropTypes.number,
    'PTV Missense Control Carrier': PropTypes.number,
    'PTV Missense Pvalue': PropTypes.number,
    'PTV Missense OR': PropTypes.string,
    'N de novo PTV + Missense': PropTypes.number,
    'de novo Pvalue': PropTypes.number,
    'Case-Control + de novo Pvalue': PropTypes.number,
    'Case-Control Cauchy Pvalue': PropTypes.number,
  }).isRequired,
}

const SCHEMAGeneResults = ({ results }) => (
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

SCHEMAGeneResults.propTypes = {
  results: PropTypes.objectOf(PropTypes.object).isRequired,
}

export default SCHEMAGeneResults
