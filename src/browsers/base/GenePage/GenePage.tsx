import React from 'react'
import styled from 'styled-components'

// @ts-expect-error: no types in this version of @gnomad/ui
import { ExternalLink, PageHeading, Tabs } from '@gnomad/ui'

import DocumentTitle from '../DocumentTitle'
import Fetch from '../Fetch'
import HelpButton from '../HelpButton'
import StatusMessage from '../StatusMessage'
import RegionViewer from './AutosizedRegionViewer'
import { ExacConstraintTable, GnomadConstraintTable } from './Constraint'
import GeneInfo from './GeneInfo'
import GeneResults from './GeneResults'
import { TrackPage, TrackPageSection } from './TrackPage'
import TranscriptTrack from './TranscriptTrack'
import VariantsInGene from './VariantsInGene'
import {
  DatasetId,
  VariantColumnConfig,
  VariantConsequence,
  VariantConsequenceCategoryLabels,
  VariantCustomFilter,
} from '../Browser'
import { IndividualGeneAPIResponse } from '../GeneResultsPage/geneResultTableColumns'
import { SortOrder } from './VariantTable'
import { VariantTableColumn } from './variantTableColumns'

const GeneName = styled.span`
  font-size: 0.75em;
  font-weight: 400;
`

const TablesWrapper = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  margin-bottom: 3em;
`

const ConstraintWrapper = styled.div`
  @media (min-width: 700px) {
    min-width: 415px;
  }
