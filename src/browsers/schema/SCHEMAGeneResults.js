import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { BaseTable } from '@gnomad/ui'

const Table = styled(BaseTable)`
  min-width: 325px;
`

const SCHEMAGeneResult = ({ result }) => (
  <div>
    <Table>
      <thead>
        <tr>
          <th scope="col">Category</th>
          <th scope="col">Cases</th>
          <th scope="col">Controls</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">LoF</th>
          <td>{result.x_case_lof === null ? '—' : result.x_case_lof}</td>
          <td>{result.x_ctrl_lof === null ? '—' : result.x_ctrl_lof}</td>
        </tr>
        <tr>
          <th scope="row">Missense (MPC&nbsp;&ge;&nbsp;3)</th>
          <td>{result.x_case_mis3 === null ? '—' : result.x_case_mis3}</td>
          <td>{result.x_ctrl_mis3 === null ? '—' : result.x_ctrl_mis3}</td>
        </tr>
        <tr>
          <th scope="row">Missense (3&nbsp;&gt;&nbsp;MPC&nbsp;&ge;&nbsp;2)</th>
          <td>{result.x_case_mis2 === null ? '—' : result.x_case_mis2}</td>
          <td>{result.x_ctrl_mis2 === null ? '—' : result.x_ctrl_mis2}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <th scope="row">De Novo LoF</th>
          <td colSpan={2}>{result.dn_lof === null ? '—' : result.dn_lof}</td>
        </tr>
        <tr>
          <th scope="row">De Novo Missense</th>
          <td colSpan={2}>{result.dn_mis === null ? '—' : result.dn_mis}</td>
        </tr>
        <tr>
          <th scope="row">Meta-analysis P-value</th>
          <td colSpan={2}>{result.pval_meta === null ? '—' : result.pval_meta.toPrecision(3)}</td>
        </tr>
      </tfoot>
    </Table>
  </div>
)

SCHEMAGeneResult.propTypes = {
  result: PropTypes.shape({
    x_case_lof: PropTypes.number,
    x_ctrl_lof: PropTypes.number,
    dn_lof: PropTypes.number,
    x_case_mis2: PropTypes.number,
    x_ctrl_mis2: PropTypes.number,
    x_case_mis3: PropTypes.number,
    x_ctrl_mis3: PropTypes.number,
    dn_mis: PropTypes.number,
    pval_meta: PropTypes.number,
  }).isRequired,
}

const SCHEMAGeneResults = ({ results }) => (
  <>
    <h2>Gene Result</h2>
    {results.meta ? <SCHEMAGeneResult result={results.meta} /> : <p>No result for this gene.</p>}
  </>
)

SCHEMAGeneResults.propTypes = {
  results: PropTypes.objectOf(PropTypes.object).isRequired,
}

export default SCHEMAGeneResults
