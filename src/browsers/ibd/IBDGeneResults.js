import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { BaseTable, Tabs } from '@gnomad/ui'

import HelpButton from '../base/HelpButton'

const ibdAnalysisGroups = ['IBD', 'CD', 'UC']

const Table = styled(BaseTable)`
  min-width: 325px;
`

const formatToDecimals = (value, decimals = 3) => {
  if (value == null) return '-'
  return Number(value).toFixed(decimals)
}
const formatDecimal = (value) => formatToDecimals(value, 3)
// const formatWholeNumber = (value) => formatToDecimals(value, 0)

const formatScientific = (value, decimals = 2) => {
  if (value == null) return '-'
  if (value < 0.01) {
    return Number(value).toExponential(decimals)
  }
  return formatToDecimals(value)
}

const formatPVal = (value) => {
  if (value === 0) {
    return '2.2e-16'
  }
  return formatScientific(value)
}

const rowOptions = {
  'PTV 0.001': 'ptv_0_001',
  'NSyn 0.001': 'nsyn_0_001',
  'NSyn AM 0.001': 'nsyn_am_0_001',
}

const columnOptions = {
  'P-Value': {
    schemaName: 'P_meta',
    renderFunction: formatPVal,
  },
  Beta: {
    schemaName: 'beta_meta',
    renderFunction: formatDecimal,
  },
  'Het P': {
    schemaName: 'het_P_meta',
    renderFunction: formatDecimal,
  },
}

const rowsWanted = ['PTV 0.001', 'NSyn 0.001']

const columnsWanted = ['Category', 'P-Value', 'Beta', 'Het P']

const IBDGeneResult = ({ result }) => (
  <div>
    <Table>
      <thead>
        <tr>
          {columnsWanted.map((column) => {
            return <th scope="col">{column}</th>
          })}
        </tr>
      </thead>

      <tbody>
        {rowsWanted.map((row) => (
          <tr key={row}>
            <th scope="row">{row}</th>
            {columnsWanted
              .filter((column) => column !== 'Category')
              .map((column) => (
                <td key={column}>
                  {(() => {
                    const toCheck = result[`${rowOptions[row]}_${columnOptions[column].schemaName}`]
                    return toCheck === null ? '-' : columnOptions[column].renderFunction(toCheck)
                  })()}
                </td>
              ))}
          </tr>
        ))}
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
      tabs={ibdAnalysisGroups.map((group) => ({
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
