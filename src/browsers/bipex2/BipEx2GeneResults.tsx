import React from 'react'
import styled from 'styled-components'

import { BaseTable, ExternalLink } from '@gnomad/ui'

import HelpButton from '../base/HelpButton'

const Table = styled(BaseTable)`
  min-width: 325px;
`

const renderOddsRatio = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) {
    return '-'
  }
  if (value === 'Infinity') {
    return '∞'
  }
  if (value === 0) {
    return '0'
  }

  const floatValue = typeof value === 'string' ? parseFloat(value) : value
  if (Number.isNaN(floatValue)) {
    return value
  }
  return floatValue.toPrecision(3)
}

enum ResultEnum {
  n_cases,
  n_controls,
  ptv_case_carrier,
  ptv_ctrl_carrier,
  ptv_p_value,
  ptv_odds_ratio,
  mis_case_carrier,
  mis_ctrl_carrier,
  mis_p_value,
  mis_odds_ratio,
  ptv_mis_case_carrier,
  ptv_mis_ctrl_carrier,
  ptv_mis_p_value,
  ptv_mis_odds_ratio,
  syn_case_carrier,
  syn_ctrl_carrier,
  syn_p_value,
  syn_odds_ratio,
}

type ResultKey = keyof typeof ResultEnum

type ResultObject = Record<ResultKey, string>

type CategoryAbbreviation = 'ptv' | 'mis' | 'ptv_mis' | 'syn'


const safeReturnValue = (object: ResultObject, fieldName: ResultKey): string => {
  return object[fieldName] === null ? '-' : object[fieldName]
}

const createGeneTableRow = (object: ResultObject, category: string, categoryAbbreviation: CategoryAbbreviation) => {
  return (
    <tr>
      <th scope="row">{category}</th>
      <td>{safeReturnValue(object, `${categoryAbbreviation}_case_carrier`)}</td>
      <td>{safeReturnValue(object, `${categoryAbbreviation}_ctrl_carrier`)}</td>
      <td>{safeReturnValue(object, `${categoryAbbreviation}_p_value`)}</td>
      <td>{renderOddsRatio(object[`${categoryAbbreviation}_odds_ratio`])}</td>
    </tr>
  )
}

const BipExGeneResult = ({ result }: { result: ResultObject }) => (
  <div>
    <Table>
      <thead>
        <tr>
          <th scope="col">Category</th>
          <th scope="col">Case Count</th>
          <th scope="col">Control Count</th>
          <th scope="col">P-value</th>
          <th scope="col">Odds Ratio</th>
        </tr>
      </thead>
      <tbody>
        {createGeneTableRow(result, 'Protein-truncating', 'ptv')}
        {createGeneTableRow(result, 'Missense', 'mis')}
        {createGeneTableRow(result, 'Missense + Protein-truncating', 'ptv_mis')}
        {createGeneTableRow(result, 'Synonmymous', 'syn')}
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


interface BipExGeneResultsProps {
  results: {
    meta: ResultObject
  }
}

const BipExGeneResults = ({ results }: BipExGeneResultsProps) => (
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

    <BipExGeneResult result={results.meta} />
  </>
)

export default BipExGeneResults
