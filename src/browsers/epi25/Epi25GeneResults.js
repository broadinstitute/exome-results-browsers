import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { BaseTable, Tabs } from '@gnomad/ui'

import HelpButton from '../base/HelpButton'

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
  return value.toPrecision(3)
}

const Epi25GeneResult = ({ result }) => (
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
          <td>{result.ptv_pval === null ? '-' : result.ptv_pval.toPrecision(3)}</td>
          <td>{renderOddsRatio(result.ptv_OR)}</td>
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
          <td>
            {result.damaging_missense_pval === null
              ? '-'
              : result.damaging_missense_pval.toPrecision(3)}
          </td>
          <td>{renderOddsRatio(result.damaging_missense_OR)}</td>
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

Epi25GeneResult.propTypes = {
  result: PropTypes.shape({
    n_cases: PropTypes.number,
    n_controls: PropTypes.number,
    damaging_missense_case_count: PropTypes.number,
    damaging_missense_control_count: PropTypes.number,
    damaging_missense_pval: PropTypes.number,
    damaging_missense_OR: PropTypes.number,
    ptv_case_count: PropTypes.number,
    ptv_control_count: PropTypes.number,
    ptv_pval: PropTypes.number,
    ptv_OR: PropTypes.number,
  }).isRequired,
}

const Epi25GeneResults = ({ results }) => (
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
              ancestry.
            </p>
          </>
        }
      />
    </h2>
    <Tabs
      tabs={['EPI', 'DEE', 'GGE', 'NAFE'].map((group) => ({
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

Epi25GeneResults.propTypes = {
  results: PropTypes.objectOf(PropTypes.object).isRequired,
}

export default Epi25GeneResults
