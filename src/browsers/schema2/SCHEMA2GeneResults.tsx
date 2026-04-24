import React from 'react'
import styled from 'styled-components'

import { BaseTable, TooltipAnchor, TooltipHint } from '@gnomad/ui'

import HelpButton from '../base/HelpButton'
import StyledContent from '../base/StyledContent'
import geneResultsDescription from './content/generesults.md'
import { renderStringOrFloatPvalueAsScientific } from '../base/tableCells'

const Table = styled(BaseTable)`
  min-width: 325px;
`

const renderOddsRatio = (value: number | string | null | undefined) => {
  if (value === null || value == undefined) {
    return '-'
  }
  if (value === 'Infinity') {
    return '∞'
  }

  if (value === 0) {
    return '0'
  }

  const floatValue = typeof value == 'string' ? parseFloat(value) : value
  if (Number.isNaN(floatValue)) {
    return value
  }
  return floatValue.toPrecision(3)
}

const safeRenderCount = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return '-'
  }

  return value
}

type SchemaGeneResult = {
  ptv_case_carrier: number
  ptv_control_carrier: number
  ptv_p_value: number
  ptv_odds_ratio: string

  ptv_mis_case_carrier: number
  ptv_mis_control_carrier: number
  ptv_mis_p_value: number
  ptv_mis_odds_ratio: string

  ptv_n_de_novo: number
  ptv_mis_n_de_novo: number

  n_de_novo_p_value: number
  case_control_plus_de_novo_p_value: number
  schema_case_control_p_value: number

  n_cases: number
  n_controls: number
}

interface SchemaGeneResultProps {
  result: SchemaGeneResult
}

const SCHEMAGeneResult = ({ result }: SchemaGeneResultProps) => {
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
              {safeRenderCount(result.ptv_case_carrier)}
            </td>
            <td>{safeRenderCount(result.ptv_control_carrier)}</td>
            <td style={{ paddingLeft: '10px' }}>{renderOddsRatio(result.ptv_odds_ratio)}</td>
            <td style={{ paddingLeft: '10px' }}>
              {renderStringOrFloatPvalueAsScientific(result.ptv_p_value)}
            </td>
            <td style={{ paddingLeft: '10px', borderLeft: '1px solid #ccc' }}>
              {safeRenderCount(result.ptv_n_de_novo)}
            </td>
            <td rowSpan={2} style={{ paddingLeft: '10px' }}>
              {renderStringOrFloatPvalueAsScientific(result.n_de_novo_p_value)}
            </td>
          </tr>

          <tr>
            <th scope="row">
              <TooltipAnchor tooltip="Protein-truncating variants (PTVs) classified as high-confidence by LOFTEE: stop-gained, frameshift, and essential splice acceptor and donor sites, and missense variants predicted to be damaging (mean missense rank percentile >= 93%).">
                <TooltipHint style={{ backgroundPosition: '0 1.11em' }}>PTV + Missense</TooltipHint>
              </TooltipAnchor>
            </th>
            <td style={{ paddingLeft: '10px', borderLeft: '1px solid #ccc' }}>
              {safeRenderCount(result.ptv_mis_case_carrier)}
            </td>
            <td>{safeRenderCount(result.ptv_mis_control_carrier)}</td>
            <td rowSpan={2} style={{ paddingLeft: '10px' }}>
              {renderOddsRatio(result.ptv_mis_odds_ratio)}
            </td>
            <td rowSpan={2} style={{ paddingLeft: '10px' }}>
              {renderStringOrFloatPvalueAsScientific(result.ptv_mis_p_value)}
            </td>
            <td style={{ paddingLeft: '10px', borderLeft: '1px solid #ccc' }}>
              {safeRenderCount(result.ptv_mis_n_de_novo)}
            </td>
          </tr>
        </tbody>
      </Table>
      <p style={{ marginTop: '2rem', fontWeight: 'bold' }}>
        Case-Control SCHEMA2 <span style={{ fontStyle: 'italic' }}>P</span>-value:{' '}
        {renderStringOrFloatPvalueAsScientific(result.schema_case_control_p_value)}
      </p>
      <p style={{ fontWeight: 'bold' }}>
        Case-Control + de novo <span style={{ fontStyle: 'italic' }}>P</span>-value:{' '}
        {renderStringOrFloatPvalueAsScientific(result.case_control_plus_de_novo_p_value)}
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
