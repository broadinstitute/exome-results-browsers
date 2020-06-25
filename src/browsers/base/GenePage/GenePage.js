import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { PageHeading, Tabs } from '@gnomad/ui'

import DocumentTitle from '../DocumentTitle'
import Fetch from '../Fetch'
import StatusMessage from '../StatusMessage'
import RegionViewer from './AutosizedRegionViewer'
import { ExacConstraintTable, GnomadConstraintTable } from './Constraint'
import GeneInfo from './GeneInfo'
import GeneResults from './GeneResults'
import { TrackPage, TrackPageSection } from './TrackPage'
import TranscriptTrack from './TranscriptTrack'
import VariantsInGene from './VariantsInGene'

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

const GenePage = ({
  browserTitle,
  gene,
  defaultVariantAnalysisGroup,
  variantAnalysisGroupLabels,
  variantAnalysisGroupOptions,
  variantConsequences,
  variantResultColumns,
  variantCustomFilter,
  renderVariantAttributes,
}) => {
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
            <h2>Constraint</h2>
            <Tabs
              tabs={[
                {
                  id: 'gnomad',
                  label: 'gnomAD',
                  render: () =>
                    gene.gnomad_constraint ? (
                      <GnomadConstraintTable constraint={gene.gnomad_constraint} />
                    ) : (
                      <p>gnomAD constraint is not available for this gene.</p>
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
          defaultVariantAnalysisGroup={defaultVariantAnalysisGroup}
          gene={gene}
          renderVariantAttributes={renderVariantAttributes}
          variantAnalysisGroupLabels={variantAnalysisGroupLabels}
          variantAnalysisGroupOptions={variantAnalysisGroupOptions}
          variantConsequences={variantConsequences}
          variantCustomFilter={variantCustomFilter}
          variantResultColumns={variantResultColumns}
        />
      </RegionViewer>
    </TrackPage>
  )
}

GenePage.propTypes = {
  browserTitle: PropTypes.string.isRequired,
  variantAnalysisGroupOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  defaultVariantAnalysisGroup: PropTypes.string.isRequired,
  variantAnalysisGroupLabels: PropTypes.objectOf(PropTypes.string),
  variantResultColumns: PropTypes.arrayOf(PropTypes.object).isRequired,
  variantConsequences: PropTypes.arrayOf(PropTypes.object).isRequired,
  variantCustomFilter: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  renderVariantAttributes: PropTypes.func,
  gene: PropTypes.shape({
    reference_genome: PropTypes.oneOf(['GRCh37', 'GRCh38']).isRequired,
    gene_id: PropTypes.string.isRequired,
    symbol: PropTypes.string.isRequired,
    name: PropTypes.string,
    canonical_transcript: PropTypes.shape({
      strand: PropTypes.string.isRequired,
      exons: PropTypes.arrayOf(
        PropTypes.shape({
          start: PropTypes.number.isRequired,
          stop: PropTypes.number.isRequired,
        })
      ),
    }).isRequired,
    gnomad_constraint: PropTypes.object,
    exac_constraint: PropTypes.object,
    gene_results: PropTypes.objectOf(PropTypes.any).isRequired,
  }).isRequired,
}

GenePage.defaultProps = {
  variantAnalysisGroupLabels: undefined,
  variantCustomFilter: undefined,
  renderVariantAttributes: undefined,
}

const GenePageContainer = ({ geneIdOrSymbol, ...otherProps }) => {
  return (
    <Fetch path={`/gene/${geneIdOrSymbol}`}>
      {({ data, error, loading }) => {
        if (loading) {
          return <StatusMessage>Loading gene...</StatusMessage>
        }

        if (error || !(data || {}).gene) {
          return <StatusMessage>{error.message || 'Unable to load gene'}</StatusMessage>
        }

        return <GenePage {...otherProps} gene={data.gene} />
      }}
    </Fetch>
  )
}

GenePageContainer.propTypes = {
  geneIdOrSymbol: PropTypes.string.isRequired,
}

export default GenePageContainer
