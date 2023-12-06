import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { BaseTable, Tabs } from '@gnomad/ui'

import HelpButton from '../base/HelpButton'

const Table = styled(BaseTable)`
  min-width: 325px;
`

// const renderOddsRatio = (value) => {
//   if (value === null) {
//     return '-'
//   }
//   if (value === 'Infinity') {
//     return '∞'
//   }
//   if (value === 0) {
//     return '0'
//   }
//   return value.toPrecision(3)
// }

// const renderPVal = (pval) => {
//   console.log(pval)
//   // if (pval === null) {
//   //   return '-'
//   // }
//   // if (pval === 0) {
//   //   return '2.2e-16'
//   // }
//   // return pval.toPrecision(3)
//   return 1
// }

const IBDGeneResult = ({ result }) => (
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
          {/* <td>{result.ptv_case_count === null ? '-' : result.ptv_case_count}</td> */}
          {/* <td>{result.ptv_control_count === null ? '-' : result.ptv_control_count}</td> */}
          {/* <td>{renderPVal(result.ptv_pval)}</td> */}
          {/* <td>{renderPVal(result)}</td> */}
          {/* <td>{renderOddsRatio(result.ptv_OR)}</td> */}
        </tr>
        <tr>
          <th scope="row">Damaging Missense</th>
          {/* <td>
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
          <td>{renderOddsRatio(result.damaging_missense_OR)}</td> */}
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

IBDGeneResult.propTypes = {
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

const IBDGeneResults = ({ results }) => (
  <>
    <h2>
      Gene Result{' '}
      <HelpButton
        popupTitle="Gene Burden Result"
        popupContent={
          <>
            <p>
              These tables display the case-control gene burden for the full IBD cohort (IBD) and
              for each of the primary irritable bowel disease types (Crohn&apos;s Disease, CD; and
              Ulcerative Colitis, UC). Cases in the IBD table include all 50,126 IBD patients
              (28,718 with CD, 17,991 with CD, and 3,417 with other IBD syndromes). Each of the case
              groups is compared against over 97,000 control samples.
            </p>
          </>
        }
      />
    </h2>
    <Tabs
      tabs={['cd', 'ibd', 'uc'].map((group) => ({
        id: group,
        label: group,
        render: () =>
          results[group] ? (
            <IBDGeneResult result={results[group]} />
          ) : (
            <p>No result for {group} in this gene.</p>
          ),
      }))}
    />
  </>
)

IBDGeneResults.propTypes = {
  results: PropTypes.objectOf(PropTypes.object).isRequired,
}

export default IBDGeneResults
