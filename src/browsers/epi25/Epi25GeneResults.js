import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { BaseTable, Tabs } from '@gnomad/ui'

import HelpButton from '../base/HelpButton'

const Table = styled(BaseTable)`
  min-width: 325px;
`

const Epi25GeneResult = ({ result }) => (
  <div>
    <Table>
      <thead>
        <tr>
          <th scope="col">Category</th>
          <th scope="col">Cases</th>
          <th scope="col">Controls</th>
          <th scope="col">P-Val</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">LoF</th>
          <td>{result.xcase_lof === null ? '—' : result.xcase_lof}</td>
          <td>{result.xctrl_lof === null ? '—' : result.xctrl_lof}</td>
          <td>{result.pval_lof === null ? '—' : result.pval_lof.toPrecision(3)}</td>
        </tr>
        <tr>
          <th scope="row">MPC</th>
          <td>{result.xcase_mpc === null ? '—' : result.xcase_mpc}</td>
          <td>{result.xctrl_mpc === null ? '—' : result.xctrl_mpc}</td>
          <td>{result.pval_mpc === null ? '—' : result.pval_mpc.toPrecision(3)}</td>
        </tr>
        <tr>
          <th scope="row">Inframe Indel</th>
          <td>{result.xcase_infrIndel === null ? '—' : result.xcase_infrIndel}</td>
          <td>{result.xctrl_infrIndel === null ? '—' : result.xctrl_infrIndel}</td>
          <td>{result.pval_infrIndel === null ? '—' : result.pval_infrIndel.toPrecision(3)}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <th scope="row">Overall</th>
          <td />
          <td />
          <td>{result.pval === null ? '—' : result.pval.toPrecision(3)}</td>
        </tr>
      </tfoot>
    </Table>
  </div>
)

Epi25GeneResult.propTypes = {
  result: PropTypes.shape({
    xcase_lof: PropTypes.number,
    xctrl_lof: PropTypes.number,
    pval_lof: PropTypes.number,
    xcase_mpc: PropTypes.number,
    xctrl_mpc: PropTypes.number,
    pval_mpc: PropTypes.number,
    xcase_infrIndel: PropTypes.number,
    xctrl_infrIndel: PropTypes.number,
    pval_infrIndel: PropTypes.number,
    pval: PropTypes.number,
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
              table includes all 9,170 epilepsy patients (1,021 with DEE, 3,108 with GGE, 3,597 with
              NAFE, and 1,444 with other epilepsy syndromes). Each of the case groups is compared
              against 8,364 controls without known neuropsychiatric conditions.
            </p>
            <p>
              Given a functional category of deleterious variants, the numbers in the tables are the
              carrier counts of singletons (AC=1) absent in the DiscovEHR database (“ultra-rare”
              singletons) aggregated at the gene level. LoF stands for loss-of-function or
              protein-truncating variants; MPC for missense variants with an MPC score &ge;2; and
              Inframe indel for inframe insertions or deletions. DiscovEHR is a population allele
              frequency reference that contains 50,726 whole-exome sequences from a largely European
              and non-diseased adult population. The difference in the proportion of carriers
              between cases and controls is assessed using a two-tailed Fisher’s exact test.
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