`

interface GenePageProps {
  datasetId: DatasetId
  browserTitle: string
  gene: IndividualGeneAPIResponse
  defaultVariantAnalysisGroup: string
  variantAnalysisGroupLabels?: Record<string, string>
  variantAnalysisGroupOptions: string[]
  variantSortKey?: string
  variantSortOrder?: SortOrder
  variantConsequences: VariantConsequence[]
  variantConsequenceCategoryLabels?: VariantConsequenceCategoryLabels
  variantResultColumns: VariantColumnConfig[]
  variantCustomFilter?: VariantCustomFilter
  // TK: TODO: fixme: type this better in Browser.tsx, import here
  renderVariantAttributes?: (result: any) => void
  additionalVariantDetailSummaryColumns?: VariantTableColumn[]
  variantDetailColumns?: VariantTableColumn[]
  renderVariantTranscriptConsequences?: boolean
}

const GenePage = ({
  datasetId,
  browserTitle,
  gene,
  defaultVariantAnalysisGroup,
  variantAnalysisGroupLabels = undefined,
  variantAnalysisGroupOptions,
  variantSortKey = 'variant_id',
  variantSortOrder = 'ascending',
  variantConsequences,
  variantConsequenceCategoryLabels = undefined,
  variantResultColumns,
  variantCustomFilter = undefined,
  additionalVariantDetailSummaryColumns = undefined,
  renderVariantAttributes = undefined,
  variantDetailColumns = undefined,
  renderVariantTranscriptConsequences = false,
}: GenePageProps) => {
  return (
    <TrackPage>
      <TrackPageSection>
        <DocumentTitle title={`${gene.symbol} | ${browserTitle}`} />
        <PageHeading>
          {gene.symbol} <GeneName>{gene.name}</GeneName>
        </PageHeading>

        <GeneInfo gene={gene} />

        <TablesWrapper>
          <div>
            <GeneResults gene={gene} geneResults={gene.gene_results} />
          </div>
          <ConstraintWrapper>
            <h2>
              Constraint{' '}
              <HelpButton
                popupTitle="Constraint"
                popupContent={
                  <p>
                    Metrics for quantification intolerance to loss-of-function / protein-truncating
                    variation as calculated by the gnomAD consortium. For more information, please
                    visit the{' '}
                    <ExternalLink href="https://gnomad.broadinstitute.org">
                      gnomAD browser
                    </ExternalLink>
                    , and read our{' '}
                    <ExternalLink href="https://gnomad.broadinstitute.org/help/constraint">
                      help text
                    </ExternalLink>
                    . Please note that insertions and deletions are excluded in the aggregated
                    counts and calculated metrics.
                  </p>
                }
              />
            </h2>
            <Tabs
              tabs={[
                {
                  id: 'gnomad_v4',
                  label: 'gnomAD v4',
                  render: () =>
                    gene.gnomad_v4_constraint ? (
                      <GnomadConstraintTable constraint={gene.gnomad_v4_constraint} />
                    ) : (
                      <p>gnomAD v4 constraint is not available for this gene.</p>
                    ),
                },
                {
                  id: 'gnomad_v2',
                  label: 'gnomAD v2',
                  render: () =>
                    gene.gnomad_v2_constraint ? (
                      <GnomadConstraintTable constraint={gene.gnomad_v2_constraint} />
                    ) : (
                      <p>gnomAD v2 constraint is not available for this gene.</p>
                    ),
                },
                {
                  id: 'exac',
                  label: 'ExAC',
                  render: () =>
                    gene.exac_constraint ? (
                      <ExacConstraintTable constraint={gene.exac_constraint} />
                    ) : (
                      <p>ExAC constraint is not available for this gene.</p>
                    ),
                },
              ]}
            />
          </ConstraintWrapper>
        </TablesWrapper>
      </TrackPageSection>
      <RegionViewer padding={75} regions={gene.canonical_transcript.exons}>
        <TranscriptTrack
          exons={gene.canonical_transcript.exons}
          strand={gene.canonical_transcript.strand}
        />
        <VariantsInGene
          datasetId={datasetId}
          defaultVariantAnalysisGroup={defaultVariantAnalysisGroup}
          gene={gene}
          renderVariantAttributes={renderVariantAttributes}
          additionalVariantDetailSummaryColumns={additionalVariantDetailSummaryColumns}
          variantDetailColumns={variantDetailColumns}
          renderVariantTranscriptConsequences={renderVariantTranscriptConsequences}
          variantAnalysisGroupLabels={variantAnalysisGroupLabels}
          variantAnalysisGroupOptions={variantAnalysisGroupOptions}
          variantSortKey={variantSortKey}
          variantSortOrder={variantSortOrder}
          variantConsequences={variantConsequences}
          variantConsequenceCategoryLabels={variantConsequenceCategoryLabels}
          variantCustomFilter={variantCustomFilter}
          variantResultColumns={variantResultColumns}
        />
      </RegionViewer>
    </TrackPage>
  )
}

interface GenePageContainerProps {
  datasetId: DatasetId
  geneIdOrSymbol: string
  browserTitle: string
  defaultVariantAnalysisGroup: string
  variantAnalysisGroupOptions: string[]
  variantConsequences: VariantConsequence[]
  variantResultColumns: VariantColumnConfig[]
  [key: string]: any
}

// TK: TODO: fixme: get rid of the ...otherProps,
// I personally don't like this pattern, it hides props from the reader
const GenePageContainer = ({
  datasetId,
  geneIdOrSymbol,
  defaultVariantAnalysisGroup,
  variantAnalysisGroupOptions,
  variantConsequences,
  variantResultColumns,
  ...otherProps
}: GenePageContainerProps) => {
  return (
    <Fetch path={`/gene/${geneIdOrSymbol}`}>
      {({
        data,
        error,
        loading,
      }: {
        data: { gene: IndividualGeneAPIResponse }
        error: Error | null
        loading: boolean
      }) => {
        if (loading) {
          return <StatusMessage>Loading gene...</StatusMessage>
        }

        if (error || !(data || {}).gene) {
          return <StatusMessage>{error?.message || 'Unable to load gene'}</StatusMessage>
        }

        return (
          <GenePage
            datasetId={datasetId}
            gene={data.gene}
            defaultVariantAnalysisGroup={defaultVariantAnalysisGroup}
            variantAnalysisGroupOptions={variantAnalysisGroupOptions}
            variantConsequences={variantConsequences}
            variantResultColumns={variantResultColumns}
            {...otherProps}
          />
        )
      }}
    </Fetch>
  )
}

export default GenePageContainer
