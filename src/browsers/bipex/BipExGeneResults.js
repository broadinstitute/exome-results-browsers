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

const BipExGeneResult = ({ result }) => (
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
          <td>{result.ptv_case_count === null ? '-' : result.ptv_case_count}</td>
          <td>{result.ptv_control_count === null ? '-' : result.ptv_control_count}</td>
          <td>
            {result.ptv_fisher_gnom_non_psych_pval === null
              ? '-'
              : result.ptv_fisher_gnom_non_psych_pval.toPrecision(3)}
          </td>
          <td>{renderOddsRatio(result.ptv_fisher_gnom_non_psych_OR)}</td>
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
            {result.damaging_missense_fisher_gnom_non_psych_pval === null
              ? '-'
              : result.damaging_missense_fisher_gnom_non_psych_pval.toPrecision(3)}
          </td>
          <td>{renderOddsRatio(result.damaging_missense_fisher_gnom_non_psych_OR)}</td>
        </tr>
      </tbody>
    </Table>
    <p>
      <strong>Total cases: {result.n_cases}</strong>
    </p>
    <p>
      <strong>Total controls: {result.n_controls}</strong>
    </p>
  </div>
)

BipExGeneResult.propTypes = {
  result: PropTypes.shape({
    n_cases: PropTypes.number,
    n_controls: PropTypes.number,
    ptv_case_count: PropTypes.number,
    ptv_control_count: PropTypes.number,
    ptv_fisher_gnom_non_psych_pval: PropTypes.number,
    // Odds ratio values may be a string 'inf' or a number
    ptv_fisher_gnom_non_psych_OR: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    damaging_missense_case_count: PropTypes.number,
    damaging_missense_control_count: PropTypes.number,
    damaging_missense_fisher_gnom_non_psych_pval: PropTypes.number,
    // Odds ratio values may be a string 'inf' or a number
    damaging_missense_fisher_gnom_non_psych_OR: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]),
  }).isRequired,
}

const BipExGeneResults = ({ results }) => (
  <>
    <h2>
      Gene Result{' '}
      <HelpButton
        popupTitle="Gene Burden Result"
        popupContent={
          <>
            <p>
              These tables display the case-control burden of classes of variation within the gene
              of interest. By clicking on the tabs, you can jump between the entire case-control
              cohort and subphenotypes.
            </p>
            <p>
              Counts in the tables denote the summation of all minor allele count (MAC) &le; 5
              variants with that class of variation across the currently selected case cohort and
              controls respectively. We include two tables. The first is the overall count of
              MAC&le;5 without restriction to those variants not observed in a large control
              repository, the second applies a further restriction that the MAC&le;5 variant must
              not be present in the genome aggregation database (gnomAD). PTV stands for protein
              truncating variants, and we define damaging missense variants as missense variants
              that are classed as ‘probably damaging’ by polyphen, and ‘deleterious’ by SIFT.
            </p>
            <p>
              p-values are evaluated using Fisher’s exact and Cochran–Mantel–Haenszel (CMH) tests (a
              contingency based test allowing for case-control counts across distinct strata
              (cohorts grouped by geography in our case) in the data). Note that these p-values are
              evaluated on contingency tables based on presence/absence of a class of variation in
              the gene, not overall burden.
            </p>
          </>
        }
      />
    </h2>
    <Tabs
      tabs={[
        'Bipolar Disorder',
        'Bipolar Disorder 1',
        'Bipolar Disorder 2',
        'Bipolar Disorder with Psychosis',
        'Bipolar Disorder without Psychosis',
        'Bipolar Disorder (including Schizoaffective)',
      ].map((group) => ({
        id: group,
        label: group,
        render: () =>
          results[group] ? (
            <BipExGeneResult result={results[group]} />
          ) : (
            <p>No result for {group} in this gene.</p>
          ),
      }))}
    />
  </>
)

BipExGeneResults.propTypes = {
  results: PropTypes.objectOf(PropTypes.object).isRequired,
}

export default BipExGeneResults
