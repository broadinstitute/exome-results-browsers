import React from 'react'
import styled from 'styled-components'

// @ts-expect-error: no types in this @gnomad/ui version
import { BaseTable } from '@gnomad/ui'
import { ASC2AnalysisGroup } from './ASC2Browser'
import { renderStringOrFloatPvalueAsScientific } from '../base/tableCells'
import { ASC2_VARIANT_CLASS_CATEGORIES, ASC2GeneResult } from './ascTypes'

const Table = styled(BaseTable)`
  min-width: 480px;

  th,
  td {
    padding: 0.6em 20px 0.6em 8px;
  }

  thead {
    tr:first-child th {
      border-bottom: none;
    }

    tr:first-child th:first-child {
      border-bottom: 1px solid #000;
    }

    tr:first-child th:first-child,
    tr:first-child th:nth-child(2),
    tr:first-child th:nth-child(3) {
      border-right: 1px solid #ccc;
    }

    tr:last-child th:nth-child(2),
    tr:last-child th:nth-child(4) {
      border-right: 1px solid #ccc;
    }
  }

  tbody th:first-child,
  tbody td:nth-child(3),
  tbody td:nth-child(5) {
    border-right: 1px solid #ccc;
  }
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
          <th rowSpan={2} scope="col">
            Class
          </th>
          <th colSpan={2} scope="colgroup">
            De&nbsp;novo
          </th>
          <th colSpan={2} scope="colgroup">
            Inherited (proband)
          </th>
          <th colSpan={2} scope="colgroup"></th>
        </tr>
        <tr>
          <th scope="col">Proband</th>
          <th scope="col">Sibling</th>
          <th scope="col">Transmitted</th>
          <th scope="col">Untransmitted</th>
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
      {renderStringOrFloatPvalueAsScientific({
        value: result.false_discovery_rate,
        decimalPlaces: 4,
      })}
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
