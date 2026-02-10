import React from 'react'

// @ts-expect-error: no types in this @gnomad/ui version
import { Page, PageHeading } from '@gnomad/ui'

import DocumentTitle from './DocumentTitle'
import Link from './Link'
import Searchbox from './Searchbox'

const DefaultHomePage = () => (
  <Page>
    <DocumentTitle title="Results browser" />
    <PageHeading>Results Browser</PageHeading>
    {/* @ts-expect-error: from @gnomad/ui */}
    <Searchbox width="100%" />
    <p style={{ marginTop: '0.25em' }}>
      Or <Link to="/results">view all results</Link>
    </p>
  </Page>
)

export default DefaultHomePage
