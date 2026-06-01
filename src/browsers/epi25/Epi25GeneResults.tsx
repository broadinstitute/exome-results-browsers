import React from 'react'
import styled from 'styled-components'

import { BaseTable, Tabs } from '@gnomad/ui'

import HelpButton from '../base/HelpButton'
import { Epi25AnalysisGroup, epi25AnalysisGroups } from './Epi25Browser'
import { renderOddsRatio } from '../base/tableCells'

const Table = styled(BaseTable)`
  min-width: 325px;
`

const renderPVal = (pval: number | undefined | null) => {
  if (pval === null || pval === undefined) {
    return '-'
  }
  if (pval === 0) {
    return '2.2e-16'
  }
  return pval.toPrecision(3)
}


type Epi25GeneResult = {
  ptv_case_count: number | null
  ptv_control_count: number | null
  ptv_pval: number | null
  ptv_OR: number | null

  damaging_missense_case_count: number | null
  damaging_missense_control_count: number | null
  damaging_missense_pval: number | null
  damaging_missense_OR: number | null

  n_cases: number,
  n_controls: number,
}

interface Epi25GeneResultProps {
  result: Epi25GeneResult
}


const Epi25GeneResult = ({ result }: Epi25GeneResultProps) => (
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
          <td>{renderPVal(result.ptv_pval)}</td>
          <td>{renderOddsRatio({ value: result.ptv_OR })}</td>
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
          <td>{renderPVal(result.damaging_missense_pval)}</td>
          <td>{renderOddsRatio({ value: result.ptv_OR })}</td>
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

interface Epi25GeneResultsProps {
  results: Record<Epi25AnalysisGroup, Epi25GeneResult>

}

const Epi25GeneResults = ({ results }: Epi25GeneResultsProps) => (
  <>
    <h2>
      Gene Result{' '}
      <HelpButton
        popupTitle="Gene Burden Result"
        popupContent={
          <>
            <p>
              These tables display the case-control gene burden for the full epilepsy cohort (EPI)
              and for each of the primary epilepsy types (DEE, GGE, and NAFE). Cases in the EPI
              table includes all 20,979 epilepsy patients (1,938 with DEE, 5,499 with GGE, 9,219
              with NAFE, and 4,323 with other epilepsy syndromes). Each of the case groups is
              compared against 33,444 controls without known neuropsychiatric conditions.
            </p>
            <p>
              Given a functional category of deleterious variants, the numbers in the tables are the
              carrier counts of ultra-rare (allele count [AC]&ge;5) variants aggregated at the gene
              level. The burden of ultra-rare, deleterious SNVs and indels - protein-truncating or
              damaging missense (with an MPC score&le;2) variants - in cases versus controls is
              assessed using a Firth logistic regression test with adjustment for sex and genetic
              ancestry (P-value is capped at 2.2e-16).
            </p>
          </>
        }
      />
    </h2>
    <Tabs
      tabs={epi25AnalysisGroups.map((group) => ({
        id: group,
        label: group,
        render: () =>
          results[group] ? (
            <Epi25GeneResult result={results[group]} />
          ) : (
            <p>No result for {group} in this gene.</p>
          ),
      }))}
    />
  </>
)

export default Epi25GeneResults
