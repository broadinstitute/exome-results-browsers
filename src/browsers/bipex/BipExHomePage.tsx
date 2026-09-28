import React from 'react'
import styled from 'styled-components'

// @ts-expect-error: no types in this @gnomad/ui version
import { Page, PageHeading } from '@gnomad/ui'

import DocumentTitle from '../base/DocumentTitle'
import Link from '../base/Link'
import Searchbox from '../base/Searchbox'

import BipExLogo from './BipExLogo.svg'

const StyledLogo = styled.img`
  display: block;
  height: 200px;
  margin: 0 auto 2em;
`

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

export default () => (
  <HomePageWrapper>
    <DocumentTitle title="BipEx: Bipolar Exomes Browser" />
    <HomePageHeading>BipEx: Bipolar Exomes</HomePageHeading>

    <StyledLogo src={BipExLogo} />

    <Searchbox id="bipex-search" width="100%" />
    <p style={{ marginTop: '0.25em' }}>
      Or <Link to="/results">view all results</Link>
    </p>

    <p style={{ textAlign: 'center' }}>
      Example genes: <Link to="gene/ENSG00000023516">AKAP11</Link>,{' '}
      <Link to="/gene/ENSG00000161681">SHANK1</Link>.
    </p>

    <p style={{ textAlign: 'justify' }}>
      The Bipolar Exome Sequencing (BipEx) consortium is a large international collaboration dedicated to aggregating, generating, and analyzing exome sequencing data from individuals with bipolar disorder to better understand disease architecture and advance gene discovery.
    </p>


    <p style={{ textAlign: 'justify' }}>
      The BipEx 2.0 data set (GRCh38/hg38) includes 64,435 individuals with bipolar disorder and 168,101 controls across diverse global ancestries. Analyses of rare protein-coding variation identified 13 genes associated with bipolar disorder at exome-wide significance, expanding our understanding of the biological pathways and mechanisms contributing to disease risk.
    </p>

    <p>
      We thank the many tens of thousands of participants and families whose contributions made this work possible, as well as the investigators, institutions, and funders supporting the BipEx consortium.
    </p>

    <p>Analysis data last updated January 14, 2026.</p>
  </HomePageWrapper>
)
