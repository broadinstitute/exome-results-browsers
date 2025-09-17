import { get } from 'lodash'
import React from 'react'
import Highlighter from 'react-highlight-words'
import styled from 'styled-components'

import { TextButton } from '@gnomad/ui'

const VariantIdButton = styled(TextButton)`
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const categoryColors = {
  lof: '#DD2C00',
  missense: 'orange',
  synonymous: '#2E7D32',
  other: '#424242',
}

const VariantCategoryMarker = styled.span`
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 0.5em;

  &::before {
    content: '';
    display: inline-block;
    box-sizing: border-box;
    width: 10px;
    height: 10px;
    border: 1px solid #000;
    border-radius: 5px;
    background: ${(props) => props.color};
  }
`

const renderNumberCell = (row, key) => {
  const number = get(row, key)
  if (number === null || number === undefined) {
    return ''
  }
  const truncated = Number(number.toPrecision(3))
  if (truncated === 0) {
    return '0'
  }
  return truncated
}

const renderExponentialNumberCell = (row, key) => {
  const number = get(row, key)
  if (number === null || number === undefined) {
    return ''
  }
  const truncated = Number(number.toPrecision(3))
  if (truncated === 0) {
    return '0'
  }
  return truncated.toExponential()
}

export const renderExponentialIfSmall = (number) => {
  if (number === null || number === undefined) {
    return ''
  }

  const truncated = Number(number.toPrecision(3))
  if (truncated === 0) {
    return '0'
  }

  if (truncated < 0.01) {
    return truncated.toExponential()
  }

  return truncated
}

const renderExponentialNumberCellIfSmall = (row, key) => {
  const number = get(row, key)
  return renderExponentialIfSmall(number)
}

const variantDescriptionColumns = [
  {
    key: 'variant_id',
    heading: 'Variant ID',
    tooltip: 'Chromosome-position-reference-alternate',
    isRowHeader: true,
    isSortable: true,
    sortFunction: (a, b) => a - b,
    sortKey: 'pos',
    minWidth: 130,
    grow: 2,
    render: (row, key, { highlightWords, onClickVariant }) => (
      <VariantIdButton onClick={() => onClickVariant(row)} tabIndex={-1}>
        <Highlighter searchWords={highlightWords} textToHighlight={row[key]} />
      </VariantIdButton>
    ),
    renderForCSV: get,
  },
  {
    key: 'hgvs',
    heading: 'HGVSp/c',
    tooltip: 'HGVS protein (if available) or coding sequence',
    isSortable: true,
    sortFunction: (a, b) => a.localeCompare(b),
    sortKey: 'hgvs',
    minWidth: 130,
    grow: 2,
    render: (row, key, { highlightWords }) => (
      <Highlighter
        className="grid-cell-content"
        searchWords={highlightWords}
        textToHighlight={row[key] || ''}
      />
    ),
    renderForCSV: get,
  },
  {
    key: 'consequence',
    heading: 'Consequence',
    tooltip: 'Predicted functional consequence',
    isSortable: true,
    sortFunction: (a, b) => a.localeCompare(b),
    sortKey: 'consequence',
    minWidth: 180,
    render: (row, key, { highlightWords }) =>
      row.consequence && (
        <span className="grid-cell-content">
          <VariantCategoryMarker color={categoryColors[row.consequenceCategory]} />
          <Highlighter searchWords={highlightWords} textToHighlight={row.consequence || ''} />
        </span>
      ),
    renderForCSV: get,
  },
]

const statColumns = [
  {
    key: 'group_result.ac_case',
    heading: 'AC Case',
    tooltip: 'Allele count in cases',
    isSortable: true,
    sortFunction: (a, b) => a - b,
    sortKey: 'group_result.ac_case',
    minWidth: 75,
    render: get,
    renderForCSV: get,
  },
  {
    key: 'group_result.an_case',
    heading: 'AN Case',
    tooltip: 'Allele number in cases',
    isSortable: true,
    sortFunction: (a, b) => a - b,
    sortKey: 'group_result.an_case',
    minWidth: 75,
    render: get,
    renderForCSV: get,
  },
  {
    key: 'group_result.ac_ctrl',
    heading: 'AC Control',
    tooltip: 'Allele count in controls',
    isSortable: true,
    sortFunction: (a, b) => a - b,
    sortKey: 'group_result.ac_ctrl',
    minWidth: 75,
    render: get,
    renderForCSV: get,
  },
  {
    key: 'group_result.an_ctrl',
    heading: 'AN Control',
    tooltip: 'Allele number in controls',
    isSortable: true,
    sortFunction: (a, b) => a - b,
    sortKey: 'group_result.an_ctrl',
    minWidth: 75,
    render: get,
    renderForCSV: get,
  },
  {
    key: 'group_result.af_case',
    heading: 'AF Case',
    tooltip: 'Allele frequency in cases',
    isSortable: true,
    sortFunction: (a, b) => a - b,
    sortKey: 'group_result.af_case',
    minWidth: 80,
    render: renderExponentialNumberCell,
    renderForCSV: get,
  },
  {
    key: 'group_result.af_ctrl',
    heading: 'AF Control',
    tooltip: 'Allele frequency in controls',
    isSortable: true,
    sortFunction: (a, b) => a - b,
    sortKey: 'group_result.af_ctrl',
    minWidth: 80,
    render: renderExponentialNumberCell,
    renderForCSV: get,
  },
]

const gp2StatColumns = [
  {
    key: 'group_result.wgs_ac_case',
    heading: 'WGS AC Case',
    tooltip: 'Allele count in cases in whole genome sequencing',
    isSortable: true,
    sortFunction: (a, b) => a - b,
    sortKey: 'group_result.wgs_ac_case',
    minWidth: 80,
    render: get,
    renderForCSV: get,
  },
  {
    key: 'group_result.wgs_an_case',
    heading: 'WGS AN Case',
    tooltip: 'Allele number in cases in whole genome sequencing',
    isSortable: true,
    sortFunction: (a, b) => a - b,
    sortKey: 'group_result.wgs_an_case',
    minWidth: 80,
    render: get,
    renderForCSV: get,
  },
  {
    key: 'group_result.wgs_af_case',
    heading: 'WGS AF Case',
    tooltip: 'Allele frequency in cases in whole genome sequencing',
    isSortable: true,
    sortFunction: (a, b) => a - b,
    sortKey: 'group_result.wgs_af_case',
    minWidth: 80,
    render: renderExponentialNumberCellIfSmall,
    renderForCSV: get,
  },
  {
    key: 'group_result.wgs_ac_ctrl',
    heading: 'WGS AC Control',
    tooltip: 'Allele count in controls in whole genome sequencing',
    isSortable: true,
    sortFunction: (a, b) => a - b,
    sortKey: 'group_result.wgs_ac_ctrl',
    minWidth: 80,
    render: get,
    renderForCSV: get,
  },
  {
    key: 'group_result.wgs_an_ctrl',
    heading: 'WGS AN Control',
    tooltip: 'Allele number in controls in whole genome sequencing',
    isSortable: true,
    sortFunction: (a, b) => a - b,
    sortKey: 'group_result.wgs_an_ctrl',
    minWidth: 80,
    render: get,
    renderForCSV: get,
  },
  {
    key: 'group_result.wgs_af_ctrl',
    heading: 'WGS AF Control',
    tooltip: 'Allele frequency in controls in whole genome sequencing',
    isSortable: true,
    sortFunction: (a, b) => a - b,
    sortKey: 'group_result.wgs_af_ctrl',
    minWidth: 80,
    render: renderExponentialNumberCellIfSmall,
    renderForCSV: get,
  },
  {
    key: 'group_result.wgs_ac_other',
    heading: 'WGS AC Other',
    tooltip: 'Allele count in others in whole genome sequencing',
    isSortable: true,
    sortFunction: (a, b) => a - b,
    sortKey: 'group_result.wgs_ac_other',
    minWidth: 80,
    render: get,
    renderForCSV: get,
  },
  {
    key: 'group_result.wgs_an_other',
    heading: 'WGS AN Other',
    tooltip: 'Allele number in others in whole genome sequencing',
    isSortable: true,
    sortFunction: (a, b) => a - b,
    sortKey: 'group_result.wgs_an_other',
    minWidth: 80,
    render: get,
    renderForCSV: get,
  },
  {
    key: 'group_result.wgs_af_other',
    heading: 'WGS AF Other',
    tooltip: 'Allele frequency in others in whole genome sequencing',
    isSortable: true,
    sortFunction: (a, b) => a - b,
    sortKey: 'group_result.wgs_af_other',
    minWidth: 80,
    render: renderExponentialNumberCellIfSmall,
    renderForCSV: get,
  },
]

const getVariantTableColumns = (variantResultColumns) => {
  const { datasetId } = window.datasetConfig

  const datasetColumns = [...variantDescriptionColumns]

  if (datasetId === 'GP2') {
    datasetColumns.push(...gp2StatColumns)
  } else {
    datasetColumns.push(...statColumns)
  }

  const resultColumns = variantResultColumns.map((column) => {
    return {
      key: column.key,
      heading: column.heading || column.key,
      tooltip: column.tooltip,
      isSortable: true,
      sortFunction: (a, b) => a - b,
      sortKey: column.key,
      minWidth: column.minWidth || 65,
      render: column.render ? (row, key) => column.render(get(row, key)) : renderNumberCell,
      renderForCSV: column.renderForCSV ? (row, key) => column.renderForCSV(get(row, key)) : get,
    }
  })

  const variantTableColumns = [...datasetColumns, ...resultColumns]

  return variantTableColumns
}

export default getVariantTableColumns
