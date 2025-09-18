import PropTypes from 'prop-types'
import React from 'react'
import { Route, Switch } from 'react-router-dom'

import { ExternalLink } from '@gnomad/ui'

import datasetConfig from '../datasetConfig'
import Fetch from './Fetch'

const BrowserLink = ({ dataset }) => (
  <Switch>
    <Route
      path="/results"
      render={() => (
        <ExternalLink href={`https://${dataset.toLowerCase()}.broadinstitute.org/results`}>
          View results in {dataset} browser
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
                href={`https://${dataset.toLowerCase()}.broadinstitute.org${location.pathname}`}
              >
                View {label} in {dataset} browser
              </ExternalLink>
            )
          }}
        </Fetch>
      )}
    />
    <Route
      render={() => (
        <ExternalLink href={`https://${dataset.toLowerCase()}.broadinstitute.org`}>
          Open {dataset} browser
        </ExternalLink>
      )}
    />
  </Switch>
)

BrowserLink.propTypes = {
  dataset: PropTypes.string.isRequired,
}

export default () => (
  <>
    <p>
      This website contains results from one of several case-control studies of psychiatric diseases
      done at the Broad Institute. Results of other studies are available at the following websites:
    </p>

    {datasetConfig.datasetId !== 'ASC' && (
      <>
        <h2>
          Autism - <ExternalLink href="https://asc.broadinstitute.org">ASC</ExternalLink>
        </h2>
        <p>
          Founded in 2010, the Autism Sequencing Consortium (ASC) is an international group of
          scientists who share autism spectrum disorder (ASD) samples and genetic data. This portal
          displays variant and gene-level data from the most recent ASC exome sequencing analysis.
        </p>
        <p>
          <BrowserLink dataset="ASC" />
        </p>
      </>
    )}

    {datasetConfig.datasetId !== 'BipEx' && (
      <>
        <h2>
          Bipolar disorder -{' '}
          <ExternalLink href="https://bipex.broadinstitute.org">BipEx</ExternalLink>
        </h2>
        <p>
          The Bipolar Exome (BipEx) sequencing project is a collaboration between multiple
          institutions across the globe, which aims to increase our understanding of the disease
          architecture of bipolar disorder.
        </p>
        <p>
          <BrowserLink dataset="BipEx" />
        </p>
      </>
    )}

    {datasetConfig.datasetId !== 'Epi25' && (
      <>
        <h2>
          Epilepsy - <ExternalLink href="https://epi25.broadinstitute.org">Epi25</ExternalLink>
        </h2>
        <p>
          The Epi25 collaborative is a global collaboration committed to aggregating, sequencing,
          and deep-phenotyping up to 25,000 epilepsy patients to advance epilepsy genetics research.
          The Epi25 whole-exome sequencing (WES) case-control study is one of the
          collaborative&apos;s ongoing endeavors that aims to characterize the contribution of rare
          genetic variation to a spectrum of epilepsy syndromes to identify individual risk genes.
        </p>
        <p>
          <BrowserLink dataset="Epi25" />
        </p>
      </>
    )}

    {datasetConfig.datasetId !== 'SCHEMA' && (
      <>
        <h2>
          Schizophrenia -{' '}
          <ExternalLink href="https://schema.broadinstitute.org">SCHEMA</ExternalLink>
        </h2>
        <p>
          The Schizophrenia Exome Sequencing Meta-analysis (SCHEMA) consortium is a large multi-site
          collaboration dedicated to aggregating, generating, and analyzing high-throughput
          sequencing data of schizophrenia patients to improve our understanding of disease
          architecture and advance gene discovery. The first results of this study have provided
          genome-wide significant results associating rare variants in individual genes to risk of
          schizophrenia, and later releases are planned with larger number of samples that will
          further increase power.
        </p>
        <p>
          <BrowserLink dataset="SCHEMA" />
        </p>
      </>
    )}

    {datasetConfig.datasetId !== 'GP2' && (
      <>
        <h2>
          Parkinsons - <ExternalLink href="https://gp2.broadinstitute.org">GP2</ExternalLink>
        </h2>
        <p>
          The Global Parkinson’s Genetics Program (
          <ExternalLink href="https://gp2.org/">GP2</ExternalLink>) is a resource program of the
          Aligning Science Across Parkinson&apos;s (
          <ExternalLink href="https://parkinsonsroadmap.org/#">ASAP</ExternalLink>) initiative,
          which is managed by the Coalition for Aligning Science and implemented by the Michael J.
          Fox Foundation. GP2 serves as a central hub to generate genetic data from studies across
          the globe and harmonize corresponding clinical data. Our goal is to genetically
          characterize over 250,000 volunteers around the world to further understand the genetic
          architecture of Parkinson’s disease (PD).
        </p>
        <p>
          <BrowserLink dataset="GP2" />
        </p>
      </>
    )}
  </>
)
