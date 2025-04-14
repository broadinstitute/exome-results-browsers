import React from 'react'
import styled from 'styled-components'

import { Page, PageHeading } from '@gnomad/ui'

import DocumentTitle from '../base/DocumentTitle'
import Link from '../base/Link'
import Searchbox from '../base/Searchbox'
import StyledContent from '../base/StyledContent'

import homePageContent from './content/homepage.md'

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

const GP2HomePage = () => (
  <HomePageWrapper>
    <DocumentTitle title="GP2 Browser" />
    <HomePageHeading>GP2: Parkinsons Association Browser</HomePageHeading>

    <Searchbox width="100%" />
    <p style={{ marginTop: '0.25em' }}>
      Or <Link to="/results">view all results</Link>
    </p>

    <p>
      Examples - Gene name: <Link to="/gene/ENSG00000231565">NEK2P2</Link>, Ensembl gene ID:{' '}
      <Link to="/gene/ENSG00000231565">ENSG00000231565</Link>
    </p>

    <StyledContent dangerouslySetInnerHTML={{ __html: homePageContent.html }} />
  </HomePageWrapper>
)

export default GP2HomePage
