import React from 'react'
import styled from 'styled-components'

import { ExternalLink, Page, PageHeading } from '@gnomad/ui'

import DocumentTitle from '../base/DocumentTitle'
import Link from '../base/Link'
import Searchbox from '../base/Searchbox'

const HomePageHeading = styled(PageHeading)`
  margin: 3em 0 1em;
`

const HomePageWrapper = styled(Page)`
  max-width: 740px;
  font-size: 16px;

  p {
    margin: 0 0 1.5em;
    line-height: 1.5;
  }
`

import AscLogo from './content/asc_logo.png'
import BroadLogo from './content/broad_logo.png'
import SfariLogo from './content/sfari_logo.png'

const LogoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3em;
  width: 100%;
  margin: 0 0 2em;
`

const StyledLogo = styled.img`
  width: auto;
  height: auto;
  max-width: 30%;
  max-height: 140px;
`

export default () => (
  <HomePageWrapper>
    <DocumentTitle title="ASC2 browser" />
    <HomePageHeading>Autism Sequencing Consortium exome analysis</HomePageHeading>

    <Searchbox id="asc-search" width="100%" />

    <p style={{ marginTop: '0.5em' }}>
      Search for a gene (e.g., <Link to="/gene/ENSG00000251322">SHANK3</Link>) or an Ensembl ID
      (e.g., <Link to="/gene/ENSG00000251322">ENSG0000251322</Link>) or view{' '}
      <Link to="/results">all results</Link>
    </p>

    <p>
      The{' '}
      <ExternalLink href="https://genome.emory.edu/ASC/">
        Autism Sequencing Consortium (ASC)
      </ExternalLink>{' '}
      is an international collaboration dedicated to the collection, aggregation, and analysis of
      sequencing data of autistic individuals, with the aim of advancing our understanding of the
      genetic basis of autism spectrum disorder (ASD). This Browser displays the results of the
      ASC’s latest exome aggregation and gene discovery efforts, encompassing data from 62,429
      individuals with recorded autism (38,680 probands and 23,749 cases) and 33,316 individuals
      without recorded autism (9,567 siblings and 23,749 controls).
    </p>

    <LogoRow>
      <StyledLogo src={AscLogo} />
      <StyledLogo src={BroadLogo} />
      <StyledLogo src={SfariLogo} />
    </LogoRow>

    <p>
      More information can be found on data collection and generation can be found{' '}
      <Link to="/results">here</Link>. All data are released for the benefit of the biomedical
      community (see the <Link to="/terms">terms of use</Link>).
    </p>
  </HomePageWrapper>
)
