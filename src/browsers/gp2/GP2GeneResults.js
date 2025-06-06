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

const renderPVal = (pval) => {
  if (pval === null) {
    return '-'
  }
  if (pval === 0) {
    return '2.2e-16'
  }
  return pval.toPrecision(3)
}

const GP2GeneResult = ({ result }) => (
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
          <td>{renderPVal(result.damaging_missense_pval)}</td>
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

GP2GeneResult.propTypes = {
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

const GP2GeneResults = ({ results }) => (
  <>
    <h2>
      Gene Result{' '}
      <HelpButton
        popupTitle="Gene Burden Result"
        popupContent={
          <>
            <p>
              Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien
              vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus
              leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus
              bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut
              hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia
              nostra inceptos himenaeos.
            </p>
            <p>
              Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien
              vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus
              leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus
              bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut
              hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia
              nostra inceptos himenaeos.
            </p>
          </>
        }
      />
    </h2>
    <Tabs
      // TODO: change to ancestries when we get the data
      tabs={['AAC', 'CAH', 'MDE', 'AMR', 'CAS', 'EUR', 'EAS', 'SAS', 'AJ', 'FIN', 'AFR'].map(
        (group) => ({
          id: group,
          label: group,
          render: () =>
            results[group] ? (
              <GP2GeneResult result={results[group]} />
            ) : (
              <p>No result for {group} in this gene.</p>
            ),
        })
      )}
    />
  </>
)

GP2GeneResults.propTypes = {
  results: PropTypes.objectOf(PropTypes.object).isRequired,
}

export default GP2GeneResults
