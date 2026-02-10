import React from 'react'

// @ts-expect-error: no types in this @gnomad/ui version
import { Page, PageHeading } from '@gnomad/ui'

import DocumentTitle from './DocumentTitle'
import Link from './Link'

const PageNotFoundPage = () => (
  <Page>
    <DocumentTitle title="Not Found" />
    <PageHeading>Page Not Found</PageHeading>
    <p>
      This page does not exist. Try searching for a gene or go to the <Link to="/">home page</Link>.
    </p>
  </Page>
)

export default PageNotFoundPage
