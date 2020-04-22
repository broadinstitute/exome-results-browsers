import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { BaseTable } from '@gnomad/ui'

const Table = styled(BaseTable)`
  min-width: 325px;
`

const renderOddsRatio = value => {
  if (value === null) {
    return '-'
  }
  if (value === 'Inf') {
    return '∞'
  }
  const n = Number(value)
  if (n === 0) {
    return '0'
  }
  return n.toPrecision(3)
}

const GeneResultsTable = ({ geneResult }) => (
  <div>
    <Table>
      <thead>
        <tr>
          <th scope="col">Category</th>
          <th scope="col">Case Count</th>
          <th scope="col">Control Count</th>
          <th scope="col">Fisher p-val</th>
          <th scope="col">Fisher odds ratio</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Protein-truncating</th>
          <td>{geneResult.ptv_case_count === null ? '-' : geneResult.ptv_case_count}</td>
          <td>{geneResult.ptv_control_count === null ? '-' : geneResult.ptv_control_count}</td>
          <td>
            {geneResult.ptv_fisher_gnom_non_psych_pval === null
              ? '-'
              : geneResult.ptv_fisher_gnom_non_psych_pval.toPrecision(3)}
          </td>
          <td>{renderOddsRatio(geneResult.ptv_fisher_gnom_non_psych_OR)}</td>
        </tr>
        <tr>
          <th scope="row">Damaging Missense</th>
          <td>
            {geneResult.damaging_missense_case_count === null
              ? '-'
              : geneResult.damaging_missense_case_count}
          </td>
          <td>
            {geneResult.damaging_missense_control_count === null
              ? '-'
              : geneResult.damaging_missense_control_count}
          </td>
          <td>
            {geneResult.damaging_missense_fisher_gnom_non_psych_pval === null
              ? '-'
              : geneResult.damaging_missense_fisher_gnom_non_psych_pval.toPrecision(3)}
          </td>
          <td>{renderOddsRatio(geneResult.damaging_missense_fisher_gnom_non_psych_OR)}</td>
        </tr>
      </tbody>
    </Table>
    <p>
      <strong>Total cases: {geneResult.n_cases}</strong>
    </p>
    <p>
      <strong>Total controls: {geneResult.n_controls}</strong>
    </p>
  </div>
)

GeneResultsTable.propTypes = {
  geneResult: PropTypes.shape({
    n_cases: PropTypes.number,
    n_controls: PropTypes.number,
    ptv_case_count: PropTypes.number,
    ptv_control_count: PropTypes.number,
    ptv_fisher_gnom_non_psych_pval: PropTypes.number,
    ptv_fisher_gnom_non_psych_OR: PropTypes.string,
    damaging_missense_case_count: PropTypes.number,
    damaging_missense_control_count: PropTypes.number,
    damaging_missense_fisher_gnom_non_psych_pval: PropTypes.number,
    damaging_missense_fisher_gnom_non_psych_OR: PropTypes.string,
  }).isRequired,
}

export default GeneResultsTable
