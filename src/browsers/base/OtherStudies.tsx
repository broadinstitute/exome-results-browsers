import React from 'react'
import { Route, Switch } from 'react-router-dom'

// @ts-expect-error: no types in this @gnomad/ui version
import { ExternalLink } from '@gnomad/ui'

import datasetConfig from '../datasetConfig'
import Fetch from './Fetch'
import { DatasetId } from './Browser'

const BrowserLink = ({ datasetId }: { datasetId: DatasetId }) => (
  <Switch>
    <Route
      path="/results"
      render={() => (
        <ExternalLink href={`https://${datasetId.toLowerCase()}.broadinstitute.org/results`}>
          View results in {datasetId} browser
        </ExternalLink>
      )}
    />
    <Route
      path="/gene/:geneIdOrName"
      render={({ location, match }) => (
        <Fetch path={`/gene/${match.params.geneIdOrName}`}>
          {({ data }) => {
            const label = data && data.gene ? data.gene.symbol : 'this gene'
            return (
              <ExternalLink
                href={`https://${datasetId.toLowerCase()}.broadinstitute.org${location.pathname}`}
              >
                View {label} in {datasetId} browser
              </ExternalLink>
            )
          }}
        </Fetch>
      )}
    />
    <Route
      render={() => (
        <ExternalLink href={`https://${datasetId.toLowerCase()}.broadinstitute.org`}>
          Open {datasetId} browser
        </ExternalLink>
      )}
    />
  </Switch>
)

type DatasetLink = {
  id: DatasetId
  phenotype: string
  description: string | React.ReactNode
}

const datasetLinks: DatasetLink[] = [
  {
    id: 'ASC',
    phenotype: 'Autism',
    description:
      'Founded in 2010, the Autism Sequencing Consortium (ASC) is an international group of scientists who share autism spectrum disorder (ASD) samples and genetic data. This portal displays variant and gene-level data from the most recent ASC exome sequencing analysis.',
  },
  {
    id: 'BipEx',
    phenotype: 'Bipolar disorder',
    description:
      'The Bipolar Exome (BipEx) sequencing project is a collaboration between multiple institutions across the globe, which aims to increase our understanding of the disease architecture of bipolar disorder.',
  },
  {
    id: 'Epi25',
    phenotype: 'Epilepsy',
    description:
      'The Epi25 collaborative is a global collaboration committed to aggregating, sequencing, and deep-phenotyping up to 25,000 epilepsy patients to advance epilepsy genetics research. The Epi25 whole-exome sequencing (WES) case-control study is one of the collaborative&apos;s ongoing endeavors that aims to characterize the contribution of rare genetic variation to a spectrum of epilepsy syndromes to identify individual risk genes.',
  },
  {
    id: 'SCHEMA',
    phenotype: 'Schizophrenia',
    description:
      'The Schizophrenia Exome Sequencing Meta-analysis (SCHEMA) consortium is a large multi-site collaboration dedicated to aggregating, generating, and analyzing high-throughput sequencing data of schizophrenia patients to improve our understanding of disease architecture and advance gene discovery. The first results of this study have provided genome-wide significant results associating rare variants in individual genes to risk of schizophrenia, and later releases are planned with larger number of samples that will further increase power.',
  },
  {
    id: 'GP2',
    phenotype: 'Parkinsons',
    description: (
      <p>
        The Global Parkinson’s Genetics Program (
        <ExternalLink href="https://gp2.org/">GP2</ExternalLink>) is a resource program of the
        Aligning Science Across Parkinson&apos;s (
        <ExternalLink href="https://parkinsonsroadmap.org/#">ASAP</ExternalLink>) initiative, which
        is managed by the Coalition for Aligning Science and implemented by the Michael J. Fox
        Foundation. GP2 serves as a central hub to generate genetic data from studies across the
        globe and harmonize corresponding clinical data. Our goal is to genetically characterize
        over 250,000 volunteers around the world to further understand the genetic architecture of
        Parkinson’s disease (PD).
      </p>
    ),
  },
]

const OtherStudies = () => (
  <>
    <p>
      This website contains results from one of several case-control studies of psychiatric diseases
      done at the Broad Institute. Results of other studies are available at the following websites:
    </p>

    {datasetLinks
      .filter((ds) => ds.id !== datasetConfig.datasetId)
      .map((ds) => {
        return (
          <>
            <h2>
              {ds.phenotype} -{' '}
              <ExternalLink href={`https://${ds.id.toLowerCase()}.broadinstitute.org`}>{ds.id}</ExternalLink>
            </h2>
            <p>{ds.description}</p>
            <p>
              <BrowserLink datasetId={ds.id} />
            </p>
          </>
        )
      })}
  </>
)

export default OtherStudies
