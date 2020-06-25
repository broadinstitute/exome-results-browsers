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

const baseColumns = [
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

const getVariantTableColumns = (variantResultColumns) => {
  const resultColumns = variantResultColumns.map((column) => ({
    key: column.key,
    heading: column.heading || column.key,
    tooltip: column.tooltip,
    isSortable: true,
    sortFunction: (a, b) => a - b,
    sortKey: column.key,
    minWidth: column.minWidth || 65,
    render: column.render ? (row, key) => column.render(get(row, key)) : renderNumberCell,
    renderForCSV: column.renderForCSV ? (row, key) => column.renderForCSV(get(row, key)) : get,
  }))

  return [...baseColumns, ...resultColumns]
}

export default getVariantTableColumns
