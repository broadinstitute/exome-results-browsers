import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { BaseTable } from '@gnomad/ui'

const Table = styled(BaseTable)`
  min-width: 325px;
`

const ASCGeneResult = ({ result }) => (
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
          <th scope="row">De novo protein-truncating variants</th>
          <td>{result.xcase_dn_ptv === null ? '—' : result.xcase_dn_ptv}</td>
          <td>{result.xcont_dn_ptv === null ? '—' : result.xcont_dn_ptv}</td>
        </tr>
        <tr>
          <th scope="row">De novo missense variants with MPC 1-2</th>
          <td>{result.xcase_dn_misa === null ? '—' : result.xcase_dn_misa}</td>
          <td>{result.xcont_dn_misa === null ? '—' : result.xcont_dn_misa}</td>
        </tr>
        <tr>
          <th scope="row">De novo missense variants with MPC &ge; 2</th>
          <td>{result.xcase_dn_misb === null ? '—' : result.xcase_dn_misb}</td>
          <td>{result.xcont_dn_misb === null ? '—' : result.xcont_dn_misb}</td>
        </tr>
        <tr>
          <th scope="row">
            Protein-truncating variants in iPSYCH (&quot;Danish Blood Spot&quot;) cohort
          </th>
          <td>{result.xcase_dbs_ptv === null ? '—' : result.xcase_dbs_ptv}</td>
          <td>{result.xcont_dbs_ptv === null ? '—' : result.xcont_dbs_ptv}</td>
        </tr>
        <tr>
          <th scope="row">Protein-truncating variants in Swedish cohort</th>
          <td>{result.xcase_swe_ptv === null ? '—' : result.xcase_swe_ptv}</td>
          <td>{result.xcont_swe_ptv === null ? '—' : result.xcont_swe_ptv}</td>
        </tr>
        <tr>
          <th scope="row">Protein-truncating variants transmitted/not transmitted to probands</th>
          <td>{result.xcase_tut === null ? '—' : result.xcase_tut}</td>
          <td>{result.xcont_tut === null ? '—' : result.xcont_tut}</td>
        </tr>
      </tbody>
    </Table>
    <p>
      <strong>Q-Val:</strong> {result.qval === null ? '—' : result.qval.toPrecision(4)}
    </p>
  </div>
)

ASCGeneResult.propTypes = {
  result: PropTypes.shape({
    xcase_dn_ptv: PropTypes.number,
    xcont_dn_ptv: PropTypes.number,
    xcase_dn_misa: PropTypes.number,
    xcont_dn_misa: PropTypes.number,
    xcase_dn_misb: PropTypes.number,
    xcont_dn_misb: PropTypes.number,
    xcase_dbs_ptv: PropTypes.number,
    xcont_dbs_ptv: PropTypes.number,
    xcase_swe_ptv: PropTypes.number,
    xcont_swe_ptv: PropTypes.number,
    xcase_tut: PropTypes.number,
    xcont_tut: PropTypes.number,
    qval: PropTypes.number,
  }).isRequired,
}

const ASCGeneResults = ({ results }) => (
  <>
    <h2>Gene Result</h2>
    {results.All ? <ASCGeneResult result={results.All} /> : <p>No result for this gene.</p>}
  </>
)

ASCGeneResults.propTypes = {
  results: PropTypes.objectOf(PropTypes.object).isRequired,
}

export default ASCGeneResults
