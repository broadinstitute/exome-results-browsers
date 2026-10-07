import React from 'react'
import styled from 'styled-components'

// @ts-expect-error: no types in this @gnomad/ui version
import { ExternalLink, Page, PageHeading } from '@gnomad/ui'

import DocumentTitle from '../base/DocumentTitle'
import Link from '../base/Link'
import Searchbox from '../base/Searchbox'

import AgbLogo from './content/agb_logo.png'

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

const Logo = styled.img`
  display: block;
  width: 220px;
  max-width: 100%;
  height: auto;
  margin: 0 auto 1.5em;
`

const ReleaseDetails = styled.div`
  margin: 0 0 1.5em;
  text-align: center;
  line-height: 1.5;
`

const HomePage = (): React.JSX.Element => {
  return (
    <HomePageWrapper>
      <DocumentTitle title="AGB: Autism Genomics Browser" />
      <HomePageHeading>The Autism Genomics Browser</HomePageHeading>

      <Logo alt="Autism Genomics Browser logo" src={AgbLogo} />

      <ReleaseDetails>
        <div>
          <strong>Release:</strong> October 2026
        </div>
        <div>
          <strong>Reference genome:</strong> GRCh38
        </div>
      </ReleaseDetails>

      <Searchbox id="asc-search" width="100%" />

      <h2>Example</h2>
      <p style={{ marginTop: '0.5em' }}>
        Search for a gene (e.g., <Link to="/gene/ENSG00000251322">SHANK3</Link>) or an Ensembl ID
        (e.g., <Link to="/gene/ENSG00000251322">ENSG00000251322</Link>) or view{' '}
        <Link to="/results">all results</Link>.
      </p>

      <h2>The data</h2>
      <p>
        The Autism Genomics Browser (AGB) displays the results of our cross-consortia autism
        genomics data aggregation and gene discovery efforts. The most recent data freeze (
        <ExternalLink href="https://www.medrxiv.org/content/10.64898/2026.08.24.26360398v1">
          Satterstrom, Auwerx, Fu et al., 2026
        </ExternalLink>
        , <em>medRxiv</em>) encompasses data from 62,429 individuals with recorded autism (38,680
        probands and 23,749 cases) and 33,316 individuals without recorded autism (9,567 siblings
        and 23,749 controls). The data were aggregated and analyzed as part of an initiative that
        includes investigators and samples from the{' '}
        <ExternalLink href="https://pubmed.ncbi.nlm.nih.gov/23259942/">
          Autism Sequencing Consortium (ASC)
        </ExternalLink>
        , the{' '}
        <ExternalLink href="https://www.sfari.org/">
          Simons Foundation Autism Research Initiative (SFARI)
        </ExternalLink>
        , our clinical diagnostic laboratory partner{' '}
        <ExternalLink href="https://www.genedx.com/">GeneDx</ExternalLink>, the Danish{' '}
        <ExternalLink href="https://ipsych.dk/en/about-ipsych">iPSYCH</ExternalLink> project, and
        other collaborators dedicated to advancing our understanding of the genetic basis of autism.
        More information on data collection and generation can be found{' '}
        <Link to="/about">here</Link>. All data are released for the benefit of the biomedical
        community (see the <Link to="/terms">terms of use</Link>).
      </p>
    </HomePageWrapper>
  )
}

export default HomePage
