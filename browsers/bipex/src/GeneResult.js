import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { BaseTable } from '@gnomad/ui'

const Table = styled(BaseTable)`
  min-width: 325px;
`

const GeneResultsTable = ({ geneResult }) => (
  <div>
    <Table>
      <thead>
        <tr>
          <th scope="col">Category</th>
          <th scope="col">Case Count</th>
          <th scope="col">Control Count</th>
          <th scope="col">Fisher log p-val</th>
          <th scope="col">Fisher gnomAD (non-psych) log p-val</th>
          <th scope="col">CMH Log p-val</th>
          <th scope="col">CMH gnomAD (non-psych) log p-val</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Protein-truncating</th>
          <td>{geneResult.ptv_case_count === null ? '-' : geneResult.ptv_case_count}</td>
          <td>{geneResult.ptv_control_count === null ? '-' : geneResult.ptv_control_count}</td>
          <td>
            {geneResult.ptv_fisher_log_pval === null
              ? '-'
              : geneResult.ptv_fisher_log_pval.toPrecision(3)}
          </td>
          <td>
            {geneResult.ptv_fisher_gnom_non_psych_log_pval === null
              ? '-'
              : geneResult.ptv_fisher_gnom_non_psych_log_pval.toPrecision(3)}
          </td>
          <td>
            {geneResult.ptv_CMH_log_pval === null
              ? '-'
              : geneResult.ptv_CMH_log_pval.toPrecision(3)}
          </td>
          <td>
            {geneResult.ptv_CMH_gnom_non_psych_log_pval === null
              ? '-'
              : geneResult.ptv_CMH_gnom_non_psych_log_pval.toPrecision(3)}
          </td>
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
            {geneResult.damaging_missense_fisher_log_pval === null
              ? '-'
              : geneResult.damaging_missense_fisher_log_pval.toPrecision(3)}
          </td>
          <td>
            {geneResult.damaging_missense_fisher_gnom_non_psych_log_pval === null
              ? '-'
              : geneResult.damaging_missense_fisher_gnom_non_psych_log_pval.toPrecision(3)}
          </td>
          <td>
            {geneResult.damaging_missense_CMH_log_pval === null
              ? '-'
              : geneResult.damaging_missense_CMH_log_pval.toPrecision(3)}
          </td>
          <td>
            {geneResult.damaging_missense_CMH_gnom_non_psych_log_pval === null
              ? '-'
              : geneResult.damaging_missense_CMH_gnom_non_psych_log_pval.toPrecision(3)}
          </td>
        </tr>
      </tbody>
    </Table>
    <p>Total cases: {geneResult.n_cases}</p>
    <p>Total controls: {geneResult.n_controls}</p>
  </div>
)

GeneResultsTable.propTypes = {
  geneResult: PropTypes.shape({
    n_cases: PropTypes.number,
    n_controls: PropTypes.number,
    ptv_case_count: PropTypes.number,
    ptv_control_count: PropTypes.number,
    ptv_fisher_log_pval: PropTypes.number,
    ptv_fisher_gnom_non_psych_log_pval: PropTypes.number,
    ptv_CMH_log_pval: PropTypes.number,
    ptv_CMH_gnom_non_psych_log_pval: PropTypes.number,
    damaging_missense_case_count: PropTypes.number,
    damaging_missense_control_count: PropTypes.number,
    damaging_missense_fisher_log_pval: PropTypes.number,
    damaging_missense_fisher_gnom_non_psych_log_pval: PropTypes.number,
    damaging_missense_CMH_log_pval: PropTypes.number,
    damaging_missense_CMH_gnom_non_psych_log_pval: PropTypes.number,
  }).isRequired,
}

export default GeneResultsTable
