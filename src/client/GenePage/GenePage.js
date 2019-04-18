import PropTypes from 'prop-types'
import React, { Component } from 'react'
import styled from 'styled-components'

import { PageHeading } from '@broad/ui'

import browserConfig from '@browser/config'

import DocumentTitle from '../DocumentTitle'
import Query from '../Query'
import StatusMessage from '../StatusMessage'
import { TrackPage, TrackPageSection } from '../TrackPage'
import RegionViewer from './AutosizedRegionViewer'
import GeneInfo from './GeneInfo'
import TranscriptTrack from './TranscriptTrack'
import VariantsInGene from './VariantsInGene'

const GeneFullName = styled.span`
  font-size: 0.75em;
  font-weight: 400;
`

const geneQuery = `
query Gene($geneName: String!) {
  gene(gene_name: $geneName) {
    gene_id
    gene_name
    full_gene_name
    canonical_transcript
    results {
      analysis_group
      categories {
        id
        xcase
        xctrl
        pval
      }
      pval_meta
    }
    transcript {
      strand
      exons {
        feature_type
        start
        stop
      }
    }
  }
}
`

class GenePage extends Component {
  state = {
    selectedAnalysisGroup: browserConfig.analysisGroups.defaultGroup,
  }

  render() {
    const { geneName } = this.props
    const { selectedAnalysisGroup } = this.state

    return (
      <Query query={geneQuery} variables={{ geneName }}>
        {({ data, error, graphQLErrors, loading }) => {
          if (loading) {
            return <StatusMessage>Loading gene...</StatusMessage>
          }

          if (error) {
            return <StatusMessage>Unable to load gene</StatusMessage>
          }

          if (graphQLErrors && !data.gene) {
            return <StatusMessage>{graphQLErrors.map(err => err.message).join(', ')}</StatusMessage>
          }

          const { gene } = data
          const canonicalCodingExons = gene.transcript.exons.filter(
            exon => exon.feature_type === 'CDS'
          )

          return (
            <TrackPage>
              <TrackPageSection>
                <DocumentTitle title={gene.gene_name} />
                <PageHeading>
                  {gene.gene_name} <GeneFullName>{gene.full_gene_name}</GeneFullName>
                </PageHeading>
                <GeneInfo gene={gene} />
              </TrackPageSection>
              <RegionViewer padding={75} regions={canonicalCodingExons}>
                <TranscriptTrack exons={canonicalCodingExons} strand={gene.transcript.strand} />
                <VariantsInGene
                  gene={gene}
                  selectedAnalysisGroup={selectedAnalysisGroup}
                  onChangeAnalysisGroup={analysisGroup => {
                    this.setState({ selectedAnalysisGroup: analysisGroup })
                  }}
                />
              </RegionViewer>
            </TrackPage>
          )
        }}
      </Query>
    )
  }
}

GenePage.propTypes = {
  geneName: PropTypes.string.isRequired,
}

export default GenePage
