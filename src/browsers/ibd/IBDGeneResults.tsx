import React from 'react'
import styled from 'styled-components'

import { BaseTable, Tabs } from '@gnomad/ui'

import HelpButton from '../base/HelpButton'
import { IBDAnalysisGroup, ibdAnalysisGroups } from './IBDBrowser'

const Table = styled(BaseTable)`
  min-width: 325px;
`

const formatToDecimals = (value: number | string | null | undefined, decimals = 3) => {
  if (value === null || value === undefined) {
    return '-'
  }

  const floatValue = typeof value === 'string' ? parseFloat(value) : value
  if (Number.isNaN(floatValue)) {
    return value
  }

  return floatValue.toFixed(decimals)
}

const formatDecimal = (value: number | string | undefined) => {
  return formatToDecimals(value, 3)
}

const formatScientific = (value: number | string | null | undefined, decimals = 2) => {
  if (value === null || value === undefined) {
    return '-'
  }

  const floatValue = typeof value === 'string' ? parseFloat(value) : value
  if (Number.isNaN(floatValue)) {
    return value
  }

  if (floatValue < 0.01) {
    return floatValue.toExponential(decimals)
  }
  return formatToDecimals(value)
}

const formatPVal = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) {
    return '-'
  }

  const floatValue = typeof value === 'string' ? parseFloat(value) : value
  if (Number.isNaN(floatValue)) {
    return value
  }
  if (floatValue === 0) {
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

const rowsToRender = ['PTV 0.001', 'NSyn 0.001']
const columnsToRender = ['Category', 'P-Value', 'Beta', 'Het P']

type IBDGeneResult = {
  n_cases: number
  n_controls: number
  damaging_missense_case_count: number
  damaging_missense_control_count: number
  damaging_missense_pval: number
  damaging_missense_OR: number
  ptv_case_count: number
  ptv_control_count: number
  ptv_pval: number
  ptv_OR: number
}

interface IBDGeneResultProps {
  result: IBDGeneResult
}

const IBDGeneResult = ({ result }: IBDGeneResultProps) => (
  <div>
    <Table>
      <thead>
        <tr>
          {columnsToRender.map((column) => {
            return <th scope="col">{column}</th>
          })}
        </tr>
      </thead>

      <tbody>
        {rowsToRender.map((row) => (
          <tr key={row}>
            <th scope="row">{row}</th>
            {columnsToRender
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

interface IBDGeneResultsProps {
  results: Record<IBDAnalysisGroup, IBDGeneResult>
}

const IBDGeneResults = ({ results }: IBDGeneResultsProps) => (
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

export default IBDGeneResults
