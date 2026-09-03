import { get } from 'lodash'
import React from 'react'
import Highlighter from 'react-highlight-words'
import styled from 'styled-components'

// @ts-expect-error: no types in this @gnomad/ui version
import { TooltipAnchor } from '@gnomad/ui'

import Link from '../Link'
import { InputData, renderFloatAsScientific } from '../tableCells'
import {
  DatasetId,
  GeneResultColumnConfig,
  GeneResultColumnGroup,
  ReferenceGenome,
} from '../Browser'
import { Constraint } from '../GenePage/Constraint'
import { Strand } from '../GenePage/TranscriptTrack'

interface GeneDatasetResultAPIResponse {
  group_results: unknown[][]
}

interface Exon {
  feature_type: string
  start: number
  stop: number
}

interface CanonicalTranscriptAPIResponse {
  transcript_id: string
  strand: Strand
  start: number
  stop: number
  exons: Exon[]
}

export type IndividualGeneGeneResultsAPIResponse = Partial<
  Record<DatasetId, GeneDatasetResultAPIResponse>
>

export interface IndividualGeneAPIResponse {
  gene_id: string
  hgnc_id: string
  symbol: string
  name: string
  previous_symbols: string[] | null
  alias_symbols: string[] | null
  omim_id: string
  search_terms: string[] | null
  exac_constraint: Constraint
  gnomad_v2_constraint: Constraint
  gnomad_v4_constraint: Constraint
  gene_results: IndividualGeneGeneResultsAPIResponse
  reference_genome: ReferenceGenome
  chrom: string
  strand: Strand
  start: number
  stop: number
  gencode_gene_symbol: string
  canonical_transcript_id: string
  canonical_transcript: CanonicalTranscriptAPIResponse
}

// TK: TODO: should this type live here, or another file?
export interface GeneRow {
  gene_id: string
  gene_symbol?: string
  gene_name?: string
  chrom?: string
  pos?: number

  // TK: TODO: fixme: from geneInfo, are these the same type? Or split into two
  reference_genome: ReferenceGenome
  canonical_transcript_id: string
  symbol: string
  start: number
  stop: number
  hgnc_id?: string
  omim_id?: string

  group_results: { [key: string]: any }
  [key: string]: any
}

interface RenderContext {
  highlightWords?: string[]
}

export interface GeneResultTableColumn {
  key: string
  heading: React.ReactNode
  csvHeading: string
  isSortable?: boolean
  minWidth?: number
  grow?: number
  tooltip?: string
  render: (row: GeneRow, key: string, context: RenderContext) => React.ReactNode
  renderForCSV: (row: GeneRow, key: string) => string | number | null
}

const baseColumns: GeneResultTableColumn[] = [
  {
    key: 'gene_id',
    heading: 'Gene',
    csvHeading: 'Gene',
    isSortable: true,
    minWidth: 100,
    render: (row, _key, { highlightWords = [] }) => (
      <Link className="grid-cell-content" target="_blank" to={`/gene/${row.gene_id}`}>
        <Highlighter
          searchWords={highlightWords}
          textToHighlight={row.gene_symbol || row.gene_id}
        />
      </Link>
    ),
    renderForCSV: (row, key) => get(row, key),
  },
  {
    key: 'gene_name',
    heading: 'Description',
    csvHeading: 'Description',
    isSortable: true,
    minWidth: 200,
    grow: 4,
    render: (row, key, { highlightWords = [] }) => {
      const value = row[key]
      return value ? (
        <TooltipAnchor tooltip={row[key]}>
          <span className="grid-cell-content">
            <Highlighter searchWords={highlightWords} textToHighlight={row[key]} />
          </span>
        </TooltipAnchor>
      ) : null
    },
    renderForCSV: (row, key) => get(row, key),
  },
]

export const DEFAULT_COLUMN_GROUP_COLOR = '#eef1f7'

const ColumnGroupBanner = styled.div<{ $color: string; $hasLabel: boolean }>`
  position: relative;
  z-index: ${({ $hasLabel }) => ($hasLabel ? 1 : 0)};
  margin: -0.25em -20px 0.35em -0.5em;
  padding: 0.4em 20px 0.25em 0.5em;
  height: 1.5em;
  background: ${({ $color }) => $color};
`

const ColumnGroupBannerLabel = styled.span`
  position: absolute;
  left: 0.5em;
  top: 50%;
  transform: translateY(-50%);
  white-space: nowrap;
  font-weight: bold;
`

export const applyColumnGroupHeadings = (
  columns: GeneResultColumnConfig[]
): GeneResultColumnConfig[] =>
  columns.map((column, index) => {
    if (!column.group) {
      return column
    }

    const previousColumn = columns[index - 1]
    const isFirstInGroupRun = previousColumn?.group?.key !== column.group.key
    const color = column.group.color || DEFAULT_COLUMN_GROUP_COLOR

    return {
      ...column,
      heading: (
        <React.Fragment>
          <ColumnGroupBanner $color={color} $hasLabel={isFirstInGroupRun}>
            {isFirstInGroupRun ? (
              <ColumnGroupBannerLabel>{column.group.label}</ColumnGroupBannerLabel>
            ) : null}
          </ColumnGroupBanner>
          <div>{column.heading || column.key}</div>
        </React.Fragment>
      ),
    }
  })

export const getColumnGroups = (columns: GeneResultColumnConfig[]): GeneResultColumnGroup[] => {
  const groups: GeneResultColumnGroup[] = []
  columns.forEach((column) => {
    if (column.group && !groups.some((group) => group.key === column.group!.key)) {
      groups.push(column.group)
    }
  })
  return groups
}

const getTableColumns = (geneResultColumns: GeneResultColumnConfig[]): GeneResultTableColumn[] => {
  const resultColumns: GeneResultTableColumn[] = applyColumnGroupHeadings(geneResultColumns).map(
    (column, index) => {
      const originalHeading = geneResultColumns[index].heading
      const csvHeading = typeof originalHeading === 'string' ? originalHeading : column.key

      return {
        key: column.key,
        heading: column.heading || column.key,
        csvHeading,
        tooltip: column.tooltip,
        isSortable: true,
        minWidth: column.minWidth || 65,
        grow: 0,
        render: column.render
          ? (row, key) => column.render!(get(row, key), row)
          : (row, key) =>
              renderFloatAsScientific({ value: get(row, key) as InputData, zeroValue: '0' }),
        renderForCSV: column.renderForCSV
          ? (row, key) => column.renderForCSV!(get(row, key), row)
          : (row, key) => get(row, key),
      }
    }
  )

  return [...baseColumns, ...resultColumns]
}

export default getTableColumns
