import React from 'react'

import { Page, PageHeading } from '@gnomad/ui'

import DocumentTitle from './DocumentTitle'
import Link from './Link'
import Searchbox from './Searchbox'

export default () => (
  <Page>
    <DocumentTitle title="Results browser" />
    <PageHeading>Results Browser</PageHeading>
    <Searchbox width="100%" />
    <p style={{ marginTop: '0.25em' }}>
      Or <Link to="/results">view all results</Link>
    </p>
  </Page>
)
