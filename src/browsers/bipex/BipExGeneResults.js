import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { BaseTable, ExternalLink, Tabs } from '@gnomad/ui'

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
    <h3>Burden (MAC ≤ 5)</h3>
    <Table>
      <thead>
        <tr>
          <th scope="col">Category</th>
          <th scope="col">Case Count</th>
          <th scope="col">Control Count</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Protein-truncating</th>
          <td>{result.ptv_case_count === null ? '-' : result.ptv_case_count}</td>
          <td>{result.ptv_control_count === null ? '-' : result.ptv_control_count}</td>
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
        </tr>
      </tbody>
    </Table>

    <h3>Presence/absence (MAC ≤ 5, not in gnomAD non-neuro)</h3>
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
          <td>
            {result.ptv_fisher_gnom_non_psych_case_count === null
              ? '-'
              : result.ptv_fisher_gnom_non_psych_case_count}
          </td>
          <td>
            {result.ptv_fisher_gnom_non_psych_control_count === null
              ? '-'
              : result.ptv_fisher_gnom_non_psych_control_count}
          </td>
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
            {result.damaging_missense_fisher_gnom_non_psych_case_count === null
              ? '-'
              : result.damaging_missense_fisher_gnom_non_psych_case_count}
          </td>
          <td>
            {result.damaging_missense_fisher_gnom_non_psych_control_count === null
              ? '-'
              : result.damaging_missense_fisher_gnom_non_psych_control_count}
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

    <p style={{ marginTop: '2em' }}>
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
    ptv_fisher_gnom_non_psych_case_count: PropTypes.number,
    ptv_fisher_gnom_non_psych_control_count: PropTypes.number,
    ptv_fisher_gnom_non_psych_pval: PropTypes.number,
    // Odds ratio values may be a string 'inf' or a number
    ptv_fisher_gnom_non_psych_OR: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    damaging_missense_case_count: PropTypes.number,
    damaging_missense_control_count: PropTypes.number,
    damaging_missense_fisher_gnom_non_psych_case_count: PropTypes.number,
    damaging_missense_fisher_gnom_non_psych_control_count: PropTypes.number,
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
              These pages display two separate tables, one of burden of classes of variation, and
              one of presence/absence of classes of variation. By clicking on the tabs, you can jump
              between the entire case-control cohort and subphenotypes.
            </p>
            <p>
              Counts in the first table denote the summation of all minor allele count (MAC) ≤ 5
              variants with that class of variation across the currently selected case cohort and
              controls respectively. This does not impose the further restriction to those variants
              not observed in a large control repository (gnomAD non-neuro).
            </p>
            <p>
              To determine whether a particular variant is present or absent in gnomAD non-neuro,
              check the &ldquo;in gnomAD non-neuro&rdquo; column of that variant table further down
              the page.
            </p>
            <p>
              Entries in the second table are counts of individuals harboring at least one MAC ≤ 5
              variant with the additional restriction that it is not present in gnomAD non-neuro
              (which we call ultra-rare in the{' '}
              <ExternalLink href="https://doi.org/10.1101/2021.03.09.21252930">paper</ExternalLink>
              ). Note that this is not the same as the above table after subtracting variants not in
              gnomAD non-neuro, as an individual could potentially have more than one ultra-rare
              variant in the gene.
            </p>
            <p>
              We define damaging missense variants as missense variants that are classed as
              &ldquo;probably damaging&rdquo; by polyphen, and &ldquo;deleterious&rdquo; by SIFT.
            </p>
            <p>
              <em>p</em>-values are evaluated with Fisher&apos;s exact tests using the counts in the
              second table.
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
