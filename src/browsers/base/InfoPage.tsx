import React from 'react'
import styled from 'styled-components'

// @ts-expect-error: no types in this @gnomad/ui version
import { Page, PageHeading } from '@gnomad/ui'

import DocumentTitle from './DocumentTitle'

const InfoPageWrapper = styled(Page)`
  font-size: 16px;

  p {
    margin-bottom: 1em;
    line-height: 1.4;
  }
`

type InfoPageProps = {
  title: string,
  children: React.ReactNode,
}

const InfoPage = ({
  title,
  children = undefined
}:
  InfoPageProps
) => (
  <InfoPageWrapper>
    <DocumentTitle title={title} />
    <PageHeading>{title}</PageHeading>
    {children}
  </InfoPageWrapper>
)

export default InfoPage
