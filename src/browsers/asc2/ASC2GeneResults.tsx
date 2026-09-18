import React from 'react'
import styled from 'styled-components'

// @ts-expect-error: no types in this @gnomad/ui version
import { BaseTable, TooltipAnchor, TooltipHint } from '@gnomad/ui'
import { ASC2AnalysisGroup } from './ASC2Browser'
import { renderASC2BayesFactor, renderASC2FalseDiscoveryRate } from './ascNumberFormatting'
import { ASC2_VARIANT_CLASS_CATEGORIES, ASC2GeneResult } from './ascTypes'

const EXCLUDED_FROM_ANALYSIS_ROW_COLOR = '#767676'
const EXCLUDED_FROM_ANALYSIS_ROW_ITALIC = true

const Table = styled(BaseTable)`
  min-width: 480px;

  th,
  td {
    padding: 0.6em 20px 0.6em 8px;
    text-align: center;
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

const ClassRow = styled.tr<{ $isExcludedFromAnalysis?: boolean }>`
  ${({ $isExcludedFromAnalysis }) =>
    $isExcludedFromAnalysis &&
    `
      color: ${EXCLUDED_FROM_ANALYSIS_ROW_COLOR};
      font-style: ${EXCLUDED_FROM_ANALYSIS_ROW_ITALIC ? 'italic' : 'normal'};
    `}
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
            <TooltipAnchor tooltip="We expect a 4:1 allele count ratio based on a 4:1 proband:sibling ratio.">
              <TooltipHint>De&nbsp;novo</TooltipHint>
            </TooltipAnchor>
          </th>
          <th colSpan={2} scope="colgroup">
            <TooltipAnchor tooltip="We expect a 1:1 allele count ratio based on a 50% Mendelian inheritance rate.">
              <TooltipHint>Inherited (proband)</TooltipHint>
            </TooltipAnchor>
          </th>
          <th colSpan={2} scope="colgroup">
            <TooltipAnchor tooltip="We expect a 1:1 allele count ratio based on a 1:1 case:control ratio.">
              <TooltipHint>Case-control</TooltipHint>
            </TooltipAnchor>
          </th>
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
        {ASC2_VARIANT_CLASS_CATEGORIES.map(({ suffix, label, tooltip, isExcludedFromAnalysis }) => (
          <ClassRow key={suffix} $isExcludedFromAnalysis={isExcludedFromAnalysis}>
            <th scope="row">
              <TooltipAnchor tooltip={tooltip}>
                <TooltipHint>{label}</TooltipHint>
              </TooltipAnchor>
            </th>
            <td>{renderCount(result[`de_novo_${suffix}_proband`])}</td>
            <td>{renderCount(result[`de_novo_${suffix}_sibling`])}</td>
            <td>{renderCount(result[`transmitted_${suffix}_proband`])}</td>
            <td>{renderCount(result[`untransmitted_${suffix}_proband`])}</td>
            <td>{renderCount(result[`${suffix}_case`])}</td>
            <td>{renderCount(result[`${suffix}_control`])}</td>
          </ClassRow>
        ))}
      </tbody>
    </Table>

    <p>
      <strong>Bayes Factor:</strong> {renderASC2BayesFactor(result.bayes_factor)}
    </p>
    <p>
      <strong>FDR:</strong> {renderASC2FalseDiscoveryRate(result.false_discovery_rate)}
    </p>
  </div>
)

interface ASC2GeneResultsProps {
  results: Record<ASC2AnalysisGroup, ASC2GeneResult>
}

const ASC2GeneResults = ({ results }: ASC2GeneResultsProps) => (
  <>
    <h2>Gene Summary Allele Counts</h2>
    {results.meta ? <ASC2GeneResult result={results.meta} /> : <p>No result for this gene.</p>}
  </>
)

export default ASC2GeneResults
