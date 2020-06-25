import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { Page, PageHeading } from '@gnomad/ui'

import DocumentTitle from './DocumentTitle'

const InfoPageWrapper = styled(Page)`
  font-size: 16px;

  p {
    margin-bottom: 1em;
    line-height: 1.4;
  }
`

const InfoPage = ({ children, title }) => (
  <InfoPageWrapper>
    <DocumentTitle title={title} />
    <PageHeading>{title}</PageHeading>
    {children}
  </InfoPageWrapper>
)

InfoPage.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
}

InfoPage.defaultProps = {
  children: undefined,
}

export default InfoPage
