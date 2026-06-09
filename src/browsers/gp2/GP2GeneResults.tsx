import React from 'react'
import styled from 'styled-components'

import { BaseTable } from '@gnomad/ui'
import { renderOddsRatio, renderStringOrFloatPvalueAsScientific } from '../base/tableCells'
import { GP2AnalysisGroup } from './GP2Browser'

const Table = styled(BaseTable)`
  min-width: 325px;
`

const zeroPValueReplacement = '2.2e-16'

type Gp2GeneResult = {
    n_cases: number
    n_controls: number
    damaging_missense_case_count: number
    damaging_missense_control_count: number
    damaging_missense_pval: number
    damaging_missense_OR: number
    ptv_case_count: number
    ptv_control_count: number
    ptv_pval: number
    ptv_OR: number
}

interface GP2GeneResultProps {
  result: Gp2GeneResult
}

const GP2GeneResult = ({ result }: GP2GeneResultProps) => (
  <div>
    <Table>
      <thead>
        <tr>
          <th scope="col">Category</th>
          <th scope="col">Case Count</th>
          <th scope="col">Control Count</th>
          <th scope="col">P-Val</th>
          <th scope="col">Odds Ratio</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Protein-truncating</th>
          <td>{result.ptv_case_count === null ? '-' : result.ptv_case_count}</td>
          <td>{result.ptv_control_count === null ? '-' : result.ptv_control_count}</td>
          <td>{renderStringOrFloatPvalueAsScientific(result.ptv_pval, zeroPValueReplacement)}</td>
          <td>{renderOddsRatio({ value: result.ptv_OR})}</td>
        </tr>
        <tr>
          <th scope="row">Damaging Missense</th>
          <td>
            {result.damaging_missense_case_count === null
              ? '-'
              : result.damaging_missense_case_count}
          </td>
          <td>
            {result.damaging_missense_control_count === null
              ? '-'
              : result.damaging_missense_control_count}
          </td>
          <td>{renderStringOrFloatPvalueAsScientific(result.ptv_pval, zeroPValueReplacement)}</td>
          <td>{renderOddsRatio({ value: result.damaging_missense_OR})}</td>
        </tr>
      </tbody>
    </Table>

    <p style={{ marginTop: '2em' }}>
      <strong>Total cases: {result.n_cases}</strong>
    </p>
    <p>
      <strong>Total controls: {result.n_controls}</strong>
    </p>
  </div>
)


interface GP2GeneResultsProps {
  results: Record<GP2AnalysisGroup, Gp2GeneResult>
}

const GP2GeneResults = ({ results }: GP2GeneResultsProps ) => (
  <>
    <h2>Gene Results </h2>
    <p>Gene burden results will be released in the future.</p>
  </>
)

export default GP2GeneResults
