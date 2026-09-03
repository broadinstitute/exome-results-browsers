import React from 'react'
import styled from 'styled-components'

import { BaseTable } from '@gnomad/ui'
import { ASC2AnalysisGroup } from './ASC2Browser'
import { renderStringOrFloatPvalueAsScientific } from '../base/tableCells'
import { ASC2_VARIANT_CLASS_CATEGORIES, ASC2GeneResult } from './ascTypes'

const Table = styled(BaseTable)`
  min-width: 480px;
`

const renderCount = (value: number | null) => (value === null ? '\u2014' : value)

interface ASC2GeneResultProps {
  result: ASC2GeneResult
}

const ASC2GeneResult = ({ result }: ASC2GeneResultProps) => (
  <div>
    <Table>
      <thead>
        <tr>
          <th scope="col">Class</th>
          <th scope="col">De&nbsp;novo Proband</th>
          <th scope="col">De&nbsp;novo Sibling</th>
          <th scope="col">Transmitted Proband</th>
          <th scope="col">Untransmitted Proband</th>
          <th scope="col">Case</th>
          <th scope="col">Control</th>
        </tr>
      </thead>
      <tbody>
        {ASC2_VARIANT_CLASS_CATEGORIES.map(({ suffix, label }) => (
          <tr key={suffix}>
            <th scope="row">{label}</th>
            <td>{renderCount(result[`de_novo_${suffix}_proband`])}</td>
            <td>{renderCount(result[`de_novo_${suffix}_sibling`])}</td>
            <td>{renderCount(result[`transmitted_${suffix}_proband`])}</td>
            <td>{renderCount(result[`untransmitted_${suffix}_proband`])}</td>
            <td>{renderCount(result[`${suffix}_case`])}</td>
            <td>{renderCount(result[`${suffix}_control`])}</td>
          </tr>
        ))}
      </tbody>
    </Table>

    <p>
      <strong>Bayes Factor:</strong>{' '}
      {renderStringOrFloatPvalueAsScientific({ value: result.bayes_factor, decimalPlaces: 4 })}
    </p>
    <p>
      <strong>FDR:</strong>{' '}
      {renderStringOrFloatPvalueAsScientific({ value: result.fdr, decimalPlaces: 4 })}
    </p>
  </div>
)

interface ASC2GeneResultsProps {
  results: Record<ASC2AnalysisGroup, ASC2GeneResult>
}

const ASC2GeneResults = ({ results }: ASC2GeneResultsProps) => (
  <>
    <h2>Gene Result</h2>
    {results.meta ? <ASC2GeneResult result={results.meta} /> : <p>No result for this gene.</p>}
  </>
)

export default ASC2GeneResults
